# Release checklist

For a human releasing the theme. Everything here is a command you can run, in order.

## 1. Pre-flight, on the branch being released

```bash
git switch v3-dev && git pull
yarn install --frozen-lockfile     # what CI does; fails if the lockfile is stale
yarn verify                        # build + GScan + manifest + tests + bundle + classes
```

`yarn verify` must be green. It fails on GScan **errors**, not only fatal ones — do not
add `--fatal` anywhere (see `docs/v3-roadmap.md`, "The gate was blind to error-level
findings").

## 2. Fixtures, against a running Ghost

```bash
yarn ghost:up                      # first time: see README, the theme must be active
yarn fixtures:capture
yarn fixtures:normalize
yarn fixtures:diff
```

Expect either "All fixtures match", or a diff you can explain line by line. Promote
deliberately — `yarn fixtures:promote` — and never as a way to make a red run green.

## 3. Version and changelog

- `package.json` → `version` (the theme's own version, which Ghost shows).
- `CHANGELOG.md` → an entry for that version. Say what a *user* has to do, not what the
  commits did.
- Commit both, then merge to `v3-dev` and open the `v3-dev → main` pull request.

## 4. Package and validate the archive

```bash
yarn package        # builds dist/<name>-<version>.zip and reads it back with GScan
```

The script runs `ship-manifest --check` first, so a missing `yarn build` cannot be
packaged, and it finishes by having GScan validate **the archive** — the closest thing to
what Ghost does when the zip is uploaded. If that prints "✓ compatible", the archive is
sound.

## 5. Release

1. Merge `v3-dev` into `main`.
2. Tag it: `git tag v3.0.0 && git push origin v3.0.0`.
3. Attach `dist/<name>-<version>.zip` to a GitHub release, with the changelog entry.
4. Upload it in Ghost admin (**Settings → Design → Change theme → Upload**), or to the
   marketplace. The `deploy-theme` workflow does the same thing on demand
   (`workflow_dispatch`): it builds, checks, packages, and hands that archive to the
   deploy action — the same file, not a second packaging path.

## 6. Smoke test the live site

With the new theme active, on a real browser:

- [ ] home, a post, a tag archive, an author archive, and a 404
- [ ] `/es/` and a Spanish post: **`<html lang="es">`**, Spanish dates and reading times
- [ ] light and dark, and the toggle: choose one, navigate away, come back — no flash
- [ ] mobile: the menu opens, closes on Escape and on an outside tap
- [ ] search, the copy button on a code block, and the share buttons
- [ ] with JavaScript disabled: text, links, images and the mobile menu still work

## 7. Rollback

Keep the previous archive. Re-uploading it in Ghost admin restores the old theme in a few
seconds; nothing in this theme touches content, routes or settings.
