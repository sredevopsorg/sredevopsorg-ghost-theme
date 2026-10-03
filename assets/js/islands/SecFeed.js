import { t } from "../lib/theme-config.js";
import {
  buildFeedLink,
  buildFeedUrl,
  clampLimit,
  clampPollMinutes,
  filterItems,
  listSignature,
  normalizePayload,
  pickFilters,
  relativeTime,
  summarize,
  DEFAULT_LIMIT,
  DEFAULT_POLL_MINUTES,
  REQUEST_TIMEOUT_MS,
} from "../lib/sec-feed-model.js";

/**
 * Security feed — a minified frontend for
 * https://github.com/sredevopsorg/sredevopsorg-sec-feed
 *
 * Mount point (partials/sec-feed.hbs, gated on the `sec_feed_api_url` setting):
 *   <div data-island="SecFeed" data-api-url="…" data-limit="10" data-poll="5"
 *        data-feed-link="…"></div>
 *
 * Why this is an island, and not a page: the upstream service already ships a full
 * single-page frontend with search, SSE and its own filters. This is deliberately
 * the small half of it — the newest N advisories inside a block of an existing page —
 * so a reader gets current security context without leaving the article they are on.
 * "View the full live feed" hands over to the real thing.
 *
 * Why vanilla and not React: nothing here is server-rendered, so there is nothing to
 * hydrate, and the only state is "loading / ready / failed / which chip". Rendering
 * ten rows does not need the ~69 kB gzip of runtime that the theme's React islands
 * pull in — and this widget is most likely to live on the homepage, the one page every
 * reader pays for. The decision logic that *is* subtle lives in
 * assets/js/lib/sec-feed-model.js, where it is unit-tested; this file is the thin
 * shell around it. See docs/adr/0003-security-feed-widget.md.
 *
 * Polling, not SSE: the upstream rate-limits `/api/events` and caps concurrent
 * subscribers, so one long-lived connection per open tab is the wrong thing for a
 * widget to ask of a service it does not own. Polling every `data-poll` minutes while
 * the tab is visible, plus an immediate refresh when it comes back, is the same
 * trade the upstream's own frontend makes as its documented fallback.
 *
 * Failure handling, which is the part that matters most for an external dependency:
 *   - no configured base  -> stay unmounted, silently (the partial renders nothing)
 *   - first load fails    -> a message and a retry button, inside the reserved block
 *   - a later poll fails  -> keep the rows on screen and mark them stale, so a
 *                            momentary outage never blanks a page that already rendered
 *   - the list is unchanged -> the status line is not re-announced to screen readers
 *
 * No-JS: the mount point is empty and the partial renders a plain link to the full
 * feed, which is the documented island contract.
 */

/**
 * Severity badges. Keyed by the tones in sec-feed-model.js so an unknown severity
 * from a future upstream release falls to `unknown` instead of rendering nothing.
 * Severity is also spelled out in text in every badge, so colour is never the only
 * signal — which is why these classes never have to be legible on their own.
 */
export const SEVERITY_CLASSES = {
  critical: "border-brand-red/50 bg-brand-red/10 text-brand-red",
  high: "border-brand-orange/50 bg-brand-orange/10 text-brand-orange",
  medium: "border-border-strong bg-subtle text-body",
  low: "border-border-subtle bg-transparent text-muted",
  unknown: "border-border-subtle bg-transparent text-muted",
};

/** The urgent marker down the left edge. Only urgent rows get one. */
export const DOT_CLASSES = {
  critical: "bg-brand-red",
  high: "bg-brand-orange",
  medium: "bg-border-strong",
  low: "bg-border-strong",
  unknown: "bg-border-strong",
};

/**
 * Topic chips. The interesting tags carry the meaning a security reader scans for
 * (known-exploited, exploit, malware, patch); the rest stay neutral so the row does
 * not turn into a bag of coloured badges.
 */
export const TAG_CLASSES = {
  kev: "border-brand-red/50 bg-brand-red/10 text-brand-red",
  exploit: "border-brand-orange/50 bg-brand-orange/10 text-brand-orange",
  malware: "border-brand-purple/50 bg-brand-purple/10 text-brand-purple",
  "malicious-packages": "border-brand-purple/50 bg-brand-purple/10 text-brand-purple",
  "supply-chain": "border-brand-purple/50 bg-brand-purple/10 text-brand-purple",
  patch: "border-brand-blue/50 bg-brand-blue/10 text-brand-blue",
};

/** Everything that is neither a topic nor a badge. */
const NEUTRAL_CHIP = "border-border-subtle bg-subtle text-body";

function tagClass(tag) {
  return TAG_CLASSES[tag] ?? NEUTRAL_CHIP;
}

