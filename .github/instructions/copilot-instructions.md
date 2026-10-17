## Overview

`sredevopsorg-ghost-theme` is a Ghost 6 Handlebars theme. Ghost renders every page on the
server; Vite 8 builds the CSS/JS and React islands add interactivity only where a template
declares a mount point. Tailwind CSS v4 runs through `@tailwindcss/vite`; there is no
`tailwind.config.js`, PostCSS pipeline, or Gulp build.

## Commands

Use Yarn 1 for this repo. `package.json` pins `yarn@1.22.22` and requires Node 24.

```bash
yarn install --frozen-lockfile  # install exactly what CI installs
yarn dev                        # vite build --watch; rebuilds assets/built/**
yarn build                      # one production build
yarn verify                     # build + GScan + package check + unit + bundle + classes
yarn test                       # alias for yarn verify
yarn test:unit                  # node:test models and enhance islands
yarn test:bundle                # built entry + island chunk contract
yarn test:classes               # every template/island class has CSS
yarn package                    # dist/<name>-<version>.zip, validated with gscan --zip
```

`yarn test:bundle`, `yarn test:classes` and `yarn test:ship` require a build; `yarn verify`
does it first. Do not add `--fatal` to GScan: it only fails on fatal issues and lets
error-level findings pass.

The local Ghost 6 + MySQL stack is available with `yarn ghost:up`; `yarn ghost:restart`
is required after editing `.hbs` files because Ghost caches compiled templates. The
fixture and browser-layout checks are local-only and need a seeded Ghost/Chromium.

## Boundaries

- **Templates**: Ghost owns routing and rendering. Do not add a client-side router or move
  page rendering into React.
- **Generated assets**: `assets/built/**` is generated and git-ignored. Do not edit it by
  hand. `partials/vite_assets/head.hbs` and `foot.hbs` are generated too, but they are
  committed so a fresh clone parses; regenerate and commit them after a build.
- **Sources**: edit `.hbs`, `assets/css/**`, `assets/js/**`, `lib/vite/**`,
  `scripts/**` and `package.json` intentionally.
- **Do not commit** `node_modules/`, `dist/`, local Ghost content, or secrets.
- **Do not ship** `assets/css`, `assets/js`, `lib/`, `scripts/`, `tests/`, `docs/`,
  or config files in the theme zip. `scripts/package-theme.mjs` and
  `scripts/ship-manifest.mjs` enforce this.

## Data flows

- **Handlebars**: Ghost resolves a URL to a collection/post/page context and renders the
  matching template. Locale collections are defined in `routes.yaml`; locale post/page
  templates are selected per content item in Ghost Admin.
- **CSS**: `assets/css/index.css` imports Tailwind, `theme.css` and the generated
  `fonts.css`; Vite emits `assets/built/index-<hash>.css`.
- **JS**: `assets/js/index.js` imports the stylesheet, `main.js` and the island runtime.
  `assets/js/islands.js` maps `data-island` names to dynamic imports; the framework chunk
  is fetched only where an island exists.
- **Asset bridge**: `lib/vite/ghost-manifest-partials.js` reads Vite's manifest and writes
  the two `partials/vite_assets/*.hbs` files that templates include through `{{asset}}`.
- **Locales**: `default-*.hbs` wrap `partials/shell.hbs`; `home-*.hbs` use
  `partials/collection-layout.hbs`; `custom-*.hbs` use `partials/post-layout.hbs`;
  `custom-page-es.hbs` uses `partials/page-body.hbs`.

## Conventions

1. **Do not hardcode asset URLs.** Use `{{asset "built/..."}}`; the manifest partials own
   the hashes.
2. **Keep `{{ghost_head}}` before `</head>` and `{{ghost_foot}}` before `</body>`.**
   `partials/shell.hbs` owns both; `default*.hbs` are wrappers.
3. **Partial arguments do not survive `{{#post}}`, `{{#page}}`, `{{#get}}` or
   `{{#foreach}}`.** Pass `locale` at the partial's top level or as a literal.
4. **Custom settings are append-only.** Keys are `snake_case`; never rename
   `show_search`, `show_login`, the `sec_feed_*` keys or the `featured_*` keys. Keep
   every setting used and descriptions under 100 characters.
5. **Image sizes are theme-defined.** A `{{img_url size="..."}}` must match a key in
   `config.image_sizes`.
6. **Locale tags**: exactly one of `en`, `es`, `br` per post. `hash-*` tags are legacy
   and ignored. The root `/` feed is intentionally mixed.
7. **Islands** export exactly one of `mount(element, props)` or
   `enhance(element, props)`; the registry key must equal `data-island`. Nothing may
   break with JavaScript disabled.

## Key files

- `package.json` — Ghost metadata, `config.custom`, image sizes, scripts, toolchain.
- `vite.config.js` — Ghost-safe Vite 8 build (`base: "./"`, `assetsDir: "."`, manifest).
- `lib/vite/ghost-manifest-partials.js` — manifest-to-Handlebars bridge.
- `assets/css/index.css` — Tailwind v4 entry, semantic theme tokens, source globs.
- `assets/js/islands.js` — island registry, lazy mounting, cleanup.
- `partials/shell.hbs` — document shell and the `{{{body}}}` injection point.
- `partials/collection-layout.hbs`, `partials/post-layout.hbs`, `partials/page-body.hbs`
  — shared page bodies, parameterised by `locale`.
- `routes.yaml` — locale collections and taxonomies (uploaded in Admin, not deployed).
- `scripts/` — GScan-adjacent checks, packaging, fixtures, font/icon sync.
- `tests/` — `node:test` suites; `tests/fixtures/golden/` is the reviewed HTML baseline.

## Verification

Before opening a PR, run `yarn verify` and `git diff --check`. If the change touches
templates, also run `yarn fixtures:capture && yarn fixtures:normalize && yarn fixtures:diff`
against a seeded local Ghost and explain any diff. If it touches the security-feed layout,
run `yarn test:sec-feed-layout` in the Playwright image.
