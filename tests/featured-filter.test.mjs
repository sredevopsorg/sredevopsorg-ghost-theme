import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * Tests for the featured hero and its relationship with the listing grid.
 *
 * What can actually break, in order of likelihood:
 *
 *   1. a `featured_*` theme setting comes back, so the Admin pane shows a control that
 *      the templates no longer read (or GScan rejects an unused setting);
 *   2. the hero and the grid stop coming from the same `posts` list, which is the only
 *      property that makes "displayed once" true by construction;
 *   3. the hero starts filtering by a language tag on `/` (it must stay the mixed feed)
 *      or a locale home starts rendering posts from another locale;
 *   4. Ghost's `featured` flag creeps back in as a hero rule, so a post flagged further
 *      down is promoted and its card vanishes from the grid (or is rendered twice);
 *   5. the hero grows a query of its own, or the grid starts at position 1, and page 1
 *      shows the same post twice;
 *   6. the three per-locale heroes drift apart, or a hero string turns back into a hash
 *      argument that `{{#foreach}}` would drop.
 *
 * Ghost renders server-side, so the honest end-to-end check is the HTML goldens
 * (tests/fixtures/README.md). These tests are the fast, offline half, including a render
 * of the real partials with Ghost-shaped helpers.
 */
const require = createRequire(import.meta.url);
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const custom = packageJson.config.custom;

const heroes = {
  en: readFileSync("partials/featured-hero.hbs", "utf8"),
  es: readFileSync("partials/featured-hero-es.hbs", "utf8"),
  br: readFileSync("partials/featured-hero-br.hbs", "utf8"),
};
const hero = heroes.en;
const row = readFileSync("partials/featured-row.hbs", "utf8");
const grid = readFileSync("partials/listing-grid.hbs", "utf8");
const layout = readFileSync("partials/collection-layout.hbs", "utf8");
const home = readFileSync("home.hbs", "utf8");

/**
 * A minimal Handlebars standing in for Ghost's: `{{#foreach}}` honours `from`/`to` and
 * sets `@index`/`@number`, and `{{#is}}` answers the page context the caller passes.
 * Only the helpers the partials under test actually use are implemented, so an
 * accidental dependency on something new fails loudly.
 */
function ghostHandlebars({ page = 1 }) {
  const hbs = require("handlebars").create();
  hbs.registerPartial("post-card", `<card>{{url}}</card>`);
  for (const [name, source] of Object.entries(heroes)) hbs.registerPartial(`featured-hero${name === "en" ? "" : `-${name}`}`, source);

  // Ghost's block helpers forward `options.data`; so must these. A pass that selects no
  // items (an unset `to`, a non-existent `from`) must run `options.inverse` so the
  // template's `{{else}}` still happens, exactly as Ghost renders it.
  const run = function (options, fn) {
    return typeof fn === "function" ? fn(this, { data: options.data }) : "";
  };

  // Ghost's archive-wide `foreach`: one helper for every collection (posts and authors
  // alike), so wrapping the array case in a ghost-handler is not necessary — but it must
  // never throw on a post that has no authors.
  hbs.registerHelper("foreach", function (collection, options) {
    const list = collection ?? [];
    const from = options.hash.from === undefined ? 1 : Number(options.hash.from);
    const to = options.hash.to === undefined ? list.length : Number(options.hash.to);
    // A position that is not a number selects nothing (Ghost renders nothing), and a
    // pass with no items still runs `{{else}}`.
    const items = Number.isFinite(from) && Number.isFinite(to) ? list.slice(from - 1, to) : [];
    if (!items.length) return run.call(this, options, options.inverse);
    return items
      .map((item, i) =>
        options.fn(item, {
          data: { ...(options.data || {}), index: i, number: i + 1, first: i === 0, last: i === items.length - 1 },
        }),
      )
      .join("");
  });
  hbs.registerHelper("if", function (condition, options) {
    return run.call(this, options, condition ? options.fn : options.inverse);
  });
  hbs.registerHelper("match", function (...args) {
    const options = args.pop();
    const [left, operator, right] = args;
    const ok = operator === "=" ? left === right : operator === ">" ? left > right : false;
    return run.call(this, options, ok ? options.fn : options.inverse);
  });
  // `{{#is}}` / `{{^is}}`: true when the page context is among the named ones.
  const inContext = (context) =>
    context
      .split(",")
      .map((part) => part.trim())
      .some((want) => (page === 1 ? want === "home" || want === "index" : true) && want !== "nowhere");
  hbs.registerHelper("is", function (context, options) {
    return run.call(this, options, inContext(context) ? options.fn : options.inverse);
  });
  hbs.registerHelper("t", (value) => value);
  hbs.registerHelper("date", (value, options) => `[${options.hash.format}]`);
  hbs.registerHelper("reading_time", () => "[read]");
  hbs.registerHelper("excerpt", () => "[excerpt]");
  hbs.registerHelper("img_url", () => "/img.png");
  return hbs;
}

