#!/usr/bin/env bash
# Render the overlay with the environment substituted, refusing to emit a manifest that
# still has placeholders.
#
# Why this is a script and not `kubectl apply -k`: kustomize does not expand environment
# variables, so `images.newTag: ${TAG}` and the HTTPRoute's `parentRefs` would reach the
# API server literally — the image would be named `${TAG}` and the route would point at a
# Gateway called `${GATEWAY_NAME}`. Rendering here, then applying the rendered file, also
# makes `kubectl diff -f <file>` possible, which `apply -k` cannot do.
#
# Usage:
#   render.sh            # print to stdout, fail on any leftover placeholder or missing value
#   render.sh > out.yaml
#
# Required: TAG TTS_HOST
#   Gateway API: GATEWAY_NAME GATEWAY_NAMESPACE [GATEWAY_SECTION]
#   Traefik:     TLS_MIDDLEWARE TLS_SECRET
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OVERLAY="${OVERLAY:-overlay}"

# Defaults that match the Makefile. They are repeated here rather than only there because
# these three are used whenever the Gateway is rendered, and an unset TLS_SECRET produces
# `name: ` in the certificateRef — a Gateway that silently references no certificate, which
# is exactly the failure that made the hostname unreachable before.
#
# `export` is load-bearing: `envsubst` reads only the *environment*, so a plain shell
# variable assigned here would be invisible to it and the placeholder would render empty.
: "${TLS_SECRET:=tts-audio-tls}"
: "${NODE_POOL_LABEL:=dsh.sredevops.org/node-pool}"
: "${GATEWAY_SECTION:=web}"
: "${IMAGE:=ghcr.io/sredevopsorg/sredevopsorg-ghost-theme/tts-audio-runner}"
export TLS_SECRET NODE_POOL_LABEL GATEWAY_SECTION

required=(TAG TTS_HOST NODE_POOL)
if grep -q "route.yaml" "$HERE/$OVERLAY/kustomization.yaml"; then
  required+=(GATEWAY_NAME GATEWAY_NAMESPACE)
fi

missing=()
for name in "${required[@]}"; do
  if [ -z "${!name:-}" ]; then missing+=("$name"); fi
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "render: missing required value(s): ${missing[*]}" >&2
  echo "render: see deploy/tts-audio/README.md §Deploy" >&2
  exit 2
fi

# The image a created Job runs, as a fully qualified reference. It used to be written as
# `value: "${IMAGE}"` in webhook.yaml/backfill.yaml, but `${IMAGE}` is one of the
# placeholders envsubst is told *not* to touch (it belongs to the Job template inside the
# ConfigMap), so the literal string `${IMAGE}` reached the cluster as WORKER_IMAGE. The
# receiver then stamped Jobs with `image: ${IMAGE}`, every one of which failed with
# InvalidImageName. Resolved here instead, from the same two values kustomize uses.
WORKER_IMAGE="${IMAGE}:${TAG}"
export WORKER_IMAGE

if ! command -v envsubst >/dev/null 2>&1; then
  echo "render: envsubst is required (Debian: gettext-base; macOS: brew install gettext)" >&2
  exit 2
fi

# Only the variables this stack knows are substituted, so a `${...}` that belongs to a
# future feature is left visible instead of being blanked out silently.
# `${IMAGE}`, `${POST_ID}` and `${POD_NAMESPACE}` are deliberately absent: they belong to
# the Job template inside the ConfigMap and are filled by the receiver when it creates a
# Job. Adding IMAGE here would blank the template's image field at render time, and the
# receiver would queue Jobs with no image.
#
# `NODE_POOL` is in VARS for the Deployment patch in overlay/node-pool-webhook.yaml. The
# ConfigMap's job template carries no placeholder for it: the receiver sets the selector
# itself from the NODE_POOL env var (worker/src/k8s.mjs), so nothing about this cluster's
# pool is baked into a template every future Job is stamped from.
#
# That template is guarded below, not left to convention: a `${NODE_POOL}` there would be
# substituted here and silently pin every Job to the deploying cluster's pool.
VARS='${TAG} ${TTS_HOST} ${GATEWAY_NAME} ${GATEWAY_NAMESPACE} ${GATEWAY_SECTION} ${TLS_MIDDLEWARE} ${TLS_SECRET} ${NODE_POOL} ${NODE_POOL_LABEL} ${WORKER_IMAGE}'

# Scoped to the ConfigMap document: the Deployment legitimately carries `${NODE_POOL_LABEL}`
# in its env, and a whole-stream grep would flag that instead of the template.
template_pool="$(kubectl kustomize "$HERE/$OVERLAY" \
  | awk 'BEGIN { RS = "\n---\n" } /kind: ConfigMap/ && /job-template\.json:/ { print; exit }' \
  | grep -oE '\$\{(NODE_POOL|NODE_POOL_LABEL)\}' | sort -u || true)"
if [ -n "$template_pool" ]; then
  echo "render: the job template must not reference ${template_pool}" >&2
  echo "render: the receiver fills the node selector from its own environment (worker/src/k8s.mjs)" >&2
  exit 2
fi

rendered="$(kubectl kustomize "$HERE/$OVERLAY" | envsubst "$VARS")"

# The backfill Job is opt-in, mirroring WITH_GATEWAY. It is NOT a kustomize resource (see
# base/kustomization.yaml): `kubectl apply` would recreate it on every deploy, so deploying
# an unrelated ConfigMap change silently started a full archive backfill — a 221-Job flood,
# twice. Only `make backfill` sets WITH_BACKFILL=1.
if [ "${WITH_BACKFILL:-0}" = "1" ] && [ -f "$HERE/base/backfill.yaml" ]; then
  rendered="${rendered}
---
$(envsubst "$VARS" < "$HERE/base/backfill.yaml")"
fi

# The Gateway is rendered on its own so it keeps its own namespace. It is optional: a
# cluster that already publishes the receiver through an existing Gateway (or through a
# Traefik IngressRoute) does not need one, and `GATEWAY_NAME` there names that Gateway.
if [ "${WITH_GATEWAY:-1}" = "1" ] && [ -f "$HERE/$OVERLAY/gateway.yaml" ]; then
  rendered="${rendered}
---
$(envsubst "$VARS" < "$HERE/$OVERLAY/gateway.yaml")"
fi

# Placeholders that are supposed to survive: the Job template inside the ConfigMap is
# filled by the receiver when it creates a Job, not when this script runs.
SURVIVORS='POST_ID|IMAGE|POD_NAMESPACE|NODE_POOL'

# Anything else left unexpanded means a value was not supplied. envsubst above only
# substitutes the listed variables, so this catches a route whose Gateway or host is still
# a placeholder instead of applying it and discovering the problem at runtime.
leftover="$(printf '%s\n' "$rendered" | grep -oE '\$\{[A-Z_]+\}' | sort -u | grep -vE "^\\$\{($SURVIVORS)\\}$" || true)"
if [ -n "$leftover" ]; then
  echo "render: unsubstituted placeholders remain:" >&2
  printf '%s\n' "$leftover" >&2
  exit 2
fi

printf '%s\n' "$rendered"
