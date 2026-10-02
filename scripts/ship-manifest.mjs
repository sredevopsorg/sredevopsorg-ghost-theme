#!/usr/bin/env node
/**
 * ship-manifest — assert what a Ghost theme package may and may not contain.
 *
 * Ghost uploads a theme as a zip and never runs npm. The failure mode this guards
 * against is shipping (or failing to ship) the wrong files: source dirs and
 * node_modules inside the package, or templates referencing an asset the build
 * never produced (the classic stale-hash bug).
 *
 * Usage:
 *   node scripts/ship-manifest.mjs --list    # print the files that would ship
 *   node scripts/ship-manifest.mjs --check   # validate; exit 1 on violations
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep, posix } from "node:path";

const ROOT = process.cwd();

/** Pruned during the walk for speed; never shippable. */
const PRUNE = [".git", "node_modules"];

/** Directories whose contents must never ship (tooling, tests, docs). */
const DENY_DIRS = [".github", ".vscode", ".idea", "lib", "scripts", "tests", "docs"];

/** Individual files that must never ship. */
const DENY_FILES = [
  ".gitignore",
  ".pre-commit-config.yaml",
  ".cursorignore",
  ".env",
  "yarn.lock",
  "package-lock.json",
  "gulpfile.js", // removed in Phase 1; denied so it can never ship
  "vite.config.js",
  "vite.config.mjs",
  "tailwind.config.js",
  "postcss.config.js",
  "README.md",
  "demo.html",
];

/** Dev/build config denied by pattern. */
const DENY_PATTERNS = [/^docker-compose.*\.ya?ml$/, /^tsconfig.*\.json$/, /\.spec\.[cm]?jsx?$/];

/** Only files matching one of these ship. */
const ALLOW_PATTERNS = [
  /^[^/]+\.hbs$/, // root templates (default, index, post, home-en, custom-es, error…)
  /^partials\/.*\.hbs$/,
  /^members\/.*\.hbs$/,
  /^locales\/.*\.json$/,
  /^package\.json$/,
  /^LICENSE$/,
  /^assets\/built\/.*$/, // build output (CSS/JS/manifest, hashed from Phase 1)
  /^assets\/(img|images|fonts|icons)\/.*$/, // static assets
  /^assets\/screenshot-.*\.(jpe?g|png)$/,
  /^routes\.yaml$/, // Ghost ignores it inside a zip; kept for ops parity
];

/** Ghost treats an upload as a theme only with these present. */
const REQUIRED = ["package.json", "default.hbs", "index.hbs", "post.hbs"];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (PRUNE.includes(entry.name)) continue;
    const abs = join(dir, entry.name);
    const rel = relative(ROOT, abs).split(sep).join(posix.sep);
    if (entry.isDirectory()) walk(abs, acc);
    else if (entry.isFile()) acc.push(rel);
  }
  return acc;
}

function ships(rel) {
  if (DENY_FILES.includes(rel)) return false;
  if (DENY_DIRS.includes(rel.split(posix.sep)[0])) return false;
  if (DENY_PATTERNS.some((re) => re.test(rel))) return false;
  return ALLOW_PATTERNS.some((re) => re.test(rel));
}

/** Every `{{asset "path"}}` in the templates must exist under assets/ and ship. */
function assetReferences(files) {
  const refs = new Map(); // asset path -> [template, …]
  const re = /\{\{\s*asset\s+["']([^"']+)["']\s*\}\}/g;
  for (const rel of files.filter((f) => f.endsWith(".hbs"))) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    for (const match of src.matchAll(re)) {
      const assetPath = match[1];
      if (!refs.has(assetPath)) refs.set(assetPath, []);
      refs.get(assetPath).push(rel);
    }
  }
  return refs;
}

const all = walk(ROOT);
const shipped = all.filter(ships).sort();

if (process.argv.includes("--list")) {
  console.log(shipped.join("\n"));
  console.log(`\n${shipped.length} of ${all.length} files would ship.`);
  process.exit(0);
}

const errors = [];

for (const rel of REQUIRED) {
  if (!shipped.includes(rel)) errors.push(`required file missing from package: ${rel}`);
}

for (const [assetPath, templates] of assetReferences(all)) {
  const expected = posix.join("assets", assetPath);
  if (!existsSync(join(ROOT, expected))) {
    errors.push(`${expected} is referenced by ${templates.join(", ")} but does not exist — build first`);
  } else if (!shipped.includes(expected)) {
    errors.push(`${expected} exists but is excluded from the package (referenced by ${templates.join(", ")})`);
  }
}

// Redundant with the deny rules, but it turns a silent rule regression into a loud failure.
const leaked = all.filter((rel) => DENY_DIRS.includes(rel.split(posix.sep)[0]) && ships(rel));
for (const rel of leaked) errors.push(`tooling/test file would ship: ${rel}`);

if (errors.length) {
  console.error("ship-manifest: FAILED\n");
  for (const err of errors) console.error(`  ✗ ${err}`);
  console.error("\nThe package must be self-contained: build first, ship assets/built/**, no dev files.");
  process.exit(1);
}

console.log(`ship-manifest: OK — ${shipped.length} of ${all.length} files ship, every {{asset}} reference resolves.`);
