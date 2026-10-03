import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Tests for the security-feed widget.
 *
 * Three groups, matching what can actually break:
 *
 *   1. the model (assets/js/lib/sec-feed-model.js) — pure functions over a payload
 *      this theme does not control, so every field is treated as optional and every
 *      value as untrusted. Same split as tests/table-of-contents.test.mjs: the
 *      component needs a browser, the decisions do not.
 *   2. the theme classes — the severity/tag maps live in island source, where
 *      scripts/class-coverage.mjs cannot see them (it reads `class=` attributes and
 *      literal classList writes; these are map values). This group closes that gap
 *      for this island by asking the built CSS directly.
 *   3. the "no third-party request" guarantee — the feed origin is a theme setting,
 *      so nothing in the source may contain one. That is what makes the guarantee a
 *      property of the code rather than of a review.
 */
const {
  buildFeedLink,
  buildFeedUrl,
  clampLimit,
  clampPollMinutes,
  filterItems,
  listSignature,
  normalizeBaseUrl,
  normalizeItem,
  normalizePayload,
  pickFilters,
  relativeTime,
  severityTone,
  summarize,
  DEFAULT_LIMIT,
  DEFAULT_POLL_MINUTES,
  MAX_LIMIT,
  MAX_POLL_MINUTES,
} = await import("../assets/js/lib/sec-feed-model.js");

const { DOT_CLASSES, SEVERITY_CLASSES, TAG_CLASSES } = await import("../assets/js/islands/SecFeed.js");

// --- URL handling ----------------------------------------------------------------

test("normalizeBaseUrl accepts an origin and trims trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://security-feed.sredevops.org"), "https://security-feed.sredevops.org");
  assert.equal(normalizeBaseUrl("  https://security-feed.sredevops.org/  "), "https://security-feed.sredevops.org");
  assert.equal(normalizeBaseUrl("https://security-feed.sredevops.org///"), "https://security-feed.sredevops.org");
  assert.equal(normalizeBaseUrl("https://security-feed.sredevops.org:8000"), "https://security-feed.sredevops.org:8000");
});

test("normalizeBaseUrl accepts a site-relative path, for a reverse-proxied feed", () => {
  assert.equal(normalizeBaseUrl("/feed"), "/feed");
  assert.equal(normalizeBaseUrl("/feed/"), "/feed");
});

test("normalizeBaseUrl rejects anything that is not plainly an http(s) origin", () => {
  for (const value of [
    "",
    "   ",
    null,
    undefined,
    42,
    "javascript:alert(1)",
    "data:text/html,<script>",
    "security-feed.sredevops.org", // no scheme: guessing the scheme is how the wrong host gets called
    "//security-feed.sredevops.org", // protocol-relative, not a path
    "ftp://security-feed.sredevops.org",
  ]) {
    assert.equal(normalizeBaseUrl(value), "", `expected ${JSON.stringify(value)} to be rejected`);
  }
});

test("normalizeBaseUrl drops a query or fragment, which cannot belong to a base URL", () => {
  assert.equal(normalizeBaseUrl("https://example.com/?tag=x#top"), "https://example.com");
});

test("buildFeedUrl asks the upstream for the documented endpoint", () => {
  assert.equal(
    buildFeedUrl("https://security-feed.sredevops.org", { limit: 10 }),
    "https://security-feed.sredevops.org/api/feed?limit=10",
  );
});

test("buildFeedUrl encodes a tag filter instead of pasting it in", () => {
  assert.equal(
    buildFeedUrl("https://example.com", { tag: "a b&c=d" }),
    "https://example.com/api/feed?limit=10&tag=a+b%26c%3Dd",
  );
});

test("buildFeedUrl clamps the row count to what a block can render", () => {
  assert.match(buildFeedUrl("https://example.com", { limit: 5000 }), /limit=25$/);
  assert.match(buildFeedUrl("https://example.com", { limit: 0 }), /limit=1$/);
  assert.match(buildFeedUrl("https://example.com", { limit: "abc" }), new RegExp(`limit=${DEFAULT_LIMIT}$`));
  assert.match(buildFeedUrl("https://example.com", { limit: 1e9 }), new RegExp(`limit=${MAX_LIMIT}$`));
});

test("buildFeedUrl returns null for an unusable base, which is the island's cue to stay unmounted", () => {
  assert.equal(buildFeedUrl(""), null);
  assert.equal(buildFeedUrl("javascript:alert(1)"), null);
  assert.equal(buildFeedUrl(undefined), null);
});

test("buildFeedLink points at the upstream app, not at an API path", () => {
  assert.equal(buildFeedLink("https://security-feed.sredevops.org"), "https://security-feed.sredevops.org");
  assert.equal(buildFeedLink("/feed"), "/feed/");
  assert.equal(buildFeedLink("nope"), "");
});

