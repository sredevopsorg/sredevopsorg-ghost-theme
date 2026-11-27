#!/usr/bin/env node
/**
 * Image-build guard: refuse to build while the model lock is unpopulated.
 *
 * A `REPLACE_ME` entry means nobody verified those bytes against upstream. Building
 * anyway would ship an image whose weights are whatever the CDN served that day, so this
 * exits non-zero and says how to fix it.
 *
 * Run from the directory holding models.lock.json (the Dockerfile does `cd` first).
 */

import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("models.lock.json", "utf8"));
const unset = Object.entries(lock.files).filter(([, sha]) => sha === "REPLACE_ME");

if (unset.length) {
  console.error(`models.lock.json is not populated for: ${unset.map(([file]) => file).join(", ")}`);
  console.error("run: node scripts/update-models.mjs  (needs the Hugging Face CDN)");
  process.exit(1);
}

const missing = Object.entries(lock.files).some(([, sha]) => !/^[0-9a-f]{64}$/.test(sha));
if (missing) {
  console.error("models.lock.json has an entry that is not a sha256 digest");
  process.exit(1);
}

console.error(`model: ${lock.repo} @ ${lock.revision}, ${Object.keys(lock.files).length} files`);
