# Article-audio pipeline (Kokoro TTS → GCS → reader)
#
# Everything is driven from here so the runbook in README.md has one set of commands that
# cannot drift from the manifests. Nothing in this directory is part of the Ghost theme
# package: scripts/ship-manifest.mjs refuses to ship anything outside its allow-list.
#
# Typical lifecycle:
#
#   make test                                   # render + lint + unit tests (no cluster)
#   make gcp-bootstrap                          # bucket, CORS, service account, key
#   make secret ADMIN_KEY=... WEBHOOK_SECRET=... GCS_KEY=./key.json
#   make deploy TAG=<sha> TTS_HOST=tts.sredevops.org GATEWAY_NAME=... GATEWAY_NAMESPACE=...
#   make backfill DRY_RUN=1                     # see what the archive would cost
#   make backfill
#
# Variables may also come from the environment or a local `.env.make` (never committed).

SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c

NAMESPACE ?= tts-audio
RELEASE   ?= tts-audio
IMAGE     ?= ghcr.io/sredevopsorg/sredevopsorg-ghost-theme/tts-audio-runner

TAG            ?=
TTS_HOST       ?=
GATEWAY_NAME   ?=
GATEWAY_NAMESPACE ?=
GATEWAY_SECTION ?= web
TLS_MIDDLEWARE ?=
TLS_SECRET     ?=

KUBECTL ?= kubectl
SUDO    ?= sudo

.PHONY: help
help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── verification ──────────────────────────────────────────────────────────────

.PHONY: test
test: ## Render, validate and unit-test everything offline
	./test.sh

.PHONY: test-worker
test-worker: ## Worker unit tests only (needs Node 24)
	cd worker && npm test

.PHONY: render
render: ## Print the rendered manifests (requires TAG, TTS_HOST, and the gateway values)
	@TAG="$(TAG)" TTS_HOST="$(TTS_HOST)" GATEWAY_NAME="$(GATEWAY_NAME)" \
	 GATEWAY_NAMESPACE="$(GATEWAY_NAMESPACE)" GATEWAY_SECTION="$(GATEWAY_SECTION)" \
	 TLS_MIDDLEWARE="$(TLS_MIDDLEWARE)" TLS_SECRET="$(TLS_SECRET)" \
	 ./render.sh

.PHONY: diff
diff: ## Server-side diff of what `make deploy` would change
	@TAG="$(TAG)" TTS_HOST="$(TTS_HOST)" GATEWAY_NAME="$(GATEWAY_NAME)" \
	 GATEWAY_NAMESPACE="$(GATEWAY_NAMESPACE)" GATEWAY_SECTION="$(GATEWAY_SECTION)" \
	 TLS_MIDDLEWARE="$(TLS_MIDDLEWARE)" TLS_SECRET="$(TLS_SECRET)" \
	 ./render.sh | $(KUBECTL) diff -f - || true

# ── deployment ────────────────────────────────────────────────────────────────

.PHONY: apply
apply: ## Render and apply (used by deploy and backfill; not usually called directly)
	@TAG="$(TAG)" TTS_HOST="$(TTS_HOST)" GATEWAY_NAME="$(GATEWAY_NAME)" \
	 GATEWAY_NAMESPACE="$(GATEWAY_NAMESPACE)" GATEWAY_SECTION="$(GATEWAY_SECTION)" \
	 TLS_MIDDLEWARE="$(TLS_MIDDLEWARE)" TLS_SECRET="$(TLS_SECRET)" \
	 ./render.sh > .rendered.yaml
	$(KUBECTL) apply -f .rendered.yaml
	@rm -f .rendered.yaml

.PHONY: deploy
deploy: apply ## Apply the rendered manifests (TAG is required; see render.sh)

