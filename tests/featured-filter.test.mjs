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
 *   3. the filter string is assembled for the wrong combination — the four modes are
 *      built by hand, and a copy-paste error in one branch is invisible on the default
 *      path, which is the one everyone tests.
 *
 * Ghost renders the templates server-side, so the honest end-to-end check is the HTML
 * goldens (tests/fixtures/README.md). These tests are the fast, offline half: they pin
 * the contract that makes the four combinations correct, and a live Ghost run is what
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

// --- the four filter combinations -------------------------------------------------

test("the four featured/tag combinations produce the documented NQL", () => {
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

test("the custom tag is added, never substituted: every branch keeps the locale tag", () => {
  // The language tag is what keeps /es/ Spanish-only; dropping it would let an English
  // post become the Spanish hero. Every `tag:` prefix in the dispatch partial must be
  // followed by `locale`, never by `@custom.featured_tag` alone.
  const concats = [...heroLocale.matchAll(/concat\s+[^\n)]*?\)/g)].map((m) => m[0]);
  assert.ok(concats.length >= 4, "expected at least four concat filters");
  for (const expr of concats) {
    assert.match(expr, /"tag:"\s*locale|"featured:true\+tag:"\s*locale/, `locale tag missing in: ${expr}`);
    assert.doesNotMatch(
      expr,
      /"(?:featured:true\+)?tag:"\s*@custom\.featured_tag/,
      `custom tag must not replace the locale tag in: ${expr}`,
    );
  }
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
  const calls = row.match(/\{\{> "featured-hero-locale" locale=locale\}\}/g) ?? [];
  assert.equal(calls.length, 2, "the hero dispatch must be shared by the feed-on and feed-off branches");
  assert.doesNotMatch(row, /\{\{> "featured-hero(?!-locale)/, "featured-row must not pick a hero directly");
});
