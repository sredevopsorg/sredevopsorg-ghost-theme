#!/usr/bin/env node
/**
 * Image-build guard: verify every baked model artefact against models.lock.json.
 *
 * Runs inside the image build after the download step, and refuses to produce an image
 * whose weights do not match the pinned digests. A moved upstream file, a truncated
 * download or a CDN error page all fail here rather than at synthesis time in a Job.
 *
 * Run from the directory holding models.lock.json and the downloaded files.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("models.lock.json", "utf8"));
let bad = 0;

for (const [file, expected] of Object.entries(lock.files)) {
  let actual;
  try {
    actual = createHash("sha256").update(readFileSync(file)).digest("hex");
  } catch (err) {
    console.error(`missing artefact ${file}: ${err.message}`);
    bad = 1;
    continue;
  }
  if (actual !== expected) {
    console.error(`sha256 mismatch for ${file}: got ${actual}, expected ${expected}`);
    bad = 1;
  }
}

if (bad) process.exit(1);
console.error(`model: all ${Object.keys(lock.files).length} files verified`);
