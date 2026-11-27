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

required=(TAG TTS_HOST)
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
VARS='${TAG} ${TTS_HOST} ${GATEWAY_NAME} ${GATEWAY_NAMESPACE} ${GATEWAY_SECTION} ${TLS_MIDDLEWARE} ${TLS_SECRET}'

rendered="$(kubectl kustomize "$HERE/$OVERLAY" | envsubst "$VARS")"

# Placeholders that are supposed to survive: the Job template inside the ConfigMap is
# filled by the receiver when it creates a Job, not when this script runs.
SURVIVORS='POST_ID|IMAGE|POD_NAMESPACE'

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
