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
for kind in Namespace ServiceAccount Role RoleBinding ConfigMap Deployment Service Job HTTPRoute NetworkPolicy PodDisruptionBudget HorizontalPodAutoscaler Gateway; do
  printf '%s' "$rendered" | grep -q "^kind: ${kind}$" || fail "rendered output is missing a ${kind}"
done

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
  printf '%s' "$template" | grep -q '"ttlSecondsAfterFinished"' || fail "job template has no TTL"
  printf '%s' "$template" | grep -q '"readOnlyRootFilesystem": true' || fail "job template is not read-only"
  printf '%s' "$template" | grep -q '"runAsNonRoot": true' || fail "job template allows root"
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
