# Changelog

## 3.5.2

### Changed

- **Code blocks follow the article's type scale.** Block code uses the body size with a
  tighter line-height, and inline code inherits the size of the text around it instead of
  being pinned to 16px — so `<code>` inside a small table cell or a caption no longer
  renders larger than its row.
- **Only the code scrolls inside the macOS-style window.** The traffic-light header is now
  painted as background layers on the block, so it stays in place when a long line scrolls
  horizontally instead of sliding away with the code.

### Fixed

- **The language label and copy button are visible again.** The window header used to paint
  over Prism's toolbar; the label and button now sit in the header and remain clickable
  while the code scrolls beneath them.

### Removed

- **Line numbers on code blocks.** The Prism line-numbers plugin, the gutter styling and the
  test that added the `line-numbers` class were removed.

## 3.5.1

### Removed

- **Security feed widget.** The `SecFeed` island, its model, the `sec-feed` partial, the
  `page-secfeed.hbs` template, the `sec_feed_api_url` and `sec_feed_items` theme settings,
  the related translation strings and the ADR were removed. Sites that enabled the feed
  lose the widget; no content, route or other setting changes are needed.

## 3.5.0

### Added

- **Collapsible table of contents on mobile.** Posts show a collapsible TOC above the
  content on small screens, while desktop keeps the sticky sidebar TOC. Adds Collapse and
  Expand strings in `en`, `es` and `pt`; no configuration is needed.

## 3.4.1

### Changed

- **Version-only release.** No functional changes.

## 3.4.0

### Fixed

- **The post table of contents could render twice.** On some loads React committed the
  final `<nav>` beside the earlier empty render, producing two TOC cards, a duplicate
  `toc-title` id and two scroll-spy listeners. The island now collects its headings during
  render, reuses one React root per container through a WeakMap root store, and owns one
  scroll-spy pair per mount element; the runtime also enforces one mount per element.
- **Share buttons did not render on posts.** The ShareButtons mount point is laid out with
  `display: contents` and therefore generates no box, so the lazy `IntersectionObserver`
  never reported it as intersecting. The runtime now observes the mount point's parent when
  the mount point has no box, and the copy-link and native-share controls appear.

## 3.3.1

### Changed

- **Maintenance release.** GScan 6.7.0 for the validation gate and regenerated manifest
  partials; no user-facing changes.

## 3.3.0

### Changed

- **Dependency updates.** `@vitejs/plugin-react` 6, React 19.3.1 and the CodeQL workflow
  actions; no theme behavior changes.

## 3.2.2

### Fixed

- **The home page hero is no longer filtered by language.** `/` is the unfiltered mixed
  feed, but its featured card was queried with `featured:true+tag:en`, so it could only ever
  show an English post while the post grid below it mixed every locale. The root hero now
  uses the existing `featured_only` / `featured_tag` settings without a language tag — it
  shows the newest featured post wherever it was published — while `/en/`, `/es/` and
  `/br/` keep their `tag:<locale>` and render exactly as before. No content, route or
  setting change is required.

## 3.2.1

### Added

- **Portuguese post template** — `custom-br.hbs` mirrors `custom-es.hbs` and renders
  `post-layout` with `locale="br"`. It is an editor-selected custom template, like the
  Spanish one: a Portuguese post still needs its Template setting changed to `custom-br`
  before it declares `<html lang="pt">`.
- **Package scripts and metadata** — `test` (alias for `verify`), `test:gscan`,
  `sync:fonts`, `sync:icons` and `ghost:logs`; a pinned
  `packageManager: yarn@1.22.22`; homepage/docs/keywords metadata; and Homepage grouping
  for the featured-hero settings.
- **Regression tests** for the locale template wrappers and for explicit `.js` Prism
  import specifiers.

### Changed

- **Vite 8 / Rolldown** replaces Vite 7. The build config now uses
  `build.rolldownOptions`, and the generated manifest partials were regenerated for the
  new content hashes. `@vitejs/plugin-react` 5.2 already supports Vite 8.
- **README and supporting docs** now describe the real architecture: root `/` is an
  unfiltered mixed feed, `hash-*` tags are legacy and not required, locale posts need
  `custom-es`/`custom-br` selected in the editor, and the release archive is built with
  `yarn package`.

