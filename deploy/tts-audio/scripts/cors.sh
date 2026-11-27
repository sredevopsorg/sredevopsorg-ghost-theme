#!/usr/bin/env bash
# Apply the bucket's CORS policy.
#
# The reader loads the MP3 from audio.sredevops.org, which resolves (via Cloudflare) to
# the GCS bucket; because the page and the audio are on different origins, the browser
# needs CORS for a plain <audio> element, and `Accept-Ranges`/`Content-Range` must be
# exposed or seeking would fail before the whole file downloads.
#
# Region is not set here: a bucket CORS policy is global.
#
#   ./scripts/cors.sh
#   GCS_BUCKET=other ./scripts/cors.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUCKET="${GCS_BUCKET:-sredevops-audio}"

command -v gcloud >/dev/null || { echo "cors: gcloud is required" >&2; exit 2; }

# `make gcp-bootstrap` passes the origins it read from SITE_ORIGINS; rendering them into a
# temporary file keeps config/cors.json reviewable in git instead of generated.
if [ -n "${SITE_ORIGINS:-}" ]; then
  origins="$SITE_ORIGINS"
else
  origins="https://www.sredevops.org,https://sredevops.org,http://localhost:2368"
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
node -e '
  const origins = process.argv[1].split(",").map((s) => s.trim()).filter(Boolean);
  const base = require(process.argv[2]);
  const policy = base.map((rule) => ({ ...rule, origin: origins }));
  process.stdout.write(JSON.stringify(policy, null, 2));
' "$origins" "$HERE/../config/cors.json" > "$tmp"

gcloud storage buckets update "gs://${BUCKET}" --cors-file="$tmp"
echo "cors: applied to gs://${BUCKET} for: ${origins}"
