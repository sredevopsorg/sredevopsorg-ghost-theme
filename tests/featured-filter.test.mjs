import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Tests for the featured-hero filter settings (`featured_tag`, `featured_only`).
 *
 * What can actually break, in order of likelihood:
 *
 *   1. the settings stop being declared or stop being read, so the Admin pane shows
 *      a control that does nothing (or GScan fails on an unused setting);
 *   2. a hero partial goes back to a hard-coded `filter="featured:true+tag:en"`, which
 *      would silently ignore the settings for that locale only;
 *   3. the filter string is assembled for the wrong combination — the eight modes are
 *      built by hand, and a copy-paste error in one branch is invisible on the default
 *      path, which is the one everyone tests;
 *   4. the root channel `/` starts filtering its hero by a language tag again (or a
 *      locale collection drops it) — the root route is the intentionally unfiltered,
 *      mixed feed, while /en/, /es/ and /br/ must stay locale-only.
 *
 * Ghost renders the templates server-side, so the honest end-to-end check is the HTML
 * goldens (tests/fixtures/README.md). These tests are the fast, offline half: they pin
 * the contract that makes the combinations correct, and a live Ghost run is what
 * proves the rendering (see the PR notes).
 */
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const custom = packageJson.config.custom;

const heroLocale = readFileSync("partials/featured-hero-locale.hbs", "utf8");
const row = readFileSync("partials/featured-row.hbs", "utf8");
const heroes = {
  en: readFileSync("partials/featured-hero.hbs", "utf8"),
  es: readFileSync("partials/featured-hero-es.hbs", "utf8"),
  br: readFileSync("partials/featured-hero-br.hbs", "utf8"),
};

/**
 * Body of a top-level block, cut at its first sibling `{{else}}`.
 *
 * The dispatch has one top-level `{{#if mixedFeed}}` whose alternate branch holds the
 * locale filters, and both branches contain nested `{{#if}}`/`{{else}}`; a plain split on
 * "{{else}}" would therefore truncate the mixed-feed body at a nested else.
 */
function blockBody(source, opener) {
  const start = source.indexOf(opener);
  assert.notEqual(start, -1, `missing ${opener}`);
  const token = /\{\{([#/])?(?:if|match|foreach|unless|is|has)\b[^}]*\}\}|\{\{else\}\}/g;
  token.lastIndex = start;
  let depth = 0;
  let bodyEnd = null;
  let match;
  while ((match = token.exec(source))) {
    if (match[0] === "{{else}}") {
      if (depth === 1) bodyEnd = match.index;
      continue;
    }
    if (match[1] === "/") {
      depth -= 1;
      if (depth === 0) return source.slice(start + opener.length, bodyEnd ?? match.index);
    } else {
      depth += 1;
    }
  }
  assert.fail(`unclosed ${opener}`);
}

// --- the settings contract -------------------------------------------------------

test("featured_tag and featured_only are declared with the defaults the docs promise", () => {
  assert.equal(custom.featured_tag?.type, "text");
  assert.equal(custom.featured_tag?.default, "", "empty must mean 'keep the locale tag only'");
  assert.equal(custom.featured_only?.type, "boolean");
  assert.equal(custom.featured_only?.default, true, "the shipped default must keep today's output");
});

test("every custom setting description stays inside GScan's 100-character limit", () => {
  for (const [key, setting] of Object.entries(custom)) {
    if (!setting.description) continue;
    assert.ok(
      setting.description.length < 100,
      `${key}: description is ${setting.description.length} chars, GScan warns at 100`,
    );
  }
});

test("both settings are read, so neither is an unused setting GScan would reject", () => {
  assert.match(heroLocale, /@custom\.featured_tag/);
  assert.match(heroLocale, /@custom\.featured_only/);
});

// --- the filter combinations, per channel kind ------------------------------------

test("the four locale featured/tag combinations produce the documented NQL", () => {
  // on + custom tag → featured:true+tag:<locale>+tag:<custom>
  assert.match(
    heroLocale,
    /concat\s+"featured:true\+tag:"\s+locale\s+"\+tag:"\s+@custom\.featured_tag/,
    "featured-only + custom tag must AND the custom tag onto the locale tag",
  );
  // on + no custom tag → featured:true+tag:<locale>
  assert.match(
    heroLocale,
    /concat\s+"featured:true\+tag:"\s+locale\s*\)/,
    "featured-only with no custom tag must reproduce today's filter",
  );
  // off + custom tag → tag:<locale>+tag:<custom>
  assert.match(
    heroLocale,
    /concat\s+"tag:"\s+locale\s+"\+tag:"\s+@custom\.featured_tag/,
    "tag-only + custom tag must drop featured:true but keep the locale tag",
  );
  // off + no custom tag → tag:<locale>
  assert.match(
    heroLocale,
    /concat\s+"tag:"\s+locale\s*\)/,
    "tag-only with no custom tag must keep the collection's language tag",
  );
});

test("every locale branch keeps the language tag, and only the root branch drops it", () => {
  // The language tag is what keeps /es/ Spanish-only; dropping it would let an English
  // post become the Spanish hero. Every `tag:` prefix in a locale branch must therefore be
  // followed by `locale`, never by `@custom.featured_tag` alone. The mixed-feed branch has
  // no language tag by design (the root route is the unfiltered feed), so its only tag is
  // the optional custom one.
  const concats = [...heroLocale.matchAll(/concat\s+[^\n)]*?\)/g)].map((m) => m[0]);
  assert.ok(concats.length >= 14, "expected twelve locale concat filters and two root ones");

  let localeBranches = 0;
  let rootBranches = 0;
  for (const expr of concats) {
    if (/\blocale\b/.test(expr)) {
      localeBranches += 1;
      assert.match(expr, /"tag:"\s*locale|"featured:true\+tag:"\s*locale/, `locale tag missing in: ${expr}`);
      assert.doesNotMatch(
        expr,
        /"(?:featured:true\+)?tag:"\s*@custom\.featured_tag/,
        `custom tag must not replace the locale tag in: ${expr}`,
      );
    } else {
      rootBranches += 1;
      assert.match(
        expr,
        /"(?:featured:true\+)?tag:"\s*@custom\.featured_tag/,
        `root-channel concat must use the custom tag alone: ${expr}`,
      );
    }
  }
  assert.equal(localeBranches, 12, "three heroes for each of the four locale combinations");
  assert.equal(rootBranches, 2, "featured_tag is the only tag a root-channel filter can carry");
});

