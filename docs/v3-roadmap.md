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

Flow per phase: branch from `v3-dev` → implement → `npm run verify` locally → PR into `v3-dev`
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
| 3d | `v3/phase-3-code-blocks` | Prism from npm, dynamically imported on post pages only (vendored bundle deleted); `CodeBlocks` island for copy/language affordances | Post-page budget respected; code visible with JS off | 0.5–1 d |
| 4a | `v3/phase-4-template-correctness` | `@page.show_title_and_feature_image`, dead `{{#is "page"}}` branch, per-locale `lang`, standalone `error.hbs`, undefined `sticky-top`/`feature-image-wrapper` | Every context renders; `/es/` and `/br/` posts emit correct `lang` | 0.5–1 d |
| 4b | `v3/phase-4-locale-dedupe` | One shared shell/card/hero/author partial parameterised by `locale`; route-referenced filenames kept as thin wrappers; custom templates audited | Fixture diff per locale clean; GScan clean; no Admin routing change required | 1 d |
| 5a | `v3/phase-5-fonts-icons` | Self-hosted Inter + Roboto Mono, Font Awesome replaced by an SVG sprite / tree-shaken imports | Zero CDN requests; Lighthouse ≥ target | 0.5 d |
| 5b | `v3/phase-5-theming` | Palette → `@theme` tokens, `ThemeToggle` island behind `theme_toggle`, no-FOUC head script | Contrast unchanged in dark; toggle persists; dropable without blocking v3 | 0.5–1 d |
| 6 | `v3/phase-6-release-prep` | README, deploy workflow (`npm ci`, exclude list), zip/verify scripts, `v3.0.0` changelog entry | Full release checklist passes; **then** ask before PR `v3-dev` → `main` | 0.5 d |

≈ 7–9 focused days. Phases 3a–3d, 4a–4b and 5a–5b are independent branches and can be worked in
any order once Phase 2 lands.

## Island contract (applies to every Phase 3 branch)

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
