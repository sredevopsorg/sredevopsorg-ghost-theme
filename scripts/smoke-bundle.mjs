#!/usr/bin/env node
/**
 * smoke-bundle — three properties of the built bundle that nothing else checks.
 *
 * 1. **It loads.** The entry is evaluated in a stubbed DOM; it must not throw and
 *    must register its DOM hooks. Why: bundling changes the semantics of the code
 *    it ingests. A real example caught here — the inline UMD `reframe` in
 *    assets/js/main.js was detected as CommonJS, took its `module.exports` branch
 *    instead of assigning the global, and the call site threw
 *    `reframe is not defined`. No HTML diff can see that.
 *
 * 2. **It is split.** The entry chunk must contain no framework code, and the
 *    generated partials must eager-load only the entry. Otherwise every page pays
 *    for React whether or not it has an island.
 *
 * 3. **Templates and chunks agree.** Every `data-island="X"` in a template must
 *    correspond to a code-split chunk named X in the manifest, so a registry typo
 *    or a missing import fails here instead of silently doing nothing in a browser.
 *
 * 4. **Island chunks load.** Each of those chunks is imported and must expose
 *    exactly one of `mount()`/`enhance()`. Nothing else evaluates them — the entry
 *    never imports them statically — so a broken import path or a renamed export
 *    would otherwise only appear in a browser.
 *
 * Not a DOM test suite — Phase 3 adds Playwright for behaviour.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const MANIFEST = join(ROOT, "assets/built/manifest.json");
const ENTRY_BUDGET_BYTES = 12 * 1024;

/** React API names survive minification, so their presence means React is inlined. */
const FRAMEWORK_MARKERS = ["createRoot", "useState", "useEffect", "react-dom"];

function fail(message) {
  console.error(`smoke-bundle: FAILED — ${message}`);
  process.exit(1);
}

if (!existsSync(MANIFEST)) fail("assets/built/manifest.json missing — run `yarn build` first.");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const entry = Object.values(manifest).find((item) => item.isEntry && item.file?.endsWith(".js"));
if (!entry) fail("the manifest has no isEntry JS chunk.");

const bundlePath = resolve(ROOT, "assets/built", entry.file);
const bundleSource = readFileSync(bundlePath, "utf8");

// --- 1. it loads ------------------------------------------------------------------
const registered = [];
const stubElement = () => ({
  style: {},
  className: "",
  dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {},
  setAttribute() {},
  getAttribute: () => null,
  appendChild() {},
  insertBefore() {},
  removeChild() {},
  contains: () => false,
  children: [],
  querySelectorAll: () => [],
  offsetHeight: 0,
  offsetWidth: 0,
  parentNode: null,
});

globalThis.window = {
  location: { host: "sredevops.org", href: "https://sredevops.org/" },
  addEventListener() {},
  innerWidth: 1200,
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: () => {},
};
globalThis.document = {
  addEventListener: (type) => registered.push(type),
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => null,
  createElement: stubElement,
  body: stubElement(),
  documentElement: stubElement(),
  activeElement: stubElement(),
  readyState: "complete",
};
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

try {
  await import(bundlePath);
} catch (err) {
  fail(`the bundle threw while loading:\n  ${err.message}\n  ${entry.file}`);
}

// The entry is a deferred module, so the DOM is already parsed when it runs and its
// own work happens immediately. `keydown` is the one behaviour it genuinely owns
// (the `/` search hotkey); everything event-driven and heavier lives in islands, so
// asserting DOMContentLoaded here would freeze an implementation detail.
const missingHooks = ["keydown"].filter((type) => !registered.includes(type));
if (missingHooks.length) {
  fail(`the bundle loaded but registered no ${missingHooks.join(", ")} listener — check the entry's imports.`);
}

if (!registered.length) {
  fail("the bundle registered no DOM listeners at all — is the entry still wired up?");
}

