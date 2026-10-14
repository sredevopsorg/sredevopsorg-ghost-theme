# ADR 0004 — The featured hero filter is two additive settings, not a tag override

- **Status**: Accepted
- **Date**: 2026-10-14
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
assignment or ternary. The three inputs (`locale`, `@custom.featured_only`,
`@custom.featured_tag`) are only all in scope at the dispatch partial's own top level, so the
four combinations are written out there and handed to the locale hero as a
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