/** `textContent` everywhere: a title from another service is data, never markup. */
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** Props arrive from the mount element's dataset; everything here has a default. */
function readProps(props) {
  const base = typeof props.apiUrl === "string" ? props.apiUrl : "";
  return {
    url: buildFeedUrl(base, { limit: clampLimit(props.limit, DEFAULT_LIMIT) }),
    // Derived, never configured: an origin-style base is the app's own root, a
    // path-style base is the app mounted under that prefix. Either way the link lands
    // on the full frontend rather than on an API path.
    link: buildFeedLink(base),
    pollMs: clampPollMinutes(props.poll, DEFAULT_POLL_MINUTES) * 60_000,
  };
}

/**
 * One fetch with a hard timeout.
 *
 * `cache: "no-store"` because the widget's whole job is freshness and the service
 * sends no caching headers of its own; `credentials: "omit"` because a public feed
 * must never be read with the reader's cookies.
 */
async function request(url, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // The caller's signal (page teardown) wins over ours.
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`feed responded ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

function createWidget(element_, config) {
  // The status line is the only live region: announcing ten rewritten rows on every
  // poll would be noise, while "12 advisories · updated 2 minutes ago" is useful.
  const status = element("p", "mb-3 text-xs text-subtle-text", t("secFeedLoading"));
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const notices = element("div", "mt-3 space-y-1 text-xs text-subtle-text");
  const filters = element("div", "mb-3 flex flex-wrap gap-1.5");
  filters.setAttribute("role", "group");
  filters.setAttribute("aria-label", t("secFeedFilterLabel"));

  const list = element("ul", "divide-y divide-border-subtle");
  list.setAttribute("aria-label", t("secFeedList"));

  const footer = element("p", "mt-4 border-t border-border-subtle pt-3 text-xs");

  const body = [status, filters, list, notices, footer];
  for (const node of body) element_.appendChild(node);

  const controller = new AbortController();
  let timer = 0;
  let disposed = false;
  let tag = "";
  let feed = { items: [], updatedAt: "", sourceErrors: [], sample: false };
  let signature = null;
  let chipButtons = [];
  let settled = false;

  const locale = document.documentElement.lang || "en";

  function relative(iso) {
    return relativeTime(iso, Date.now(), locale) || "";
  }

  /**
   * "12 advisories" without a plural engine: the theme's own `minute`/`minutes` pattern.
   *
   * `replaceAll`, not `replace("%")`. A string pattern replaces only the first match,
   * which is both surprising when a translator writes a second `%` into the string and
   * the pattern CodeQL's `js/incomplete-sanitization` rule reports on — see alert #13.
   */
  function advisoryCount(total) {
    const template = total === 1 ? t("secFeedAdvisoryOne") : t("secFeedAdvisoryMany");
    return template.replaceAll("%", String(total));
  }

  function renderStatus() {
    const { total } = summarize(feed.items);
    const when = relative(feed.updatedAt);
    const parts = [advisoryCount(total)];
    if (when) parts.push(`${t("secFeedUpdated")} ${when}`);
    status.textContent = parts.join(" · ");
  }

  function renderNotices({ stale }) {
    notices.textContent = "";
    // Order matters: "this is sample data" outranks everything, because it explains
    // the rows above rather than qualifying them.
    if (feed.sample) notices.appendChild(element("p", "", t("secFeedSample")));
    if (stale) notices.appendChild(element("p", "", t("secFeedStale")));
    else if (feed.sourceErrors.length) notices.appendChild(element("p", "", t("secFeedSources")));
  }

  function renderRow(item, marked) {
    const row = element("li", "flex gap-3 py-3");
    // Decorative: the urgency is already spelled out by the severity badge, so a
    // screen reader gains nothing from an empty span.
    if (marked) {
      const dot = element("span", `mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[item.tone] ?? DOT_CLASSES.unknown}`);
      dot.setAttribute("aria-hidden", "true");
      row.appendChild(dot);
    }

    const bodyNode = element("div", "min-w-0 flex-1");

    const link = element("a", "block text-sm font-semibold text-strong hover:text-brand-purple", item.title);
    link.href = item.url;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    bodyNode.appendChild(link);

    const meta = element("div", "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-subtle-text");
    meta.appendChild(
      element(
        "span",
        `rounded border px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider ${SEVERITY_CLASSES[item.tone] ?? SEVERITY_CLASSES.unknown}`,
        item.tone === "unknown" ? "—" : item.tone,
      ),
    );
    if (item.kev) {
      meta.appendChild(element("span", `rounded border px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider ${TAG_CLASSES.kev}`, "KEV"));
    }
    if (item.source) meta.appendChild(element("span", "", item.source));
    const when = relative(item.publishedAt) || item.timeAgo;
    if (when) {
      meta.appendChild(element("span", "", "·"));
      const time = element("time", "", when);
      if (item.publishedAt) time.setAttribute("datetime", item.publishedAt);
      meta.appendChild(time);
    }
    bodyNode.appendChild(meta);

    const chips = [...item.visibleTags];
    if (item.cve) chips.push(item.cve);
    if (chips.length) {
      const tagRow = element("div", "mt-1.5 flex flex-wrap gap-1.5");
      for (const value of chips) {
        const isCve = value === item.cve;
        tagRow.appendChild(
          element(
            "span",
            `rounded border px-1.5 py-0.5 font-mono text-[10px] ${isCve ? "border-border-subtle text-body" : tagClass(value)}`,
            isCve ? value.toUpperCase() : value,
          ),
        );
      }
      bodyNode.appendChild(tagRow);
    }

    row.appendChild(bodyNode);
    return row;
  }

  function renderList() {
    const visible = filterItems(feed.items, tag);
    list.textContent = "";
    if (!visible.length) {
      list.appendChild(element("li", "py-6 text-center text-sm text-muted", t("secFeedEmpty")));
      return;
    }

    // The upstream sorts urgent-first, so the top N of a live feed is almost always
    // *all* urgent: a dot on every row marks nothing and trains the eye to skip it.
    // It is shown only while some rows are not urgent, i.e. while it can still single
    // one out. The severity badge carries the distinction either way.
    const anyNonUrgent = visible.some((item) => !item.urgent);

    for (const item of visible) list.appendChild(renderRow(item, item.urgent && anyNonUrgent));
  }

  function renderFooter() {
    footer.textContent = "";
    if (!config.link) return;
    const link = element("a", "font-mono font-bold uppercase tracking-wider text-brand-purple hover:text-brand-blue", `${t("secFeedViewAll")} →`);
    link.href = config.link;
    link.rel = "noopener noreferrer";
    footer.appendChild(link);
  }

  function renderFilters() {
    const available = pickFilters(feed.items);
    filters.textContent = "";
    chipButtons = [];
    if (available.length < 2) return;

    const options = ["", ...available];
    for (const value of options) {
      const button = element(
        "button",
        "rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
        value || t("secFeedFilterAll"),
      );
      button.type = "button";
      button.dataset.tag = value;
      button.addEventListener("click", () => {
        if (tag === value) return;
        tag = value;
        paintChips();
        renderList();
      });
      filters.appendChild(button);
      chipButtons.push({ button, value });
    }
    paintChips();
  }

  /** Selected chip is filled, the rest are outlined: state readable without colour. */
  function paintChips() {
    const selected = "border-brand-purple bg-brand-purple/10 text-brand-purple";
    const idle = "border-border-subtle bg-subtle text-muted hover:text-strong";
    for (const { button, value } of chipButtons) {
      const active = value === tag;
      button.className = `rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${active ? selected : idle}`;
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function renderError(message) {
    status.textContent = "";
    list.textContent = "";
    notices.textContent = "";
    footer.textContent = "";
    filters.textContent = "";
    chipButtons = [];

    const retry = element("button", "mt-3 rounded border border-brand-purple px-3 py-1.5 text-sm font-semibold text-strong", t("secFeedRetry"));
    retry.type = "button";
    retry.addEventListener("click", () => refresh());

    status.appendChild(element("span", "", message));
    status.appendChild(retry);
  }

  async function refresh() {
    if (disposed || !config.url) return;
    try {
      const payload = normalizePayload(await request(config.url, controller.signal));
      if (disposed) return;

      feed = payload;
      // Only rewrite the rows when they actually changed: a poll that returns the
      // same list should cost no DOM work and no announcement.
      const nextSignature = listSignature(filterItems(feed.items, tag));
      const changed = nextSignature !== signature;
      signature = nextSignature;

      status.className = "mb-3 text-xs text-subtle-text";
      settle();
      renderStatus();
      renderNotices({ stale: false });
      if (changed) {
        renderFilters();
        renderList();
      }
    } catch (error) {
      if (disposed || error?.name === "AbortError") return;
      // First load: say so and offer a retry. Later: keep the rows, mark them stale.
      settle();
      if (signature === null) renderError(t("secFeedError"));
      else renderNotices({ stale: true });
    }
  }

  /**
   * The mount point ships `aria-busy="true"`, because the server could not know
   * whether the island would run. Clear it once the block has content — ready,
   * empty or failed — or assistive technology waits on a region that never settles.
   */
  function settle() {
    if (settled) return;
    settled = true;
    element_.setAttribute("aria-busy", "false");
  }

  function schedule() {
    clearTimeout(timer);
    // setTimeout, not setInterval: a slow or hung response must never stack requests.
    timer = setTimeout(() => {
      if (document.hidden) {
        schedule();
        return;
      }
      refresh().finally(schedule);
    }, config.pollMs);
  }

  function onVisible() {
    if (!document.hidden) refresh().finally(schedule);
  }

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onVisible, { passive: true });

  renderFooter();
  refresh().finally(schedule);

  return {
    dispose() {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    },
  };
}

/** Island contract: see assets/js/islands.js. */
export function mount(element, props) {
  const config = readProps(props);
  // An unset or unusable base is not an error: the template already renders nothing
  // for an unconfigured site, and this keeps a mistyped setting from firing a
  // request at a URL that can never work.
  if (!config.url) return undefined;

  const widget = createWidget(element, config);
  return () => widget.dispose();
}