// --- 2. it is split ---------------------------------------------------------------
const inlined = FRAMEWORK_MARKERS.filter((marker) => bundleSource.includes(marker));
if (inlined.length) {
  fail(
    `framework code is inlined in the entry chunk (${inlined.join(", ")}).\n` +
      "  Islands must be imported dynamically through the registry in assets/js/islands.js,\n" +
      "  and the island runtime must not import React itself.",
  );
}

const entrySize = statSync(bundlePath).size;
if (entrySize > ENTRY_BUDGET_BYTES) {
  fail(`the entry chunk is ${entrySize} B, over the ${ENTRY_BUDGET_BYTES} B budget — something heavy became static.`);
}

const eager = new Set();
for (const partial of ["partials/vite_assets/head.hbs", "partials/vite_assets/foot.hbs"]) {
  const file = join(ROOT, partial);
  if (!existsSync(file)) fail(`${partial} is missing — run \`yarn build\`.`);
  for (const match of readFileSync(file, "utf8").matchAll(/\{\{\s*asset\s+"built\/([^"]+)"\s*\}\}/g)) {
    if (match[1].endsWith(".js")) eager.add(match[1]);
  }
}
const unexpected = [...eager].filter((file) => file !== entry.file);
if (unexpected.length) {
  fail(
    `the generated partials eager-load non-entry chunks: ${unexpected.join(", ")}.\n` +
      "  Only the static entry may be preloaded; dynamic island chunks load on demand.",
  );
}

// --- 3. templates and chunks agree -----------------------------------------------
const islandNames = new Set();
for (const file of readdirSync(ROOT, { recursive: true })) {
  if (!String(file).endsWith(".hbs")) continue;
  const full = join(ROOT, String(file));
  if (String(file).startsWith("node_modules") || !statSync(full).isFile()) continue;
  for (const match of readFileSync(full, "utf8").matchAll(/data-island="([^"{}]+)"/g)) {
    islandNames.add(match[1]);
  }
}

const chunkNames = new Set(
  Object.values(manifest)
    .filter((item) => item.isDynamicEntry)
    .map((item) => item.name),
);
const unwired = [...islandNames].filter((name) => !chunkNames.has(name));
if (unwired.length) {
  fail(
    `templates declare islands with no matching code-split chunk: ${unwired.join(", ")}.\n` +
      `  Chunks present: ${[...chunkNames].join(", ") || "(none)"}\n` +
      "  Register the module in assets/js/islands.js (key must equal data-island).",
  );
}

// --- 4. island chunks load and honour the contract --------------------------------
const contractErrors = [];
let loadedChunks = 0;

for (const name of islandNames) {
  const chunk = Object.values(manifest).find((item) => item.isDynamicEntry && item.name === name);
  if (!chunk) continue; // section 3 already reported it

  try {
    const mod = await import(resolve(ROOT, "assets/built", chunk.file));
    const hasMount = typeof mod.mount === "function";
    const hasEnhance = typeof mod.enhance === "function";
    if (!hasMount && !hasEnhance) contractErrors.push(`${name} (${chunk.file}) exports neither mount() nor enhance()`);
    else if (hasMount && hasEnhance) {
      contractErrors.push(`${name} (${chunk.file}) exports both mount() and enhance() — pick one`);
    } else loadedChunks++;
  } catch (err) {
    contractErrors.push(`${name} (${chunk.file}) failed to load: ${err.message}`);
  }
}

if (contractErrors.length) {
  fail(`island chunks are broken:\n${contractErrors.map((line) => `  - ${line}`).join("\n")}`);
}

console.log(
  `smoke-bundle: OK — entry ${entry.file} (${entrySize} B) loads, registers ${registered.join(", ")}, ` +
    `inlines no framework; ${islandNames.size} island(s) resolve to ${chunkNames.size} split chunk(s) ` +
    `and ${loadedChunks} of them load with a valid contract.`,
);