.PHONY: secret
secret: ## Create/refresh the Secret from ADMIN_KEY, WEBHOOK_SECRET, GCS_KEY=<path>
	@: $${ADMIN_KEY:?set ADMIN_KEY to the Ghost Admin API key (id:secret)}
	@: $${WEBHOOK_SECRET:?set WEBHOOK_SECRET to the Ghost webhook secret}
	@: $${GCS_KEY:?set GCS_KEY to the service-account JSON key file}
	@test -f "$$GCS_KEY" || { echo "secret: $$GCS_KEY not found" >&2; exit 2; }
	$(KUBECTL) create namespace $(NAMESPACE) --dry-run=client -o yaml | $(KUBECTL) apply -f -
	@$(KUBECTL) -n $(NAMESPACE) create secret generic tts-audio \
	  --from-literal=admin-api-key="$$ADMIN_KEY" \
	  --from-literal=webhook-secret="$$WEBHOOK_SECRET" \
	  --from-file=gcs-key.json="$$GCS_KEY" \
	  --dry-run=client -o yaml | $(KUBECTL) apply -f -
	@echo "secret: tts-audio created/updated in $(NAMESPACE)"
	@echo "secret: restart the receiver to pick it up:  make restart"

.PHONY: restart
restart: ## Roll the receiver (needed after a Secret change)
	$(KUBECTL) -n $(NAMESPACE) rollout restart deployment/tts-webhook
	$(KUBECTL) -n $(NAMESPACE) rollout status deployment/tts-webhook --timeout=120s

.PHONY: status
status: ## Show what is running and the last Jobs
	@$(KUBECTL) -n $(NAMESPACE) get deploy,svc,pdb -o wide
	@echo
	@$(KUBECTL) -n $(NAMESPACE) get jobs --sort-by=.metadata.creationTimestamp | tail -n 20

.PHONY: logs
logs: ## Tail the receiver logs
	$(KUBECTL) -n $(NAMESPACE) logs -l app.kubernetes.io/component=webhook -f --tail=50 --max-log-requests=5

# ── backfill ──────────────────────────────────────────────────────────────────

.PHONY: backfill
backfill: ## Queue audio for every post missing it (DRY_RUN=1 prints the plan only)
	@$(MAKE) apply TAG="$(TAG)" TTS_HOST="$(TTS_HOST)" GATEWAY_NAME="$(GATEWAY_NAME)" \
	  GATEWAY_NAMESPACE="$(GATEWAY_NAMESPACE)" GATEWAY_SECTION="$(GATEWAY_SECTION)" >/dev/null
	# The apply above also created the backfill Job; recreate it so a previous, finished
	# run does not make `wait` return against stale status.
	$(KUBECTL) -n $(NAMESPACE) delete job tts-backfill --ignore-not-found
	@$(MAKE) apply TAG="$(TAG)" TTS_HOST="$(TTS_HOST)" GATEWAY_NAME="$(GATEWAY_NAME)" \
	  GATEWAY_NAMESPACE="$(GATEWAY_NAMESPACE)" GATEWAY_SECTION="$(GATEWAY_SECTION)" >/dev/null
	@if [ "$(DRY_RUN)" = "1" ]; then \
	  $(KUBECTL) -n $(NAMESPACE) set env job/tts-backfill DRY_RUN=1 >/dev/null; \
	  echo "backfill: dry run — no Jobs will be created"; \
	fi
	$(KUBECTL) -n $(NAMESPACE) wait --for=condition=complete --timeout=30m job/tts-backfill \
	  || { $(KUBECTL) -n $(NAMESPACE) logs job/tts-backfill --tail=200; exit 1; }
	@$(KUBECTL) -n $(NAMESPACE) logs job/tts-backfill --tail=50

.PHONY: backfill-plan
backfill-plan: ## Same as backfill, planning only: how many posts would be queued
	$(MAKE) backfill DRY_RUN=1

# ── local synthesis (listen before deploying) ─────────────────────────────────

