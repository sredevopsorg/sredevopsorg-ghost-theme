#!/usr/bin/env node
/**
 * Build the theme archive that gets uploaded to Ghost.
 *
 * Ghost uploads a zip and never runs npm, so the archive is exactly the files
 * scripts/ship-manifest.mjs decides are shippable — that script stays the single source
 * of truth, and its --check mode runs first so a missing `yarn build` cannot be packaged.
 *
 * Why a hand-written zip: there is no `zip` binary and no archiver dependency in this
 * project, and the format needed here is a small, well-specified subset. The result is
 * validated the same way Ghost validates an upload — `gscan --zip` reads it back, which
 * makes a malformed archive fail loudly rather than at upload time.
 *
 *   node scripts/package-theme.mjs            # writes dist/<name>-<version>.zip
 *   node scripts/package-theme.mjs --no-gscan # skip the read-back validation
 */
import { execFileSync } from "node:child_process";
import { deflateRawSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");

// ---------------------------------------------------------------------------
// Minimal zip writer
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[i] = value;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

/** Already-compressed formats gain nothing from deflate and only cost CPU. */
const STORE_EXTENSIONS = [".woff2", ".woff", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".ico", ".zip"];

function dosDateTime(date) {
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() / 2)) & 0xffff;
  const day = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  return { time, day };
}

/**
 * @param {{ path: string, data: Buffer, mtime: Date }[]} entries — zip paths use forward slashes
 */
function createZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const store = STORE_EXTENSIONS.some((ext) => entry.path.toLowerCase().endsWith(ext));
    const body = store ? entry.data : deflateRawSync(entry.data, { level: 9 });
    const { time, day } = dosDateTime(entry.mtime);
    const crc = crc32(entry.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(store ? 0 : 8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, name, body);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4); // version made by
    header.writeUInt16LE(20, 6); // version needed
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(store ? 0 : 8, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(day, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(body.length, 20);
    header.writeUInt32LE(entry.data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE(0, 42); // local header offset
    header.writeUInt32LE(offset, 42);
    central.push(header, name);

    offset += local.length + name.length + body.length;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...chunks, centralBuffer, end]);
}

// ---------------------------------------------------------------------------
// Package
// ---------------------------------------------------------------------------

const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const version = manifest.version;
const archiveName = `${manifest.name}-${version}.zip`;
const archivePath = join(DIST, archiveName);

console.log("checking what would ship");
execFileSync("node", ["scripts/ship-manifest.mjs", "--check"], { cwd: ROOT, stdio: "inherit" });

const SUMMARY = /^\d+ of \d+ files would ship\.$/;
const listing = execFileSync("node", ["scripts/ship-manifest.mjs", "--list"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !SUMMARY.test(line));

if (listing.length === 0) throw new Error("ship-manifest listed no files");
for (const path of listing) {
  if (!existsSync(join(ROOT, path))) throw new Error(`ship-manifest listed a missing file: ${path}`);
}

const entries = listing.map((path) => ({
  path,
  data: readFileSync(join(ROOT, path)),
  mtime: statSync(join(ROOT, path)).mtime,
}));

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
const zip = createZip(entries);
writeFileSync(archivePath, zip);

const bytes = zip.length;
const raw = entries.reduce((total, entry) => total + entry.data.length, 0);
console.log(
  `\nwrote ${archivePath}\n  ${entries.length} files, ${(raw / 1024).toFixed(0)} kB raw -> ` +
    `${(bytes / 1024).toFixed(0)} kB archived`,
);

if (!process.argv.includes("--no-gscan")) {
  console.log("\nreading the archive back the way Ghost does");
  execFileSync("npx", ["gscan", "--zip", "--verbose", archivePath], { cwd: ROOT, stdio: "inherit" });
}

console.log(`\nnext: upload ${archiveName} in Ghost admin, or hand it to whoever does.`);
