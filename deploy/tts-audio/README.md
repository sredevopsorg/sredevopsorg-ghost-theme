# Article audio pipeline

Pre-generated article audio for sredevops.org: Ghost webhooks mark a post dirty, a
Kubernetes Job speaks it once with a local Kokoro model, the MP3 lands in Google Cloud
Storage, and the theme's player streams it. The reader never calls a speech API.

This directory is **not** part of the Ghost theme package. `scripts/ship-manifest.mjs`
refuses to ship it, and `yarn verify` never runs it; its own gate is `make test`.

```
 Ghost ──webhook──► API Gateway ──► tts-webhook (Deployment, 2 replicas)
                                     │ verifies X-Ghost-Signature
                                     │ skips drafts / untagged / unchanged posts
                                     └─► Job tts-<post-id>-<hash>
                                           Admin API ─► text ─► hash ─► skip?
                                           Kokoro ─► ffmpeg ─► one MP3
                                           ─► gs://<bucket>/audio/<id>/<hash>.mp3
                                           ─► PUT codeinjection_foot (the marker)

 reader ──► https://audio.sredevops.org/audio/<id>/<hash>.mp3   (Cloudflare DNS → GCS)
```

See [docs/adr/0005-local-tts-audio-pipeline.md](../../docs/adr/0005-local-tts-audio-pipeline.md)
for *why* these choices, and [README § Article audio](../../README.md#article-audio-pre-generated-kokoro)
for the reader-facing behaviour.

---

## What you need before starting

| Thing | Why | Where |
|---|---|---|
| `gcloud` CLI, authenticated | bucket, CORS, lifecycle, service account | local |
| `kubectl` pointed at the GKE cluster | deploy, backfill, logs | local |
| A Gateway (Gateway API) or Traefik | expose the receiver | the cluster |
| Cloudflare access to `sredevops.org` DNS | the `audio` record | Cloudflare |
| A Ghost custom integration | Admin API key + webhook secret | Ghost Admin |

`make test` needs only `kubectl` (for kustomize), `envsubst`, `node` 24 and optionally
`shellcheck`. None of them touch a cluster.

---

## 1. Google Cloud

The defaults in the Makefile (and `base/configmap.yaml`) are
`GCP_PROJECT=sredevopsorg`, `GCS_BUCKET=tts-sredevopsorg`; override them for another
project. The service account is `tts-audio-runner@<project>.iam.gserviceaccount.com` and
needs object access to that bucket only.

```bash
make gcp-bootstrap GCP_PROJECT=<project> GCS_BUCKET=<bucket> GCP_LOCATION=<region>
```

`gcp-bootstrap` needs a principal that can **administer** the bucket (IAM + CORS). The
runner service account deliberately cannot: it is scoped to objects, so it can write audio
but not widen its own permissions. If you are using the runner key by mistake you will see
`storage.buckets.get` / `storage.buckets.update` denied.

Three failures are worth naming, because each one leaves a pipeline that looks deployed
but produces nothing a reader can hear:

| Symptom | Cause |
|---|---|
| `The specified bucket does not exist` | `GCS_BUCKET` names a bucket that was never created, or the wrong project |
| Anonymous `GET` on an object returns **403** | `allUsers` → `roles/storage.objectViewer` is missing; the player cannot read it |
| `OPTIONS` preflight has no `access-control-allow-origin` | CORS was never applied; a ranged seek fails in the browser |

Verify all three after the bootstrap:

```bash
curl -s -o /dev/null -w 'anonymous: %{http_code}\n' "https://storage.googleapis.com/$GCS_BUCKET/<any-object>"
curl -sI -X OPTIONS -H 'Origin: https://www.sredevops.org' -H 'Access-Control-Request-Method: GET' \
  "https://storage.googleapis.com/$GCS_BUCKET/<any-object>" | grep -i access-control
```

That command is idempotent and does four things:

1. Creates the bucket with **uniform bucket-level access** and public-access prevention, so
   only an explicit `allUsers` binding grants read.
2. Applies [`config/cors.json`](config/cors.json) through `scripts/cors.sh`: `GET`/`HEAD`
   from the site origins, exposing `Accept-Ranges` and `Content-Range` — without those, a
   seek in the player restarts the file.
3. Applies [`config/lifecycle.json`](config/lifecycle.json): objects under `audio/` are
   deleted after **90 days**. Superseded audio is only referenced by the marker, so a
   stale object is dead weight; 90 days is long enough for a reader who left a tab open and
   for a CDN to keep serving a cached page.
4. Grants `roles/storage.objectAdmin` **on the bucket** to
   `tts-audio-runner@<project>.iam.gserviceaccount.com` and creates the account if needed.

Then create the key — this is the only long-lived credential in the system:

```bash
make gcp-key                      # writes ./key.json (git-ignored)
```

### Why a JSON key and not Workload Identity

The bucket is in one project and the cluster is in another, the publication does not use
Workload Identity yet, and migrating it is a change to the Ghost deployment that this
repository does not own. A key with a bucket-scoped role, mounted read-only into the Jobs
only (never into the receiver), is the smaller surface today.

**To migrate later**, when the cluster does use Workload Identity: annotate the
`tts-worker` ServiceAccount with
`iam.gke.io/gcp-service-account=<gsa>@<project>.iam.gserviceaccount.com`, add
`roles/iam.workloadIdentityUser` for `serviceAccount:<project>.svc.id.goog[tts-audio/tts-worker]`,
and delete the `gcs-key` volume, the `GOOGLE_APPLICATION_CREDENTIALS` env and the
`gcs-key.json` Secret entry. Nothing in the worker code changes.

---

## 2. Cloudflare DNS

One record, in the `sredevops.org` zone:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `audio` | `c.storage.googleapis.com` | **Proxied** (orange cloud) |

Nothing else. Cloudflare manages DNS; uploads and reads are GCS. The proxy gives the host a
certificate and a cache in front of the bucket.

Verify it end to end once there is at least one object:

```bash
OBJ=audio/<post-id>/<hash>.mp3 make cf-verify
```

The script checks the four properties the player depends on: `Content-Type: audio/mpeg`,
`Accept-Ranges: bytes`, the immutable `Cache-Control`, and that a `Range` request comes back
**206 Partial Content**. If Cloudflare is stripping ranges, switch the record to **DNS
only** (grey cloud): the player still works, you only lose the CDN, and `AUDIO_BASE_URL`
does not change.

---

## 3. Ghost integration

Ghost Admin → **Integrations** → *Add custom integration*, name it `tts-audio`.

1. Copy the **Admin API key** (`id:secret`) and the **Content API key**.
2. The integration must have **Administrator** rights: the job writes code injection, which
   is an admin-only column. Point it at nothing else.
3. Create a **webhook** with:
   - **URL**: `https://<TTS_HOST>/ghost` (`TTS_HOST` is the hostname you will deploy)
   - **Secret**: any long random string — the receiver verifies `X-Ghost-Signature` with it
   - **Events**: `Post added`, `Post published edited`, `Post unpublished`, `Post deleted`

`Post published edited` fires both on publish and on every later edit, which is why the
receiver also checks the content hash: a re-save that changes nothing queues no work.

> The webhook URL must be reachable **from the Ghost server**, not from a browser.

---

## 4. Create the Secret

```bash
make secret \
  ADMIN_KEY='<id>:<secret>' \
  WEBHOOK_SECRET='<the webhook secret>' \
  GCS_KEY=./key.json
# then delete the local copy: the cluster now has the only one
rm key.json
```

This writes `tts-audio` in the `tts-audio` namespace with three keys: `admin-api-key`,
`webhook-secret`, `gcs-key.json`. It is never committed; `base/secret.example.yaml`
documents the shape and is never applied.

**Rotation.** Create a new key with `make gcp-key`, re-run `make secret`, `make restart`,
then disable/delete the old key in the GCP console. The jobs pick the new key up as they
start; the receiver only uses it to clear markers on delete.

---

## 5. Deploy

The route needs to know your Gateway. On a Gateway API cluster:

```bash
make deploy \
  TAG=<12-char commit sha from the image build> \
  TTS_HOST=tts.sredevops.org \
  NODE_POOL=<value of the node-pool label> \
  GATEWAY_NAME=<gateway> GATEWAY_NAMESPACE=<namespace> GATEWAY_SECTION=web
```

`TAG` must be the **12-character** short SHA, which is how the workflow tags the image
(`${{ github.sha }}` truncated to 12). A 7-character prefix is not a tag and the pod will
fail with `ImagePullBackOff` / `manifest unknown`.

`render.sh` refuses to render without those values, and refuses to emit a manifest that
still contains a placeholder it does not expect — the failure mode it prevents is a route
pointing at `${GATEWAY_NAME}`.

### Node placement

`NODE_POOL` pins every pipeline workload to a node carrying that label
(`dsh.sredevops.org/node-pool`, overridable with `NODE_POOL_LABEL`). It is required, not
optional, because an empty selector matches **no** node and the pods would sit `Pending`.

On this cluster the value is `dsh` — the amd64 node. Two reasons it is pinned rather than
left to the scheduler:

- the image is built multi-arch, but the arm64 control-plane node is cordoned for a reason;
- the amd64 node's dataplane has a defect with egress policy (see below), so *where* these
  pods run is a decision with consequences, not an implementation detail.

The Deployment and the backfill Job carry the selector in their manifests. Synthesis Jobs
get it from the **receiver**, which reads `NODE_POOL` from its own environment and sets it
on each Job (`worker/src/k8s.mjs`); the template in `tts-job-template` keeps an empty
`nodeSelector` on purpose, so this cluster's pool is never baked into a template that every
future Job is stamped from.

### Egress policy is deliberately absent

There are only **ingress** policies in `base/netpol.yaml`. There used to be two egress
policies, and on this cluster any egress policy selecting these pods broke every in-cluster
destination, measured from inside a receiver pod:

| State | `10.43.0.1:443` (API) | own ClusterIP |
|---|---|---|
| no egress policy | OPEN | OPEN |
| any egress policy | `ECONNREFUSED` | `ECONNREFUSED` |

"Any" included a single policy whose only rule was `port: 443` with no `to:`, and one with
an explicit `to: ipBlock` covering the service, pod and node ranges. Deleting them restored
connectivity with no other change; public hosts on 443 and direct pod-to-pod traffic kept
working throughout, so it was specifically the service path. That is a CNI defect, not
something a manifest can express around — and the policies were not buying containment
anyway, since any destination on 443 was permitted.

The practical consequence was that the **backfill could not create a single Job**: it read
all 221 posts and failed each one with `connect ECONNREFUSED <apiserver>:443`. If you
re-add egress policies, verify with the probe above *before* trusting them, and expect
`make test` to fail until you remove the assertion that guards this.

`make deploy` also creates the **Gateway** itself (`overlay/gateway.yaml`), because a
`HTTPRoute` pointing at a Gateway that does not exist attaches to nothing — the route gets
no `status` and the hostname returns Cloudflare **1016**. On this cluster each application
owns its Gateway, next to Traefik in `kube-system`.

Two values are easy to get wrong, and both are asserted by `make test`:

| Field | Value | Why |
|---|---|---|
| listener `port` | **8443** | Traefik's `websecure` entrypoint port *inside* the container. The Service maps it to 443; the Gateway API port is the container port. |
| `allowedRoutes` | **`All`** | The route lives in `tts-audio`, the Gateway in `kube-system`. Every other Gateway on the cluster uses `Same` because their routes sit beside them — copying that leaves the route unattached. The listener `hostname` pins it to one host regardless. |

The Gateway needs a TLS certificate **in its own namespace**, so copy the wildcard cert
first:

```bash
make tls-secret GATEWAY_NAMESPACE=kube-system
```

It copies `security-feed/security-feed-sredevops-tls` (a Cloudflare Origin certificate for
`*.sredevops.org`) into `GATEWAY_NAMESPACE` under `TLS_SECRET` (default `tts-audio-tls`).
Override `TLS_SOURCE_NAMESPACE` / `TLS_SOURCE_SECRET` if it moves. This is a **snapshot**:
re-run it when the wildcard certificate is renewed.

Set `WITH_GATEWAY=0` to skip creating one, when the cluster already publishes the receiver
through an existing Gateway — in that case `GATEWAY_NAME`/`GATEWAY_NAMESPACE` name *that*
Gateway.

On **Traefik CRDs** (no Gateway API), edit `overlay/kustomization.yaml` to list
`route-traefik.yaml` instead of `route.yaml`, pass `TLS_MIDDLEWARE`/`TLS_SECRET`, and
`WITH_GATEWAY=0`.

After a release that **renames** a resource, run the prune check — `kubectl apply` is a
create-or-update verb and never removes an object whose name changed. This has bitten the
NetworkPolicies here twice: `allow-webhook-kubernetes-api` became
`allow-kubernetes-api-egress`, and both egress policies were removed later for the reasons
above. In each case the old object lingered on the cluster:

```bash
make prune TAG=<sha> TTS_HOST=... NODE_POOL=... GATEWAY_NAME=... GATEWAY_NAMESPACE=...  # dry run
make prune ... CONFIRM=1                                                                # delete
```

It only considers kinds this repository owns and only objects labelled
`app.kubernetes.io/part-of=tts-audio`, so a Secret, a Job or anything foreign is untouched.

Then point DNS for `TTS_HOST` at the Gateway as you do for any other service, and check:

```bash
curl -sS https://<TTS_HOST>/healthz          # {"ok":true,...}
make status
make logs
```

The image comes from GHCR:

```
ghcr.io/sredevopsorg/sredevopsorg-ghost-theme/tts-audio-runner:<sha>
```

It is public (the repository is public), so no `imagePullSecrets` are needed. If the
package is ever made private, add a `docker-registry` Secret and an `imagePullSecrets`
entry to both the Deployment and the Job template in [`base/configmap.yaml`](base/configmap.yaml).

---

## 6. Backfill the archive

Every post published before the pipeline existed has no audio. The backfill Job walks the
Admin API and queues one synthesis Job per post that needs one.

```bash
make backfill-plan      # DRY RUN: how many posts, no Jobs created
make backfill           # queue them
```

Each post is an independent Job (`tts-<id>-<hash>`), so the backfill is resumable: a post
already up to date is skipped by the hash check, and a Job name that already exists is not
created twice. Re-running is safe and cheap.

Rough cost: a 9k-character article is ~8k chars/s of CPU, so **1–2 minutes per post** in a
2-CPU Job. A hundred posts is a couple of hours of cluster time, not of anyone's attention.

---

## 7. Listen before you trust it

The voices are Kokoro's, not the Chirp 3: HD voice the site used. Judge Spanish and
Portuguese before the archive goes through them:

```bash
make dev-synth TEXT="Kubernetes es el orquestador de referencia." LOCALE=es OUT=sample-es.mp3
make dev-synth TEXT="O Kubernetes é o orquestrador de referência." LOCALE=br OUT=sample-br.mp3
```

Files land in `.dev-out/`. To change a voice, edit `TTS_VOICES` in
[`base/configmap.yaml`](base/configmap.yaml), apply, and re-run `make backfill`; the content
hash includes the voice, so every post is regenerated on its next edit or backfill.

---

## Operating it

### Is the Admin key actually valid?

Two traps, in the order they cost the most time.

**1. The header takes a signed JWT, not the key.** `Authorization: Ghost <token>` where
`<token>` is an HS256 JWT (`kid` = key id, `aud` = `/admin/`), signed with the
hex-decoded secret. Sending the raw `id:secret` gives **`400 INVALID_JWT`**, which reads
exactly like a revoked key. Ghost's source is explicit about it:

```js
const decoded = jwt.decode(token, { complete: true });
if (!decoded || !decoded.header) throw BadRequestError({ code: 'INVALID_JWT' });
const apiKeyId = decoded.header.kid;
```

The worker signs per request (`signAdminToken` in `worker/src/ghost.mjs`). Do not test the
key with a bare `curl` and an `id:secret` header — that test always fails.

**2. `/site/` answers 200 without any auth**, so it proves nothing about the key.

Node signs without needing Ghost's internals:

```bash
ADMIN_KEY='<id>:<secret>' node -e '
  const c = require("crypto");
  const [id, s] = process.env.ADMIN_KEY.split(":");
  const n = Math.floor(Date.now() / 1000);
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const si = b({ alg: "HS256", typ: "JWT", kid: id }) + "." + b({ iat: n, exp: n + 300, aud: "/admin/" });
  process.stdout.write(si + "." + c.createHmac("sha256", Buffer.from(s, "hex")).update(si).digest("base64url"));
' | xargs -I{} curl -s -o /dev/null -w '%{http_code}\n' \
    -H "Authorization: Ghost {}" https://www.sredevops.org/ghost/api/admin/settings/
```

**200** means the key is good. A **400 `INVALID_JWT`** with a *correctly signed* token means
the integration was deleted or its key regenerated — repair it in Ghost Admin →
Integrations, give it the **Administrator** role (needed to write code injection), then
`make secret` + `make restart`. A **403** means no header was sent.

The quickest end-to-end check is the backfill in dry-run mode, which exercises the same
signed read the Jobs use and nothing else:

```bash
make backfill-plan
```

| Symptom | Look at | Likely cause |
|---|---|---|
| Post stays silent after publishing | `make logs` (receiver), then `kubectl -n tts-audio logs job/tts-...` | webhook secret mismatch (401), Gateway not routing, post has no locale tag |
| Backfill job fails immediately | `kubectl -n tts-audio logs job/tts-backfill` | `INVALID_JWT` — see "Is the Admin key actually valid?" above |
| Receiver logs `ignore … content hash unchanged` | — | Ghost re-saved the post; expected |
| Job fails with `Ghost 401` | Secret | Admin API key revoked or wrong format |
| Job fails with `Ghost 400 INVALID_JWT` | Secret | the Admin API key is not valid on this instance: revoked, or copied from a different integration. `/site/` still answering 200 proves nothing — it is public without auth |
| Job fails with `bucket` errors | Secret | key rotated without `make secret`, or the GSA lost its binding |
| Player falls back to Cloud TTS on an old post | `make status` | its marker was removed, or the object expired (90-day lifecycle) |
| `cf-verify` fails on partial content | Cloudflare | proxy stripped ranges — use a DNS-only record |
| Audio plays but sounds like the wrong language | `kubectl logs` for `phonemes ... dropped` | a locale tag mismatch, or a missing espeak-ng language pack in the image |
| Job fails with `espeak-ng is not installed` | image | the base image lost `espeak-ng`; it is a hard dependency, not optional |

Useful commands:

```bash
make status                 # deployments, services, last Jobs
make logs                   # tail the receiver
kubectl -n tts-audio get jobs --sort-by=.metadata.creationTimestamp
kubectl -n tts-audio logs job/<name> --tail=100
make backfill-plan          # what would be queued right now
make teardown               # remove the pipeline from the cluster (bucket kept)
```

---

## Throughput and job sizing

Measured on a 2-vCPU container, on real Spanish articles:

| Quantity | Measured |
|---|---|
| synthesis | **~8 characters of article per second of CPU** |
| model load, per Job | ~10 s |
| a ~300-character article | ~35 s of synthesis, ~16 s of audio |
| a 10k-character article | ~20 min of synthesis at 2 CPUs |
| threading 1 → 2 threads | 4.5 → 4.9 chars/s (barely worth it) |
| output | 24 kHz mono → 96 kbps MP3, ~1 MB per 90 s |

The job template therefore sets `requests.cpu: "0"` with a **cpu limit of 2** and a
**1-hour** `activeDeadlineSeconds`. The request is 0 deliberately: the node it runs on has
2 allocatable cores, and a 2-core request made every Job in a 221-post backfill unschedulable
(`0/2 nodes are available: 1 Insufficient cpu`) — the archive simply never ran. Requests are
what the scheduler books, limits are what the cgroup allows, so a 0 request plus a 2 limit
means a Job always fits and still uses both cores when the node is otherwise idle.

Because a 0 request cannot throttle anything, **concurrency is capped in code**:
`MAX_CONCURRENT_JOBS=1` makes the backfill create the next Job only when the previous one
has finished, so articles are synthesised one at a time. Nothing in `batch/v1` caps
concurrency *across* Jobs (`parallelism` caps pods within one Job, and every post gets its
own), so this lives in `worker/src/k8s.mjs`. `QUEUE_POLL_MS` sets how often it re-checks and
`QUEUE_MAX_WAIT_MS` bounds the wait, so a Job that can never be scheduled fails the run
instead of blocking it forever.

The knobs that actually move throughput:

- **CPU limit** — the dominant factor. Raising the Job's limit from 2 to 4 roughly halves
  the wall time; it is a `resources` edit in `base/configmap.yaml`.
- **`TTS_CHUNK_CHARS`** — larger chunks amortise per-call overhead. 450 is the default;
  past ~500 the model's prosody degrades.
- **A GPU** — the same image runs with `KOKORO_DEVICE=gpu` and
  `resources.limits.nvidia.com/gpu` in the job template, unchanged otherwise. Not worth it
  for a few posts a day; worth it for a large backfill.

With `MAX_CONCURRENT_JOBS=1` a backfill is a **queue, not a fan-out**: wall-clock time is
the sum of the articles, not `total_characters / (8 * CPUs_available)`. For 221 posts
averaging a few thousand characters that is hours, not minutes. Raise
`MAX_CONCURRENT_JOBS` only when the node has spare cores — at 0 CPU requests extra
concurrency does not add capacity, it only divides it.

### Why the request is 0

Measured on this cluster, and the reason the job template differs from the earlier
throughput-optimal sizing:

| Job `requests.cpu` | What happened |
|---|---|
| `2` (original) | all 221 Jobs `Pending`: `0/2 nodes are available: 1 Insufficient cpu` |
| `1` | one Job at a time fits; verified a Job scheduled and completed |
| `0` (current) | always schedulable; `MAX_CONCURRENT_JOBS` does the throttling instead |

A request of 0 books no CPU, so the scheduler will admit every Job at once. That is safe
only because the queue keeps one active — which is why the two settings ship together and
`test.sh` fails if either is changed alone. The node still caps pods at **110**, so even
with spare cores a 221-Job backfill drains rather than running in parallel.

## The model lock

The image bakes Kokoro's weights and verifies every file against
[`worker/models.lock.json`](worker/models.lock.json) at build time; a `REPLACE_ME` entry
**fails the build** rather than shipping an unchecked artifact. The lock is populated and
every checksum is verified against the pinned upstream revision
(`onnx-community/Kokoro-82M-v1.0-ONNX @ 1939ad2a`).

To regenerate it, run this from a machine that can reach the Hugging Face CDN:

```bash
cd worker
node scripts/update-models.mjs             # fetch, hash, rewrite the lock
node scripts/update-models.mjs --set-rev <40-char sha>   # move to a new revision
```

Review the diff before committing: a changed checksum means the upstream artifact moved,
which should be a deliberate decision, never a surprise in a rebuild.

Adding a voice means adding it to `files` in the lock and to `TTS_VOICES` in the
ConfigMap; the Dockerfile iterates the lock. The voice must be one the model ships
(`voices/<name>.bin`) **and** whose language `espeak-ng` can phonemise — the American and
British English sets, `ef_*/em_*` (Spanish) and `pf_*/pm_*` (Brazilian Portuguese).

---

## What is deliberately not here

- **No Artifact Registry.** Images go to GHCR, authenticated by the workflow's own token.
  The cluster therefore needs no GCP registry credential, only the bucket key.
- **No CronJob.** Synthesis is event-driven and the backfill is idempotent; a nightly
  re-read of the archive would cost cluster time to find nothing to do.
- **No GPU.** The quantized model runs on CPU at an acceptable rate. The same image runs
  unchanged on a GPU: set `resources.limits.nvidia.com/gpu` in the job template and
  `KOKORO_DEVICE=gpu` in the ConfigMap.
- **No Ghost plugin or server-side code.** The theme has no runtime; everything happens in
  the marker, the webhook receiver and the Jobs.
