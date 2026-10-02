# Golden HTML fixtures

Ghost renders templates server-side, so the only honest regression test for a
template or build-pipeline change is: render the same contexts before and after,
then diff the HTML. These fixtures are that baseline.

```
tests/fixtures/
├── contexts.txt    # fixture name -> URL path to capture
├── golden/         # committed baseline (reviewed HTML)
├── raw/            # last capture, untouched   (git-ignored)
└── current/        # last capture, normalised  (git-ignored)
```

## One-time setup

```bash
yarn ghost:up                       # Ghost 6 on http://localhost:2368
```

Then, in Ghost Admin (`http://localhost:2368/ghost/`):

1. Create the owner account.
2. **Settings → Design** → activate `sredevopsorg-ghost-theme`.
3. **Settings → Advanced → Routing** → upload `routes.yaml`. Routing is stored in the
   database, which is why it is not part of a theme upload and not deployed by CI.
4. Create content: a few posts tagged `en`, `es` and `br` (plus their `hash-*`
   tags), at least one page, one author, and enough posts to fill two pages.

Edit `contexts.txt` so the `adjust:` paths point at that content. Anything still
pointing at a non-existent slug fails during capture rather than silently
producing an empty fixture.

## Capture and compare

```bash
yarn fixtures:capture     # curl-free capture into raw/ (needs Ghost running)
yarn fixtures:normalize   # -> current/
yarn fixtures:diff        # compare current/ with golden/; exits 1 on any difference
```

When a difference is intended (a real template change), review it and re-baseline:

```bash
yarn fixtures:promote     # current/ -> golden/    then: git diff tests/fixtures/golden
```

## Baselines for a migration (Phase 1 procedure)

A baseline captured on the branch you are testing proves nothing. For a migration the
goldens must come from the **pre-migration** theme, then the branch is captured against them.
The docker-compose file mounts the repository itself as the active theme, so switching branch
switches the theme:

```bash
# 1. baseline from the pre-migration theme
git checkout main
yarn install && yarn build && yarn ghost:restart
node scripts/fixtures.mjs capture && node scripts/fixtures.mjs normalize
node scripts/fixtures.mjs promote                       # -> tests/fixtures/golden/
git add tests/fixtures/golden && git commit -m "test: golden fixtures for the v2 (gulp) build"

# 2. capture the branch and compare
git checkout v3/phase-1-vite-pipeline
yarn install && yarn build && yarn ghost:restart
node scripts/fixtures.mjs capture && node scripts/fixtures.mjs normalize
node scripts/fixtures.mjs diff                          # exits 1 and prints the first differing character
```

Expected for the Vite/Tailwind-v4 migration: differences limited to

- `<link>`/`<script>` asset URLs and their `?v=` hash (normalised, so usually invisible),
- the new `{{body_class}}` classes on `<body>` (three layout shells),
- `{{post_class}}` on the post container (post, custom-es, custom-notocbot),
- the members signup form's new messages in the sidebar.

Anything else is a real rendering change and must be explained before merging.

## What is normalised

Only four things, so that everything else in a diff is a real change:

| Normalised | Why |
| --- | --- |
| `?v=<hash>` → `?v=HASH` | `{{asset}}` cache-busting query changes on every restart |
| `nonce="…"` → `nonce="NONCE"` | Ghost's code-injection CSP nonces are per-request |
| ISO timestamps → `TIMESTAMP` | injected meta/RSS hints |
| `Ghost x.y.z` → `Ghost VERSION` | generator meta changes on Ghost upgrades |

Trailing whitespace is trimmed. Nothing else is touched — do not add normalisers
to hide a difference you have not understood.

## Using it as a gate

* **Phase 1 (Vite replaces gulp):** the diff must contain asset URLs only.
* **Phase 4 (template correctness/locale dedupe):** per-locale diffs must be empty or
  explainable; `lang=` changes are expected and intended.
* **CI:** fixtures need a seeded Ghost, so they run locally today. Phase 3 adds
  Playwright against this same container, which is where they move into CI.

## Known gap

There is no committed Ghost import file, so the baseline depends on content created
by hand. Adding `tests/fixtures/seed.json` (Ghost Admin → **Export** → import) would
make captures reproducible from scratch — worth doing before the Phase 1 gate.