test("clampPollMinutes keeps the poll sane against a rate limit", () => {
  assert.equal(clampPollMinutes("5"), 5);
  assert.equal(clampPollMinutes("0"), 1);
  assert.equal(clampPollMinutes("9999"), MAX_POLL_MINUTES);
  assert.equal(clampPollMinutes("", DEFAULT_POLL_MINUTES), DEFAULT_POLL_MINUTES);
  assert.equal(clampPollMinutes(undefined), DEFAULT_POLL_MINUTES);
});

// --- payload normalisation -------------------------------------------------------

test("normalizeItem keeps the fields a row renders and drops the rest", () => {
  const item = normalizeItem({
    id: "abc",
    title: "CVE-2024-21626: runc container escape",
    url: "https://example.com/advisory",
    source: "Ubuntu Security Notices",
    published: "2025-01-01T12:00:00+00:00",
    time_ago: "6 hours",
    tags: ["Kubernetes", "cve", "kubernetes", " "],
    cves: ["CVE-2024-21626", "CVE-2024-99999"],
    severity: "Critical",
    urgent: true,
    kev: true,
    is_sample: false,
  });

  assert.equal(item.title, "CVE-2024-21626: runc container escape");
  assert.equal(item.severity, "critical");
  assert.equal(item.tone, "critical");
  assert.equal(item.urgent, true);
  assert.equal(item.kev, true);
  assert.equal(item.sample, false);
  assert.equal(item.cve, "CVE-2024-21626", "only the first CVE fits a row");
  // Tags are lowercased and de-duplicated so a chip matches regardless of casing.
  assert.deepEqual(item.tags, ["kubernetes", "cve"]);
  assert.equal(item.publishedAt, "2025-01-01T12:00:00.000Z");
  assert.equal(item.timeAgo, "6 hours");
});

test("normalizeItem rejects rows with nothing to render", () => {
  assert.equal(normalizeItem(null), null);
  assert.equal(normalizeItem("not an object"), null);
  assert.equal(normalizeItem({ title: "no link", url: "" }), null);
  assert.equal(normalizeItem({ title: "", url: "https://example.com" }), null);
  assert.equal(normalizeItem({ title: 42, url: 42 }), null);
});

test("normalizeItem is defensive about a service that changed or dropped a field", () => {
  const item = normalizeItem({ title: "Still fine", url: "https://example.com/x" });
  assert.equal(item.severity, "");
  assert.equal(item.tone, "unknown");
  assert.deepEqual(item.tags, []);
  assert.deepEqual(item.visibleTags, []);
  assert.equal(item.cve, "");
  assert.equal(item.publishedAt, "");
  assert.equal(item.urgent, false, "a truthy string is not a boolean true");
  assert.equal(item.kev, false);
  // With no id from upstream, the URL is the identity the list signature needs.
  assert.equal(item.id, "https://example.com/x");
});

test("normalizeItem truncates rather than letting one row own the block", () => {
  const item = normalizeItem({ title: "x".repeat(1000), source: "y".repeat(500), url: "https://e.com" });
  assert.equal(item.title.length, 300);
  assert.ok(item.title.endsWith("…"));
  assert.equal(item.source.length, 80);
});

test("normalizeItem strips control characters out of titles", () => {
  const item = normalizeItem({ title: "runc\u0000escape\u001b[31m", url: "https://e.com" });
  // Each run of control characters becomes a single space, so nothing can smuggle a
  // stray gap or an escape sequence into the rendered row.
  assert.equal(item.title, "runc escape [31m");
});

test("normalizeItem caps the chips a single row can carry", () => {
  const item = normalizeItem({
    title: "t",
    url: "https://e.com",
    tags: ["linux", "cloud", "kubernetes", "cve", "exploit", "patch"],
  });
  assert.equal(item.tags.length, 6, "the model keeps them all for filtering");
  assert.equal(item.visibleTags.length, 3, "the row renders three");
});

test("normalizePayload reads the documented /api/feed shape", () => {
  const payload = normalizePayload({
    generated_at: "2025-01-01T12:00:00+00:00",
    fetched_at: "2025-01-01T12:05:00+00:00",
    source_errors: ["debian: ConnectTimeout reaching www.debian.org"],
    count: 1,
    items: [{ title: "An advisory", url: "https://e.com/a" }],
  });

  assert.equal(payload.items.length, 1);
  assert.equal(payload.updatedAt, "2025-01-01T12:05:00.000Z", "fetched_at is what the reader wants");
  assert.deepEqual(payload.sourceErrors, ["debian: ConnectTimeout reaching www.debian.org"]);
  assert.equal(payload.sample, false);
});

