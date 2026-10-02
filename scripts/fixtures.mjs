#!/usr/bin/env node
/**
 * fixtures — golden-HTML regression testing for a Ghost theme.
 *
 * Rendering a Ghost theme can only be verified against a running Ghost, so this
 * captures the HTML of every context, normalises the parts that legitimately
 * change between captures (cache-busting hashes, nonces, timestamps, Ghost
 * version), and diffs against committed goldens.
 *
 * Workflow:
 *   1. docker compose -f docker-compose.dev.yml up -d   (see tests/fixtures/README.md)
 *   2. yarn fixtures:capture                          -> tests/fixtures/raw/
 *   3. yarn fixtures:normalize                        -> tests/fixtures/current/
 *   4. yarn fixtures:promote                          (only when the new output is intended)
 *
 *   After a change: capture + normalize + `yarn fixtures:diff`.
 *   The diff must show asset URLs only for a build-pipeline change (Phase 1).
 *
 * Zero dependencies (Node >= 20 for global fetch).
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";

const ROOT = process.cwd();
const DIRS = {
  raw: join(ROOT, "tests/fixtures/raw"),
  current: join(ROOT, "tests/fixtures/current"),
  golden: join(ROOT, "tests/fixtures/golden"),
};
const CONTEXTS = join(ROOT, "tests/fixtures/contexts.txt");

/** Supports both `--name=value` and `--name value`. */
function arg(name, fallback) {
  const argv = process.argv.slice(3);
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  if (inline) return inline.split("=").slice(1).join("=");
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return fallback;
}

/** `name  /path  # comment` lines; first token is the fixture name. */
function contexts() {
  return readFileSync(CONTEXTS, "utf8")
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [name, path] = line.split(/\s+/);
      return { name, path: path ?? "/" };
    });
}

/**
 * Normalisations are deliberately few and explicit: anything normalised here is
 * something a human must then verify by reading the diff.
 */
const NORMALISERS = [
  [/[?&]v=[0-9a-zA-Z._-]+/g, "?v=HASH"], // {{asset}} cache-busting query
  [/nonce="[^"]*"/g, 'nonce="NONCE"'], // CSP nonces (Ghost code injection)
  [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})/g, "TIMESTAMP"],
  [/Ghost \d+\.\d+\.\d+/g, "Ghost VERSION"], // generator meta, changes on Ghost upgrade
  [/[ \t]+$/gm, ""], // trailing whitespace
];

function normalise(html) {
  return NORMALISERS.reduce((acc, [re, replacement]) => acc.replace(re, replacement), html);
}

/** Display path: strips the repo root so logs stay short. */
function rel(absPath) {
  return absPath.startsWith(`${ROOT}/`) ? absPath.slice(ROOT.length + 1) : absPath;
}

async function capture() {
  const base = arg("base", "http://localhost:2368").replace(/\/$/, "");
  const out = arg("out", DIRS.raw);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  let failures = 0;
  for (const { name, path } of contexts()) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "theme-fixtures/1.0" } });
      const body = await res.text();
      if (!res.ok) {
        console.error(`  ✗ ${name.padEnd(12)} ${res.status} ${url}`);
        failures++;
        continue;
      }
      writeFileSync(join(out, `${name}.html`), body);
      console.log(`  ✓ ${name.padEnd(12)} ${url} (${body.length} bytes)`);
    } catch (err) {
      console.error(`  ✗ ${name.padEnd(12)} ${url} — ${err.message}`);
      failures++;
    }
  }
  if (failures) {
    console.error(`\n${failures} context(s) failed. Is Ghost running at ${base}?`);
    process.exit(1);
  }
  console.log(`\nCaptured ${contexts().length} contexts into ${rel(out)}/.`);
}

