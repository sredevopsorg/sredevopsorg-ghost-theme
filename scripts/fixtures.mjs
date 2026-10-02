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
import { spawnSync } from "node:child_process";
import { join, dirname, basename, resolve } from "node:path";

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

/**
 * `name  /path  # comment` lines; first token is the fixture name.
 *
 * A note may carry `expect=NNN` for contexts whose correct response is not 200 —
 * the 404 template, for example, must keep returning 404 while still being
 * captured and diffed.
 */
function contexts() {
  return readFileSync(CONTEXTS, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [body, ...noteParts] = line.split("#");
      const [name, path] = body.trim().split(/\s+/);
      const note = noteParts.join("#");
      const expect = Number((note.match(/expect=(\d{3})/) ?? [])[1]) || 200;
      return { name, path: path ?? "/", expect };
    });
}

/**
 * Normalisations are deliberately few and explicit: anything normalised here is
 * something a human must then verify by reading the diff.
 */
const NORMALISERS = [
  // Ghost emits minified HTML on very few lines, so any insertion shifts the rest of
  // the file and a line diff reports hundreds of false changes. One tag per line makes
  // the diff show what was actually added or removed. Applied to both sides, so it
  // stays meaningful (including inside <pre>/<code>, where it is equally deterministic).
  [/></g, ">\n<"],
  // Vite's content hash inside the filename. Without this, every build changes the
  // golden files even when no markup changed, which buries real differences.
  // Anchored to assets/built so it cannot touch a content image filename.
  [/\/assets\/built\/([A-Za-z0-9_.-]+?)-[A-Za-z0-9_-]{8}\.(js|css)/g, "/assets/built/$1-HASH.$2"],
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
  for (const { name, path, expect } of contexts()) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "theme-fixtures/1.0" } });
      const body = await res.text();
      if (res.status !== expect) {
        console.error(`  ✗ ${name.padEnd(12)} ${res.status} ${url} (expected ${expect})`);
        failures++;
        continue;
      }
      writeFileSync(join(out, `${name}.html`), body);
      console.log(`  ✓ ${name.padEnd(12)} ${res.status} ${url} (${body.length} bytes)`);
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
  // Normalising in place deletes the input before reading it; refuse instead.
  if (resolve(from) === resolve(to)) {
    console.error(`--in and --out are the same directory (${rel(from)}/) — normalise into a different one.`);
    process.exit(2);
  }
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

/**
 * Line differences between two captures.
 *
 * Uses `diff -u` when available: an insertion shifts every following line, and a
 * naive line-by-line comparison then reports the whole file as changed (a single
 * inserted blank line produced "136 differing lines" for two real changes). A real
 * diff reports the hunks instead. Falls back to an order-insensitive set comparison
 * when `diff` is not installed.
 */
function lineDifferences(goldenPath, currentPath, { max = 16 } = {}) {
  const result = spawnSync("diff", ["-u", goldenPath, currentPath], { encoding: "utf8" });

  if (!result.error) {
    const added = [];
    const removed = [];
    for (const line of (result.stdout ?? "").split("\n")) {
      if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) continue;
      if (line.startsWith("+")) added.push(line.slice(1).trim());
      else if (line.startsWith("-")) removed.push(line.slice(1).trim());
    }
    const show = (lines) => lines.filter(Boolean).slice(0, max);
    return {
      mode: "diff",
      added: show(added),
      removed: show(removed),
      addedTotal: added.filter(Boolean).length,
      removedTotal: removed.filter(Boolean).length,
      truncated: Math.max(0, added.filter(Boolean).length - max) + Math.max(0, removed.filter(Boolean).length - max),
    };
  }

  // Fallback: compare the two line multisets. Order-insensitive, so it cannot show a
  // reordering, but it cannot invent cascade differences either.
  const count = (text) => {
    const map = new Map();
    for (const line of text.split("\n")) map.set(line, (map.get(line) ?? 0) + 1);
    return map;
  };
  const goldenCount = count(readFileSync(goldenPath, "utf8"));
  const currentCount = count(readFileSync(currentPath, "utf8"));
  const collect = (a, b) => {
    const out = [];
    for (const [line, n] of a) {
      const diff = n - (b.get(line) ?? 0);
      for (let i = 0; i < diff; i++) out.push(line.trim());
    }
    return out.filter(Boolean);
  };
  const removed = collect(goldenCount, currentCount);
  const added = collect(currentCount, goldenCount);
  return {
    mode: "set",
    added: added.slice(0, max),
    removed: removed.slice(0, max),
    addedTotal: added.length,
    removedTotal: removed.length,
    truncated: Math.max(0, added.length - max) + Math.max(0, removed.length - max),
  };
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
    const delta = lineDifferences(join(golden, file), join(current, file));
    const scope = delta.mode === "diff" ? "diff" : "line set";
    console.error(
      `  ✗ ${file} — ${delta.removedTotal} removed, ${delta.addedTotal} added  [${scope}]`,
    );
    for (const line of delta.removed) console.error(`      - ${line}`);
    for (const line of delta.added) console.error(`      + ${line}`);
    if (delta.truncated) console.error(`      … ${delta.truncated} more line(s)`);
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