test("normalizePayload survives a bare array, a missing envelope and outright junk", () => {
  assert.equal(normalizePayload([{ title: "a", url: "https://e.com/a" }]).items.length, 1);
  assert.deepEqual(normalizePayload({}).items, []);
  assert.deepEqual(normalizePayload(null).items, []);
  assert.deepEqual(normalizePayload("nope").items, []);
  assert.equal(normalizePayload({ generated_at: "2025-01-01T00:00:00Z" }).updatedAt, "2025-01-01T00:00:00.000Z");
});

test("normalizePayload flags sample rows, so the widget can say the data is not live", () => {
  const payload = normalizePayload({ items: [{ title: "a", url: "https://e.com/a", is_sample: true }] });
  assert.equal(payload.sample, true);
  assert.equal(payload.items[0].sample, true);
});

test("normalizePayload drops unrenderable rows instead of emitting empty ones", () => {
  const payload = normalizePayload({
    items: [
      { title: "keep", url: "https://e.com/a" },
      { title: "", url: "https://e.com/b" },
      null,
    ],
  });
  assert.equal(payload.items.length, 1);
});

// --- filtering -------------------------------------------------------------------

test("pickFilters offers chips in a fixed order, not in frequency order", () => {
  const items = normalizePayload({
    items: [
      { title: "a", url: "https://e.com/a", tags: ["malware", "cloud", "kubernetes"] },
      { title: "b", url: "https://e.com/b", tags: ["cloud", "linux", "kev"] },
    ],
  }).items;

  // A frequency sort would lead with cloud; a reader steering the chips wants the
  // platform first and the resort last.
  assert.deepEqual(pickFilters(items), ["kubernetes", "linux", "cloud", "kev", "malware"]);
  assert.deepEqual(pickFilters(items, 2), ["kubernetes", "linux"]);
});

test("pickFilters offers nothing when there is nothing worth filtering by", () => {
  assert.deepEqual(pickFilters([]), []);
  assert.deepEqual(pickFilters(normalizePayload({ items: [{ title: "a", url: "https://e.com/a", tags: ["rust"] }] }).items), []);
});

test("filterItems filters the rows already fetched, spending no request", () => {
  const items = normalizePayload({
    items: [
      { title: "a", url: "https://e.com/a", tags: ["kubernetes"] },
      { title: "b", url: "https://e.com/b", tags: ["linux"] },
    ],
  }).items;

  assert.equal(filterItems(items, "").length, 2, "no filter means everything");
  assert.equal(filterItems(items, "linux").length, 1);
  assert.equal(filterItems(items, "LINUX").length, 1, "the chip and the tag must agree on case");
  assert.equal(filterItems(items, "cloud").length, 0);
  assert.deepEqual(filterItems(undefined, "linux"), []);
});

test("listSignature changes only when the rows do, so an unchanged poll stays silent", () => {
  const a = normalizePayload({ items: [{ id: "1", title: "a", url: "https://e.com/a" }] }).items;
  const b = normalizePayload({ items: [{ id: "2", title: "b", url: "https://e.com/b" }] }).items;
  assert.equal(listSignature(a), listSignature(normalizePayload({ items: [{ id: "1", title: "different text", url: "https://e.com/a" }] }).items));
  assert.notEqual(listSignature(a), listSignature(b));
});

test("summarize counts what the header shows", () => {
  const items = normalizePayload({
    items: [
      { title: "a", url: "https://e.com/a", urgent: true, kev: true },
      { title: "b", url: "https://e.com/b", kev: true },
    ],
  }).items;
  assert.deepEqual(summarize(items), { total: 2, urgent: 1, kev: 2 });
  assert.deepEqual(summarize([]), { total: 0, urgent: 0, kev: 0 });
});

// --- severity --------------------------------------------------------------------

test("severityTone maps the documented severities and buckets the rest", () => {
  for (const level of ["critical", "high", "medium", "low"]) {
    assert.equal(severityTone(level), level);
    assert.equal(severityTone(level.toUpperCase()), level);
    assert.equal(severityTone(` ${level} `), level);
  }
  assert.equal(severityTone("severe"), "unknown");
  assert.equal(severityTone(""), "unknown");
  assert.equal(severityTone(undefined), "unknown");
  assert.equal(severityTone(3), "unknown");
});

// --- relative time ---------------------------------------------------------------

const NOW = Date.parse("2025-01-02T12:00:00Z");

