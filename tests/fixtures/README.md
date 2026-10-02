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
yarn ghost:up                       # Ghost 6 on http://localhost:2368 + Mailpit on :8025
```

On a **fresh volume** the database has to be initialised once before Ghost will
start — otherwise it logs `Database state requires initialisation` and exits:

```bash
docker compose -f docker-compose.dev.yml run --rm --entrypoint sh ghost \
  -c 'cd /var/lib/ghost/current && ./node_modules/.bin/knex-migrator init'
```

Two things verified on real hardware while setting this up:

- **Ghost sends mail** (staff sign-in device verification, import-completion
  notices). With no mailer those steps fail with `Failed to send email`, and an
  import can fail with it. The compose file therefore runs Mailpit and points
  Ghost at it; read what Ghost sends at <http://localhost:8025>.
- **CPUs without SSE4.2/AVX cannot run Ghost as-is**: its bundled `sharp` dies with
  SIGILL (exit 132) before Ghost finishes booting. On such a machine also load
  `docker-compose.legacy-cpu.yml`, which hides sharp (so image resizing is
  unavailable — fine for HTML fixtures) and runs node with `--no-opt`:

  ```bash
  docker compose -f docker-compose.dev.yml -f docker-compose.legacy-cpu.yml up -d
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

### Restoring a Ghost export

Ghost's importer needs `meta` **inside** `db[0]`:

```json
{ "db": [ { "meta": { "exported_on": 0, "version": "6.67.0" }, "data": { "posts": [] } } ] }
```

A file shaped `{"db":[{"data":…}]}` is unwrapped to `{data}` and rejected with
`Wrong importer structure. `meta` is missing.` Admin's own export always includes
it. On slow hardware, import in batches of about ten posts: larger payloads can
kill the Ghost process (SIGILL on old CPUs, see the override above) partway
through, and the API returns `200` immediately because the import runs as a
background job — watch the container log for `site-content-import completed`
rather than trusting the response.

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
