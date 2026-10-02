# ADR 0001 — v3: React islands on a Vite pipeline

- **Status:** Accepted (integration branch `v3-dev`)
- **Date:** 2026-10-01
- **Supersedes:** the gulp + PostCSS + Tailwind v3 build described in `README.md` (v2.x)

## Context

The theme is a Ghost 6 theme: Ghost renders Handlebars server-side, resolves routing from
`routes.yaml`, and injects SEO, Portal, search, comments and card assets through
`{{ghost_head}}` / `{{ghost_foot}}`. The build today is gulp + PostCSS + Tailwind v3, with
committed build output in `assets/built/` and third-party runtime pulled from CDNs.

Verified baseline before this work (2026-10-01, `main` @ `6f86991`, v2.1.5):

- `npx gscan --fatal --verbose .` → clean, exit 0, Ghost 6.x compatible.
- `npx gulp build` succeeds; every built asset is referenced through `{{asset}}`.
- Interactivity is ~153 lines of DOM-mutation JS (`assets/js/main.js`), an inline tocbot
  initialiser with a `setTimeout(…, 500)` race (`partials/sidebar.hbs`), and inline
  `onclick` + `alert()` sharing (`partials/social-share.hbs`).
- Third-party runtime: Google Fonts ×2, Font Awesome CDN, tocbot CDN (post pages only),
  a vendored Prism 1.30 bundle.
- Locale handling duplicates templates per language (`default-es`, `default-br`,
  `home-es/en/br`, `post-card-es/br`, `featured-hero-es/br`, `author-box-es`, `custom-es`,
  `custom-notocbot`) instead of parameterising one set.
- Known defects: `{{body_class}}` / `{{post_class}}` are never used, `<form data-members-form=>`
  has an empty value, `@page.show_title_and_feature_image` is ignored, `post.hbs` contains a
  dead `{{#is "page"}}` branch, and posts under `/es/` and `/br/` still render
  `<html lang="{{@site.locale}}">` because they always extend `default.hbs`.
- The body is hardcoded dark (`<html class="dark">`, 308 hardcoded colour utilities, no
  `darkMode` configuration).

## Decision

### D1 — Stay a theme; add islands, not a frontend app

Ghost keeps rendering all content, routing and membership. React is used **only** as islands
mounted into server-rendered markup, under the island contract:

1. Templates own the document; React mounts into a `div` inside `{{{body}}}`.
2. Existing DOM is the source of truth for content (`data-target=".gh-content"`), not props.
3. Scalars travel in data attributes; structured payloads only through a `{{json}}` script block.
4. Every page must be complete and readable with JavaScript disabled.
5. Server-rendered content is never hidden behind a React-only render path.

**Explicit non-goals:** Ghost native search (`data-ghost-search`), comments (`{{comments}}`),
Portal/member auth, and any client-side routing. A headless (Next.js/Remix/SvelteKit) rewrite
was rejected: it forfeits admin-driven routing, member gating, SEO output and GScan validity.

### D2 — Vite replaces gulp/PostCSS/uglify

One tool builds CSS and JS. Configuration pinned to the theme contract: `base: "./"`,
`publicDir: false`, `build.outDir: "assets/built"`, **`build.assetsDir: "."`** (never emit
`assets/built/assets/**`), `manifest: "manifest.json"`.

### D3 — Tailwind CSS v4 via `@tailwindcss/vite`

`@source` globs scan `*.hbs`, `partials/**` and `assets/js/**`. The theme palette moves into
`@theme` CSS variables so a later theme toggle can redefine the scale per mode instead of
rewriting 308 colour utilities in templates. **Fallback:** if the Phase 1 HTML/CSS diff is
noisy, keep Tailwind v3 behind Vite's PostCSS path — a one-PR revert, not a re-plan.

### D4 — React 19 now, runtime kept swappable

`@vitejs/plugin-react`, `react`, `react-dom`. The registry (`data-island` name → component)
is framework-agnostic so aliasing to Preact (~4 kB vs ~60–70 kB gzip) stays a build-config
change. The Preact decision is **gated on the Phase 3 measured bundle**, not taken up front.

### D5 — Build-time manifest bridge for hashed assets

`lib/vite/ghost-manifest-partials.js` rewrites committed static partials
(`partials/vite_assets/head.hbs`, `foot.hbs`, `post.hbs`) from `manifest.json`, emitting the
stylesheet link, `modulepreload`, the single `<script type="module">`, and the **post-only
chunk** that stays inside `{{#is "post"}}` in `partials/scripts.hbs`. Handlebars cannot read a
manifest at render time; this is the bridge. Placeholders are committed so a fresh clone
still parses before the first build.

### D6 — Locale dedupe inside v3, filenames frozen

Duplicated locale templates collapse into shared partials parameterised with partial hash
arguments (`{{> "post-card" locale="es"}}`). **Route-referenced filenames stay**
(`default-es.hbs`, `default-br.hbs`, `home-es.hbs`, `home-en.hbs`, `home-br.hbs`) because
`routes.yaml` is excluded from the deploy action and routing is edited by hand in Ghost
Admin — renaming them would silently break collections until someone updates Admin routing.
Editor-selectable custom templates (`custom-es.hbs`, `custom-notocbot.hbs`) are audited for
assigned posts before removal; unused ones are deleted, used ones become thin wrappers.

### D7 — Build output is not committed

`assets/built/**` becomes git-ignored; `partials/vite_assets/*.hbs` placeholders stay
committed. `yarn zip` builds before packaging, and CI builds before deploying. This removes
the stale-hash class of bug and the review noise of committed bundles.

### D8 — Theme toggle is a token-layer feature, flagged and dropable

The dark palette first becomes semantic tokens (Phase 5). `ThemeToggle` then flips a class on
`<html>` and persists to `localStorage`, guarded by a `theme_toggle` boolean custom setting
and a no-FOUC inline head script. Dark remains the default. If Phase 5 runs long, v3 ships
without the toggle and still gains the token layer.

### D9 — Branch and integration model

- `main` is frozen for the duration of v3. No direct commits, no merges into `main` until the
  release step is explicitly approved.
- `v3-dev` is the integration branch; every phase is a feature branch PR'd **into `v3-dev`**.
- Feature branches are named `v3/<phase>-<slug>`.
  **Why not `v3-dev/<slug>`:** git cannot hold `refs/heads/v3-dev` and
  `refs/heads/v3-dev/<slug>` at the same time (directory/file ref conflict). The `v3/` prefix
  groups the phase branches and keeps the PR base unambiguous.
- Squash merge into `v3-dev`; Conventional Commits; no force-pushes to `v3-dev`.
- Release is a single PR `v3-dev` → `main`, tagged `v3.0.0`, only on explicit instruction.
- Rollback: `v2.1.5` stays tagged and shippable; re-uploading the v2 zip in Ghost Admin is the
  operational rollback.

## Consequences

**Positive:** one build tool; hashed assets with preload and per-context chunks; interactive
components written once and testable; CDN dependencies removed; locale and post layouts
deduplicated; a token layer that makes theming cheap; CI-enforced GScan and bundle budgets.

**Negative / accepted costs:** React runtime (~60–70 kB gzip) on pages that use islands, even
lazy-loaded; a small build-time plugin to maintain (the manifest bridge); fixture-based
regression testing becomes necessary because rendering is no longer verifiable by eye; the
manual `routes.yaml` step in Admin remains a documented release-checklist item.

**Neutral:** Ghost's template caching still requires `ghost restart` after `.hbs` changes —
`vite build --watch` cannot solve that.
