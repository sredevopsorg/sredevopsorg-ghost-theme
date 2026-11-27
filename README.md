# SREDevOps.org Ghost Theme (v3)

> **Ghost 6 theme** for [SREDevOps.org](https://www.sredevops.org) — multi-locale, Tailwind CSS v4 built with Vite, React islands where interactivity is needed, light and dark palettes, and tag-based language filtering. No third-party requests.

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
| `yarn package` | writes `dist/<name>-<version>.zip` and validates it with `gscan --zip`; older archives are preserved | a build |
| `yarn ghost:up` / `ghost:down` / `ghost:restart` / `ghost:logs` | the local Ghost 6 + MySQL compose stack | Docker + `.env` |
| `yarn fixtures:capture` / `normalize` / `diff` / `promote` | golden HTML regression workflow | a seeded Ghost |
| `yarn sync:fonts` / `sync:icons` | regenerate committed fonts/icons and licence texts | network |

`yarn verify` is the offline CI gate. The fixture checks are deliberately local-only because they need a populated Ghost instance.

---

### Self-hosted assets (no third-party requests)

The theme makes **no third-party requests**. Fonts and icons ship with it, so there is no
extra DNS lookup, no second TLS handshake and nothing render-blocking from another origin.

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

### Code blocks

Code blocks in posts are highlighted with Prism and rendered inside a macOS-style window:
traffic-light header, the language name and a copy button. Line numbers are not used. The
code follows the article's type scale, and only the code scrolls horizontally — the window
header stays in place.

The Prism stylesheet (`assets/vendor/prism-window.css`) is linked on posts only. Pages and
other templates that render the `CodeBlocks` island still run the same highlighter and
share the code typography, but tokens keep the default text colour and there is no
macOS-style window.

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
content, hero, author box and island config. See “Adding a New Locale”
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
| `page-recommendations.hbs` | `/recommendations/` page | `default.hbs` + recommendations | en |

Key partials:

| Partial | Responsibility |
| --- | --- |
| `partials/shell.hbs` | `<html lang>`, `<head>`, header, `{{{body}}}`, footer, `{{ghost_foot}}`, scripts |
| `partials/collection-layout.hbs` | Channel heading, featured row, post grid, pagination |
| `partials/post-layout.hbs` | Article, sidebar/ToC, related content, comments, author box, sharing |
| `partials/page-body.hbs` | Page title/feature image toggle and page content |
| `partials/featured-row.hbs` | Picks the locale's featured hero (`featured-hero[-es|-br].hbs`) |
| `partials/listing-grid.hbs` | Post grid; page 1 starts at the second post, because the hero is the first |

> 🔄 **Inheritance syntax**: `{{!< filename}}` at the top of a template tells Ghost to render the file inside the `{{{body}}}` placeholder of `filename`. Partial hash arguments such as `locale` are dropped inside `{{#post}}`, `{{#page}}`, `{{#get}}` and `{{#foreach}}`, so pass them at the partial's own top level or as a literal at the call site.

---

## ⚙️ Theme Configuration

Customize behavior via **Ghost Admin → Settings → Design → Theme**. This is the
authoritative settings table.

| Option | Type | Default | Group | Description |
|--------|------|---------|-------|-------------|
| `show_search` | Boolean | `true` | site-wide | Show a search icon in the main navigation |
| `show_login` | Boolean | `true` | site-wide | Show a sign-in link in the main navigation |
| `tts_enabled` | Boolean | `true` | Post | Show the article audio player on posts |
| `tts_api_key` | Text | *(empty)* | Post | Google TTS fallback key for posts without audio yet |
| `tts_audio_host` | Text | `https://audio.sredevops.org` | Post | Origin serving pre-generated audio; empty disables it |

### Featured hero

The hero at the top of every channel (`/`, `/en/`, `/es/`, `/br/`) is **the first post
Ghost returns for that channel** — `posts`[0], normally the newest post:

- **`/`** is the unfiltered, mixed feed ([routes.yaml](routes.yaml) gives it no collection
  filter), so its hero is the newest post of any locale.
- **`/en/`, `/es/` and `/br/`** keep their own collection filters from `routes.yaml`
  (`tag:en+tag:-es+tag:-br` and so on), so each locale home only ever shows its own
  posts. The theme does not add, change or re-apply that filter.
- The theme adds **no** filter of its own: there is no `featured_tag`/`featured_only`
  setting any more, and Ghost's `featured` flag does not move the hero. Promoting a
  flagged post from further down the list would take a card out of the grid, so the hero
  stays on the lead post.

**The hero is never displayed twice.** The grid below (`partials/listing-grid.hbs`) renders
the *same* `posts` list starting at the second item (`{{#foreach from="2"}}`), and the
hero is its first item, so there is nothing to compare or filter — page 1 shows the hero
plus `posts_per_page - 1` cards, and every other page lists its posts in full.

The hero's label, date format and reading-time strings live in one file per locale
(`partials/featured-hero.hbs`, `-es.hbs`, `-br.hbs`) because they are printed inside
`{{#foreach}}`, where a partial argument does not survive. `partials/featured-row.hbs`
only picks the file.

> Fixtures still hold a golden from the previous design, where the hero was chosen by a
> separate query. Re-capture against a seeded Ghost (`yarn fixtures:capture`,
> `yarn fixtures:normalize`) and review the diff before promoting.

### Article audio (pre-generated, Kokoro)

With `tts_enabled` on (the default), posts render the `TtsPlayer` island above the article: a
miniplayer with play/pause, back/forward 10 seconds, stop, a timebar with elapsed and
remaining time, 0.5×–2× speed, and **Download MP3**. The controls appear only once someone
presses play. Pages do not get a player.

**Download MP3** links straight at the stored object: the file is already on the CDN, so a
download costs nothing and takes no time. The saved name (`<slug>-<lang>.mp3`) comes from
the object's `Content-Disposition` header, because browsers ignore a `download` attribute
on a cross-origin URL.

**The audio is not synthesised in the reader's browser.** Each published post is spoken
once, server-side, by an open-weight local model
([Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), Apache-2.0), stored in a Google
Cloud Storage bucket and served from **`https://audio.sredevops.org`**. The player streams
that one file, so seeking is native, the duration is exact, and a listen costs nothing.

How the page finds the file: the synthesis job writes a single marker line into the post's
**code injection** (Settings → Post → Code injection, *Footer*):

```html
<meta name="sredevops:tts" content='{"v":1,"hash":"…","file":"https://audio.sredevops.org/audio/<post>/<hash>.mp3",…}'>
```

`{{ghost_foot}}` renders that inside `<body>` ([partials/shell.hbs](partials/shell.hbs)),
and the island reads it with `document.querySelector('meta[name="sredevops:tts"]')`. Do not
edit or delete it by hand: it is rewritten on every regeneration, and removing it makes the
post fall back to Cloud TTS (see below).

The same voice family is used in each collection, selected from the post's locale tag:

| Locale tag | Kokoro voice | espeak-ng language | Notes |
|-----------|--------------|--------------------|-------|
| `en` | `af_heart` | `en-us` | American English, highest-graded voice in the release |
| `es` | `ef_dora` | `es` | Spanish, 0.98× speed |
| `br` | `pf_dora` | `pt-br` | Brazilian Portuguese (`pt-br`, not `pt`), 0.98× speed |

A post gets audio only when it carries **exactly one** of those tags. A post with no tag,
or with two, is skipped rather than guessed: the voice follows the tag, not the template,
so a `custom-br.hbs` post must also be tagged `br`.

#### The pipeline

The pipeline lives beside the theme in [`deploy/tts-audio/`](deploy/tts-audio/README.md) —
outside the theme package, and refused by `scripts/ship-manifest.mjs` if it ever tried to
ship. It is **not** deployed by this repository's CI; see the runbook for the commands.

```
Ghost webhook (post.added / post.published.edited / post.unpublished / post.deleted)
  → https://<TTS_HOST>/ghost  → API Gateway / HTTPRoute → tts-webhook (Deployment)
        verifies the signature, decides, creates a Job — answers 202 in milliseconds
  → Job tts-worker
        1. reads the post (Admin API; the public <url>.md without a key)
        2. extracts the text the reader would hear
        3. hashes text + voice + speed; stops if the marker already matches
        4. synthesises with Kokoro, encodes one MP3 (ffmpeg, ID3 + duration header)
        5. uploads audio/<post-id>/<hash>.mp3 to GCS (immutable Cache-Control)
        6. writes the marker into the post's code injection
```

Each language is phonemised with **espeak-ng** and then spoken by the same ONNX model.
That detail is not incidental: `kokoro-js`, the usual JS wrapper, only ships English
voice names and an English-only phonemizer, so it cannot produce `es` or `br` audio at all
— it throws on `ef_dora` and hard-codes `language = "en"`. The worker therefore calls the
model directly (`deploy/tts-audio/worker/src/tts.mjs` explains the three steps). Measured
throughput is **~8 characters per second of CPU** on 2 vCPUs, plus ~10 s of model load per
job; see the runbook for how the job is sized.

The image is published to **GHCR** (`ghcr.io/sredevopsorg/sredevopsorg-ghost-theme/tts-audio-runner`,
tagged with the commit SHA) by [.github/workflows/tts-audio-ci.yaml](.github/workflows/tts-audio-ci.yaml).
DNS for `audio.sredevops.org` is a proxy record in **Cloudflare** pointing at the bucket;
Cloudflare manages DNS only — reads and writes are GCS.

#### Fallback: Google Cloud TTS

A post with no marker — a new post in the seconds between publish and the job finishing, a
post whose audio was deleted, or one whose marker names a host the theme does not trust —
falls back to **the old browser-direct Cloud TTS path**, unchanged: the article text is read
from `.gh-content`, chunked, and synthesised per chunk behind `tts_api_key`. It is a real
fallback and it bills like one, per listener. The chunking rules in
[assets/js/lib/tts.js](assets/js/lib/tts.js) still apply there only.

To enable it, create a **Google Cloud API key** restricted to *Cloud Text-to-Speech API*
and to the *Websites* `https://www.sredevops.org/*` and `http://localhost:2368/*`, then paste
it into **Ghost Admin → Settings → Design → Theme → `tts_api_key`**. The key is embedded in
the post HTML and is therefore public; treat it as such, keep the project on a low quota,
and rotate it if the bill moves.

Leaving `tts_api_key` empty is fine once the archive has audio: pre-generated files need no
key at all. A post with **neither** a marker nor a key renders a single disabled
"unavailable" button, and the article is unaffected.

#### Reading the text

The job extracts text with the same rules the browser fallback uses — `pre`, `code`,
tables, `nav` and scripts dropped; a space after every block element so `<li>uno</li><li>dos</li>`
does not read as "unodoss"; the feature-image caption skipped when it repeats the excerpt —
plus normalisation the browser never needed: entities decoded, typographic quotes
straightened and soft hyphens removed. Sentences are split on the same boundaries as
[assets/js/lib/tts.js](assets/js/lib/tts.js) and terminated, which is what gives the model
natural pauses and keeps regeneration deterministic. There is no byte cap: the 5000-byte
and 610-byte Cloud TTS limits only matter on the fallback path.

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

Use in templates: `{{img_url feature_image size="l" format="webp"}}`. The `format`
parameter requires `size`; it makes Ghost serve a WebP copy, so it is used for every
theme image outside the header (feature images, post cards, heroes and author avatars).
The header logo and icon are intentionally rendered as uploaded, so an SVG logo stays
vector and the site icon keeps its source format.

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

### Checking the deployed hero

The live site runs a published archive, so the check is done on the rendered HTML: the
hero must appear **once** in `<main>`, and never among the cards of the grid below it.

```bash
# the hero on page 1 is the <a class="group block mb-12 …">; expect 1 per home page,
# and its href must not also appear among the cards of <section class="grid">
for p in / /en/ /es/ /br/ /page/2/; do
  printf '%s: hero occurrences = %s\n' "$p" \
    "$(curl -sL "https://www.sredevops.org$p" | grep -c 'class="group block mb-12 rounded-2xl')"
done   # / /en/ /es/ /br/ -> 1     /page/2/ -> 0 (later pages have no hero)
```

Also worth confirming, on any build that changes the hero:

- each home page shows `posts_per_page - 1` cards on page 1 and a full list from page 2;
- `/` mixes several locales while `/en/`, `/es/` and `/br/` only list their own posts;
- `<html lang>` is `en`, `es` and `pt` on `/`, `/es/` and `/br/` respectively.

### Locale-specific validation

```bash
# The Spanish collection shell, not an individual post
curl -s http://localhost:2368/es/ | grep -o '<html[^>]*>'
# Expected: <html lang="es">

# A Portuguese post that has the custom-br template selected
curl -s http://localhost:2368/br/some-post/ | grep -o '<html[^>]*>'
# Expected: <html lang="pt">
```

### Fixtures

These need a running Ghost and are intentionally local-only:

```bash
yarn ghost:up
yarn fixtures:capture
yarn fixtures:normalize
yarn fixtures:diff
```


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
- **Page 1 of every channel shows one card fewer.** The hero is the channel's first post
  and is never repeated in the grid; Ghost has no card-level offset, so the slot is not
  refilled. Pages 2 and later are untouched.
- **The hero is always the newest post of the channel.** Ghost's `featured` flag does not
  promote a post to the hero, and the old `featured_only`/`featured_tag` settings are
  gone: promoting a flagged post would pull one card out of the grid.
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
- **The light palette's contrast is unverified by a human.** The token layer is tested
  functionally, but the light colours have not been measured.
- **Fixture checks are local-only.** They need a seeded Ghost.
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
   - `partials/listing-grid.hbs` (card loop, one branch per locale)
   - `partials/featured-row.hbs` (hero dispatch) plus a new `partials/featured-hero-<locale>.hbs`
     copy whose label, date format and reading-time strings are that locale's
   - `partials/theme-toggle.hbs`, `partials/header.hbs`, `partials/island-config.hbs`
   - `partials/page-body.hbs`

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
