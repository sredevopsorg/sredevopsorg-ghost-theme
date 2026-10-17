# SREDevOps.org Ghost Theme (v3)

> **Ghost 6 theme** for [SREDevOps.org](https://www.sredevops.org) — multi-locale, Tailwind CSS v4 built with Vite, React islands where interactivity is needed, light and dark palettes, and tag-based language filtering. No third-party requests by default; the optional security feed adds cross-origin requests.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Ghost Compatibility](https://img.shields.io/badge/Ghost-%3E%3D6.0.0-lightgrey)](https://ghost.org)
[![Node Engine](https://img.shields.io/badge/Node-%3E%3D24-green)](https://nodejs.org)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sredevopsorg/sredevopsorg-ghost-theme)
---

## 🌐 Multi-Locale Architecture

One Ghost publication serves three content locales. `routes.yaml` defines the collections, locale-specific collection templates render them, and a per-post custom template sets the language of an individual post.

### How a request is rendered

| Route | Collection template | Document shell | Filter |
| --- | --- | --- | --- |
| `/` | `home.hbs` | `default.hbs` (site locale) | none — mixed feed |
| `/en/{slug}/` | `home-en.hbs` | `default.hbs` | `tag:en+tag:-es+tag:-br` |
| `/es/{slug}/` | `home-es.hbs` | `default-es.hbs` (`lang="es"`) | `tag:es+tag:-en+tag:-br` |
| `/br/{slug}/` | `home-br.hbs` | `default-br.hbs` (`lang="pt"`) | `tag:br+tag:-es+tag:-en` |

`home*.hbs` extends `default*.hbs`. Those files are one-line wrappers around `partials/shell.hbs`, which owns `<html lang>`, `<head>`, the header/footer and `{{{body}}}`. The locale wrappers pass two different values:

- `documentLang` is the BCP-47 tag for `<html lang>` — `es` for Spanish, `pt` for Portuguese.
- `locale` is the theme's content-locale key — `es`, `br`, `en` — matching the collection path and the value the layouts and cards already use.

### Language tags

A post appears in a locale collection when it carries that locale's tag and **no other locale tag**:

| Collection | A post must have | A post must not have |
| --- | --- | --- |
| `/en/{slug}/` | `en` | `es`, `br` |
| `/es/{slug}/` | `es` | `en`, `br` |
| `/br/{slug}/` | `br` | `en`, `es` |

- **`hash-*` tags are not required.** Ghost's filter syntax ANDs (`+`) and negates (`-`) tags. Existing content may still carry `hash-en`, `hash-es` or `hash-br` from the v2 import; no route reads them. Do not add them for new posts.
- **Root `/` is a mixed feed.** It has no filter and shows posts from every locale. Each card declares its own `lang`, so a Spanish card inside the English document is still read with a Spanish voice.
- **One locale tag per post.** A post tagged with both `es` and `br` is excluded from both collections, because each filter explicitly negates the other locale tags.
- **The site locale is still English.** It controls Ghost's own strings (`{{t}}`) and the shell used when a template does not extend a locale wrapper.

### Individual posts and pages

A layout cannot see the post context, so the document language is decided by the template the editor selects:

| Content | Template | Document language |
| --- | --- | --- |
| English post | `post.hbs` | site locale (English) |
| Spanish post | `custom-es.hbs` | `lang="es"` |
| Portuguese post | `custom-br.hbs` | `lang="pt"` |
| English page | `page.hbs` | site locale (English) |
| Spanish page | `custom-page-es.hbs` | `lang="es"` |

`custom-*.hbs` files are selectable per post/page in Ghost Admin. There is no automatic tag-to-template inference; an existing Spanish or Portuguese post keeps the site language until its Template setting is changed. A Portuguese page custom template does not exist yet — see [Known limitations](#-known-limitations).

### `routes.yaml` core configuration

```yaml
routes:
  /:
    controller: channel
    template: home
    rss: true

collections:
  /en/:
    template: home-en
    permalink: /en/{slug}/
    filter: tag:en+tag:-es+tag:-br
    data: tag.en

  /es/:
    template: home-es
    permalink: /es/{slug}/
    filter: tag:es+tag:-en+tag:-br
    data: tag.es

  /br/:
    template: home-br
    permalink: /br/{slug}/
    filter: tag:br+tag:-es+tag:-en
    data: tag.br

taxonomies:
  tag: /tag/{slug}/
  author: /author/{slug}/
```

The locale collections carry `data: tag.<locale>`, so their templates get the tag object for the heading. The root channel has no filter and uses `home.hbs` with the site title and description.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Islands](#-islands-client-interactivity)
- [Package scripts](#-package-scripts)
- [Security feed widget](#-security-feed-widget)
- [Locale Content Authoring](#-locale-content-authoring)
- [Template Architecture Reference](#-template-architecture-reference)
- [Theme Configuration](#-theme-configuration)
- [Testing & Validation](#-testing--validation)
- [Deployment](#-deployment)
- [Known limitations](#-known-limitations)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔧 Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| **Node.js** | `>=24` | Runtime for the build (Vite 8, Tailwind CSS v4) |
| **Yarn** | `1.22.22` | Package manager, pinned through `packageManager` |
| **Ghost** | `>=6.0` | Local development and production |
| **Docker** *(optional)* | Latest | Run Ghost 6 + MySQL through `docker-compose.dev.yml` |

> 🐳 **Local stack:** `docker-compose.dev.yml` uses the project's `ghcr.io/sredevopsorg/ghost-on-kubernetes:latest-docker` image with MySQL 8.4. For a manual install, use Ghost 6 or later.

---

## 🚀 Installation

### 1. Clone and install

```bash
git clone https://github.com/sredevopsorg/sredevopsorg-ghost-theme.git
cd sredevopsorg-ghost-theme

yarn install --frozen-lockfile
```

### 2. Configure Ghost

1. Copy the environment template and set absolute host paths and database passwords:

   ```bash
   cp .env.example .env
   # edit THEME_PATH, GHOST_DATA_PATH, DATABASE_ROOT_PASSWORD and DATABASE_PASSWORD
   yarn ghost:up
   ```

   The compose file serves Ghost at <http://localhost:2368>. On a fresh database volume, follow the one-time initialisation step in [tests/fixtures/README.md](tests/fixtures/README.md).

2. Upload `routes.yaml` to **Ghost Admin → Settings → Advanced → Routing**. Routing is stored in the database, not in the theme archive, so it is not deployed by CI.

3. Activate the theme in **Ghost Admin → Settings → Design → Change theme**. The compose file mounts this repository at `content/themes/sredevopsorg-ghost-theme`, but activation is a one-time Admin step.

4. Set the publication language in **Ghost Admin → Settings → General → Publication language**. It controls Ghost's own `{{t}}` strings and the fallback shell; the locale collections are selected by `routes.yaml`.

   For a non-Docker install, symlink the repository into `content/themes/` instead:

   ```bash
   ln -s /path/to/sredevopsorg-ghost-theme \
     /path/to/ghost/content/themes/sredevopsorg-ghost-theme
   ```

### 3. Start the development build

```bash
yarn dev        # vite build --watch: rebuilds assets/built/** on save
```

This rebuilds, on every change:

- `assets/css/index.css` (Tailwind CSS v4 + `assets/css/theme.css` + `assets/css/fonts.css`) → `assets/built/index-<hash>.css`
- `assets/js/index.js` → `assets/built/index-<hash>.js`
- `partials/vite_assets/{head,foot}.hbs`, regenerated from `assets/built/manifest.json`

Because filenames are hashed, the generated partials are the only place asset URLs live — never hardcode them, and rebuild after pulling.

> 🔁 **Dev loop:** `yarn build` (or `--watch`) for assets, but **Ghost caches compiled Handlebars templates** — after editing any `.hbs` file run `yarn ghost:restart` before trusting what the browser shows.
>
> `yarn ghost:up` starts the local Ghost 6 + MySQL stack and mounts this repository as a theme. It does not activate the theme or upload routing; both are one-time Admin steps. See [tests/fixtures/README.md](tests/fixtures/README.md) for the clean-database procedure.

---

## 🧩 Islands (client interactivity)

Ghost renders every page server-side; React is added only where a template declares a mount
point. Nothing may break with JavaScript disabled.

```handlebars
{{!-- post.hbs --}}
<div data-island="ReadingProgress" data-target=".gh-content"></div>
```

```jsx
// assets/js/islands/ReadingProgress.jsx — owns dynamic UI, renders into the element
export function mount(element, props) {
  createRoot(element).render(<ReadingProgress {...props} />);
}
```

```js
// assets/js/islands/MobileMenu.js — augments server markup, loads no framework
export function enhance(element, props) {
  // element is the <details> from the template; it keeps its children
  return () => {}; // optional cleanup
}
```

Pick the cheapest mode that does the job: `enhance` for DOM augmentation (the mobile menu
costs under 0.5 kB gzip), `mount` when the island really owns stateful UI (the React
runtime is ~68 kB gzip, so it is code-split and only fetched where such an island exists).

1. Register the module in `assets/js/islands.js` — the key must equal `data-island`.
2. `yarn build`, then `yarn ghost:restart` (Ghost caches compiled templates).
3. `yarn verify` — the checks below fail loudly if the wiring is wrong.

| Guarantee | Enforced by |
| --- | --- |
| No page eager-loads React; the framework arrives with the island that needs it | `yarn test:bundle` (entry has no framework, partials reference only the entry) |
| Every `data-island` in a template resolves to a code-split chunk | `yarn test:bundle` |
| Island Tailwind classes have real CSS | `yarn test:classes` |
| `enhance` island behaviour (Escape, outside click, breakpoints) | `yarn test:unit` |
| Island chunks load and expose exactly one of `mount`/`enhance` | `yarn test:bundle` |
| Below-the-fold islands (`data-island-lazy`) are not fetched early | mount points `[data-island-lazy]`, observed with `IntersectionObserver` |
| Adding an island cannot break the page or the other islands | guarded, isolated mounting in `assets/js/islands.js` |

Strings come from `partials/island-config.hbs` (`{{json}}` + `{{t}}`), read in an island with
`t("key")` from `assets/js/lib/theme-config.js`. Keep that payload small: it is inline on every
page.

## 🧰 Package scripts

All commands run from the theme root. The default `yarn test` is the full gate and is an alias for `yarn verify`.

| Script | What it does | Needs |
| --- | --- | --- |
| `yarn build` | Vite 8 production build into `assets/built/` and regenerate `partials/vite_assets/*.hbs` | Node |
| `yarn dev` | `vite build --watch`; rebuilds on source changes | Node |
| `yarn verify` / `yarn test` | build + GScan + ship manifest + unit + bundle + class coverage | Node |
| `yarn test:ci` | plain GScan; the same validation Ghost applies on upload | Node |
| `yarn test:dev` | verbose GScan | Node |
| `yarn test:unit` | `node:test` suite for models and `enhance` islands | Node |
| `yarn test:bundle` | evaluates the built entry and checks code-splitting/island contracts | a build |
| `yarn test:classes` | proves every class in a template or island has CSS | a build |
| `yarn test:ship` | asserts the package contents and every `{{asset}}` reference | a build |
| `yarn test:sec-feed-layout` | Chromium layout checks for the security-feed panel | Ghost + Playwright image |
| `yarn package` | writes `dist/<name>-<version>.zip` and validates it with `gscan --zip`; older archives are preserved | a build |
| `yarn ghost:up` / `ghost:down` / `ghost:restart` / `ghost:logs` | the local Ghost 6 + MySQL compose stack | Docker + `.env` |
| `yarn fixtures:capture` / `normalize` / `diff` / `promote` | golden HTML regression workflow | a seeded Ghost |
| `yarn sync:fonts` / `sync:icons` | regenerate committed fonts/icons and licence texts | network |

`yarn verify` is the offline CI gate. The fixture and browser-layout checks are deliberately local-only because they need a populated Ghost instance and Chromium.

---

## 🛡️ Security feed widget

The theme can render the newest advisories from
[SREDevOps Sec Feed](https://github.com/sredevopsorg/sredevopsorg-sec-feed) — Ubuntu, Debian,
Red Hat, NVD, CISA, AWS, the Kubernetes blog and OpenSSF, enriched with CISA KEV, EPSS and
OSV.dev — as a block **inside** a page, above the post grid on every collection.

It is a *minified* frontend on purpose. The service already ships a full single-page
frontend with search, SSE and its own filters; this is the small half of it, and the
widget's footer links to the real thing.

```
Ghost renders                         the island fetches
─────────────                         ────────────────
partials/featured-row.hbs             assets/js/islands/SecFeed.js
  ┌─ 2/3 ────────────┬─ 1/3 ─────┐     status line, tag chips, rows
  │ featured post    │ sec feed   │ ──► poll every 5 min while visible
  │                 │ <section>  │ ──► GET {base}/api/feed?limit=<n>
  └──────────────────┴────────────┘     <noscript> link if JavaScript is off
```

### Turning it on

**Admin → Settings → Design → Theme** (the feed settings are grouped under “Homepage”)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sec_feed_api_url` | Text | *(empty)* | Origin of the feed API, e.g. `https://security-feed.sredevops.org`. Empty hides the widget entirely. |
| `sec_feed_items` | Select | `3` | How many advisories the widget shows (3 / 5 / 10 / 15 / 20). |

With `sec_feed_api_url` empty the partial renders **nothing**: no markup, no island chunk,
no request. That keeps "no third-party requests" true for an unmodified site, and it is what
`tests/sec-feed.test.mjs` guards — the API origin appears in no source file, only as this setting.

### ⚠️ CORS is required — and it is not configured yet

The widget calls the feed **cross-origin**, and the sec-feed fails CORS closed: with
`CORS_ORIGINS` unset, no cross-origin caller is allowed. Add the publication's origin to
the service:

```
CORS_ORIGINS=https://www.sredevops.org
```

Checked against the live service on 2026-10-03: `GET /api/feed` sent with an `Origin`
header returns `200` and `Vary: Origin`, but **no `Access-Control-Allow-Origin`** — so until
`CORS_ORIGINS` includes the publication, the browser blocks the response and the widget
shows its error state (correctly: it degrades, it does not break the page). To avoid CORS
entirely, reverse-proxy the feed onto the publication's own domain and set
`sec_feed_api_url` to that path, e.g. `/feed`.

### Behaviour worth knowing

- **Polling, not SSE.** `/api/events` is rate-limited and caps concurrent subscribers, so a
  widget on a public homepage should not hold one connection per open tab. It polls every 5
  minutes while the tab is visible and refreshes when the tab returns or the browser
  reconnects.
- **Failures degrade.** A failed first load renders a message and a retry button; a failed
  later poll keeps the rows and marks them stale instead of blanking the page.
- **Sample rows are labelled.** When no upstream source is reachable the service serves
  realistic sample items; the widget says so rather than passing it off as live data.
- **No-JS** shows a link to the full feed (`<noscript>`, outside the mount point).
- **Tag chips filter the rows already fetched** — no request per click, no rate limit spent.

### Where it appears

Included by `partials/featured-row.hbs`, which the four **channel** templates reach through
`collection-layout.hbs`: `/` (or `/en/`), `/es/` and `/br/`. It sits in a **1/3 column beside
the featured post, which takes the other 2/3**, and stacks below it on mobile (the post is
first in the DOM, so it also reads first without CSS).

When `sec_feed_api_url` is empty, `featured-row.hbs` renders the bare full-width featured post
and no grid at all — an unconfigured site's HTML is byte-identical to a theme without this
feature. If a channel has **no** featured post configured, the 2/3 column is empty and the feed
sits beside it; a site with no featured post on a channel would want the feed moved.

### Height and scrolling

**The feed panel is the same height as the featured card, and leaves the same space below it.**
The advisory list is the scroll region — the heading, the status line and the tag chips stay
pinned above it — so a channel with twenty advisories is exactly as tall as one with three.

The featured card carries `mb-12`, so the row's rhythm is *card + 48px*. The feed column repeats
that same `mb-12` (`partials/featured-row.hbs`), and the panel is pinned to what is left. That is
what makes the two visible surfaces line up: the panel is shortened by the margin to the card's
height, and the margin is the space the row needs before the post grid. Two mechanisms are at
work, and both matter:

| Mechanism | Where | Why |
| --- | --- | --- |
| `align-items: stretch` (the grid default) | `partials/featured-row.hbs` row | gives both columns the row's height instead of their own |
| `lg:relative` column + `lg:absolute lg:inset-0` panel | row / `partials/sec-feed.hbs` | takes the feed out of the row's intrinsic sizing, so the *hero card* decides the height |
| `mb-12` on the feed column | `partials/featured-row.hbs` | matches the card's own bottom margin, so the panel is the card's height and the next block keeps the same gap |

Without the second row of that table the height is merely *equal*, not stable: an in-flow grid
item still contributes its content height to an auto-sized row track, so a feed of twenty
advisories sized the track no matter how the column was clamped (`min-h-0` bounds a flex item,
not a grid track). Without the third, the panel is one card-margin taller than the card and sits
flush against the post grid. A hardcoded row height cannot replace any of it: the card measures
504.5px at 1024x900 and 467px at every width from 1280 up, so any constant is wrong at one end.

Measured in Chromium against a live feed:

| Viewport | Featured card | Feed panel | Gap below card | Gap below panel | List scrollable |
| --- | --- | --- | --- | --- | --- |
| 1024×900 | 504.5 | 504.5 | 48px | 48px | 272px |
| 1280×900 | 467.0 | 467.0 | 48px | 48px | 235px |
| 1440×900 | 467.0 | 467.0 | 48px | 48px | 235px |
| 1920×1080 | 467.0 | 467.0 | 48px | 48px | 235px |

With **20** advisories the panel is still 467.0px and only the list grows — before this change
the block grew with every advisory added.

**On mobile the columns stack and are deliberately not equalised.** Below `lg` the panel is an
ordinary in-flow block, so the feed sits *below* the hero at its own height (measured: 615.8px of
hero, then 764.5px of feed). Bounding it there would nest a scrollbar inside the page's own and
trap touch scrolling, so it is left alone. "Same height as the 2/3 element" is a side-by-side
property; there is no 2/3 element once the columns stack.

It is *not* on post templates and *not* on `/tag/…` or `/author/…` — `tag.hbs` and `author.hbs`
carry their own markup rather than sharing `collection-layout.hbs`.

The block is one partial, so anywhere else it goes where you put it:

```handlebars
{{> "sec-feed" locale=locale}}
```

Verified against a local Ghost 6: the block renders with the expected `data-*` attributes,
`/es/` gets the Spanish heading and no-JS link from the locale passed through, and no post,
page, tag or author template gains any widget markup.

### Full-page feed (`page-secfeed.hbs`)

`page-secfeed.hbs` renders the same block as a page rather than a sidebar. Ghost resolves a
page's template as `page-:slug.hbs` → `custom-*.hbs` → `page.hbs`, so it applies automatically
to a page whose **slug is `secfeed`** — create one and the feed is there, no template setting to
change. The page's own title and excerpt render above it, respecting the editor's
"show title and feature image" toggle.

```handlebars
{{> "sec-feed" locale="en" full=true}}
```

`full=true` changes three things, and they are not cosmetic:

| | Embedded (default) | Full page (`full=true`) |
| --- | --- | --- |
| Frame | `lg:absolute lg:inset-0 h-full min-h-0 flex flex-col overflow-hidden` | an ordinary in-flow card |
| What scrolls | the list, inside the panel | the document |
| How many advisories | the `sec_feed_items` setting | 25, the API maximum (`MAX_LIMIT`) |

The mode exists because the embedded layout's contract is *relative to a bounded box*: the list
is `flex: 1 1 0%` with `min-height: 0`, which resolves against the panel the partial is pinned
into. In an auto-height box the zero basis would win and the list would collapse to nothing while
scrolling inside its own frame. So `full=true` also sets `data-fill="page"` on the mount point,
and `assets/js/islands/SecFeed.js` skips the flex/overflow layout entirely — the status line, the
filter chips and the rows stay in normal flow and the page scrolls.

Measured in Chromium (`/secfeed/`, 25 advisories): the panel is 2634.5px tall, the list has
`overflow-y: visible` and `clientHeight == scrollHeight` (no nested scrollbar), and the document
scrolls. The embedded homepage panel on the same run is still 467px with `overflow-y: auto` and
a `clientHeight` of 255 against a 532px list — the two modes do not interfere.

For a Spanish or Portuguese feed page, add a file like this one extending `default-es.hbs` /
`default-br.hbs` and pass the matching `locale`, the same remedy `custom-page-es.hbs` documents.

### Weight

The island is **3.78 kB gzip and loads no framework**, versus ~68 kB gzip for the React runtime
the other islands share. That is why this one is vanilla while `ReadingProgress` and
`TableOfContents` are React: there is no server-rendered content here to hydrate, and this is
likely to sit on the homepage. The decisions worth testing live in
`assets/js/lib/sec-feed-model.js` and are unit-tested there; see
[docs/adr/0003](docs/adr/0003-security-feed-widget.md) for the reasoning.

---

### Self-hosted assets (no third-party requests)

The theme makes **no third-party requests by default**. Fonts and icons ship with it, so
there is no extra DNS lookup, no second TLS handshake and nothing render-blocking from
another origin. The optional security feed is the only exception, and only when
`sec_feed_api_url` is set.

| Asset | Where it comes from | How to refresh |
| --- | --- | --- |
| Inter, Roboto Mono | `assets/fonts/*.woff2` (latin + latin-ext) | `yarn sync:fonts` |
| Icons | `partials/icon.hbs`, inline SVG | `yarn sync:icons` |

Both scripts are run by hand, not by the build: they download from Google Fonts and
jsDelivr respectively and rewrite committed files, so a build stays offline and
reproducible. `assets/css/fonts.css` is generated by the font script — edit the script,
not the CSS. Licence texts live next to what they cover (`assets/fonts/LICENSE-*`,
`assets/licenses/`), which is what OFL and MIT require.

Icons are inline SVG rather than an icon font: they render with the first paint instead of
waiting for a webfont, they inherit colour through `currentColor`, and the theme no longer
pays for a stylesheet describing glyphs it never uses. Call them as
`{{> "icon" name="clock" class="w-3 h-3 mr-1"}}` — the size is explicit because an SVG has
no font-size, and `class` defaults to `w-4 h-4`.

`tests/no-third-party.test.mjs` fails the build if a third-party host or a Font Awesome
class comes back.

## 🎨 Theming

The palette is **dark by default**, and light once the reader chooses it. The operating
system's preference is not consulted; nothing has to be configured.

**Tokens are named by role, never by colour** — `bg-surface`, `text-muted`,
`border-border-strong` — so a palette is a list of values rather than a rewrite of every
template. Each token is one `light-dark(light, dark)` pair, and `color-scheme` decides
which half applies: `data-theme` on `<html>` when the reader has chosen, the dark default
otherwise.

```css
:root { color-scheme: dark; }                     /* the default */
:root[data-theme="light"] { color-scheme: light; } /* explicit choice */
:root[data-theme="dark"] { color-scheme: dark; }

@theme {
  --color-surface: light-dark(#ffffff, #0d0e11);
  --color-strong:  light-dark(#111827, #f3f4f6);
}
```

`{{> "icon" name="sun"}}` / `{{> "icon" name="moon"}}` inside `.theme-toggle` are both
rendered and CSS shows the one matching the current theme, so the control is correct
before any script runs. The `ThemeToggle` island only labels the button and writes the
choice; a small inline script in `partials/head.hbs` applies a stored choice before the
first paint, which is the one thing a deferred module cannot do.

`light-dark()` requires Chrome 111+, Safari 16.4+ or Firefox 120-era browsers — no more
than Tailwind v4 already asks for. Adding a locale or a palette means editing the token
block in `assets/css/index.css`, not the templates. See
[docs/adr/0002](docs/adr/0002-theming-semantic-tokens.md).

## ✍️ Locale Content Authoring

### Tagging posts

Create or import a post with the locale tag and its topic tags:

```md
---
title: "My Post Title"
slug: "my-post-slug"
tags:
  - es          # the only locale tag on this post
  - Kubernetes  # topic tags
  - SRE
---
```

- **Add exactly one** of `en`, `es` or `br`. The locale collections are defined by
  AND/NOT filters, so a post with both `es` and `br` is excluded from both.
- **`hash-*` tags are not required.** They exist in older imported content but no
  route or template reads them.
- **Root `/` is unfiltered.** It shows every locale; each post card carries its own
  `lang` attribute.
- **The template decides the document language.** Tagging a post `es` does not make it
  Spanish by itself; the editor must also select the locale template.

### Selecting a locale template

| Content | Template to select | Document language |
| --- | --- | --- |
| English post | `post.hbs` (default) | site locale (English) |
| Spanish post | `custom-es.hbs` | `lang="es"` |
| Portuguese post | `custom-br.hbs` | `lang="pt"` |
| English page | `page.hbs` (default) | site locale (English) |
| Spanish page | `custom-page-es.hbs` | `lang="es"` |

Ghost resolves a post as `post-:slug.hbs` → `custom-*.hbs` → `post.hbs`, so a custom
template applies only when it is selected in that post's **Template** setting. A layout
cannot read the post's tags; the theme cannot infer the language automatically.
`custom-br.hbs` renders `post-layout`, so it is a post template; a Portuguese page would
need a separate `custom-page-br.hbs` (not included yet).

### Template resolution flow

```text
GET /es/                    GET /es/my-post/
     |                           |
     v                           v
routes.yaml collection      post template resolution
  template: home-es           post-my-post.hbs
     |                       custom-*.hbs (selected)
     v                       post.hbs (fallback)
home-es.hbs                      |
  extends default-es.hbs         +-- custom-es.hbs -> post-layout locale="es"
     |                           |     extends default-es.hbs -> lang="es"
     v                           |
partials/shell.hbs                +-- post.hbs -> post-layout locale="en"
  <html lang="es">              |     extends default.hbs -> site locale
  partials/head.hbs
  {{{body}}} from collection-layout.hbs
```

### Creating locale-specific templates

Locale templates are thin wrappers, not copies of the shell:

```handlebars
{{!-- default-es.hbs --}}
{{> "shell" documentLang="es" locale="es"}}

{{!-- home-es.hbs --}}
{{!< default-es}}
{{> "collection-layout" locale="es"}}

{{!-- custom-es.hbs --}}
{{!< default-es}}
{{#post}}{{> "post-layout" locale="es"}}{{/post}}

{{!-- custom-br.hbs --}}
{{!< default-br}}
{{#post}}{{> "post-layout" locale="br"}}{{/post}}

{{!-- custom-page-es.hbs --}}
{{!< default-es}}
{{> "page-body" locale="es"}}
```

Adding a locale means adding these wrappers, a collection in `routes.yaml`, a
`locales/<lang>.json` file, and the locale branches used by the post card, related
content, hero, author box, island config and security feed. See “Adding a New Locale”
below.

---

## 🏗️ Template Architecture Reference

| File | Role | Extends / includes | Locale |
|------|------|--------------------|--------|
| `default.hbs` | Default document shell | `partials/shell.hbs` | site |
| `default-es.hbs` | Spanish document shell | `partials/shell.hbs` with `documentLang="es"`, `locale="es"` | es |
| `default-br.hbs` | Portuguese document shell | `partials/shell.hbs` with `documentLang="pt"`, `locale="br"` | br |
| `home.hbs` | Root channel (mixed feed) | `default.hbs` + `collection-layout` `header="site"` | site |
| `home-en.hbs` | `/en/` collection | `default.hbs` + `collection-layout` `locale="en"` | en |
| `home-es.hbs` | `/es/` collection | `default-es.hbs` + `collection-layout` `locale="es"` | es |
| `home-br.hbs` | `/br/` collection | `default-br.hbs` + `collection-layout` `locale="br"` | br |
| `index.hbs` | Generic listing fallback | `default.hbs` + `post-card` + pagination | en |
| `post.hbs` | English post | `default.hbs` + `post-layout` `locale="en"` | en |
| `custom-es.hbs` | Spanish post (editor-selected) | `default-es.hbs` + `post-layout` `locale="es"` | es |
| `custom-br.hbs` | Portuguese post (editor-selected) | `default-br.hbs` + `post-layout` `locale="br"` | br |
| `page.hbs` | Page | `default.hbs` + `page-body` `locale="en"` | site |
| `custom-page-es.hbs` | Spanish page (editor-selected) | `default-es.hbs` + `page-body` `locale="es"` | es |
| `tag.hbs` | Tag archive | `default.hbs` + cards + pagination | UI en |
| `author.hbs` | Author archive | `default.hbs` + author box + cards | UI en |
| `error.hbs` | Standalone error template | none (inline CSS, no helpers) | site |
| `error-404.hbs` | 404 page | `default.hbs` | site |
| `page-tags.hbs` | Tag index page | `default.hbs` | site |
| `page-secfeed.hbs` | `/secfeed/` page | `default.hbs` + `sec-feed` `full=true` | en |
| `page-recommendations.hbs` | `/recommendations/` page | `default.hbs` + recommendations | en |

Key partials:

| Partial | Responsibility |
| --- | --- |
| `partials/shell.hbs` | `<html lang>`, `<head>`, header, `{{{body}}}`, footer, `{{ghost_foot}}`, scripts |
| `partials/collection-layout.hbs` | Channel heading, featured row, post grid, pagination |
| `partials/post-layout.hbs` | Article, sidebar/ToC, related content, comments, author box, sharing |
| `partials/page-body.hbs` | Page title/feature image toggle and page content |
| `partials/featured-row.hbs` | Featured hero, with the optional security feed column |
| `partials/sec-feed.hbs` | Security-feed block and mount point, in embedded or full-page mode |

> 🔄 **Inheritance syntax**: `{{!< filename}}` at the top of a template tells Ghost to render the file inside the `{{{body}}}` placeholder of `filename`. Partial hash arguments such as `locale` are dropped inside `{{#post}}`, `{{#page}}`, `{{#get}}` and `{{#foreach}}`, so pass them at the partial's own top level or as a literal at the call site.

---

## ⚙️ Theme Configuration

Customize behavior via **Ghost Admin → Settings → Design → Theme**. This is the
authoritative settings table; the [security feed section](#-security-feed-widget) links back here.

| Option | Type | Default | Group | Description |
|--------|------|---------|-------|-------------|
| `show_search` | Boolean | `true` | site-wide | Show a search icon in the main navigation |
| `show_login` | Boolean | `true` | site-wide | Show a sign-in link in the main navigation |
| `sec_feed_api_url` | Text | *(empty)* | Homepage | Origin of the security feed API. Empty hides the [security feed widget](#-security-feed-widget) |
| `sec_feed_items` | Select | `3` | Homepage | How many advisories the widget shows (3 / 5 / 10 / 15 / 20) |
| `featured_tag` | Text | *(empty)* | Homepage | Extra tag slug ANDed into the featured hero filter, on top of the collection's language tag (none on `/`) |
| `featured_only` | Boolean | `true` | Homepage | Require the `featured` flag on the hero post |

### Featured hero filtering

The hero at the top of every channel (`/`, `/en/`, `/es/`, `/br/`) is chosen by
`partials/featured-hero-locale.hbs`. Two settings shape its NQL filter, and there are two
kinds of channel. The **locale collections** keep their language tag (`tag:en`, `tag:es`,
`tag:br`) in the filter, so they can never borrow another locale's post. The root channel
`/` is deliberately the unfiltered, mixed feed ([routes.yaml](routes.yaml) gives it no
collection filter), so its hero carries **no** language tag — the newest featured post wins,
whichever locale it is:

| Channel | `featured_only` | `featured_tag` | filter |
|---------|-----------------|----------------|--------|
| `/en/` `/es/` `/br/` | `true` (default) | *(empty)* | `featured:true+tag:<locale>` |
| `/en/` `/es/` `/br/` | `true` | `news` | `featured:true+tag:<locale>+tag:news` |
| `/en/` `/es/` `/br/` | `false` | *(empty)* | `tag:<locale>` |
| `/en/` `/es/` `/br/` | `false` | `news` | `tag:<locale>+tag:news` |
| `/` | `true` (default) | *(empty)* | `featured:true` |
| `/` | `true` | `news` | `featured:true+tag:news` |
| `/` | `false` | *(empty)* | *(no filter — the newest post)* |
| `/` | `false` | `news` | `tag:news` |

- **AND, never a replacement.** On a locale collection `featured_tag` is *added* to the
  language tag; it cannot replace it, because that would let an English post become the
  Spanish hero. The tag is a **slug** (the same value that appears in the tag's URL) and must
  exist, or the hero renders empty rather than erroring — the row's
  [1/3 column caveat](docs/adr/0003-security-feed-widget.md) applies.
- **The root feed is the exception.** `/` has no language tag to add `featured_tag` to, so
  the setting is the only tag in its filter. `home.hbs` passes `mixedFeed=true` through
  the listing partials to drop the locale clause. This changes the root hero by design: a
  locale collection's output is byte-identical to a theme without these settings, while
  `/` now shows the globally newest featured post instead of the newest English one.
  `tests/featured-filter.test.mjs` pins both contracts.
- **Eight combinations, verified end to end.** Changing only `featured_tag` moves the hero to
  a different tagged post and changing only `featured_only` moves it to the newest post on the
  channel, which is what distinguishes the rows. See
  [docs/adr/0004](docs/adr/0004-featured-hero-filter.md) for the measurements.

### Image Size Presets

Configured in `package.json` → `config.image_sizes`:

```json
"image_sizes": {
  "xs": { "width": 100 },
  "s":  { "width": 220 },
  "m":  { "width": 300 },
  "l":  { "width": 600 },
  "xl": { "width": 900 }
}
```

Use in templates: `{{img_url feature_image size="l"}}`

---

## 🧪 Testing & Validation

### The offline gate

```bash
yarn verify     # build + GScan + package contents + unit + bundle + CSS classes
yarn test       # alias for yarn verify
```

The individual checks are useful while iterating:

```bash
yarn test:ci      # plain GScan; the same validation Ghost applies on upload
yarn test:dev     # verbose GScan
yarn test:unit    # node:test models and enhance islands
yarn test:bundle  # built entry loads; React is not inlined; islands resolve
yarn test:classes # every template/island class has CSS
yarn test:ship    # package contents and asset references
```

> The gate runs the pinned GScan from `devDependencies`. Do not add `--fatal`: that flag
> only fails on *fatal* issues, so error-level findings (a removed helper, an empty
> translation) pass CI while Ghost logs a warning at boot.

`yarn test:bundle`, `yarn test:classes` and `yarn test:ship` need a build; `yarn verify`
does it for you. Running them directly after a source change will fail on stale output.

### Locale-specific validation

```bash
# The Spanish collection shell, not an individual post
curl -s http://localhost:2368/es/ | grep -o '<html[^>]*>'
# Expected: <html lang="es">

# A Portuguese post that has the custom-br template selected
curl -s http://localhost:2368/br/some-post/ | grep -o '<html[^>]*>'
# Expected: <html lang="pt">
```

### Fixtures and browser layout checks

These need a running Ghost and are intentionally local-only:

```bash
yarn ghost:up
yarn fixtures:capture
yarn fixtures:normalize
yarn fixtures:diff
```

`yarn test:sec-feed-layout` additionally needs Chromium through the Playwright image; see
[docs/adr/0003](docs/adr/0003-security-feed-widget.md).

### Packaging a release

```bash
yarn verify
yarn package    # dist/<name>-<version>.zip, read back and validated by GScan
```

The archive contains exactly the files `scripts/ship-manifest.mjs` allows — the built
assets, not the sources — and `gscan --zip` validates it the way Ghost does on upload.
Older archives in `dist/` are preserved for rollback. The full sequence, including what to
smoke-test afterwards and how to roll back, is in
[docs/release-checklist.md](docs/release-checklist.md).

### Lighthouse audits

These are targets, not CI gates:

- ✅ Performance ≥ 90 (with lazy loading enabled)
- ✅ Accessibility ≥ 95 (proper `lang` attributes per locale)
- ✅ SEO ≥ 100 (with localized meta tags and hreflang)

Run via Chrome DevTools against a local Ghost instance.

---

## 🚢 Deployment

### Option 1: Ghost Admin Upload

Ghost never runs a build, so the archive must already contain the compiled assets.

1. Build and validate:

   ```bash
   yarn verify      # build + GScan + package contents + tests
   ```

2. Build the archive. `yarn package` uses `scripts/ship-manifest.mjs` as the only
   inclusion rule, reads the zip back with `gscan --zip`, and leaves older archives in
   `dist/` for rollback:

   ```bash
   yarn package     # dist/sredevopsorg-ghost-theme-<version>.zip
   ```

   Do not zip the repository by hand: a plain `zip -r .` would ship `assets/css`,
   `assets/js`, `lib/`, `scripts/` and other build inputs.

3. Upload `dist/<name>-<version>.zip` via **Ghost Admin → Settings → Design → Change theme → Upload theme**.

### Option 2: GitHub Actions (Recommended)

This repo includes a [Deploy Ghost Theme Action](.github/workflows/deploy-theme.yaml) that:

- Builds theme assets (`yarn build`) before deploying
- Deploys via the Ghost Admin API (triggered manually via `workflow_dispatch`)

Configure secrets:

- `GHOST_API_URL`
- `GHOST_ADMIN_API_KEY`

---

## ⚠️ Known limitations

- **The root `/` feed is intentionally mixed.** It has no locale filter; only the
  `/en/`, `/es/` and `/br/` collections are segregated.
- **The document language is chosen by the template, not the tags.** A Spanish or
  Portuguese post keeps the site language until an editor selects `custom-es` or
  `custom-br`.
- **There is no Portuguese page template.** `custom-page-es.hbs` exists; a Portuguese
  page still uses `page.hbs` and the site language.
- **Server-rendered interface strings follow the site language.** `{{t}}` cannot be
  per-page in Ghost, so search, sign-in, pagination and the subscribe form stay in the
  publication language even on a locale post. Island chrome is localized per page.
- **Tag and author archives use the English card locale.** Their dates and reading-time
  strings are English because the route has no locale context; each card still declares
  the post's own `lang` from its URL.
- **The security feed is client-rendered and CORS-dependent.** With
  `sec_feed_api_url` set, the browser fetches the feed cross-origin; the service must
  allow the publication origin (see the CORS note above). The widget content is not in
  the server HTML.
- **The light palette's contrast is unverified by a human.** The token layer is tested
  functionally, but the light colours have not been measured.
- **Fixture and browser-layout checks are local-only.** They need a seeded Ghost and,
  for the layout script, Chromium.
- **`yarn dev` watches assets, not Ghost.** Ghost caches compiled templates; restart it
  after editing `.hbs` files.

---

## 🤝 Contributing

We welcome contributions aligned with our project conventions.

### Development guidelines

- **Branching**: Use feature branches (`feat/locale-switcher`, `fix/og-tags-es`)
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **PRs**: Include screenshots for UI changes; update README if behavior changes
- **Testing**: Run `yarn verify` before submitting. It builds, runs GScan, checks the
  package contents, and runs the unit, bundle and CSS-coverage suites.

### Adding a New Locale (e.g. `pt` for Portugal)

Two values are easy to confuse, so choose both explicitly:

- **`documentLang`** is the BCP-47 tag in `<html lang>` — `pt` for Portuguese.
- **`locale`** is the theme's content key, used in filters and partial arguments. The
  existing Brazilian Portuguese collection uses `br`, not `pt`.

1. **Add the wrapper templates**:

   ```handlebars
   {{!-- default-pt.hbs --}}
   {{> "shell" documentLang="pt" locale="pt"}}

   {{!-- home-pt.hbs --}}
   {{!< default-pt}}
   {{> "collection-layout" locale="pt"}}

   {{!-- custom-pt.hbs --}}
   {{!< default-pt}}
   {{#post}}{{> "post-layout" locale="pt"}}{{/post}}

   {{!-- custom-page-pt.hbs --}}
   {{!< default-pt}}
   {{> "page-body" locale="pt"}}
   ```

2. **Add the collection to `routes.yaml`**, and add `-pt` to the existing `/en/`,
   `/es/` and `/br/` filters so the partitions stay exclusive:

   ```yaml
   /pt/:
     template: home-pt
     permalink: /pt/{slug}/
     filter: tag:pt+tag:-en+tag:-es+tag:-br
     data: tag.pt
   ```

3. **Extend the locale branches in the shared code.** Search for `locale "="` and for
   the `/es/` and `/br/` URL checks. At minimum this touches:

   - `partials/post-card.hbs` (card `lang`, date and reading-time strings)
   - `partials/post-layout.hbs` (related-content filters, reading time, date, comments)
   - `partials/collection-layout.hbs` (card loop)
   - `partials/featured-hero-locale.hbs` and the three `featured-hero*.hbs` partials
   - `partials/theme-toggle.hbs`, `partials/header.hbs`, `partials/island-config.hbs`
   - `partials/sec-feed.hbs` and `partials/page-body.hbs`

4. **Add or update the Ghost translation file** `locales/<lang>.json`. This is the
   publication's site language, separate from the content-locale key above.

5. **Select the locale template per post/page.** A layout cannot read tags, so no route
   or tag can apply `custom-pt` automatically. Editors must choose it in the Template
   setting after publishing.

6. **Update docs and fixtures**: the locale table, the tag rules, `tests/fixtures/contexts.txt`,
   and any golden fixtures for the new collection.

7. **Test**:
   - `<html lang="pt">` on the collection and on a post using `custom-pt`
   - the filter excludes every other locale tag and does not hide the post from `/pt/`
   - cards and related content use Portuguese date/reading-time strings
   - `yarn verify` passes, and the fixture diff is intentional.

---

## 📜 License

- **Code**: [MIT License](LICENSE) — use, modify, distribute freely
- **Content**: CC BY 4.0 (for SREDevOps.org editorial content)
- **Third-party assets**: Respect upstream licenses (Tailwind CSS: MIT, Ghost: MIT)

---

## 🙏 Credits

- **Author**: Nicolás Georger ([@ngeorger](https://github.com/ngeorger)) — SRE/DevOps practitioner, Santiago, Chile
- **Inspiration**:
  - [RuntimeWire Website](https://runtimewire.com/)
  - [@TryGhost "Source" Theme](https://github.com/TryGhost/Source)
- **Community**: Ghost Forum contributors for multi-locale pattern validation
- **Tooling**: Tailwind CSS v4, Vite 8, GScan

---

> This theme was built in Chile 🇨🇱 with a proud latin American identity and fully committed to the principles and philosophy of FLOSS (Free/Libre and Open Source Software) — We ought to minimize external dependencies, optimized asset delivery, and community-driven localization patterns. For questions about deploying in Chile/Argentina/Brazil contexts, open an issue or reach out via [SREDevOps.org](https://www.sredevops.org).

*Ghost v6 compatible*
