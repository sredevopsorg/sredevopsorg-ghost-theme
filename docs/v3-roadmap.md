# v3 roadmap — React islands on a Vite pipeline

Companion to [ADR 0001](adr/0001-v3-react-islands-and-vite.md). This file is the working plan:
branches, deliverables, gates.

## Branch model

| Branch | Role |
| --- | --- |
| `main` | **Frozen until release is approved.** No commits, no merges. v2.1.5 remains the deployable release. |
| `v3-dev` | Integration branch. Every phase merges here. |
| `v3/<phase>-<slug>` | One phase or one island per branch, PR'd into `v3-dev`. |

Naming note: `v3-dev/<slug>` is impossible — git cannot keep `refs/heads/v3-dev` and
`refs/heads/v3-dev/<slug>` at the same time. Phase branches use the `v3/` prefix instead.

Flow per phase: branch from `v3-dev` → implement → `yarn verify` locally → PR into `v3-dev`
→ CI green → squash merge → delete branch. `v3-dev` is never force-pushed.

## Phases

| # | Branch | Deliverable | Gate | Est. |
| --- | --- | --- | --- | --- |
| 0 | `v3/phase-0-baseline` | Local Ghost compose, golden HTML fixtures per context, GScan+build+zip CI | Fixtures reproducible on demand; CI red on a deliberate GScan break | 0.5 d |
| 1 | `v3/phase-1-vite-pipeline` | Vite replaces gulp; Tailwind v4; manifest partials; `assets/built/**` uncommitted; `{{body_class}}`/`{{post_class}}` added; members form value fixed; gulp deleted | HTML fixture diff limited to asset URLs; GScan fatal-clean; zip contents asserted | 1–1.5 d |
| 2 | `v3/phase-2-island-runtime` | `islands.jsx` registry (unknown-name + double-mount guards), lazy mount, `partials/island-config.hbs` (`{{json}}` + translated island strings), island CSS/mount conventions | No-island page ships zero React bytes; console clean | 0.5 d |
| 3a | `v3/phase-3-mobile-menu` | `MobileMenu` island + CSS-only fallback; old toggle deleted from `assets/js/main.js` | Menu opens with JS off; keyboard operable | 0.5 d |
| 3b | `v3/phase-3-toc` | `TableOfContents` island; tocbot CDN, inline init, `setTimeout` and `tocbot.css` removed | No third-party request on post pages; sidebar intact with JS off | 0.5–1 d |
| 3c | `v3/phase-3-share` | `ShareButtons` island (Web Share API + clipboard + toast); inline `onclick`/`alert()` removed | Plain share links work with JS off; no `alert()` anywhere | 0.5 d |
| — | *measured so far* | `MobileMenu` vanilla **0.47 kB gzip**; `ReadingProgress` (1st React island) **69.47 kB gzip** incl. framework; `TableOfContents` (2nd React island) **+1.42 kB gzip**, `ShareButtons` (3rd) **+0.93 kB gzip**; `CodeBlocks` (vanilla) **0.34 kB gzip** plus Prism in its own 22.17 kB gzip chunk, fetched only where code exists. Entry chunk 5.0 kB with no framework. This is the data for the Preact question in D4 |
| 3d | `v3/phase-3-code-blocks` | Prism from npm, dynamically imported on post pages only (vendored bundle deleted); `CodeBlocks` island for copy/language affordances | Post-page budget respected; code visible with JS off | 0.5–1 d |
| 4a | `v3/phase-4-template-correctness` | `@page.show_title_and_feature_image`, dead `{{#is "page"}}` branch, per-locale `lang`, standalone `error.hbs`, undefined `sticky-top`/`feature-image-wrapper` | Every context renders; `/es/` and `/br/` posts emit correct `lang` | 0.5–1 d |
| 4b | `v3/phase-4-locale-dedupe` | One shared shell/card/hero/author partial parameterised by `locale`; route-referenced filenames kept as thin wrappers; custom templates audited | Fixture diff per locale clean; GScan clean; no Admin routing change required | 1 d |
| 5a | `v3/phase-5-fonts-icons` | Self-hosted Inter + Roboto Mono, Font Awesome replaced by an SVG sprite / tree-shaken imports | Zero CDN requests; Lighthouse ≥ target | 0.5 d |
| 5b | `v3/phase-5-theming` | Palette → `@theme` tokens, `ThemeToggle` island behind `theme_toggle`, no-FOUC head script | Contrast unchanged in dark; toggle persists; dropable without blocking v3 | 0.5–1 d |
| 6 | `v3/phase-6-release-prep` | README, deploy workflow (`npm ci`, exclude list), zip/verify scripts, `v3.0.0` changelog entry | Full release checklist passes; **then** ask before PR `v3-dev` → `main` | 0.5 d |

