# ADR 0004 — The featured hero filter is two additive settings, not a tag override

- **Status**: Accepted
- **Date**: 2026-10-14
- **Amended**: 2026-10-17 — the root channel is exempt from the language tag (see the update at the end)
- **Deciders**: sredevopsorg theme maintainers
- **Relates to**: [0003 — The security feed widget is an island](0003-security-feed-widget.md)

## Context

The featured hero at the top of every channel collection was a hard-coded query. The English
hero ran `filter="featured:true+tag:en"`, and the Spanish and Portuguese heroes the same with
`es` / `br` (`partials/featured-hero.hbs`, `-es.hbs`, `-br.hbs`). An editor who wanted the hero
to be curated by a topic tag — say only `news`, or only `docker` — had no control over it, and
could not turn the `featured` flag off to let the newest post on a topic be the hero.

Two requests arrived together: *filter by a custom tag* and/or *filter by a featured post*.
"and/or" is the important word. They are two independent criteria, not two values of one mode:

- a custom tag with `featured` still required,
- a custom tag alone, on the newest matching post,
- `featured` alone within the collection's language,
- neither (the existing state).

## Decision

Add two Ghost custom settings, `featured_tag` (text, default empty) and `featured_only`
(boolean, default on), and build the hero's NQL filter in one place,
`partials/featured-hero-locale.hbs`:

| `featured_only` | `featured_tag` | filter (`/es/`) |
|-----------------|----------------|-----------------|
| on (default) | *(empty)* | `featured:true+tag:es` |
| on | `news` | `featured:true+tag:es+tag:news` |
| off | *(empty)* | `tag:es` |
| off | `news` | `tag:es+tag:news` |

**The custom tag is additive.** It is ANDed onto the collection's language tag, never
substituted for it. The alternative — `featured:true+tag:<custom>` — reads simpler in the
Admin UI, but the language tag is the theme's locale partition
([routes.yaml](../routes.yaml)): dropping it means the Spanish channel can render an English
post as its hero, and the failure is silent. The additive form cannot do that.

**Empty means today.** `featured_tag` empty and `featured_only` on yields exactly the old
literal filter, so an existing site that never opens the settings renders byte-for-byte what
it rendered before. The committed HTML goldens and `tests/featured-filter.test.mjs` pin it.

**Consequence to accept:** there is no "featured across all locales, no tag" mode. Every
channel always carries its language tag. A site that wants that would need a setting to drop
the language tag, which is a different decision (and removes the locale guarantee above).

## Why the filter is assembled in a partial

A `{{#get}}` `filter` must be a literal at the call site, and Handlebars has no variable
assignment or ternary. The inputs (`locale`, `mixedFeed`, `@custom.featured_only`,
`@custom.featured_tag`) are only all in scope at the dispatch partial's own top level, so the
combinations are written out there and handed to the locale hero as a
`featuredFilter` partial argument.

That argument is read at the hero's *own* top level — the `{{#get}}` call — which is the one
scope where Ghost keeps a partial hash argument. Inside `{{#get}}` and `{{#foreach}}` it is
dropped (measured; see [docs/v3-roadmap.md](../v3-roadmap.md), "What a partial argument can
and cannot do"), which is the reason the three locale heroes still exist at all: their label,
date format and reading-time strings are rendered *inside* those blocks.

Consolidating the dispatch also removed the duplicated `{{#match}}` chain that
[ADR 0003](0003-security-feed-widget.md) recorded as the cost of the feed row: both the
feed-on and feed-off layouts now call the same partial.

## Verification

Against a local Ghost 6.70 (theme mounted, `node_modules/.bin/gscan` clean), with the settings
written to `custom_theme_settings` and Ghost restarted. Defaults render the same three heroes
as before the change (`/` and `/en/`: the QEMU/GitHub-runners post; `/es/`: DevOpsDays; `/br/`:
"O que é engenharia de plataforma"). The discriminating observations:

| Settings | `/en/` hero | `/es/` hero | `/br/` hero |
|----------|-------------|-------------|-------------|
| defaults | kiss-goodbye… (featured) | devopsdays… (featured) | o-que-e… (featured) |
| `docker` + featured | kiss-goodbye… (unchanged) | alternativas-a-docker… | *(empty — no featured `docker` post)* |
| `news` + featured | CUPS CVE post (changed) | devopsdays… (unchanged) | *(empty)* |
| no tag, not featured | sudos… (newest `en`) | nos-integramos… (newest `es`) | o-lado-obscuro… |
| `docker`, not featured | kiss-goodbye… | apple-esta-tratando… | python-poderia… |

Each row moves the hero for the reason it should and leaves the others alone; dropping
`featured_only` moves every channel to its newest post, and adding `docker` moves only the
channels that have a `docker` post.

An empty match renders an empty 2/3 column rather than an error, which is already the
documented behaviour of the row when a channel has no featured post
([ADR 0003](0003-security-feed-widget.md)).

## Update (2026-10-17) — the root channel is exempt from the language tag

The "Consequence to accept" above no longer holds for `home.hbs`. `/` is not one of the
locale collections in [routes.yaml](../routes.yaml); it is the intentionally unfiltered,
mixed feed, and the language tag made its hero English-only while the grid below it was
mixed — a featured Spanish post could never be the root hero even when it was the newest
featured post on the publication.

`home.hbs` now passes `mixedFeed=true` to `partials/collection-layout.hbs`, which forwards
it to `partials/featured-row.hbs` and then to `partials/featured-hero-locale.hbs`. That
branch assembles the filter without any `tag:<locale>` clause:

| `featured_only` | `featured_tag` | filter on `/` |
|-----------------|----------------|---------------|
| on (default) | *(empty)* | `featured:true` |
| on | `news` | `featured:true+tag:news` |
| off | *(empty)* | *(no filter — the newest post)* |
| off | `news` | `tag:news` |

The four locale rows in the Decision table are unchanged and still AND the custom tag onto
the language tag. `tests/featured-filter.test.mjs` pins both branches. The committed
`home.html` golden still needs a deliberate re-promote: the local fixture database had
already drifted from the other goldens before this change (all eight fixtures differ), so
re-promoting it here would have mixed unrelated content changes into the diff.

Verified against local Ghost 6.70 with the theme mounted and `custom_theme_settings` edited
in place (theme restarted between settings). With defaults, the `/` hero moved from the
newest featured `en` post (the QEMU post) to the newest featured post overall (DevOpsDays,
`es`), while `/en/`, `/es/` and `/br/` rendered their existing heroes unchanged.
`featured_only=false` on `/` produced the newest post overall; `featured_tag=docker`
narrowed it to `docker` posts; and with `featured_only=true+featured_tag=docker` the locale
channels matched the table above exactly (`/en/` QEMU, `/es/` "Alternativas a Docker
Desktop…", `/br/` empty, as recorded in the original Verification section).
