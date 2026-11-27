#!/usr/bin/env node
/**
 * Populate `models.lock.json` from the pinned upstream revision.
 *
 * Run this when the model revision or the voice set changes, then review the diff: the
 * lock is what the image build verifies, so a bug there means every image either fails to
 * build or ships an artefact nobody checked.
 *
 *   node scripts/update-models.mjs            # fetch, hash, rewrite the lock
 *   node scripts/update-models.mjs --set-rev <sha>   # move to a new upstream commit
 *
 * Needs the Hugging Face CDN. It is deliberately **not** part of the image build: the
 * build only reads the lock. CI runs it in a check that fails when the lock and upstream
 * disagree, so a silent upstream change cannot slip through between releases.
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCK = join(HERE, "..", "models.lock.json");

const lock = JSON.parse(await readFile(LOCK, "utf8"));

const setRevAt = process.argv.indexOf("--set-rev");
if (setRevAt > -1) {
  const next = process.argv[setRevAt + 1];
  if (!/^[0-9a-f]{40}$/.test(next ?? "")) {
    console.error("--set-rev needs the 40-character commit SHA, not a branch");
    process.exit(2);
  }
  lock.revision = next;
}

async function fetchOnce(file) {
  const url = `https://huggingface.co/${lock.repo}/resolve/${lock.revision}/${file}?download=true`;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (err) {
      if (attempt === 5) throw new Error(`${file}: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  return null;
}

let changed = 0;
for (const file of Object.keys(lock.files)) {
  process.stderr.write(`fetching ${file}… `);
  const bytes = await fetchOnce(file);
  const sha = createHash("sha256").update(bytes).digest("hex");
  const previous = lock.files[file];
  lock.files[file] = sha;
  const note = previous === sha ? "(unchanged)" : previous === "REPLACE_ME" ? "(new)" : "(CHANGED — review)";
  process.stderr.write(`${sha} ${note}\n`);
  if (previous !== sha) changed += 1;
}

await writeFile(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
process.stderr.write(`\nmodels.lock.json: ${changed} entry/entries updated (${lock.repo} @ ${lock.revision})\n`);
