#!/usr/bin/env node
/**
 * smoke-bundle — load the built entry in a stubbed DOM and assert it comes up clean.
 *
 * Why this exists: golden HTML fixtures cannot see runtime errors, and a bundler
 * changes the semantics of the code it ingests. A real example caught here: the
 * inline UMD `reframe` in assets/js/main.js was detected as CommonJS, took its
 * `module.exports` branch instead of assigning the global, and the call site in
 * the same file threw `reframe is not defined` — invisible in any HTML diff.
 *
 * This is not a DOM test suite (Phase 3 adds Playwright for that). It asserts the
 * narrow thing that must always hold: the bundle evaluates, registers its hooks,
 * and does not throw.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const MANIFEST = join(ROOT, "assets/built/manifest.json");

if (!existsSync(MANIFEST)) {
  console.error("smoke-bundle: assets/built/manifest.json missing — run `npm run build` first.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const entry = Object.values(manifest).find((item) => item.isEntry && item.file?.endsWith(".js"));
if (!entry) {
  console.error("smoke-bundle: the manifest has no JS entry.");
  process.exit(1);
}
const bundle = resolve(ROOT, "assets/built", entry.file);

// --- minimal DOM -----------------------------------------------------------------
const registered = [];
const stubElement = () => ({
  style: {},
  className: "",
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

// --- load ------------------------------------------------------------------------
try {
  await import(bundle);
} catch (err) {
  console.error(`smoke-bundle: FAILED — the bundle threw while loading:\n  ${err.message}`);
  console.error(`  ${entry.file}`);
  process.exit(1);
}

const required = ["DOMContentLoaded", "keydown"];
const missing = required.filter((type) => !registered.includes(type));

if (missing.length) {
  console.error(`smoke-bundle: FAILED — no ${missing.join(", ")} listener registered.`);
  console.error("  The bundle loaded but its behaviour is not wired; check the entry's imports.");
  process.exit(1);
}

console.log(`smoke-bundle: OK — ${entry.file} evaluates and registers ${registered.join(", ")}.`);
