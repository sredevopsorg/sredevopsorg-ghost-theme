#!/usr/bin/env bash
# Delete objects this repository used to declare but no longer does.
#
# Why this exists: `kubectl apply` is a create-or-update verb. When a resource is *renamed*
# in the repo — as `allow-webhook-kubernetes-api` became `allow-kubernetes-api-egress` —
# the old object stays in the cluster forever, silently widening what is allowed. Twice
# here the stale object was a NetworkPolicy, where "still there" means "still permitting".
#
# Usage:
#   ./scripts/prune-stale.sh <rendered.yaml> <namespace> [gateway-namespace] [--confirm]
#
# Without `--confirm` it only reports. It never touches kinds it does not manage (Secrets,
# Namespaces, Jobs are excluded on purpose: a Secret is created out of band and a Job is a
# one-off whose history is useful).
set -euo pipefail

rendered="${1:?usage: prune-stale.sh <rendered.yaml> <namespace> [gateway-ns] [--confirm]}"
namespace="${2:?usage: prune-stale.sh <rendered.yaml> <namespace> [gateway-ns] [--confirm]}"
gateway_ns="${3:-kube-system}"
confirm="${4:-}"

# Only kinds this repository owns, mapped to the kubectl resource name.
# Deliberately excluded: secret (created by `make secret`), namespace, job (one-off history).
managed_kinds="networkpolicy httproute serviceaccount role rolebinding poddisruptionbudget horizontalpodautoscaler service configmap deployment"

declared="$(node -e '
  const fs = require("fs");
  const docs = fs.readFileSync(process.argv[1], "utf8").split(/^---$/m);
  const out = [];
  for (const doc of docs) {
    const kind = /^kind:\s*(\S+)/m.exec(doc);
    const name = /^  name:\s*(\S+)/m.exec(doc);
    const ns = /^  namespace:\s*(\S+)/m.exec(doc);
    if (kind && name) out.push(`${kind[1].toLowerCase()}|${ns ? ns[1] : ""}|${name[1]}`);
  }
  process.stdout.write(out.join("\n"));
' "$rendered")"

  # A Gateway lives in its own namespace; every other managed kind lives in `namespace`.
declared_in() {
  local target_ns="$1"
  printf '%s\n' "$declared" | awk -F'|' -v ns="$target_ns" '$2 == ns { print $1 "|" $3 }'
}

stale=()
for scope in "$namespace" "$gateway_ns"; do
  declare_map="$(declared_in "$scope" | sort -u)"
  for kind in $managed_kinds; do
    # List only objects carrying this repo's label, so nothing foreign is considered.
    live="$(kubectl -n "$scope" get "$kind" -l app.kubernetes.io/part-of=tts-audio \
      -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"
    [ -n "$live" ] || continue
    while read -r name; do
      [ -n "$name" ] || continue
      if ! printf '%s\n' "$declare_map" | grep -qx "${kind}|${name}"; then
        stale+=("${kind}/${name} (namespace ${scope})")
      fi
    done <<< "$live"
  done
done

if [ "${#stale[@]}" -eq 0 ]; then
  echo "prune: nothing stale — the cluster matches the repo"
  exit 0
fi

echo "prune: ${#stale[@]} object(s) in the cluster are no longer declared:"
printf '  - %s\n' "${stale[@]}"

if [ "$confirm" != "--confirm" ]; then
  echo
  echo "prune: dry run. Re-run with CONFIRM=1 to delete them:"
  echo "  make prune TAG=... TTS_HOST=... GATEWAY_NAME=... GATEWAY_NAMESPACE=... CONFIRM=1"
  exit 0
fi

for entry in "${stale[@]}"; do
  kind="${entry%%/*}"
  rest="${entry#*/}"
  name="${rest%" (namespace "*}"
  scope="${rest##* (namespace }"
  scope="${scope%)}"
  kubectl -n "$scope" delete "$kind" "$name" --ignore-not-found
done
echo "prune: done"
