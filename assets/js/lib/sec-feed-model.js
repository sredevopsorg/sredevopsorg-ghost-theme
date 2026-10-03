/**
 * Model for the security-feed widget (assets/js/islands/SecFeed.js).
 *
 * Everything here is pure: no DOM, no fetch, no globals. The island owns the I/O
 * and the rendering; this file owns the decisions that are easy to get subtly
 * wrong and cheap to test — building a safe URL, normalising a payload that comes
 * from a service this theme does not control, choosing a severity tone, and turning
 * a timestamp into the page's own language.
 *
 * The upstream contract is https://github.com/sredevopsorg/sredevopsorg-sec-feed
 * (`GET /api/feed` -> `{ generated_at, fetched_at, source_errors, count, items[] }`).
 * Every field is treated as optional and every value as untrusted: the service is
 * a separate deployable that can be a version ahead, behind, or replaced, and a
 * widget must degrade to "a list, or a message" rather than throw.
 *
 * Units: seconds for time deltas, minutes for the poll interval, items for counts.
 */

/** Rows a widget shows by default. The API allows 200; a block in a page is not a feed. */
export const DEFAULT_LIMIT = 10;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 25;

/** Refresh cadence. The upstream cache refreshes every 10 minutes; 5 matches its own fallback. */
export const DEFAULT_POLL_MINUTES = 5;
export const MIN_POLL_MINUTES = 1;
export const MAX_POLL_MINUTES = 60;

/** A row is a link, not an article: cap what can be rendered as one line of text. */
const MAX_TITLE_LENGTH = 300;
const MAX_SOURCE_LENGTH = 80;
const MAX_TAGS_PER_ITEM = 3;
const MAX_FILTERS = 5;

/** Filter chips, in the order a security reader expects them, not by frequency. */
const FILTER_ORDER = ["kubernetes", "linux", "cloud", "cve", "exploit", "kev", "malware"];

/** Severities the upstream documents, plus an explicit bucket for everything else. */
const KNOWN_SEVERITIES = ["critical", "high", "medium", "low"];

/** A request that must not hang a page's poll loop forever. */
export const REQUEST_TIMEOUT_MS = 10_000;

function toText(value, max) {
  if (typeof value !== "string") return "";
  // Control characters would survive into textContent and show up as odd gaps in
  // the row; they never carry meaning in a title or a source name.
  const clean = value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function toIsoString(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? "" : new Date(parsed).toISOString();
}

function toNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Validate the configured API origin.
 *
 * Accepts an absolute http(s) origin, or a site-relative path for installations
 * that reverse-proxy the feed onto the publication's own domain. Everything else —
 * including `javascript:`, `data:` and a bare host with no scheme — returns "",
 * so an unconfigured or mistyped setting disables the widget instead of issuing a
 * request to somewhere arbitrary.
 */
export function normalizeBaseUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Same-origin path: only root-relative, so "//evil.example" cannot masquerade
  // as a path (that form is protocol-relative and means a different host).
  if (trimmed.startsWith("/")) {
    return trimmed.startsWith("//") ? "" : trimmed.replace(/\/+$/, "");
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  if (!url.hostname) return "";
  // Query and fragment cannot belong to a base URL; carrying them would leak into
  // every request built from it.
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

/** Clamp a row count into the range the widget renders well at. */
export function clampLimit(value, fallback = DEFAULT_LIMIT) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parsed));
}

/** Clamp a poll interval. Sub-minute polling would be a hot loop against a rate limit. */
export function clampPollMinutes(value, fallback = DEFAULT_POLL_MINUTES) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_POLL_MINUTES, Math.max(MIN_POLL_MINUTES, parsed));
}

/**
 * URL for one feed request.
 *
 * Returns null when there is no usable base, which is the island's cue to stay
 * unmounted rather than to retry a URL that can never work.
 */
export function buildFeedUrl(base, { limit = DEFAULT_LIMIT, tag = "" } = {}) {
  const normalized = normalizeBaseUrl(base);
  if (!normalized) return null;

  const query = new URLSearchParams();
  query.set("limit", String(clampLimit(limit)));
  const cleanTag = typeof tag === "string" ? tag.trim() : "";
  if (cleanTag) query.set("tag", cleanTag);

  return `${normalized}/api/feed?${query.toString()}`;
}

/** Where the "view the full live feed" link points when no explicit link is given. */
export function buildFeedLink(base) {
  const normalized = normalizeBaseUrl(base);
  if (!normalized) return "";
  // A path-style base (`/feed`) is an app mounted under a prefix; an origin-style
  // base is the app's own root.
  return normalized.startsWith("/") ? `${normalized}/` : normalized;
}

/** Bucket a severity into the tone keys the island maps to classes. */
export function severityTone(severity) {
  const value = typeof severity === "string" ? severity.trim().toLowerCase() : "";
  return KNOWN_SEVERITIES.includes(value) ? value : "unknown";
}