≈ 7–9 focused days. Phases 3a–3d, 4a–4b and 5a–5b are independent branches and can be worked in
any order once Phase 2 lands.

## Phase 4 notes

### Per-locale `lang` — investigated, not solvable at the layout level

A post that carries a locale tag but no locale template renders through `post.hbs` →
`default.hbs`, which can only emit the one site locale. Three approaches were tested
against a real Ghost 6.67 instance and all fail, for the same underlying reason: **a
layout cannot see the post context.**

| Approach | Result |
| --- | --- |
| `{{#has tag="es"}}` directly in the layout | always false |
| `{{#has}}` wrapped in `{{#post}}` in the layout | always false — `#post` yields nothing in a layout |
| `{{#contentFor "lang"}}` in `post.hbs` + `{{{block "lang"}}}` in the layout | the content **does** reach the layout, but it is evaluated **in the layout's context**, so the tag test inside it is false again |

One useful thing came out of it: `{{#block "lang"}}default{{/block}}` **does** render its
body when no `contentFor` is supplied, so a layout can define a fallback for a block.

The remedy is the documented one and what the site already does: locale shells for
collections (`default-es.hbs`, `default-br.hbs`) and a locale custom template for
individual posts (23 of 26 posts use `custom-es`). `README.md` now states that a post in
a locale collection must be assigned the locale template, otherwise it renders with the
site locale.

### What a partial argument can and cannot do (measured, Phase 4b)

The Phase 4b goal was one shared partial per component, parameterised by `locale`. That
works only at scopes where a partial hash argument survives, and it does not survive
every block:

| Where the argument is read | Visible? |
| --- | --- |
| The partial's own top level | yes |
| Inside `{{#is}}`, `{{#if}}` (helpers that do not change context) | yes |
| Inside `{{#post}}`, `{{#get}}`, `{{#foreach}}` (context-changing) | **no** — silently empty, so the fallback branch is taken |
| `{{#has tag="x"}}` as a locale test | **no** — it matches only the *primary* tag, and a locale tag is secondary by convention |

Both were verified against a real Ghost 6.67 with markers rendered into the page. The
silent part is what matters: a dropped argument does not error, it just renders the
default language.

So `locale` is passed as a **literal at each call site** where the surrounding block
would drop a variable, and components keep a per-locale variant only where a locale
string sits inside such a block — `featured-hero` (×3, its label/date/reading time live
inside `{{#get}}` + `{{#foreach}}`) and `author-box` (×2, inside `{{#foreach authors}}`).
Everything else is one partial plus one-line wrappers.

Result for Phase 4b: **793 lines across 18 templates → 533 across 16, of which 11 are
one- to two-line wrappers.** The goldens' tag sequences are byte-identical before and
after, which is the evidence that the refactor changed no markup.

## Phase 5 notes

### The last two third-party dependencies, and what replacing them cost

Fonts (Inter, Roboto Mono) and icons (Font Awesome) were the only off-site requests the
theme made. Both are local now.

| | Before | After |
| --- | --- | --- |
| Fonts | 2 stylesheets + 2 preconnects to `fonts.googleapis.com` / `fonts.gstatic.com` | 262 kB of woff2 in the theme, latin + latin-ext, 4 `@font-face` rules |
| Icons | Font Awesome's full stylesheet from cdnjs (~100 kB) plus its webfonts | ~16 kB of inline SVG covering exactly the twenty glyphs used |
| Requests to other origins | 3 stylesheets, 2 preconnects, N webfont files | 0 |

