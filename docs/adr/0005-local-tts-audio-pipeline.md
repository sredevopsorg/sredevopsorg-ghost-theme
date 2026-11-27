# 0005 — Pre-generate article audio with a local model and serve it from GCS

**Status:** accepted — 2026-11-26

## Context

The `TtsPlayer` island synthesised each article in the reader's browser with the Google
Cloud Text-to-Speech REST API and a Chirp 3: HD voice, using an API key embedded in the
post HTML. That worked, and its constraints were measured and documented (5000 bytes per
request, ~610 bytes per sentence, no speaking rate). Three properties were still wrong:

1. **Every listen bills the full article.** At ~6–9k characters per post the free monthly
   million was roughly 120–160 listens *for the whole site*, with no cache. A reload paid
   again.
2. **The key is public.** HTTP-referrer restriction makes a copied key less useful, but it
   does not stop someone who lifts it out of the page.
3. **The audio depends on the reader's network, browser CORS and quota**, and it cannot be
   downloaded without synthesising the rest of the article first.

The README already carried a "future" sketch: synthesise server-side, store in GCS, render
`<audio>`, regenerate on a content hash. This records the decisions taken to build it.

## Decisions

### 1. Kokoro-82M, not a hosted voice

Kokoro-82M is Apache-2.0 (commercial use, no terms to renegotiate), 82M parameters, runs on
CPU, and ships voices for the three locales this publication needs (`af_heart`, `ef_dora`,
`pf_dora`). It removes the per-character price and the key from the page entirely.

**It is called directly, not through `kokoro-js`.** That wrapper is the obvious choice and
it does not work for this publication: its voice table is English-only and it throws on
`ef_dora`/`pf_dora`, and its bundled `phonemizer` carries English language data and
hard-codes `language = "en"`. The model itself is multilingual — same ONNX weights and the
same 115-symbol phoneme vocabulary as the upstream Python package — so the worker does the
three steps itself: `espeak-ng` → IPA → the shipped tokenizer → the ONNX session. Debian's
`espeak-ng` has `es` and `pt-br` data. This was discovered by running the smoke test, not
by reading the model card; it is why the smoke test exists and why it runs every locale.

The trade-off is real: it is not the same voice the site had, and Spanish/Portuguese quality
is judged by ear, not by the model card. That is why `make dev-synth` exists and why the
Cloud TTS path is kept rather than deleted — see decision 5.

### 2. Kubernetes Job per post, not GitHub Actions

The webhook fires from Ghost's server with a payload Ghost constructs. A GitHub Actions run
would need either a public relay to re-trigger it (`repository_dispatch`) or a runner on a
private path, and would add one to three minutes of queue latency to a file the reader is
about to load. A Job in the cluster that already serves Ghost is one API call, starts in
seconds, is retried by Kubernetes, and dies when it is done.

Each post is its own Job (`tts-<post-id>-<hash>`), which gives idempotency for free: the
deterministic name means a duplicated webhook is a `409`, not a second synthesis.

### 3. The stored post is the source of truth; the public `.md` is the cross-check

The job reads the post through the **Ghost Admin API** with `?formats=html,md`. The public
`<url>/.md` needs no key and is what the user-facing docs point at, and the job uses it:
- as the **fallback** when no key is configured (local runs, tests), so the pipeline can be
  exercised without a Ghost Admin key;
- as a **divergence check** on every run, comparing the Markdown frontmatter with the post.

It is not the primary source because it is a *rendered* representation: it can drift from
the stored post, it is unversioned with the theme, and the marker write already requires
Admin access. Where they disagree, the job logs it and proceeds from the stored copy.

### 4. GHCR, not Artifact Registry

The image is built in the same GitHub repository that holds the theme, and the workflow's
own `GITHUB_TOKEN` can push to GHCR. Using Artifact Registry would mean a GCP credential in
a build job that only needs to produce an image, plus a registry pull secret in the
cluster. GHCR keeps the cluster's only GCP credential scoped to the bucket.

Images are tagged with the commit SHA. `:main` exists for humans and is never referenced by
a manifest.

### 5. The marker, and why Cloud TTS is kept

A post advertises its audio with one `<meta name="sredevops:tts">` line in its **code
injection footer**. Alternatives rejected:

- *A data attribute on the mount point* — the job would have to rewrite the post body
  (`source=html`, whole document), which is a much larger blast radius than one column, and
  Ghost's HTML sanitisation sits in the middle.
- *A Handlebars comment* — Ghost parses code injection before rendering, so it is stripped.
- *Deriving it from the content hash alone* — no Admin write, but the theme cannot compute
  the hash, so it would need the same write anyway.

The footer is where `{{ghost_foot}}` renders inside `<body>`, which is the only place a
`<meta>` is valid given the mount point is an empty `<div>`.

The Cloud TTS path is **kept as a fallback** rather than removed. It costs nothing when
unused (no key, no requests), and it covers the gap between publish and the job finishing, a
deleted object, and a marker that names a host the theme does not trust. Removing it would
make a failed pipeline a silent post.

### 6. Cloudflare for DNS only

`audio.sredevops.org` is a proxied CNAME to `c.storage.googleapis.com`. Cloudflare owns the
zone already; the proxy adds a certificate and a cache. Uploads and reads are GCS.
`scripts/cf-verify.sh` checks the one property that can silently break a media player
through a proxy — range requests — and documents the grey-cloud fallback.

### 7. Regenerate on the spoken text, not on the HTML

The content hash covers `voice | speed | text`, where `text` is the normalised sentence
stream after stripping code, tables and navigation. A markup edit that does not change the
words therefore does not re-synthesise; a voice change does. The skip check also `HEAD`s the
object, so an object removed by the lifecycle rule forces regeneration.

## Consequences

- The theme's reader-facing behaviour is unchanged when audio exists, and unchanged when it
  does not (the fallback is the old path).
- The publication now owns a model, an image, a bucket and a Job. `deploy/tts-audio/` is
  outside the shipped theme and outside `yarn verify`; its gate is `make test` and the
  `tts-audio` workflow.
- Throughput is **~8 characters of article per second of CPU** — 82M parameters on CPU is
  not fast. A 10k-character post costs ~20 CPU-minutes, so the Job asks for 4 CPUs and an
  hour. Acceptable for a few posts a day and for a one-off backfill; a GPU removes it
  entirely if it ever matters.
- Judging the voices is a manual step. This is accepted, not automated: an automated quality
  metric for speech is worse than one person listening to a sample per locale.
- The Admin integration holds Administrator rights. It is used only in the `tts-audio`
  namespace, and the scope is recorded in the runbook.
