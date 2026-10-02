# Changelog

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
- **Light and dark palettes with a toggle.** Dark by default, light when the operating
  system asks for it, either when the reader chooses. The choice persists and is applied
  before the first paint, so it never flashes.
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
  unintended markup changes between phases.

### Upgrading

- **Ghost 6** is required, as before; **Node 24** is required to build the theme.
- Posts in a locale collection must be assigned that locale's template (`custom-es`) for
  `<html lang>` to be that language. A Ghost layout cannot see the post's tags, so the
  theme cannot infer it — see `docs/v3-roadmap.md`, Phase 4 notes.
- If you forked a template, expect the class renames above; the mapping is in the
  Phase 5b commit.

## Earlier versions

2.x was the gulp-built, dark-only line. No changelog was kept.
