# Release checklist

For a human releasing the theme. Everything here is a command you can run, in order.

## 1. Pre-flight, on the branch being released

```bash
git switch main && git pull          # or the release branch
yarn install --frozen-lockfile       # what CI does; fails if the lockfile is stale
yarn verify                          # build + GScan + manifest + tests + bundle + classes
```

`yarn verify` must be green. It fails on GScan **errors**, not only fatal ones — do not
add `--fatal` anywhere (see `docs/v3-roadmap.md`, "The gate was blind to error-level
findings").

## 2. Fixtures, against a running Ghost

```bash
yarn ghost:up                      # first time: see tests/fixtures/README.md
yarn fixtures:capture
yarn fixtures:normalize
yarn fixtures:diff
```

The compose stack starts Ghost 6 + MySQL. The theme must be activated and `routes.yaml`
uploaded once in Admin; on a fresh database volume, initialise the database first as
described in `tests/fixtures/README.md`.

Expect either "All fixtures match", or a diff you can explain line by line. Promote
deliberately — `yarn fixtures:promote` — and never as a way to make a red run green.

`diff` refuses to run when `raw/` is newer than `current/`, because skipping `normalize`
used to compare two stale captures and report a false "All fixtures match".

## 3. Version and changelog

- `package.json` → `version` (the theme's own version, which Ghost shows). This release is
  **3.2.1**.
- `CHANGELOG.md` → an entry for that version. Say what a *user* has to do, not what the
  commits did.
- Commit both on the release branch, then merge the release branch into `main`.
- If any asset source or `package.json` changed after the verify step, rerun
  `yarn verify` before packaging so the generated manifest partials and the archive agree.

## 4. Package and validate the archive

```bash
yarn package        # writes dist/<name>-<version>.zip and reads it back with GScan
```

`yarn package` runs `ship-manifest --check` first, so a missing build cannot be packaged,
and it finishes by having GScan validate **the archive** — the closest thing to what Ghost
does when the zip is uploaded. If that prints "✓ compatible", the archive is sound.
Previous archives in `dist/` are deliberately preserved for rollback.

## 5. Release

1. Merge the release branch into `main`.
2. Tag it: `git tag v3.2.1 && git push origin v3.2.1`.
3. Attach `dist/<name>-<version>.zip` to a GitHub release, with the changelog entry.
4. Upload it in Ghost admin (**Settings → Design → Change theme → Upload**), or to the
   marketplace. The `deploy-theme` workflow does the same thing on demand
   (`workflow_dispatch`): it builds, checks, packages, and hands that archive to the
   deploy action — the same file, not a second packaging path.

## 6. Smoke test the live site

With the new theme active, on a real browser:

- [ ] home, a post, a tag archive, an author archive, and a 404
- [ ] **`/` is a mixed feed**: it declares the site language, and each Spanish/Portuguese
      card carries its own `lang`
- [ ] `/es/` and a Spanish post using `custom-es`: `<html lang="es">`, Spanish dates and
      reading times
- [ ] `/br/` declares `<html lang="pt">`; a Portuguese post using `custom-br` also declares
      `lang="pt"` and shows Portuguese date/reading-time strings
- [ ] **dark by default**: clear `localStorage.theme` (or use a private window) on a machine
      whose OS is set to *light* — the site must still be dark. Then toggle to light,
      navigate away and back: light, and no flash.
- [ ] **island chrome follows the page**: on a Spanish post the table-of-contents heading,
      the share and copy labels, the mobile-menu label and the theme-toggle label are all
      Spanish — not just `<html lang>`
- [ ] **a Spanish page**: with Template → `page-es` selected in the page editor,
      `/que-es-sredevops/` reports `<html lang="es">`. Without that selection it stays `en`.
- [ ] light and dark, and the toggle: choose one, navigate away, come back — no flash
- [ ] mobile: the menu opens, closes on Escape and on an outside tap
- [ ] search, the copy button on a code block, and the share buttons
- [ ] the optional security feed (if configured): the CORS requirement is met, the panel
      matches the hero height at `lg+`, and its list scrolls
- [ ] with JavaScript disabled: text, links, images and the mobile menu still work

Known gaps, so they are not re-reported as new: the theme's *interface* strings (search,
sign-in, pagination, the subscribe form) follow the **site** language, and Ghost offers no
per-page alternative — see `docs/v3-roadmap.md`, Phase 6 notes. There is no Portuguese page
custom template yet. The light palette's contrast has still never been measured by a human.

## 7. Rollback

Keep the previous archive. Re-uploading it in Ghost admin restores the old theme in a few
seconds; nothing in this theme touches content, routes or settings.
