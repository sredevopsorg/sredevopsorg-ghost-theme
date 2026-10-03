/**
 * The theme must not make third-party requests.
 *
 * Phase 5a moved the last two off-site dependencies into the theme: Inter and Roboto
 * Mono were loaded from fonts.googleapis.com, and every icon came from Font Awesome's
 * stylesheet on cdnjs. Both are now local (assets/fonts/, partials/icon.hbs), and this
 * test is what keeps it that way — a reintroduced <link href="https://..."> is easy to
 * miss in review and invisible in a diff of minified output.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Hosts the theme must never load anything from. Content images are not theme requests. */
const FORBIDDEN_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdnjs.cloudflare.com",
  "cdn.jsdelivr.net",
  "unpkg.com",
  "kit.fontawesome.com",
  "use.fontawesome.com",
  "use.typekit.net",
  "ajax.googleapis.com",
];

const PRUNE = new Set(["node_modules", ".git", "assets/built", "tests/fixtures"]);

function walk(dir, accept, found = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!PRUNE.has(entry.name)) walk(path, accept, found);
    } else if (accept(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

/** Read a file, or null when it does not exist (the built CSS is optional here). */
function tryRead(path) {
  try {
    return statSync(path).isFile() ? readFileSync(path, "utf8") : null;
  } catch {
    return null;
  }
}

test("no template references a third-party host", () => {
  const templates = walk(".", (name) => name.endsWith(".hbs"));
  assert.ok(templates.length > 0, "expected to find templates to scan");

  for (const file of templates) {
    const text = readFileSync(file, "utf8");
    for (const host of FORBIDDEN_HOSTS) {
      assert.ok(
        !text.includes(host),
        `${file} references ${host}; fonts and icons must ship with the theme`,
      );
    }
  }
});

test("the built CSS loads fonts from the theme, not from a network", () => {
  const built = walk("assets/built", (name) => name.endsWith(".css"));
  const files = built.length > 0 ? built : ["assets/css/fonts.css"];

  let faces = 0;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const host of FORBIDDEN_HOSTS) {
      assert.ok(!text.includes(host), `${file} references ${host}`);
    }
    faces += (text.match(/@font-face/g) ?? []).length;
    for (const url of text.matchAll(/url\(([^)]+)\)/g)) {
      const target = url[1].replace(/['"]/g, "");
      assert.ok(
        !/^(https?:)?\/\//.test(target),
        `${file} loads ${target} from a network; font URLs must be relative`,
      );
    }
  }
  assert.ok(faces >= 4, `expected at least four @font-face rules, found ${faces}`);
});

test("the self-hosted font files are present and licensed", () => {
  const expected = [
    "assets/fonts/inter-latin.woff2",
    "assets/fonts/inter-latin-ext.woff2",
    "assets/fonts/roboto-mono-latin.woff2",
    "assets/fonts/roboto-mono-latin-ext.woff2",
    // latin-ext is what Spanish accents need; dropping it would silently change
    // typography on the /es/ and /br/ content with no visible error.
    "assets/fonts/LICENSE-Inter.txt",
    "assets/fonts/LICENSE-Roboto-Mono.txt",
  ];
  for (const file of expected) {
    assert.ok(existsSync(file), `${file} is missing`);
    assert.ok(statSync(file).size > 0, `${file} is empty`);
  }
});

test("icons are inline SVG, not an icon font", () => {
  const source = tryRead("partials/icon.hbs");
  assert.ok(source, "partials/icon.hbs is missing; run scripts/sync-icons.mjs");

  assert.ok(source.includes("<svg"), "icon.hbs should contain inline SVG");
  assert.ok(
    !/class="[^"]*\bfa[sbrltd]?\b/.test(source),
    "icon.hbs still references Font Awesome classes",
  );
  // currentColor is what lets an icon inherit the link colour it sits in.
  assert.ok(source.includes('fill="currentColor"'), "icons should fill with currentColor");
  // Every icon is a branch of one match chain, so the count of icons is the count of
  // svg elements, and a malformed chain would break every call site at once.
  const svgs = (source.match(/<svg/g) ?? []).length;
  const matches = (source.match(/\{\{(?:#|else )match name/g) ?? []).length;
  assert.equal(svgs, matches, "each icon needs its own match branch");
  assert.ok(svgs >= 15, `expected the theme's icon set, found ${svgs}`);
});

test("no Font Awesome classes remain in templates or island source", () => {
  // The icon font is gone, so a leftover `fas fa-clock` renders as nothing at all — and
  // a class inside a JSX ternary is invisible to the CSS coverage guard, which is how
  // two of these survived the first pass.
  const files = [
    ...walk(".", (name) => name.endsWith(".hbs")),
    ...walk("assets/js", (name) => name.endsWith(".js") || name.endsWith(".jsx")),
  ];
  // `fa-*` is distinctive; the bare style tokens are only meaningful inside a class
  // attribute, which is what stops this from matching the word "far" in a comment.
  const patterns = [/\bfa-[a-z0-9-]+\b/, /class="[^"]*\b(?:fas|far|fab|fal|fat|fad)\b/];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      const found = text.match(pattern);
      assert.ok(!found, file + " still contains the Font Awesome class " + (found ? found[0] : ""));
    }
  }
});
