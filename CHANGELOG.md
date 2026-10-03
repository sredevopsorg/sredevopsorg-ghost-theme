# Changelog

## Unreleased

### Added

- **Security feed widget** — the newest advisories from
  [SREDevOps Sec Feed](https://github.com/sredevopsorg/sredevopsorg-sec-feed) (Ubuntu, Debian,
  Red Hat, NVD, CISA, AWS, Kubernetes and OpenSSF, enriched with CISA KEV, EPSS and OSV.dev)
  rendered as a block above the post grid on every collection: relative timestamps, severity
  badges, KEV and CVE markers, client-side tag filters, and a link to the full live feed.
  **Off by default** — set `sec_feed_api_url` in Admin → Design → Theme to enable it. See
  [README](README.md#-security-feed-widget) for the `CORS_ORIGINS` entry the service needs,
  since it fails CORS closed, and [docs/adr/0003](docs/adr/0003-security-feed-widget.md) for
  why it is an island and why it is vanilla.
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