.PHONY: dev-synth
dev-synth: ## Build the image and speak TEXT=... in LOCALE=en|es|br to OUT (default sample.mp3)
	@: $${TEXT:?set TEXT to the sentence(s) to speak}
	@mkdir -p .dev-out
	docker build -t tts-audio-runner:dev worker
	docker run --rm -e TEXT="$$TEXT" -e LOCALE="$${LOCALE:-es}" -e OUT="$$(basename "$${OUT:-sample.mp3}")" \
	  -v "$(CURDIR)/.dev-out:/out" -w /app tts-audio-runner:dev node scripts/speak.mjs
	@echo "dev-synth: wrote .dev-out/$$(basename "$${OUT:-sample.mp3}")"

# ── GCP bootstrap ─────────────────────────────────────────────────────────────

GCP_PROJECT  ?= sredevopsorg
GCS_BUCKET   ?= tts-sredevopsorg
GCP_LOCATION ?= us-central1
GSA_NAME     ?= tts-audio-runner
SITE_ORIGINS ?= https://www.sredevops.org,https://sredevops.org,http://localhost:2368

.PHONY: gcp-bootstrap
gcp-bootstrap: ## Create the bucket, CORS and the bucket-scoped service account (idempotent)
	@command -v gcloud >/dev/null || { echo "gcp-bootstrap: gcloud is required" >&2; exit 2; }
	@gcloud storage buckets describe "gs://$(GCS_BUCKET)" >/dev/null 2>&1 \
	  || gcloud storage buckets create "gs://$(GCS_BUCKET)" \
	       --project="$(GCP_PROJECT)" --location="$(GCP_LOCATION)" \
	       --uniform-bucket-level-access --public-access-prevention
	@echo "==> grant public read (no list): allUsers → objectViewer"
	@GCS_BUCKET="$(GCS_BUCKET)" SITE_ORIGINS="$(SITE_ORIGINS)" ./scripts/cors.sh
	@echo "==> lifecycle rule: audio/ objects expire after 90 days"
	@gcloud storage buckets update "gs://$(GCS_BUCKET)" --lifecycle-file=config/lifecycle.json
	@echo "==> service account $(GSA_NAME) with objectAdmin on the bucket only"
	@gcloud iam service-accounts describe "$(GSA_NAME)@$(GCP_PROJECT).iam.gserviceaccount.com" >/dev/null 2>&1 \
	  || gcloud iam service-accounts create "$(GSA_NAME)" --project="$(GCP_PROJECT)" \
	       --display-name="sredevops.org article audio runner"
	@gcloud storage buckets add-iam-policy-binding "gs://$(GCS_BUCKET)" \
	  --member="serviceAccount:$(GSA_NAME)@$(GCP_PROJECT).iam.gserviceaccount.com" \
	  --role=roles/storage.objectAdmin >/dev/null
	@echo "bootstrap: done. Create a key with:"
	@echo "  gcloud iam service-accounts keys create key.json \\"
	@echo "    --iam-account=$(GSA_NAME)@$(GCP_PROJECT).iam.gserviceaccount.com"

.PHONY: gcp-key
gcp-key: ## Write ./key.json for the runner service account (never commit it)
	@test ! -f key.json || { echo "gcp-key: key.json already exists; refusing to overwrite" >&2; exit 2; }
	gcloud iam service-accounts keys create key.json \
	  --iam-account="$(GSA_NAME)@$(GCP_PROJECT).iam.gserviceaccount.com"
	@echo "gcp-key: wrote ./key.json — pass it to 'make secret GCS_KEY=./key.json' and then delete it"

.PHONY: cf-verify
cf-verify: ## Check the audio host serves MP3 with range support through Cloudflare
	@AUDIO_HOST=$${AUDIO_HOST:-audio.sredevops.org} ./scripts/cf-verify.sh

# ── teardown ──────────────────────────────────────────────────────────────────

.PHONY: teardown
teardown: ## Delete the pipeline from the cluster (keeps the bucket and its audio)
	@$(KUBECTL) -n $(NAMESPACE) delete job -l app.kubernetes.io/component=worker --ignore-not-found
	$(KUBECTL) delete namespace $(NAMESPACE) --ignore-not-found
	@echo "teardown: the bucket and its objects were left alone."
