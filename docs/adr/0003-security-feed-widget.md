# ADR 0003 — The security feed widget is an island, not a page

- **Status**: Accepted
- **Date**: 2026-10-03
- **Deciders**: sredevopsorg theme maintainers
- **Relates to**: [0001 — React islands and Vite](0001-v3-react-islands-and-vite.md), [0002 — Semantic theme tokens](0002-theming-semantic-tokens.md)

## Context

[SREDevOps Sec Feed](https://github.com/sredevopsorg/sredevopsorg-sec-feed) is a
deployable of its own: a FastAPI backend that normalises advisories from Ubuntu,
Debian, Red Hat, NVD, CISA, AWS, the Kubernetes blog and OpenSSF, enriches them
with CISA KEV, FIRST EPSS and OSV.dev, and ships **its own** single-page frontend
with search, tag filters, an SSE stream and alerting. It is published at
`https://security-feed.sredevops.org` and its JSON API is at `/api/feed`.

The publication wants that intelligence to be *visible* on sredevops.org, without
becoming a second application. The obvious question is therefore not "what should
the widget look like" but "what is the smallest thing that can live inside a Ghost
page without taking the page over".

## Decision

Add the feed to the theme as a **single vanilla island mounted from one partial**,
opt-in through a theme setting, rendered in a **1/3 column beside the featured post
(2/3)** on the four channel collections (`/`, `/en/`, `/es/`, `/br/` — the templates
that share `partials/collection-layout.hbs`).

The row lives in `partials/featured-row.hbs` rather than in `collection-layout.hbs`
because the grid must exist *only* when the feed does. A permanently present grid
would reserve a 1/3 column for an absent widget, shrink the featured post on every
site that never set `sec_feed_api_url`, and change the HTML of every collection page
for no visible reason. The cost is one duplicated `{{#match}}` chain — a Handlebars
partial cannot take an argument conditionally — which is a fair trade for "an
unconfigured site is byte-identical".

Consequence to know about: the row assumes the channel **has** a featured post.
When one is not configured the 2/3 column renders empty and the feed sits beside
nothing. Both production channels do have one; a channel without one should move
the feed above the post grid rather than half-fill a row.

- `partials/sec-feed.hbs` — the block: `<section>`, heading, `<noscript>` link and
  the mount point. Gated on `{{#if @custom.sec_feed_api_url}}`.
- `assets/js/islands/SecFeed.js` — the island: fetch, poll, render, tag filters.
- `assets/js/lib/sec-feed-model.js` — pure logic, unit-tested.

## The alternatives, and why not

### 1. A headless frontend replacing the theme (rejected)

Next.js/Astro/SvelteKit consuming Ghost's Content API. This is the wrong shape for
the requirement: it re-implements routing, SEO metadata, membership gating, search
and the portal — all of which Ghost already does correctly — in exchange for one
widget. It also would not be a theme, so it could not be uploaded through
Ghost Admin. Rejected.

### 2. A Ghost *page* whose content is generated from the feed (rejected)

A scheduled build that writes advisories into Ghost as posts. It would be
indexable and server-rendered, which is genuinely better for SEO — but it converts a
read-only foreign service into published editorial content: every advisory becomes a
database row, a tag, and something that needs moderating, deleting and re-publishing
when the upstream retracts an item. A widget that renders a feed is reversible;
published posts are not. Rejected; the full feed remains a link away for readers who
want the archive.

### 3. React, like the other islands (rejected)

`ReadingProgress`, `ShareButtons` and `TableOfContents` are React. The widget is
not, and the difference is structural rather than stylistic:

| | React islands | This widget |
| --- | --- | --- |
| Server-rendered content to hydrate | yes | none |
| State | derived from the DOM | a fetch, a list, a selected chip |
| Measured chunk | ~69 kB gzip (shared runtime) | **3.87 kB gzip, no framework** |
| Likely location | post pages | the homepage, i.e. every reader |

There is nothing to hydrate — the whole widget is data that did not exist when the
HTML was sent — so React would be a runtime shipped to every reader to manage a
`<ul>` and five buttons. The theme's own rule ("pick the cheapest mode that does the
job") applies, and the island runtime already supports a framework-free `mount`
island (`MobileMenu`, `ThemeToggle`, `CodeBlocks`).

## Consequences

**Decisions inside the island**

- **Polling, not SSE.** `/api/events` is rate-limited and caps concurrent
  subscribers (`MAX_SSE_SUBSCRIBERS`, default 100). A widget on a public homepage
  holds a connection per open tab against a service the theme does not operate, so
  it polls every 5 minutes (the cadence the upstream uses for its own fallback),
  only while the tab is visible, and refreshes immediately when the tab returns or
  the browser comes back online.
- **Client-side tag filtering.** The rows already fetched are filtered in memory.
  The API's `tag=` parameter is used by `buildFeedUrl` for callers that want it, but
  a chip click spends no request and cannot hit the rate limit.
- **The urgent dot is suppressed when every row is urgent.** Live check: the upstream
  sorts `urgent` first, so the top 25 of a real feed were 25/25 urgent — a red dot on
  every row marks nothing and trains the eye to skip it. The dot now appears only
  while it can single a row out; the severity badge carries the distinction always,
  in text as well as colour.
- **Failures degrade, they do not blank the page.** A failed first load renders a
  message and a retry; a failed later poll keeps the rows and marks them stale.
  Sample rows (the upstream's fallback when no source is reachable) are labelled, so
  a reader is never shown sample data as if it were live.
- **`credentials: "omit"` and `cache: "no-store"`.** A public feed must never be
  read with the reader's cookies, and must not be answered from a stale HTTP cache.

**Guarantees kept**

- *No third-party requests* still holds. The API origin exists in no source file —
  only as the `sec_feed_api_url` setting — and `tests/sec-feed.test.mjs` fails the
  build if a URL literal appears in the widget. An unconfigured site renders no
  markup, fetches no chunk and issues no request.
- *Nothing breaks without JavaScript.* The mount point is empty; the partial renders
  a plain link to the full feed inside `<noscript>`, outside the mount element.
- *One failing island cannot break the page.* `mount` is guarded by the runtime, and
  returns a disposer that stops the poll loop and aborts in-flight requests.

**Costs accepted**

- The widget is client-rendered, so its content is not in the server HTML. That is
  the price of not turning advisories into published posts (alternative 2), and it
  is why the block keeps a server-rendered heading and a no-JS link.
- Relative timestamps are formatted with `Intl.RelativeTimeFormat` in the page's
  language instead of through `{{t}}`. This is deliberate: the theme already declares
  `lang` per locale, and it avoids a second translation table per time unit that
  could drift from the browser's locale data.

## Operational requirement

The widget calls the feed **cross-origin** from the publication, and the sec-feed
**fails CORS closed**: with `CORS_ORIGINS` unset, no cross-origin caller is allowed.
The service must therefore list the publication's origin:

```
CORS_ORIGINS=https://www.sredevops.org
```

**This is not configured yet.** Measured against the live service on 2026-10-03, a
cross-origin `GET /api/feed` returns `200` with `Vary: Origin` but no
`Access-Control-Allow-Origin`, so the browser discards the response today. Until the
service is changed, enabling the widget shows its error state — a correct degradation,
but a useless one. An installation that reverse-proxies the feed onto the publication's
own domain can set `sec_feed_api_url` to that path instead and needs no CORS change.

## Verification

- `assets/js/lib/sec-feed-model.js` — 32 unit tests (`tests/sec-feed.test.mjs`)
  covering URL validation, payload normalisation, filtering, severity, relative time,
  that every class the widget applies exists in the built CSS, that no URL literal
  exists in the source, and that the block stays gated on the setting.
- Verified against the live API: 25/25 items normalised, microsecond timestamps in
  `published` parsed, Spanish relative time correct, chip order as designed.
- Verified against a running Ghost 6 with the setting enabled: the block renders with
  the expected `data-*` attributes, `/es/` gets the Spanish heading and no-JS link,
  and post, page, tag and author templates gain no widget markup.
- Golden HTML fixtures: with the setting empty, **the only** diff across all eight
  contexts is the `theme-config` JSON block gaining its new strings — no structural
  change — and the goldens were re-promoted on that basis.
- `yarn verify` (build → GScan → ship-manifest → unit → bundle → class-coverage)
  passes.