test("the root channel hero is the mixed feed: the language tag is never forwarded", () => {
  assert.match(
    readFileSync("home.hbs", "utf8"),
    /\{\{> "collection-layout" locale="en" header="site" mixedFeed=true\}\}/,
    "home.hbs must mark the root channel as the mixed feed",
  );
  assert.match(
    readFileSync("partials/collection-layout.hbs", "utf8"),
    /\{\{> "featured-row" locale=locale mixedFeed=mixedFeed\}\}/,
    "collection-layout must forward mixedFeed to the featured row",
  );
  const row = readFileSync("partials/featured-row.hbs", "utf8");
  const forwarded = row.match(/\{\{> "featured-hero-locale" locale=locale mixedFeed=mixedFeed\}\}/g) ?? [];
  assert.equal(forwarded.length, 2, "both featured-row layouts must forward mixedFeed");

  // Locale wrappers must not opt in: their collections rely on the tag.
  for (const file of ["home-en.hbs", "home-es.hbs", "home-br.hbs"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /mixedFeed/, `${file} must keep filtering by its locale tag`);
  }
});

test("the mixed-feed branch filters on the two settings only, using the English hero", () => {
  const mixed = blockBody(heroLocale, "{{#if mixedFeed}}");

  for (const line of mixed.split("\n").filter((l) => l.includes("featuredFilter"))) {
    assert.doesNotMatch(line, /locale/, `root hero filter must not use a language tag: ${line.trim()}`);
  }
  assert.ok(!mixed.includes('{{> "featured-hero-es"'), "the root channel renders inside default.hbs (English UI)");
  assert.ok(!mixed.includes('{{> "featured-hero-br"'), "the root channel renders inside default.hbs (English UI)");

  assert.match(mixed, /\{\{> "featured-hero" featuredFilter="featured:true"\}\}/,
    "featured_only on + no featured_tag -> featured:true");
  assert.match(mixed, /concat\s+"featured:true\+tag:"\s+@custom\.featured_tag/,
    "featured_only on + featured_tag -> featured:true+tag:<custom>");
  assert.match(mixed, /concat\s+"tag:"\s+@custom\.featured_tag/,
    "featured_only off + featured_tag -> tag:<custom>");
  assert.match(mixed, /\{\{> "featured-hero" featuredFilter=""\}\}/,
    "featured_only off + no featured_tag -> no filter (newest post)");
});

// --- the heroes must consume the injected filter ----------------------------------

test("each hero filters on the injected featuredFilter, not a hard-coded filter", () => {
  for (const [locale, source] of Object.entries(heroes)) {
    assert.match(source, /\{\{#get "posts" filter=featuredFilter/, `${locale} hero must use the injected filter`);
    assert.doesNotMatch(
      source,
      /filter="(?:featured:true\+)?tag:/,
      `${locale} hero still has a hard-coded filter, which the settings cannot override`,
    );
  }
});

test("the dispatch partial covers all three locale heroes and is what featured-row calls", () => {
  for (const hero of ["featured-hero-es", "featured-hero-br", "featured-hero"]) {
    assert.ok(heroLocale.includes(`{{> "${hero}"`), `dispatch is missing ${hero}`);
  }
  // The partial hash argument is read at each hero's own top level (the `{{#get}}` call),
  // the one scope where Ghost keeps it — see docs/v3-roadmap.md.
  assert.match(heroLocale, /featuredFilter=\(concat /, "each hero must be handed a computed filter");

  // Both row layouts — with and without the security feed — must go through the same
  // dispatch, or the settings would apply to only one of them.
  const calls = row.match(/\{\{> "featured-hero-locale" locale=locale mixedFeed=mixedFeed\}\}/g) ?? [];
  assert.equal(calls.length, 2, "the hero dispatch must be shared by the feed-on and feed-off branches");
  assert.doesNotMatch(row, /\{\{> "featured-hero(?!-locale)/, "featured-row must not pick a hero directly");
});
