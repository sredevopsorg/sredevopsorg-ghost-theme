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
cp .env.example .env   # set THEME_PATH, GHOST_DATA_PATH and the database passwords
yarn ghost:up          # Ghost 6 on http://localhost:2368 + MySQL 8.4
```

The compose stack does **not** include Mailpit or any other mail service. If you need
Ghost's transactional email (staff sign-in verification, import notices), configure the
optional `mail__*` settings in `.env` or use an external SMTP server.

On a **fresh volume** the database has to be initialised once before Ghost will
start — otherwise it logs `Database state requires initialisation` and exits:

```bash
docker compose -f docker-compose.dev.yml run --rm --entrypoint sh ghost \
  -c 'cd /var/lib/ghost/current && ./node_modules/.bin/knex-migrator init'
```

**CPUs without SSE4.2/AVX cannot run Ghost as-is**: its bundled `sharp` dies with
SIGILL (exit 132) before Ghost finishes booting. On such a machine also load
`docker-compose.legacy-cpu.yml`, which hides sharp (so image resizing is unavailable —
fine for HTML fixtures) and runs node with `--no-opt`:

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.legacy-cpu.yml up -d
```

Then, in Ghost Admin (`http://localhost:2368/ghost/`):

1. Create the owner account.
2. **Settings → Design** → activate `sredevopsorg-ghost-theme`.
3. **Settings → Advanced → Routing** → upload `routes.yaml`. Routing is stored in the
   database, which is why it is not part of a theme upload and not deployed by CI.
4. Create content: a few posts tagged `en`, `es` and `br` (no `hash-*` tags are needed),
   at least one page, one author, and enough posts to fill two pages. Assign
   `custom-es` or `custom-br` in a locale post's Template setting when you need that
   post to declare `lang="es"` or `lang="pt"`.

Edit `contexts.txt` so the paths point at that content. Anything still pointing at a
non-existent slug fails during capture rather than silently producing an empty fixture.

### Restoring a Ghost export

Ghost's importer needs `meta` **inside** `db[0]`:

```json
{ "db": [ { "meta": { "exported_on": 0, "version": "6.67.0" }, "data": { "posts": [] } } ] }
```

A file shaped `{"db":[{"data":…}]}` is unwrapped to `{data}` and rejected with
`Wrong importer structure. meta is missing.` Admin's own export always includes
it. On slow hardware, import in batches of about ten posts: larger payloads can
kill the Ghost process (SIGILL on old CPUs, see the override above) partway
through, and the API returns `200` immediately because the import runs as a
background job — watch the container log for `site-content-import completed`
rather than trusting the response.

## Capture and compare

```bash
yarn fixtures:capture     # capture into raw/ (needs Ghost running)
yarn fixtures:normalize   # -> current/
yarn fixtures:diff        # compare current/ with golden/; exits 1 on any difference
```

When a difference is intended (a real template or build change), review it and
re-baseline:

```bash
yarn fixtures:promote     # current/ -> golden/    then: git diff tests/fixtures/golden
```

## What is normalised

The normalisers are deliberately explicit. Anything they do not cover is a real
rendering change.

| Normalised | Why |
| --- | --- |
| `>\s+<` → one tag per line | Ghost minifies HTML onto few lines; a line diff would otherwise be noise |
| `/assets/built/*-HASH.js|css` → `*-HASH` | Vite content hashes change on every build |
| Indentation, blank lines and runs of spaces | Formatting is not markup |
| `?v=<hash>` → `?v=HASH` | `{{asset}}` cache-busting query changes on every restart |
| `nonce="…"` → `nonce="NONCE"` | Ghost's code-injection CSP nonces are per-request |
| ISO timestamps → `TIMESTAMP` | injected meta/RSS hints |
| `Ghost x.y.z` → `Ghost VERSION` | generator meta changes on Ghost upgrades |
| Trailing whitespace | formatting only |

Content image filenames are not normalised: the asset-hash rule is anchored to
`assets/built`, so a changed content image is still visible in the diff.

## Using it as a gate

- **CI today:** fixtures need a seeded Ghost, so they are local-only. `yarn verify` is
  the offline gate.
- **Template or build change:** capture, normalise, diff. Explain every remaining
  difference before promoting.
- **Browser checks:** `yarn test:sec-feed-layout` covers the feed panel in Chromium;
  Playwright is not part of the default CI gate.

## Known gap

There is no committed Ghost import file, so the baseline depends on content created
by hand. Adding `tests/fixtures/seed.json` (Ghost Admin → **Export** → import) would
make captures reproducible from scratch. Until then, `contexts.txt` documents the
paths the goldens were captured from.
