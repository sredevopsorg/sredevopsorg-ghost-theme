#!/usr/bin/env bash
# Offline gate for the article-audio pipeline. No cluster, no GCP, no network.
#
# What it proves, in order of how early it fails:
#
#   1. every shell script parses and passes shellcheck when available
#   2. the base renders with kustomize, and the overlay **refuses** to render without the
#      per-cluster values (`TAG`, `TTS_HOST`, the Gateway) — the failure mode that would
#      otherwise apply a route pointing at a Gateway called `${GATEWAY_NAME}`
#   3. the overlay renders to a valid API manifest with test values, and the Job template
#      inside the ConfigMap is valid JSON with only the placeholders the receiver fills
#   4. the worker unit tests pass
#
# The Kokoro smoke test is not here: it needs the built image and runs in CI
# (`.github/workflows/tts-audio-ci.yaml`, job `worker`).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

failures=0
fail() {
  red "FAIL: $*"
  failures=$((failures + 1))
}

step "shell scripts"
for script in render.sh scripts/*.sh test.sh; do
  [ -f "$script" ] || continue
  bash -n "$script" || fail "$script does not parse"
  if command -v shellcheck >/dev/null 2>&1; then
    # SC1091: the scripts do not source anything this checker can follow.
    shellcheck --severity=warning --exclude=SC1091 "$script" || fail "$script has shellcheck warnings"
  fi
done
green "shell scripts ok"

step "kustomize base"
if ! command -v kubectl >/dev/null 2>&1; then
  fail "kubectl (for kustomize) is required"
else
  kubectl kustomize base > /tmp/tts-audio-base.yaml || fail "base does not render"
  grep -q "kind: Namespace" /tmp/tts-audio-base.yaml || fail "base has no Namespace"
  grep -q "name: tts-webhook" /tmp/tts-audio-base.yaml || fail "base has no webhook deployment"
  grep -q 'kind: Deployment' /tmp/tts-audio-base.yaml || fail "base has no Deployment"
  green "base ok"
fi

step "render refuses without the cluster values"
if ./render.sh >/dev/null 2>&1; then
  fail "render.sh rendered with no TAG/TTS_HOST/gateway values"
else
  green "render fails without values, as intended"
fi

step "overlay renders and is coherent"
export TAG=test-tag TTS_HOST=tts.example.org GATEWAY_NAME=gw GATEWAY_NAMESPACE=gw-ns GATEWAY_SECTION=web
export NODE_POOL=dsh NODE_POOL_LABEL=dsh.sredevops.org/node-pool
rendered="$(./render.sh)" || fail "overlay does not render with test values"

if printf '%s' "$rendered" | grep -q '\${TAG}'; then fail "TAG was not substituted"; fi
if printf '%s' "$rendered" | grep -q '\${TTS_HOST}'; then fail "TTS_HOST was not substituted"; fi
if ! printf '%s' "$rendered" | grep -q 'tts-audio-runner:test-tag'; then
  fail "the image tag is not the TAG passed in"
fi

# Every manifest in the output must be applyable by the client-side validator. `--dry-run`
# against `-f -` still contacts the server for discovery, so validate the YAML shape here
# instead: one document per `kind:` and a matching apiVersion, which catches a merged file.
docs="$(printf '%s' "$rendered" | grep -c '^apiVersion:')"
kinds="$(printf '%s' "$rendered" | grep -c '^kind:')"
[ "$docs" -eq "$kinds" ] || fail "every apiVersion needs exactly one kind (${docs} vs ${kinds})"
for kind in Namespace ServiceAccount Role RoleBinding ConfigMap Deployment Service HTTPRoute NetworkPolicy PodDisruptionBudget HorizontalPodAutoscaler Gateway; do
  printf '%s' "$rendered" | grep -q "^kind: ${kind}$" || fail "rendered output is missing a ${kind}"
done

step "no egress policy is declared"
# Re-adding one is a deliberate act, not an accident. On this cluster any egress policy
# selecting these pods takes the whole ClusterIP path down (measured: the API server
# refuses with ECONNREFUSED even when the rule is `port: 443` with no `to:`), which is what
# stopped the backfill from creating a single Job. See base/netpol.yaml for the evidence.
if printf '%s' "$rendered" | grep -q 'policyTypes:.*Egress\|- Egress'; then
  fail "an Egress NetworkPolicy is declared; read base/netpol.yaml before re-adding one"
else
  green "no egress policy (ingress-only, as documented)"
fi
# The two ingress policies must still be there: removing them would expose the receiver.
printf '%s' "$rendered" | grep -q 'name: default-deny-ingress' || fail "default-deny-ingress is missing"
printf '%s' "$rendered" | grep -q 'name: allow-webhook-ingress' || fail "allow-webhook-ingress is missing"

step "node-pool placement"
# Both workloads run where the dataplane behaviour is known, and the selector is a value.
pool_webhook="$(printf '%s' "$rendered" | awk '/^kind: Deployment$/{d=1} d && /node-pool:/{print $2; exit}')"
[ "$pool_webhook" = "dsh" ] || fail "the Deployment nodeSelector is '${pool_webhook}', expected the NODE_POOL value (dsh)"
# The backfill Job is rendered only under WITH_BACKFILL=1, so it is checked there, below.
printf '%s' "$rendered" | grep -q 'dsh.sredevops.org/node-pool: dsh' \
  || fail "the Deployment does not carry the node-pool selector"
# The job template the receiver stamps must NOT have the pool baked in: the receiver sets
# it per Job from its own environment, so a template placeholder would pin every future
# Job to whatever pool was current when `make deploy` ran. Asserted in the "job template"
# step below, where the template has actually been extracted.
# An unset NODE_POOL must be refused rather than rendering `node-pool: ""` (no node matches).
if (unset NODE_POOL; ./render.sh >/dev/null 2>&1); then
  fail "render.sh rendered without NODE_POOL, which would pin pods to no node at all"
else
  green "render refuses without NODE_POOL"
fi
green "node-pool placement ok"

step "the backfill is a separate, opt-in step"
# `kubectl apply` is create-or-update: while the backfill Job was a kustomize resource, every
# `make deploy` recreated it, so shipping an unrelated ConfigMap change started a full
# archive backfill. That flooded the cluster with 221 Jobs, twice. The Job is now rendered
# only when WITH_BACKFILL=1, which only `make backfill` sets.
if printf '%s' "$rendered" | grep -q '^kind: Job$'; then
  fail "the default render contains a Job — make deploy must never start a backfill"
else
  green "deploy renders no Job"
fi
backfill_rendered="$(WITH_BACKFILL=1 ./render.sh)" || fail "overlay does not render with WITH_BACKFILL=1"
if printf '%s' "$backfill_rendered" | grep -q 'name: tts-backfill'; then
  green "backfill renders the Job when asked"
else
  fail "WITH_BACKFILL=1 did not render the tts-backfill Job"
fi
# It must carry the same placement as the Deployment, or it lands on the wrong node.
printf '%s' "$backfill_rendered" | awk '/name: tts-backfill/{f=1} f && /node-pool:/{print; exit}' \
  | grep -q 'dsh' || fail "the backfill Job does not carry the node-pool selector"
# And its image env must be a real reference, not the \${IMAGE} placeholder (InvalidImageName).
printf '%s' "$backfill_rendered" | grep -A1 'name: WORKER_IMAGE' | grep -q 'tts-audio-runner:test-tag' \
  || fail "the backfill Job's WORKER_IMAGE is not the full image:tag reference"
# The Job's own container image must be pinned too. Because this document is rendered
# outside the kustomization, `images.newTag` never reaches it: left as `:latest` the first
# real run died with ErrImagePull, since no such tag is published.
printf '%s' "$backfill_rendered" | grep -q "image: .*tts-audio-runner:test-tag" \
  || fail "the backfill container image is not pinned to TAG (would pull :latest)"
if printf '%s' "$backfill_rendered" | grep -q "tts-audio-runner:latest"; then
  fail "the backfill container image is :latest — kustomize images.newTag does not reach this file"
fi
# DRY_RUN must be settable at render time. `kubectl set env job/...` patches the pod
# template, which is immutable, so the dry run failed instead of printing the plan.
printf '%s' "$backfill_rendered" | grep -A1 'name: DRY_RUN' | grep -q 'value: "0"' \
  || fail "DRY_RUN does not default to 0"
dry_rendered="$(WITH_BACKFILL=1 DRY_RUN=1 ./render.sh)" || fail "overlay does not render with DRY_RUN=1"
printf '%s' "$dry_rendered" | grep -A1 'name: DRY_RUN' | grep -q 'value: "1"' \
  || fail "DRY_RUN=1 does not reach the backfill Job"

step "gateway"
# Rendered outside the kustomization precisely so `namespace: tts-audio` cannot rewrite it;
# a Gateway in the wrong namespace is the failure that produced Cloudflare 1016.
gw_ns="$(printf '%s' "$rendered" | awk '/^kind: Gateway$/{seen=1} seen && /^  namespace:/{print $2; exit}')"
if [ "$gw_ns" != "gw-ns" ]; then
  fail "Gateway namespace is '${gw_ns}', expected the GATEWAY_NAMESPACE value (gw-ns)"
fi
printf '%s' "$rendered" | grep -q 'name: gw$' || fail "Gateway is not named after GATEWAY_NAME (gw)"
# The listener port is Traefik's websecure container port, not the Service's 443.
printf '%s' "$rendered" | grep -q 'port: 8443' || fail "Gateway listener is not on 8443 (Traefik websecure container port)"
# allowedRoutes must not be the cluster's default `Same`: the route lives in tts-audio.
printf '%s' "$rendered" | grep -q 'from: All' || fail "Gateway allowedRoutes must be All, or the route stays unattached"
printf '%s' "$rendered" | grep -q "hostname: tts.example.org" || fail "Gateway hostname is not TTS_HOST"
# The certificateRef must name a secret. An empty `name:` renders without error and
# produces a Gateway that references no certificate, which is silent until the hostname
# 404s — the same class of failure as the missing Gateway this file exists to prevent.
if printf '%s' "$rendered" | grep -qE '^\s+name:\s*$'; then
  fail "a rendered field has an empty value (an unset TLS_SECRET renders 'name: ' — see the export in render.sh)"
fi
printf '%s' "$rendered" | grep -q 'name: tts-audio-tls' \
  || fail "the Gateway certificateRef does not name the default TLS_SECRET (tts-audio-tls)"
green "gateway ok"

step "job template"
# The template is a JSON document inside a ConfigMap block scalar. Extracted with node so
# the four-space indentation kustomize emits is handled once, in one place.
template="$(printf '%s' "$rendered" | node -e '
  const fs = require("fs");
  const text = fs.readFileSync(0, "utf8");
  const doc = text.split(/^---$/m).find((d) => d.includes("job-template.json"));
  if (!doc) process.exit(1);
  const lines = doc.split("\n");
  const at = lines.findIndex((line) => /^\s*job-template\.json:\s*\|\s*$/.test(line));
  if (at < 0) process.exit(1);
  const indent = (/^(\s*)/.exec(lines[at + 1]) || ["", ""])[1];
  const body = [];
  for (const line of lines.slice(at + 1)) {
    if (line.trim() === "") { body.push(""); continue; }
    if (!line.startsWith(indent)) break;
    body.push(line.slice(indent.length));
  }
  process.stdout.write(body.join("\n"));
')" || fail "job template block not found"

if [ -z "$template" ]; then
  fail "job-template.json is missing from the ConfigMap"
elif ! printf '%s' "$template" | node -e 'JSON.parse(require("fs").readFileSync(0, "utf8"))' 2>/dev/null; then
  fail "job-template.json is not valid JSON"
else
  # Only the placeholders the receiver fills may survive the render.
  stray="$(printf '%s' "$template" | grep -oE '\$\{[A-Z_]+\}' | sort -u | grep -vE '^\$\{(POST_ID|IMAGE|POD_NAMESPACE)\}$' || true)"
  [ -z "$stray" ] || fail "job template has unexpected placeholders: ${stray}"
  # `${IMAGE}` must reach the receiver intact. It is the one placeholder a render-level
  # substitution would blank out silently, leaving every queued Job with no image.
  printf '%s' "$template" | grep -q '"image": "\${IMAGE}"' \
    || fail "job template lost its \${IMAGE} placeholder — envsubst must not substitute it"
  # The workloads, by contrast, must carry the rendered tag, not the placeholder.
  [ "$(printf '%s' "$rendered" | grep -c 'tts-audio-runner:test-tag')" -ge 2 ] \
    || fail "the Deployment and the Job do not both run the rendered image tag"
  # WORKER_IMAGE is what the receiver stamps into every Job's `image`. It must be a real
  # reference, not the literal `${IMAGE}`: that placeholder is deliberately skipped by
  # envsubst, so the string reached the cluster verbatim and every Job the receiver created
  # failed with InvalidImageName. Observed in production — 66 Jobs with `image: ${IMAGE}`.
  worker_images="$(printf '%s' "$rendered" | grep -A1 'name: WORKER_IMAGE' | grep 'value:' || true)"
  if printf '%s' "$worker_images" | grep -q '\${IMAGE}'; then
    fail "WORKER_IMAGE is the literal \${IMAGE} placeholder — Jobs would fail with InvalidImageName"
  fi
  printf '%s' "$worker_images" | grep -q 'tts-audio-runner:test-tag' \
    || fail "WORKER_IMAGE is not the full image:tag reference (got: ${worker_images:-none})"
  printf '%s' "$template" | grep -q '"ttlSecondsAfterFinished"' || fail "job template has no TTL"
  printf '%s' "$template" | grep -q '"readOnlyRootFilesystem": true' || fail "job template is not read-only"
  printf '%s' "$template" | grep -q '"runAsNonRoot": true' || fail "job template allows root"
  # The pool is set by the receiver from its own env, never baked into the template — a
  # placeholder here would pin every future Job to whatever pool was current at deploy
  # time. The selector block must still be present so the field is visible and fillable.
  printf '%s' "$template" | grep -q '"nodeSelector"' || fail "job template has no nodeSelector for the receiver to fill"
  if printf '%s' "$template" | grep -q 'NODE_POOL'; then
    fail "job template mentions NODE_POOL — the receiver fills this, not render.sh"
  fi
  # Sizing. The CPU request is 0 on purpose: the node has 2 allocatable cores and a
  # 2-core request meant a 221-Job backfill queued every Job Pending and none ever ran. 0
  # lets the scheduler admit them; MAX_CONCURRENT_JOBS is what keeps only one running.
  # Memory is bounded, and the limits stay high so a Job can still use the node when free.
  node -e '
    const t = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const r = t.spec.template.spec.containers[0].resources;
    const bad = [];
    if (r.requests?.cpu !== "0") bad.push(`requests.cpu=${r.requests?.cpu} (want 0)`);
    if (r.requests?.memory !== "256Mi") bad.push(`requests.memory=${r.requests?.memory} (want 256Mi)`);
    if (!r.limits?.cpu) bad.push("no cpu limit");
    if (bad.length) { console.log(bad.join("; ")); process.exit(1); }
  ' <<< "$template" || fail "job template sizing is not requests{cpu:0, memory:256Mi} with a cpu limit"
  # The queue is what makes a 0-CPU request safe, so the switch must exist and default to 1.
  printf '%s' "$rendered" | grep -q 'MAX_CONCURRENT_JOBS: "1"' \
    || fail "MAX_CONCURRENT_JOBS is not 1 — with a 0 CPU request that lets Jobs contend instead of queuing"
  green "job template ok"
fi

step "prune helper refuses to act without CONFIRM"
# `prune-stale.sh` deletes objects, so the default has to be a dry run. Checked by
# rendering to an empty set and asserting it only reports.
if [ -x scripts/prune-stale.sh ]; then
  out="$(./scripts/prune-stale.sh /tmp/tts-audio-base.yaml gw-ns gw-ns 2>&1 || true)"
  if printf '%s' "$out" | grep -qi "deleting\|deleted"; then
    fail "prune-stale.sh acted without --confirm"
  fi
  green "prune helper is dry by default"
fi

step "no secrets in the tree"
if [ -f base/secret.example.yaml ] && grep -q 'REPLACE_ME' base/secret.example.yaml; then
  green "secret.example.yaml holds placeholders only"
else
  fail "base/secret.example.yaml is missing or contains values"
fi
if git check-ignore -q key.json; then
  green "key.json is git-ignored"
else
  fail "key.json is not git-ignored — a real key could be committed"
fi

step "worker unit tests"
# The job and audio suites encode real audio through ffmpeg rather than mocking it —
# that is the point of testing the concat/silence path — so a missing binary would fail
# with a bare `spawn ffmpeg ENOENT` deep inside a test. Say so here instead.
missing_bins=""
for bin in node ffmpeg ffprobe; do
  command -v "$bin" >/dev/null 2>&1 || missing_bins="$missing_bins $bin"
done
if [ -n "$missing_bins" ]; then
  fail "missing required binary/binaries:${missing_bins} (install ffmpeg; node 24 for the tests)"
fi

if command -v node >/dev/null 2>&1; then
  (cd worker && node --test test/*.test.mjs) || fail "worker unit tests failed"
else
  fail "Node 24 is required for the worker tests"
fi

if [ "$failures" -ne 0 ]; then
  red "\n${failures} check(s) failed"
  exit 1
fi
green "\nall checks passed"