/** Renders the row + grid exactly as partials/collection-layout.hbs places them. */
function renderListing({ posts, locale = "en", page = 1 }) {
  const hbs = ghostHandlebars({ page });
  const rowOut = hbs.compile(row)({ locale, posts });
  const gridOut = hbs.compile(grid)({ locale, posts });
  // The hero is the only anchor carrying the `mb-12 rounded-2xl` block classes, so a
  // card link or an HTML comment in the partials cannot be mistaken for it.
  const heroUrls = [...rowOut.matchAll(/<a href="([^"]+)"[^>]*class="[^"]*rounded-2xl\b/g)].map((m) => m[1]);
  const cards = [...gridOut.matchAll(/<card>([^<]+)<\/card>/g)].map((m) => m[1]);
  return { rowOut, gridOut, heroUrls, cards };
}

// `url` and `authors` are what the hero partial prints (link target, author name).
const LISTING = [
  ["newest", false],
  ["second", false],
  ["flagged-third", true],
  ["fourth", false],
  ["fifth", false],
].map(([slug, featured]) => ({ slug, featured, url: `/${slug}/`, authors: [{ name: "Ana" }] }));

// --- the settings are gone ---------------------------------------------------------

test("the featured_* theme settings no longer exist", () => {
  assert.equal(custom.featured_only, undefined, "the hero no longer has a themed flag switch");
  assert.equal(custom.featured_tag, undefined, "the hero no longer has a themed tag filter");
  // Comments are prose about the old design; only real expressions count.
  const strip = (source) => source.replace(/\{\{!--[\s\S]*?--\}\}/g, "");
  const sources = [hero, row, grid, layout, home].map(strip).join("\n");
  assert.doesNotMatch(sources, /@custom\.featured/, "no template may read a removed setting");
  assert.doesNotMatch(sources, /featured_only|featured_tag/, "no template may mention the removed settings");
});

test("the shipped custom settings keep their keys and GScan's limits", () => {
  // Append-only list: a new feature adds its keys here, and a removed setting must not
  // come back. `featured_*` stays out (see the test above).
  assert.deepEqual(Object.keys(custom).sort(), [
    "show_login",
    "show_search",
    "tts_api_key",
    "tts_audio_host",
    "tts_enabled",
  ]);
  for (const [key, setting] of Object.entries(custom)) {
    if (setting.description) {
      assert.ok(setting.description.length < 100, `${key}: description is ${setting.description.length} chars`);
    }
  }
});

// --- one query: the hero and the grid share the page's posts -----------------------

test("only the page's own posts feed the hero and the grid", () => {
  for (const [name, source] of [["hero", hero], ["grid", grid], ["row", row]]) {
    assert.doesNotMatch(source, /\{\{#get\b/, `${name} must not run its own query`);
  }
  assert.match(hero, /\{\{#foreach posts from="1" to="1"\}\}/, "the hero is exactly the lead post");
  const heroMarkup = hero.replace(/\{\{!--[\s\S]*?--\}\}/g, "");
  assert.doesNotMatch(heroMarkup, /featured/, "the hero must not test Ghost's featured flag");
  assert.match(grid, /\{\{#foreach posts from="2"\}\}/, "the page-1 grid starts after the hero");
  assert.match(grid, /\{\{#foreach posts\b/, "the grid walks the page's posts");
  assert.match(layout, /\{\{> "listing-grid" locale=locale\}\}/, "the layout renders the shared grid");
  assert.match(layout, /\{\{> "featured-row" locale=locale\}\}/, "the layout renders the shared hero row");
});

test("no listing partial filters by language: / stays the mixed feed", () => {
  // The channel's filter lives in routes.yaml; a `tag:` inside the templates would
  // re-index `/` by language and duplicate the collections' job.
  for (const [name, source] of [["hero", hero], ["grid", grid], ["row", row]]) {
    assert.doesNotMatch(source, /tag:/, `${name} must not carry a tag filter`);
    assert.doesNotMatch(source, /filter=/, `${name} must not build a query filter`);
  }
  assert.match(home, /mixedFeed=true/, "home.hbs still declares the root channel as mixed");
  for (const file of ["home-en.hbs", "home-es.hbs", "home-br.hbs"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /mixedFeed/, `${file} is a locale collection`);
  }
});

test("each locale home keeps its own collection filter, from routes.yaml", () => {
  const routes = readFileSync("routes.yaml", "utf8");
  const expected = {
    "/en/": ["tag:en+tag:-es+tag:-br", "home-en"],
    "/es/": ["tag:es+tag:-en+tag:-br", "home-es"],
    "/br/": ["tag:br+tag:-es+tag:-en", "home-br"],
  };
  for (const [collection, [filter, template]] of Object.entries(expected)) {
    assert.ok(routes.includes(filter), `routes.yaml lost the ${collection} filter`);
    assert.ok(routes.includes(`template: ${template}`), `routes.yaml lost the ${collection} template`);
    const wrapper = readFileSync(`${template}.hbs`, "utf8");
    assert.match(wrapper, /collection-layout/, `${template}.hbs must render the shared layout`);
    // The filter is Ghost's, not the template's: the layout gets no filter argument, so
    // posts arrive already scoped by locale and the locale key only selects wording.
    assert.doesNotMatch(wrapper, /filter|tag:/, `${template}.hbs must not add a filter of its own`);
  }
});

// --- the hero and the grid render every post once ---------------------------------

const slugsOf = (urls) => urls.map((url) => url.replaceAll("/", ""));

test("the hero is the lead post and the grid starts after it", () => {
  const { heroUrls, cards } = renderListing({ posts: LISTING });
  assert.deepEqual(heroUrls, [LISTING[0].url]);
  assert.deepEqual(slugsOf(cards), LISTING.slice(1).map((p) => p.slug));
  assert.ok(!cards.includes(LISTING[0].url), "the hero must not also render as a card");
});

test("Ghost's featured flag does not move the hero", () => {
  // A flag on the lead post changes nothing, and a flag further down does not promote
  // that post: the hero is always posts[0]. No theme setting, no featured query.
  for (const flaggedIndex of [0, 2]) {
    const posts = LISTING.map((p, i) => ({ ...p, featured: i === flaggedIndex }));
    const { heroUrls, cards } = renderListing({ posts });
    assert.deepEqual(heroUrls, [posts[0].url], `a flag on ${posts[flaggedIndex].slug} must not move the hero`);
    assert.deepEqual(slugsOf(cards), posts.slice(1).map((p) => p.slug));
  }
});

test("every post of the page renders exactly once", () => {
  const { heroUrls, cards } = renderListing({ posts: LISTING });
  const rendered = [...heroUrls, ...cards];
  assert.equal(rendered.length, LISTING.length, "hero + cards cover the page's posts");
  assert.deepEqual([...rendered].sort(), LISTING.map((p) => p.url).sort(), "no post twice, none missing");
});

test("page 2 has no hero and lists every post of that page", () => {
  const { heroUrls, cards } = renderListing({ posts: LISTING, page: 2 });
  assert.deepEqual(heroUrls, []);
  assert.deepEqual(slugsOf(cards), LISTING.map((p) => p.slug));
});

test("locale only changes wording, never which posts render", () => {
  const en = renderListing({ posts: LISTING, locale: "en" });
  const es = renderListing({ posts: LISTING, locale: "es" });
  const br = renderListing({ posts: LISTING, locale: "br" });
  assert.deepEqual(es.cards, en.cards);
  assert.deepEqual(br.cards, en.cards);
  assert.deepEqual(es.heroUrls, en.heroUrls);
  assert.match(en.rowOut, /Featured/);
  assert.match(es.rowOut, /Destacado/);
  assert.match(br.rowOut, /Destaque/);
});

test("the hero strings are per-locale literals inside the loop", () => {
  // Ghost drops partial hash arguments inside `{{#foreach}}`, where the label and the
  // dates are printed, so each locale's hero carries its own literals instead.
  assert.match(heroes.en, /font-mono">Featured</);
  assert.match(heroes.es, /font-mono">Destacado</);
  assert.match(heroes.br, /font-mono">Destaque</);
  for (const [locale, source] of Object.entries(heroes)) {
    assert.doesNotMatch(source, /format=[a-zA-Z]/, `${locale}: date format must be a literal`);
    assert.doesNotMatch(source, /minute=minutes/, `${locale}: reading time must be a literal`);
  }
  // The row only dispatches on locale; it passes no hero strings.
  assert.doesNotMatch(row, /label=|dateFormat|minutes=/, "the row must not pass hero strings into the loop");
  assert.match(row, /\{\{> "featured-hero-es"\}\}/);
  assert.match(row, /\{\{> "featured-hero-br"\}\}/);
  assert.match(row, /\{\{> "featured-hero"\}\}/);
});