### Fixed

- **Prism component imports** now carry explicit `.js` extensions, so the specifiers
  resolve under Node's ESM resolver as well as Vite's. The unit suite no longer emits a
  module-resolution warning.
- **Packaging keeps previous archives.** `scripts/package-theme.mjs` removes only the
  target version's zip instead of deleting all of `dist/`, so the previous release remains
  available for rollback.
- **Removed the dead ESLint pre-commit hook.** The repository has no ESLint dependency or
  configuration; the hook only produced a false sense of a lint gate.

## 3.2.0

### Added

- **Featured hero filtering** — two theme settings, `featured_tag` (text) and `featured_only`
  (boolean, default on), let an editor choose the hero post on every channel collection by a
  custom tag and/or drop the `featured` requirement. The custom tag is **ANDed onto** the
  collection's language tag (`featured:true+tag:es+tag:news`), never substituted for it, so a
  channel still cannot render another locale's post; the defaults produce the previous filter
  exactly. All four combinations are assembled in the new
  `partials/featured-hero-locale.hbs`, which also removes the duplicated locale `{{#match}}`
  chain from `partials/featured-row.hbs`. See
  [README](README.md#featured-hero-filtering) and
  [docs/adr/0004](docs/adr/0004-featured-hero-filter.md).

### Changed

- **The local development stack is environment-driven.** `docker-compose.dev.yml` now runs
  the MySQL-backed image the deployment uses and reads `THEME_PATH` / `GHOST_DATA_PATH` from
  `.env`; copy `.env.example` to `.env` and set both to absolute paths. Nothing in the theme
  package changes — this only affects contributors running Ghost locally.

### Fixed

- **"Related content" was always empty on English posts.** The three locale branches build
  their NQL filter with `concat`, but the primary tag slug was written inside the string
  argument (`"+tags:[{{primary_tag.slug}}]"`), and `concat` does not interpolate a literal —
  NQL received the token `{{primary_tag.slug}}`, which matches nothing. The Spanish branch
  only looked populated because its bracket OR also matched every `es` post; the English
  branch has no locale tag in the bracket, so it rendered an empty section. The slug is now a
  separate `concat` argument, and `tests/related-content.test.mjs` pins the shape. See
  [partials/post-layout.hbs](partials/post-layout.hbs).

## 3.1.1

### Security

- **Bumped the transitive `handlebars` dependency to 4.7.10** to fix a JavaScript
  injection via AST type confusion in `compile()`/`precompile()` (CVE-2026-106446 /
  GHSA-8r5x-fm3f-whwj, critical, CVSS 9.8) and an unsafe inline embedding of
  precompiled templates (CVE-2026-106444, medium). `handlebars` is pulled in only as a
  dev-dependency of `gscan` (theme validation) and is pinned there, so the version is
  forced via a Yarn `resolutions` override until `gscan` ships a patched release.

## 3.1.0

### Added

- **`unmountIslands()`**, and the island runtime now collects a disposer returned by `mount`
  as well as by `enhance`, so an island owning timers or in-flight requests can be stopped.
  Ghost navigation is still a full page load, so nothing calls it yet.

## 3.0.0

A rewrite of the theme's front-end pipeline and templates. Ghost still renders every page
on the server; the theme now ships its own build, its own fonts and its own icons, and
makes **no third-party requests at all**.

### Changed — build and delivery

- **Gulp is gone; Vite builds the assets** ([#210](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/210)).
  Tailwind CSS v4 runs through the Vite plugin, and the build emits exactly what the
  templates link: hashed JS/CSS plus a set of manifest partials. `gulpfile.js` and the
  committed `assets/built/*.js|css` sources are gone.
- **Interactive UI moved to islands** ([#212](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/212)).
  A template declares a mount point (`<div data-island="…">`) and the runtime loads that
  island's chunk, and its framework, only where the markup asks for it. Nothing breaks
  with JavaScript disabled.
- **No third-party requests** ([#221](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/221)).
  Inter and Roboto Mono are self-hosted (latin + latin-ext woff2, `font-display: swap`),
  and the icons are inline SVG. The theme previously loaded three stylesheets from
  `fonts.googleapis.com` and cdnjs.

### Changed — templates

- **Locale templates are thin wrappers over shared layouts**
  ([#220](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/220)).
  `default*.hbs`, `home*.hbs`, `post.hbs` and `custom-es.hbs` now delegate to
  `partials/shell.hbs`, `partials/collection-layout.hbs` and `partials/post-layout.hbs`.
  Edit those, not the wrappers.
- **Colours are semantic tokens** ([#222](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/222)).
  `text-white` / `text-gray-400` / `bg-gray-800` / `border-gray-700` and the old `dark-*`
  names were replaced by `text-strong`, `text-muted`, `bg-subtle`, `border-border-strong`
  and friends, so a palette is a list of values rather than a rewrite of every template.
- **Light and dark palettes with a toggle.** **Dark is the default**, for everyone and
  regardless of the operating system; light is what a reader gets when they choose it. The
  choice persists and is applied before the first paint, so it never flashes.
- **A page can finally declare its own language.** `page.hbs` extended the English shell, so
  `/que-es-sredevops/` — a page titled *"Quiénes somos"* — declared `lang="en"`. There is no
  automatic route to the page's tags from a layout, so this mirrors what posts already do:
  `custom-page-es.hbs` extends `default-es.hbs`, with the shared body in
  `partials/page-body.hbs`. **Select Template → `page-es` on each Spanish page**; until then
  that page keeps declaring `lang="en"`.
- **Post cards declare their own language.** `/` has no filter and serves a mixed feed under
  `<html lang="en">`, so Spanish cards were announced with an English voice. Each card now
  emits `lang` read from the post's own URL prefix — the locale collection's permalink.
- **Island UI follows the page, not the site** ([#227](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/227)).
  The table of contents, share buttons, mobile menu, theme toggle and the code-block copy
  button spoke the site language, so a Spanish post showed `<html lang="es">` above English
  chrome — while `locales/es.json` already held every one of those strings. The content locale
  is now threaded from the shell, which is the only level that knows it.
- **The error page no longer emits an empty class token**, so `<body class=" …">` is gone.
- **`error.hbs` added**, self-contained (no layout, no partials, no helpers) so an error
  page cannot depend on the pipeline that may be what broke.

### Removed

- `assets/vendor/prism.js` — code highlighting comes from Prism via npm, in an island
  that only loads on pages that contain code
  ([#218](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/218)).
- The tocbot CDN dependency and its stylesheet; the table of contents is an island
  ([#214](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/214)).
- The inline `onclick`/`alert()` sharing links; share buttons are an island
  ([#215](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/215)).
- `custom-notocbot.hbs`, unused by any post. A post still assigned to it falls back to
  `post.hbs`.

### Documentation and tests

- `docs/adr/0001` (Vite and islands), `docs/adr/0002` (theming) and
  `docs/v3-roadmap.md` record the decisions, including the ones that did not work.
- `yarn verify` is the gate: GScan compatibility, the shipped-file manifest, unit tests
  for island behaviour, a bundle smoke test, and a check that every CSS class in a
  template or island resolves in the built stylesheet.
- Golden HTML fixtures captured from a real Ghost instance
  ([#217](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/pull/217)) detect
  unintended markup changes between phases. `fixtures.mjs diff` now refuses to compare when
  `raw/` is newer than `current/`: it previously reported "All fixtures match" against two
  stale captures, a green that no template change could break.

### Upgrading

- **Ghost 6** is required, as before; **Node 24** is required to build the theme.
- Posts in a locale collection must be assigned that locale's template (`custom-es`) for
  `<html lang>` to be that language. A Ghost layout cannot see the post's tags, so the
  theme cannot infer it — see `docs/v3-roadmap.md`, Phase 4 notes.
- Pages are the same: assign `page-es` to a Spanish page, or it keeps declaring `lang="en"`.
- The theme's *interface* strings (search, sign-in, pagination, the subscribe form) still
  follow the site language, because Ghost's translate helper has no per-page form. This is a
  decision waiting to be made rather than an oversight — see the Phase 6 notes.
- If you forked a template, expect the class renames above; the mapping is in the
  Phase 5b commit.

## Earlier versions

2.x was the gulp-built, dark-only line. No changelog was kept.