/**
 * Normalise one upstream item into exactly what a row renders.
 *
 * An item with neither a title nor a link is dropped by the caller: there is
 * nothing to show, and a row of empty boxes is worse than one row fewer.
 */
export function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;

  const title = toText(raw.title, MAX_TITLE_LENGTH);
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!title || !url) return null;

  const cves = Array.isArray(raw.cves)
    ? raw.cves.map((cve) => toText(cve, 24)).filter(Boolean)
    : [];
  const tags = Array.isArray(raw.tags)
    ? [...new Set(raw.tags.map((tag) => toText(tag, 24).toLowerCase()).filter(Boolean))]
    : [];

  return {
    id: toText(raw.id, 64) || url,
    title,
    url,
    source: toText(raw.source, MAX_SOURCE_LENGTH),
    // `time_ago` is the upstream's own English string, kept only as a fallback for
    // a timestamp we cannot parse.
    timeAgo: toText(raw.time_ago, 40),
    publishedAt: toIsoString(raw.published),
    tags,
    visibleTags: tags.slice(0, MAX_TAGS_PER_ITEM),
    severity: typeof raw.severity === "string" ? raw.severity.trim().toLowerCase() : "",
    tone: severityTone(raw.severity),
    urgent: raw.urgent === true,
    kev: raw.kev === true,
    cve: cves[0] ?? "",
    sample: raw.is_sample === true,
  };
}

/**
 * Normalise a `/api/feed` payload.
 *
 * Tolerates a bare array (what `/api/items`-style responses look like) so a future
 * upstream shape does not blank the widget. Returns an empty item list rather than
 * throwing: "no advisories" is a state the island can render, a thrown error is not.
 */
export function normalizePayload(payload) {
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : [];

  const errors = Array.isArray(payload?.source_errors)
    ? payload.source_errors.map((error) => toText(error, 200)).filter(Boolean)
    : [];

  return {
    items: rawItems.map(normalizeItem).filter(Boolean),
    updatedAt: toIsoString(payload?.fetched_at) || toIsoString(payload?.generated_at),
    sourceErrors: errors,
    sample: rawItems.some((item) => item?.is_sample === true),
  };
}

/**
 * Which tag chips to offer, in a stable order.
 *
 * Fixed order rather than "most common" because the point of a chip is to steer a
 * reader to a topic; a chip row that reshuffles every poll cannot be clicked from
 * muscle memory, and the item list below it is what carries the frequency.
 */
export function pickFilters(items, max = MAX_FILTERS) {
  const present = new Set();
  for (const item of items ?? []) {
    for (const tag of item?.tags ?? []) present.add(tag);
  }
  const limit = Number.isFinite(max) && max > 0 ? max : MAX_FILTERS;
  return FILTER_ORDER.filter((tag) => present.has(tag)).slice(0, limit);
}

/** Filter already-fetched rows client-side; no request, so no rate limit to spend. */
export function filterItems(items, tag) {
  const wanted = typeof tag === "string" ? tag.trim().toLowerCase() : "";
  if (!wanted) return items ?? [];
  return (items ?? []).filter((item) => (item?.tags ?? []).includes(wanted));
}

/** How many rows are urgent, and how many are in CISA's KEV catalog. */
export function summarize(items) {
  let urgent = 0;
  let kev = 0;
  for (const item of items ?? []) {
    if (item?.urgent) urgent++;
    if (item?.kev) kev++;
  }
  return { total: (items ?? []).length, urgent, kev };
}

/**
 * Identity of a rendered list, used to decide whether a poll actually changed
 * anything. Re-announcing an unchanged list to a screen reader on every tick is
 * worse than being a few seconds stale.
 */
export function listSignature(items) {
  return (items ?? []).map((item) => item?.id ?? "").join("|");
}

const RELATIVE_UNITS = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 2592000, divisor: 86400, unit: "day" },
  { limit: 31536000, divisor: 2592000, unit: "month" },
];

/**
 * Format a timestamp as relative time in the page's own language.
 *
 * Uses `Intl.RelativeTimeFormat` with the document language rather than a
 * translation string per unit: the theme already declares `lang` per locale, so
 * this stays correct in es and br without a second copy of every string, and it
 * cannot drift from the browser's own locale data.
 *
 * Returns "" when the date cannot be parsed or `Intl` is unavailable — the caller
 * then falls back to the upstream's `time_ago`.
 */
export function relativeTime(iso, now = Date.now(), locale = "en") {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "";
  if (typeof Intl === "undefined" || typeof Intl.RelativeTimeFormat !== "function") return "";

  const deltaSeconds = Math.round((timestamp - now) / 1000);
  const magnitude = Math.abs(deltaSeconds);

  const { divisor, unit } =
    RELATIVE_UNITS.find((entry) => magnitude < entry.limit) ?? { divisor: 31536000, unit: "year" };

  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      Math.round(deltaSeconds / divisor),
      unit,
    );
  } catch {
    // An unusable locale tag ("x-private") throws; the caller's fallback still works.
    return "";
  }
}