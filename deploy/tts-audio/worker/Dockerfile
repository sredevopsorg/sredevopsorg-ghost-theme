# ─── tts-audio-runner ──────────────────────────────────────────────────────────
#
# One image, three entrypoints (single-post job, backfill, webhook receiver). The
# receiver shares it because it already speaks the same code paths for marker writes
# and object cleanup, and because a second image would double the build matrix.
#
# The Kokoro model is baked in at build time and verified against models.lock.json.
# Nothing is downloaded at run time: a Job must not depend on the Hugging Face CDN, and
# an air-gapped cluster still works. That is also why the model revision is pinned by
# commit and every artefact is checked by sha256.
#
# `espeak-ng` is not an extra: it is the text-to-IPA step for all three locales. The npm
# `phonemizer` package that ships with the usual Kokoro JS wrapper only carries English
# language data, so Spanish and Portuguese need Debian's full espeak-ng (`pt-br`, `es`)
# — see src/tts.mjs for why the wrapper is not used.
#
# Build context: this directory (deploy/tts-audio/worker).

# ── stage 1: dependencies ──────────────────────────────────────────────────────
FROM node:25-bookworm-slim AS deps

WORKDIR /app

# `npm ci` needs the lockfile and nothing else, so a source edit does not reinstall.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ── stage 2: model ─────────────────────────────────────────────────────────────
FROM node:25-bookworm-slim AS model

# The revision is a commit, not a tag: a tag can be moved, and the sha256 checks below
# would then fail in a build that nobody can reproduce.
#
# The file list and their checksums come from models.lock.json, so adding a voice means
# editing the lock (and running the verify target), not this file. A lock entry still
# saying `REPLACE_ME` fails the build: an unverified model is worse than no image.

# The slim image has no downloader. `ca-certificates` is not optional either: without it
# curl cannot validate the Hugging Face CDN certificate and the fetch fails at TLS.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends curl ca-certificates; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /models

# The check and verify scripts are copied before the model so a lock problem fails in
# seconds, before a ~90 MB download.
COPY models.lock.json ./models.lock.json
COPY scripts/check-model-lock.mjs ./scripts/check-model-lock.mjs
COPY scripts/verify-model-files.mjs ./scripts/verify-model-files.mjs

RUN node scripts/check-model-lock.mjs

# One request per artefact, at the pinned revision. `?download=true` makes the CDN serve
# the bytes rather than an HTML page for a moved file.
RUN set -eux; \
    repo="$(node -p 'require("./models.lock.json").repo')"; \
    revision="$(node -p 'require("./models.lock.json").revision')"; \
    for file in $(node -p 'Object.keys(require("./models.lock.json").files).join(" ")'); do \
      mkdir -p "/models/$(dirname "$file")"; \
      curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors \
        "https://huggingface.co/${repo}/resolve/${revision}/${file}?download=true" \
        -o "/models/${file}"; \
    done

# Verify every file against the lock before it can reach the final image.
RUN node scripts/verify-model-files.mjs

# ── stage 3: runtime ───────────────────────────────────────────────────────────
FROM node:25-bookworm-slim AS runtime

# ffmpeg (libmp3lame) for encoding; espeak-ng for text -> IPA in every locale.
# `--no-install-recommends` and the cache purge keep the image under ~700 MB including
# the model.
# The node image already ships the `node` user (uid 1000), so no groupadd is needed.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ffmpeg espeak-ng ca-certificates; \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    KOKORO_MODEL_DIR=/models \
    KOKORO_DTYPE=q8 \
    PORT=8080

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY test/smoke.mjs ./test/smoke.mjs
COPY scripts/speak.mjs ./scripts/speak.mjs
COPY scripts/update-models.mjs ./scripts/update-models.mjs
COPY --from=model /models /models

# Everything above is copied as root, which makes the app unreadable to the unprivileged
# user this image runs as. `--chown` on each COPY would work too, but one chown here keeps
# the intent obvious and covers the baked model as well.
RUN chown -R node:node /app /models

# The node image ships a `node` user (uid 1000); run everything as it. The Job mounts
# no writable volume except an emptyDir at $TMPDIR for the encoder's temp files.
USER node

EXPOSE 8080

# No HEALTHCHECK here: the receiver Deployment declares readiness/liveness probes
# against /healthz, and a Job has no business being probed.
ENTRYPOINT ["node", "src/index.mjs"]
