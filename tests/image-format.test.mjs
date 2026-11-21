/**
 * Theme images must be served as WebP.
 *
 * Ghost's {{img_url}} helper only rewrites the file format when it is given both a
 * defined `size` and `format="webp"` (docs: "Converting images to smaller image types").
 * Dropping either argument silently falls back to the original PNG/JPEG, which is easy
 * to miss in review because the page still looks right. This test pins the contract for
 * every theme-rendered raster image outside the header: feature images, post cards,
 * heroes and author avatars. The header logo and icon are left as uploaded on purpose,
 * so an SVG logo stays vector instead of being rasterized to WebP.
 *
 * Images inside {{{content}}} are stored post HTML rendered by Ghost, not by the theme,
 * so they are deliberately out of scope here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PRUNE = new Set(["node_modules", ".git", "assets/built", "tests/fixtures"]);

function walk(dir, accept, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!PRUNE.has(entry.name)) walk(path, accept, found);
    } else if (accept(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

const templates = walk(".", (name) => name.endsWith(".hbs"));
assert.ok(templates.length > 0, "expected to find templates to scan");

test("every img_url call asks for a WebP size variant", () => {
  let checked = 0;

  for (const file of templates) {
    const text = readFileSync(file, "utf8");
    for (const [call] of text.matchAll(/{{img_url[^}]*}}/g)) {
      checked += 1;
      assert.match(call, /\bsize="/, `${file}: ${call} needs a size for format conversion`);
      assert.match(call, /\bformat="webp"/, `${file}: ${call} must request WebP`);
    }
  }

  assert.ok(checked >= 9, `expected the theme's image call sites, found ${checked}`);
});
