#!/usr/bin/env bash
# Verify that the audio host actually serves playable MP3 through Cloudflare.
#
# Cloudflare proxies the record in front of the GCS bucket, and the two properties the
# player cannot work without are:
#
#   1. **Range requests.** The browser seeks inside the article; if the proxy strips
#      `Range` or the `206 Partial Content` response, a seek restarts the file from zero.
#   2. **A correct content type and a cacheable response.** `audio/mpeg`, and the
#      `cache-control: public, max-age=31536000, immutable` the job writes.
#
# The first run needs at least one object in the bucket (backfill or a single post).
# Usage: AUDIO_HOST=audio.sredevops.org OBJ=audio/<id>/<hash>.mp3 ./scripts/cf-verify.sh
set -euo pipefail

HOST="${AUDIO_HOST:-audio.sredevops.org}"
OBJ="${OBJ:-}"
URL="https://${HOST}/${OBJ}"

if [ -z "$OBJ" ]; then
  # Discover a sample object through the bucket's XML API only when the host is public;
  # otherwise tell the operator to pass one.
  echo "cf-verify: set OBJ=audio/<post-id>/<hash>.mp3 (any object from the bucket)" >&2
  exit 2
fi

fail=0
check() {
  local label="$1" expected="$2" actual="$3"
  if printf '%s' "$actual" | grep -qi -- "$expected"; then
    echo "  ok   ${label}: ${actual}"
  else
    echo "  FAIL ${label}: expected to match '${expected}', got '${actual}'" >&2
    fail=1
  fi
}

echo "cf-verify: ${URL}"

headers="$(curl -fsSI -H 'Origin: https://www.sredevops.org' "$URL")"
check "content-type" "content-type: *audio/mpeg" "$headers"
check "range support" "accept-ranges: *bytes" "$headers"
check "immutable cache" "cache-control: .*immutable" "$headers"
check "CORS origin" "access-control-allow-origin: *\*\|https://www.sredevops.org" "$headers"
check "CORS exposes ranges" "access-control-expose-headers: .*Content-Range\|Accept-Ranges" "$headers"

status="$(curl -s -o /dev/null -w '%{http_code}' -H 'Range: bytes=0-1023' "$URL")"
if [ "$status" = "206" ]; then
  echo "  ok   partial content: 206"
else
  echo "  FAIL partial content: expected 206, got ${status}" >&2
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  cat >&2 <<'EOF'

cf-verify: the proxy is not forwarding what the player needs.

Options, in order of preference:
  1. Check the Cloudflare DNS record is proxied (orange cloud) and the SSL mode is
     Full (strict); GCS requires a valid certificate for c.storage.googleapis.com.
  2. If Cloudflare is caching with a transform (Rocket Loader, Polish on MP3, an
     "Optimization" that rewrites media), exclude audio.sredevops.org from it.
  3. Fall back to a DNS-only record (grey cloud): the player still works, it simply
     loses the Cloudflare CDN, and AUDIO_BASE_URL in the ConfigMap stays the same.
EOF
  exit 1
fi

echo "cf-verify: OK"
