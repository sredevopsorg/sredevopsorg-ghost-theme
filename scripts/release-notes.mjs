#!/usr/bin/env node
/**
 * Print the CHANGELOG section for one version, for a GitHub release body.
 *
 *   node scripts/release-notes.mjs 3.6.0
 *
 * The section is everything between `## 3.6.0` and the next `## ` heading, so the
 * release notes are the changelog entry itself rather than a second, hand-copied
 * description that can drift from it. Fails when the version is not in the changelog,
 * which is exactly the case where a release should not be published.
 */
import { readFileSync } from "node:fs";

const version = process.argv[2]?.replace(/^v/, "");
if (!version) {
  console.error("usage: node scripts/release-notes.mjs <version>");
  process.exit(2);
}

const changelog = readFileSync("CHANGELOG.md", "utf8");
const heading = `## ${version}`;
const start = changelog.indexOf(heading);
if (start === -1) {
  console.error(`CHANGELOG.md has no "${heading}" section — add it before releasing ${version}.`);
  process.exit(1);
}

const rest = changelog.slice(start + heading.length);
const next = rest.search(/^## /m);
const body = (next === -1 ? rest : rest.slice(0, next)).trim();
if (!body) {
  console.error(`The "${heading}" section in CHANGELOG.md is empty.`);
  process.exit(1);
}

process.stdout.write(`${body}\n`);
