# ADR 0002 — Theming: semantic tokens, `light-dark()`, and one inline script

Status: accepted (Phase 5b) — **amended in Phase 6: dark is the default, not the operating
system.** See [Amendment](#amendment-phase-6--dark-by-default) at the end; decision 2 and the
second context bullet below describe the original behaviour and no longer match the code.

## Context

The theme was dark-only, but not by design: `partials/shell.hbs` hardcoded
`<html class="dark">` and the markup named colours after what they looked like —
`text-white`, `text-gray-400`, `bg-gray-800`, `border-gray-700` — alongside a handful of
`dark-*` tokens from the v2 palette. A second palette was therefore not a CSS problem but
a naming problem: no rule could be redefined to mean "the opposite" without the class
lying about its name.

Two more constraints shaped the decision:

- **A theme choice must not flash.** Anything that reads `localStorage` from a module
  runs after the first paint, which is exactly the paint it is meant to prevent.
- **"Follow the system" should stay the default**, not become a third state a reader has
  to find and manage.

## Decision

1. **Name tokens by role, not colour.** `--color-surface`, `-raised`, `-subtle`,
   `-border-subtle`, `-border-strong`, `-strong`, `-body`, `-muted`, `-subtle-text`,
   `-inverse`, `-on-inverse`. Every template uses these; the old `gray-*`, `white` and
   `dark-*` names are gone from the templates. Brand and status colours stay as they are:
   they do not invert.
2. **One definition per token, resolved by `color-scheme`.** Each token is
   `light-dark(<light>, <dark>)`, and `color-scheme` is set from `data-theme` when the
   reader has chosen, otherwise `light dark` so the operating system decides. This avoids
   the usual duplication of a light block plus a `prefers-color-scheme` block, and the
   OS preference and the explicit choice cannot drift apart.
3. **A ~300-byte inline script in `<head>`** applies a stored choice before first paint.
   It is the only inline script in the theme, and it exists precisely because a deferred
   module cannot do this job.
4. **The toggle is a vanilla island** (`ThemeToggle`) with the button, both icons and its
   labels server-rendered, so the control exists and is labelled without JavaScript. CSS
   shows the icon for the current theme, and clicking announces `themechange` so every
   mount relabels itself.

## Consequences

- Adding a palette is now editing the token block, not the templates.
- `light-dark()` sets a floor of Chrome 111+/Safari 16.4+/Firefox 120-era browsers —
  within Tailwind v4's own baseline, so it adds no new requirement. Older browsers get
  an unresolved variable rather than a wrong colour.
- The inline script means a Content-Security-Policy would need a nonce or hash. Ghost
  ships no CSP by default.
- Contrast of the light palette is unverified by construction: the repository has no
  browser. It needs a human look, and that is recorded in the roadmap.

## Amendment (Phase 6) — dark by default

**What changed.** `:root` now sets `color-scheme: dark`, so every `light-dark()` token
resolves to its dark value unless the reader has explicitly chosen light. The operating
system's `prefers-color-scheme` is no longer consulted anywhere — not for the palette
(`assets/css/index.css`), not for the toggle's icon (`assets/css/theme.css`), and not in the
island (`assets/js/islands/ThemeToggle.js`, which lost `systemTheme()` and its `matchMedia`
`change` listener).

**Why.** A dark-first identity was the original design of this theme; the semantic-token
layer made light possible, and Phase 5b then made "whatever the desktop says" the default
almost as a side effect of how `light-dark()` resolves. A reader on a light desktop got the
light theme on a site whose brand is dark. "Follow the system" is a defensible default but it
is a *choice*, and it was never made deliberately.

**What it cost.** Two of the four properties in the old toggle test had to be inverted
(`with no stored choice the operating system stays in charge` → `...the theme is dark, not the
operating system's`), and the test now deletes `globalThis.matchMedia` so a reintroduction of
the old behaviour throws instead of passing quietly.

**What did not change.** The token definitions, the single `light-dark()` per token, the
pre-paint inline script, and the `data-theme` contract. Because the palette was already fully
described by `color-scheme`, the whole change is three lines of CSS plus the island's default
— which is the payoff the token layer was built for.

**Unchanged trade-off worth restating:** the light palette's contrast is still unverified —
there is no browser in this repository.