function normalize() {
  const from = arg("in", DIRS.raw);
  const to = arg("out", DIRS.current);
  if (!existsSync(from)) {
    console.error(`No captured fixtures in ${rel(from)}/ — run \`yarn fixtures:capture\` first.`);
    process.exit(1);
  }
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  const files = readdirSync(from).filter((f) => f.endsWith(".html"));
  if (!files.length) {
    console.error(`No .html files in ${rel(from)}/ — the capture step produced nothing.`);
    process.exit(1);
  }
  for (const file of files) {
    writeFileSync(join(to, file), normalise(readFileSync(join(from, file), "utf8")));
  }
  console.log(`Normalised ${files.length} fixture(s) into ${rel(to)}/.`);
}

/** Ghost output is often one very long line, so report the first differing character too. */
function firstDifference(a, b) {
  const left = a.split("\n");
  const right = b.split("\n");
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    const l = left[i] ?? "";
    const r = right[i] ?? "";
    if (l === r) continue;
    let col = 0;
    while (col < l.length && col < r.length && l[col] === r[col]) col++;
    const from = Math.max(0, col - 40);
    return {
      line: i + 1,
      col: col + 1,
      golden: l.slice(from, col + 80) || "<end of line>",
      current: r.slice(from, col + 80) || "<end of line>",
    };
  }
  return null;
}

function diff() {
  const golden = arg("golden", DIRS.golden);
  const current = arg("current", DIRS.current);
  if (!existsSync(current)) {
    console.error(`No normalised fixtures in ${rel(current)}/ — run \`yarn fixtures:normalize\`.`);
    process.exit(1);
  }
  const goldenFiles = existsSync(golden) ? readdirSync(golden).filter((f) => f.endsWith(".html")).sort() : [];
  const currentFiles = readdirSync(current).filter((f) => f.endsWith(".html")).sort();

  if (!goldenFiles.length) {
    console.warn(
      `No golden fixtures in ${rel(golden)}/ yet.\n` +
        `Review ${rel(current)}/ then commit it as the baseline: \`yarn fixtures:promote\`.`,
    );
    process.exit(0);
  }

  let changed = 0;
  for (const file of goldenFiles) {
    if (!currentFiles.includes(file)) {
      console.error(`  ✗ ${file} — missing from current capture`);
      changed++;
      continue;
    }
    const a = readFileSync(join(golden, file), "utf8");
    const b = readFileSync(join(current, file), "utf8");
    if (a === b) {
      console.log(`  = ${file}`);
      continue;
    }
    const delta = firstDifference(a, b);
    console.error(`  ✗ ${file} — first difference at line ${delta.line}, column ${delta.col}`);
    console.error(`      golden:  …${delta.golden.trim()}`);
    console.error(`      current: …${delta.current.trim()}`);
    changed++;
  }
  for (const file of currentFiles.filter((f) => !goldenFiles.includes(f))) {
    console.error(`  + ${file} — new context with no golden (promote it if intended)`);
    changed++;
  }

  if (changed) {
    console.error(`\n${changed} fixture(s) differ. Inspect ${rel(current)}/ and either fix the change or` +
      " promote it deliberately with `yarn fixtures:promote`.");
    process.exit(1);
  }
  console.log(`\nAll ${goldenFiles.length} fixtures match.`);
}

function promote() {
  const from = arg("from", DIRS.current);
  const to = arg("to", DIRS.golden);
  if (!existsSync(from)) {
    console.error(`Nothing to promote: ${rel(from)}/ does not exist.`);
    process.exit(1);
  }
  mkdirSync(to, { recursive: true });
  const files = readdirSync(from).filter((f) => f.endsWith(".html"));
  for (const file of files) copyFileSync(join(from, file), join(to, file));
  console.log(`Promoted ${files.length} fixture(s) to ${rel(to)}/ — review with \`git diff\` before committing.`);
}

const command = process.argv[2];
const commands = { capture, normalize, diff, promote };

if (!commands[command]) {
  console.error(
    `usage: node ${basename(import.meta.url)} <capture|normalize|diff|promote> [--base=URL] [--out=DIR] [--in=DIR]`,
  );
  process.exit(2);
}
await commands[command]();