test("relativeTime formats a timestamp in the page's own language", () => {
  assert.equal(relativeTime("2025-01-02T06:00:00Z", NOW, "en"), "6 hours ago");
  assert.equal(relativeTime("2025-01-02T11:55:00Z", NOW, "en"), "5 minutes ago");
  assert.equal(relativeTime(new Date(NOW).toISOString(), NOW, "en"), "now");
  // `numeric: "auto"` only says "now" for zero; anything else keeps its number.
  assert.equal(relativeTime("2025-01-02T11:59:30Z", NOW, "en"), "30 seconds ago");
  // Spanish and Portuguese pages get their own wording without a second translation
  // table: Intl already knows it, and the theme already declares the page language.
  assert.match(relativeTime("2025-01-02T06:00:00Z", NOW, "es"), /horas/);
  assert.match(relativeTime("2025-01-02T06:00:00Z", NOW, "pt-BR"), /horas/);
});

test("relativeTime crosses unit boundaries instead of counting hours forever", () => {
  assert.match(relativeTime("2024-12-20T12:00:00Z", NOW, "en"), /day|month|yesterday/i);
  assert.match(relativeTime("2023-01-02T12:00:00Z", NOW, "en"), /year/i);
});

test("relativeTime gives up gracefully so the caller can use the upstream's own string", () => {
  assert.equal(relativeTime("not a date", NOW, "en"), "");
  assert.equal(relativeTime("", NOW, "en"), "");
  assert.equal(relativeTime(undefined, NOW, "en"), "");
  // An unusable locale tag must not throw out of the widget.
  assert.equal(relativeTime("2025-01-02T06:00:00Z", NOW, "not-a-locale!"), "");
});

// --- theme classes ---------------------------------------------------------------

/** Concatenated built CSS, or null when the build has not run yet. */
function builtCss() {
  if (!existsSync("assets/built")) return null;
  const files = readdirSync("assets/built").filter((name) => name.endsWith(".css"));
  if (!files.length) return null;
  return files.map((name) => readFileSync(join("assets/built", name), "utf8")).join("\n");
}

/** Escape a class token the way Tailwind escapes it into a selector. */
function escapeClass(token) {
  return token.replace(/[!"#$%&'()*+,./:;<=>?@[\]^`{|}~]/g, (char) => `\\${char}`);
}

function assertClassesExist(label, classes, css) {
  const missing = classes.filter((token) => !css.includes(`.${escapeClass(token)}`));
  assert.deepEqual(missing, [], `${label} classes with no rule in the built CSS: ${missing.join(", ")}`);
}

test("every tone class the widget applies exists in the built CSS", (t) => {
  const css = builtCss();
  if (!css) return t.skip("assets/built has no CSS yet — run `yarn build` first");

  assertClassesExist("severity badge", Object.values(SEVERITY_CLASSES).flatMap((v) => v.split(" ")), css);
  assertClassesExist("urgent dot", Object.values(DOT_CLASSES), css);
  assertClassesExist("tag chip", Object.values(TAG_CLASSES).flatMap((v) => v.split(" ")), css);
});

// --- the no-third-party-request guarantee ----------------------------------------

/**
 * Drop comments so a documentation link to the upstream repository is not mistaken
 * for a request the code can make. A cheap heuristic, adequate here: block comments
 * are matched outright, and a `//` preceded by `:` is a protocol (`https://`), not a
 * line comment — which is exactly what a bare `//` strip would get wrong.
 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

test("the feed origin exists nowhere in the widget source but the theme setting", () => {
  // The widget can only reach the API an administrator configured; a URL literal in
  // code would turn the theme's "no third-party requests" guarantee into a review
  // question. README and docs/adr/0003 are where a default host belongs.
  for (const file of ["assets/js/islands/SecFeed.js", "assets/js/lib/sec-feed-model.js"]) {
    const code = stripComments(readFileSync(file, "utf8"));
    assert.ok(!/https?:\/\//.test(code), `${file} contains an absolute URL: it must come from the sec_feed_api_url setting`);
  }
});

test("the widget block is opt-in: no setting, no markup and no request", () => {
  const partial = readFileSync("partials/sec-feed.hbs", "utf8");
  assert.match(partial, /\{\{#if @custom\.sec_feed_api_url\}\}/, "the block must be gated on the setting");
  assert.match(partial, /\{\{\/if\}\}\s*$/, "the gate must close at the end of the partial");
  assert.match(partial, /data-island="SecFeed"/);
  assert.match(partial, /data-api-url="\{\{@custom\.sec_feed_api_url\}\}"/, "the API URL must come from the setting");
  // Every collection renders the partial, so an unconfigured site stays byte-identical.
  assert.match(readFileSync("partials/collection-layout.hbs", "utf8"), /\{\{> "sec-feed"/);
});