Neither is fetched at build time: `scripts/sync-fonts.mjs` and `scripts/sync-icons.mjs`
download once and write committed files, so builds stay offline and reproducible. Licence
texts are fetched alongside and committed.

Three things this phase caught that are worth remembering:

- **Tailwind's preflight makes `<svg>` a block element** (`display: block`), so an inline
  icon sitting in a line of text breaks the line. Every icon carries `inline-block` plus
  `align-[-0.125em]`, which is Font Awesome's own vertical alignment.
- **Replacing an element class-by-class loses classes.** The first pass rewrote 47 call
  sites and silently dropped `hidden` and `group-open:inline` from the mobile menu's close
  button, which would have left it visible next to the open/close toggle.
- **The CSS coverage guard cannot see a class inside a JSX ternary.** Two Font Awesome
  classes survived in `ShareButtons.jsx` for exactly that reason, which is why
  `tests/no-third-party.test.mjs` now greps templates *and* island source for them.

Not done, deliberately: preloading the fonts. They are referenced from the theme's own
hashed CSS with `font-display: swap`, which is one request behind the stylesheet that
already blocks first paint; a `<link rel="preload">` would need the hashed filename
exposed through the manifest bridge, and is worth doing only with a real measurement.

### The gate was blind to error-level findings (found in production, fixed)

Ghost logged this while booting the theme:

```
WARN The currently active theme "sredevopsorg-ghost-theme" has errors, but will still work.
  GS001-DEPR-LANG   partials/shell.hbs   {{lang}}
  GS080-NO-EMPTY-TRANSLATIONS  error.hbs  {{t}}
```

Both were mine, and both had passed `yarn verify` for five phases:

- a partial argument named `lang` (`{{> "shell" lang="es"}}`) reads as the removed
  `{{lang}}` helper — the argument is now `documentLang`;
- the *comment* in error.hbs listed the helpers it avoids, and the rule scans comments,
  so the literal `{{t}}` in prose counted as an empty translation.

Cause: the gate ran `gscan --fatal`, and **`--fatal` only fails on fatal issues.** On a
theme with these two errors, `gscan --fatal .` exits 0 while plain `gscan .` exits 1.
The flag reads like a strictness switch and is the opposite of one.

The gate now runs plain `gscan` (pinned in devDependencies, so CI and local runs agree)
and was verified to exit 1 when `{{lang}}` is reintroduced. Note also that gscan's
*programmatic* API returned zero errors for the same theme with every `checkVersion` —
only the CLI reproduced Ghost's own validation, so the CLI is what the gate uses.

## Island contract (applies to every Phase 3 branch)

Implemented in Phase 2 by `assets/js/islands.js` (runtime) and
`assets/js/lib/theme-config.js` (config). How it works:

| Piece | Rule |
| --- | --- |
| Mount point | `<div data-island="Name" data-…>` inside `{{{body}}}`; never `document.body` |
| Island module | `assets/js/islands/<Name>.{js,jsx}`; key in the registry must equal `data-island` |
| Mode | `mount(element, props)` when the island owns dynamic UI (framework renders into an empty element) · `enhance(element, props)` when it only augments server markup (no framework loaded at all; the element keeps its children). Return a cleanup function when listeners are added |
| Framework | Owned by the island module, never by the runtime. Choose per island: React when it owns stateful UI, vanilla when it is DOM augmentation — `MobileMenu` is 0.47 kB gzip vanilla, the React runtime alone is ~69 kB gzip |
| Code splitting | The registry holds `() => import(...)` thunks, so the island chunk (and the framework it pulls in) is fetched only where a mount point exists. React is **never** in the entry chunk — `yarn test:bundle` fails if it is |
| Lazy islands | Add `data-island-lazy` to defer even the import until the element nears the viewport |
| Props | The mount element's `dataset`; read rendered markup from the DOM (`data-target`) rather than passing content through attributes |
| Strings | `{{json}}` block from `partials/island-config.hbs`, read via `t(key)`; flat keys, English fallbacks in `theme-config.js` |
| Styles | Tailwind classes written in the component (`assets/js/**` is an `@source` glob), guarded by `yarn test:classes` |
| Failure | Unknown name, missing `mount` export or a throwing import logs and marks the element `data-island-state="unknown|failed"`; the page and other islands are unaffected |

