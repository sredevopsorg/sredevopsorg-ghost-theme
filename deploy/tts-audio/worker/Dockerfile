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
FROM node:24-bookworm-slim AS deps

WORKDIR /app

# `npm ci` needs the lockfile and nothing else, so a source edit does not reinstall.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ── stage 2: model ─────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS model

# The revision is a commit, not a tag: a tag can be moved, and the sha256 checks below
# would then fail in a build that nobody can reproduce.
#
# The file list and their checksums come from models.lock.json, so adding a voice means
# editing the lock (and running the verify target), not this file. A lock entry still
# saying `REPLACE_ME` fails the build: an unverified model is worse than no image.

WORKDIR /models

COPY models.lock.json ./models.lock.json

RUN set -eux; \
    node -e '
      const lock = require("./models.lock.json");
      const unset = Object.entries(lock.files).filter(([, sha]) => sha === "REPLACE_ME");
      if (unset.length) {
        console.error("models.lock.json is not populated for:", unset.map(([f]) => f).join(", "));
        console.error("run: node scripts/update-models.mjs  (needs the Hugging Face CDN)");
        process.exit(1);
      }
      console.error(`model: ${lock.repo} @ ${lock.revision}, ${Object.keys(lock.files).length} files`);
    '

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
RUN set -eux; \
    cd /models; \
    node -e '
      const { createHash } = require("node:crypto");
      const { readFileSync } = require("node:fs");
      const lock = JSON.parse(readFileSync("models.lock.json", "utf8"));
      let bad = 0;
      for (const [file, expected] of Object.entries(lock.files)) {
        const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
        if (actual !== expected) { console.error(`sha256 mismatch for ${file}: ${actual}`); bad = 1; }
      }
      if (bad) process.exit(1);
      console.error("model: all files verified");
    '

# ── stage 3: runtime ───────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runtime

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

# The node image ships a `node` user (uid 1000); run everything as it. The Job mounts
# no writable volume except an emptyDir at $TMPDIR for the encoder's temp files.
USER node

EXPOSE 8080

# No HEALTHCHECK here: the receiver Deployment declares readiness/liveness probes
# against /healthz, and a Job has no business being probed.
ENTRYPOINT ["node", "src/index.mjs"]