- Mount point: `<div data-island="Name" data-…>` inside `{{{body}}}`; never `document.body`.
- The registry logs and skips unknown island names — a template typo must not break every page.
- Mount below-the-fold islands lazily (`IntersectionObserver` + `await import()`), reserve space
  to avoid CLS, and never render content React owns.
- Data: DOM first, data attributes for scalars, `{{json}}` script block only when the DOM does
  not expose it. Never `{{{…}}}` into a `<script>` body.
- Islands must not swallow `data-portal`, `data-members-form` or `data-ghost-search` clicks.

## Budgets (enforced in CI)

| Metric | Target |
| --- | --- |
| JS, non-post pages | ≤ 25 kB gzip |
| JS, post pages | ≤ 45 kB gzip |
| CSS | ≤ 20 kB gzip |
| Third-party render-blocking requests | 0 |
| CLS | < 0.02 |

## Verification stack

1. **GScan** — `npx gscan --fatal --verbose .` (baseline is clean; keep it clean).
1b. **Class coverage** — `yarn test:classes`: every class used in a template or in `assets/js`
   must have a rule in `assets/built/**` + `assets/vendor/**`. This is the guard against
   Tailwind's silent failure mode, where a renamed utility simply emits no CSS.
1c. **Bundle smoke test** — `yarn test:bundle`: the built entry is evaluated in a stubbed DOM;
   it must load without throwing and register its hooks. Catches bundle-semantics regressions
   that no HTML diff can see.
1d. **Island behaviour** — `yarn test:unit` (node:test, no dependencies): DOM-level behaviour
   of `enhance` islands, e.g. Escape/outside-click/breakpoint handling in `MobileMenu`.
   Two documented limits of the class guard: `--css` directory scans are **not** recursive, so
   pass every output directory explicitly (`--css assets/built --css assets/vendor`); and a
   class whose name starts with a digit (`2xl:grid-cols-2`) is not decoded from Tailwind's
   hex-escape form, so it fails loudly rather than silently. Neither exists in the theme today.
2. **Golden HTML fixtures** — one file per context (home, `/page/2/`, post, page, tag, author,
   `/es/…`, `/br/…`, 404, members) captured from the local Ghost container; Phase 1+ diffs must
   show asset-URL changes only.
3. **Playwright** — per context: content present with JS disabled; every `[data-island]`
   non-empty with JS enabled; no console errors; no `[islands] unknown island` warnings.
4. **Zip assertion** — the package contains `assets/built/**`, `partials/**`, `*.hbs`,
   `package.json`, `locales/**`, and contains no `node_modules/`, `lib/`, `scripts/`, `tests/`,
   source assets or docs.
5. **Lighthouse** — ≥ 90 performance, ≥ 95 accessibility, 100 SEO, in all three locales.

## Settings policy

Never rename `show_search` or `show_login` (renaming drops the stored value — breaking change).
Append only, with `snake_case` keys and ≤ 20 total: `development_mode`, `reading_progress`,
`content_api_key` (text; Content API keys are public/read-only), `theme_toggle`.

## Release checklist (Phase 6, requires explicit go-ahead)

- [ ] `v3-dev` GScan fatal-clean and all fixtures reviewed.
- [ ] Budgets met; Lighthouse targets met in en/es/pt.
- [ ] Local Ghost 6 install from the built zip renders every context.
- [ ] Deploy workflow updated (`npm ci`, exclude `vite.config.js lib scripts tests docs`).
- [ ] `routes.yaml` drift checked against production Admin (routing is not deployed by CI).
- [ ] `v3.0.0` tagged; v2.1.5 zip retained as the rollback artifact.
- [ ] **Ask before** opening the `v3-dev` → `main` PR.
