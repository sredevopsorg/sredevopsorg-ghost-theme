/**
 * The three Kubernetes calls the pipeline makes, over the in-cluster API.
 *
 * Deliberately not `@kubernetes/client-node`: this needs `create a Job`, `get a Job` and
 * `delete a Job` inside one namespace with one service account. Pulling in the client
 * would add ~40 transitive packages and an openapi model to an image that is otherwise
 * Node, ffmpeg and an ONNX model.
 *
 * The service account token and CA are mounted by Kubernetes at the documented paths;
 * `KUBERNETES_SERVICE_HOST/PORT` are injected into every pod. Unit tests inject `api()`
 * and never touch a cluster.
 */

import { readFileSync } from "node:fs";
import { request } from "node:https";

const TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token";
const CA_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";
const SA_NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace";

/** Namespace this process runs in, or the configured one outside a cluster. */
export function currentNamespace(fallback = process.env.POD_NAMESPACE ?? "tts-audio") {
  try {
    return readFileSync(SA_NAMESPACE_PATH, "utf8").trim() || fallback;
  } catch {
    return fallback;
  }
}

/**
 * One request against the API server.
 *
 * Resolves to `{ status, body }` for every HTTP status so callers can branch on 409/404
 * instead of on a thrown error; a transport failure rejects.
 */
export function api(method, path, { body, token, ca, host, port } = {}) {
  const apiHost = host ?? process.env.KUBERNETES_SERVICE_HOST;
  const apiPort = port ?? process.env.KUBERNETES_SERVICE_PORT ?? "443";
  if (!apiHost) return Promise.reject(new Error("not running in a cluster: KUBERNETES_SERVICE_HOST is unset"));

  const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
  return new Promise((resolve, reject) => {
    const req = request(
      {
        method,
        host: apiHost,
        port: apiPort,
        path,
        ca: ca ?? safeRead(CA_PATH),
        headers: {
          Authorization: `Bearer ${token ?? safeRead(TOKEN_PATH)}`,
          Accept: "application/json",
          ...(payload ? { "Content-Type": "application/json", "Content-Length": payload.length } : {}),
        },
        timeout: 10_000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {
            parsed = { raw: data };
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("API server request timed out")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

/** Deep-copy a plain JSON value: the Job template comes from a ConfigMap. */
function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Fill `${VAR}` placeholders in the Job template.
 *
 * Only the values this module is given are substituted, and every one is a constant the
 * template already constrains (an id derived from a webhook payload and a hash), so no
 * part of the payload can inject a field into the Job manifest.
 */
function fill(template, values) {
  const json = JSON.stringify(template).replace(/\$\{([A-Z_]+)\}/g, (match, key) => {
    if (!(key in values)) throw new Error(`job template placeholder ${key} has no value`);
    return String(values[key]);
  });
  return JSON.parse(json);
}

/**
 * Apply the node-pool selector, or remove it when no pool is configured.
 *
 * The template always carries a `nodeSelector` block so the field is visible in the
 * ConfigMap, but an empty value must not reach the API server: `node-pool: ""` is a
 * selector that matches no node, and the Job would sit Pending forever instead of running
 * wherever the scheduler sees fit.
 */
function applyNodeSelector(job, config) {
  const spec = job.spec?.template?.spec;
  if (!spec || !("nodeSelector" in spec)) return;
  if (config.nodePool) {
    spec.nodeSelector[config.nodePoolLabel] = config.nodePool;
  } else {
    delete spec.nodeSelector;
  }
}

/**
 * Create the synthesis Job for a post, or report that the identical one already exists.
 *
 * The name is deterministic (`tts-<post>-<hash10>`), so Kubernetes enforces idempotency
 * for us: a second delivery of the same edit is a 409, which is a success here.
 */
export async function createPostJob(config, { postId, hash, template, requestImpl = api }) {
  const namespace = config.namespace;
  const job = copy(template ?? (await loadTemplate()));
  job.metadata.name = jobNameFor(postId, hash);
  job.metadata.namespace ??= namespace;
  job.metadata.labels = {
    ...(job.metadata.labels ?? {}),
    "tts.sredevops.org/post": String(postId).slice(0, 63),
  };

  if (!config.image) {
    // Without an image the Job would be created with an empty `image` field and fail at
    // the kubelet with an unhelpful error; fail here where the config is visible.
    throw new Error("WORKER_IMAGE is not configured: the receiver cannot queue a Job");
  }

  const manifest = fill(job, {
    POST_ID: postId,
    IMAGE: config.image,
    POD_NAMESPACE: namespace,
    // Rendered empty here on purpose: `applyNodeSelector` either sets a real value or
    // drops the block. Leaving the placeholder unset would throw before we get there.
    NODE_POOL: "",
  });
  applyNodeSelector(manifest, config);

  const path = `/apis/batch/v1/namespaces/${encodeURIComponent(namespace)}/jobs`;
  const response = await requestImpl("POST", path, { body: manifest });
  if (response.status === 201) return "created";
  if (response.status === 409) return "exists";
  throw new Error(`creating job failed: ${response.status} ${JSON.stringify(response.body?.message ?? response.body)}`);
}

/** Job name; mirrors `hash.mjs` so the backfill and the webhook agree. */
export function jobNameFor(postId, hash) {
  const safe = String(postId ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "post";
  return `tts-${safe}-${String(hash ?? "").slice(0, 10)}`.slice(0, 63).replace(/-+$/, "");
}

/** Delete a Job (and its pod), and the Job's objects are left to the lifecycle rule. */
export async function deletePostJob(config, postId, { requestImpl = api } = {}) {
  // Any hash matches: the delete webhook does not know which one is current, so delete
  // every Job the post ever produced.
  const label = `tts.sredevops.org/post=${postId}`;
  const path =
    `/apis/batch/v1/namespaces/${encodeURIComponent(config.namespace)}/jobs` +
    `?labelSelector=${encodeURIComponent(label)}&propagationPolicy=Background`;
  const response = await requestImpl("DELETE", path);
  if (response.status === 200 || response.status === 404) return "deleted";
  throw new Error(`deleting jobs failed: ${response.status}`);
}

/**
 * How many synthesis Jobs are running or runnable right now.
 *
 * Counts Jobs that are `active`, which is the only state that occupies the node: a Job
 * whose pod has not finished (pending or running) reports `status.active >= 1`. Completed
 * and failed Jobs have `succeeded`/`failed` instead and are not counted.
 *
 * `labelSelector` keeps this to this pipeline's Jobs, so an unrelated Job in the same
 * namespace cannot stall the queue.
 */
export async function countActiveJobs(config, { requestImpl = api, labelSelector = "app.kubernetes.io/name=tts-audio,app.kubernetes.io/component=worker" } = {}) {
  const path =
    `/apis/batch/v1/namespaces/${encodeURIComponent(config.namespace)}/jobs` +
    `?labelSelector=${encodeURIComponent(labelSelector)}`;
  const response = await requestImpl("GET", path);
  if (response.status !== 200) {
    throw new Error(`listing jobs failed: ${response.status} ${JSON.stringify(response.body?.message ?? response.body)}`);
  }
  const items = response.body?.items ?? [];
  return items.filter((job) => (job?.status?.active ?? 0) > 0).length;
}

/**
 * Wait until fewer than `limit` Jobs are active, so the queue runs one at a time.
 *
 * Why a poll and not `parallelism`: `parallelism` caps pods *within* one Job, and every
 * post gets its own Job, so it does nothing here. Nothing in batch/v1 caps concurrency
 * *across* Jobs, so the limiter has to live in whoever creates them.
 *
 * Because a synthesis Job's CPU request is 0, the scheduler will happily admit all of them
 * at once and let them contend for the node until each crawls. Serialising them keeps wall
 * time per article predictable and stops a backfill from starving the receiver.
 *
 * `waitFor` is injectable so tests do not sleep.
 */
export async function waitForSlot(
  config,
  {
    limit = Number(process.env.MAX_CONCURRENT_JOBS ?? 1),
    requestImpl = api,
    waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    pollMs = Number(process.env.QUEUE_POLL_MS ?? 15000),
    maxWaitMs = Number(process.env.QUEUE_MAX_WAIT_MS ?? 3600000),
    onWait = () => {},
  } = {},
) {
  if (!(limit > 0)) return;
  let waited = 0;
  let warned = false;
  for (;;) {
    const active = await countActiveJobs(config, { requestImpl });
    if (active < limit) return;
    if (waited >= maxWaitMs) {
      throw new Error(
        `queue stalled: ${active} Job(s) still active after ${Math.round(maxWaitMs / 1000)}s ` +
          `(MAX_CONCURRENT_JOBS=${limit}); check for Pending Jobs that cannot be scheduled`,
      );
    }
    if (!warned) {
      onWait(active, limit);
      warned = true;
    }
    await waitFor(pollMs);
    waited += pollMs;
  }
}

/** The Job template lives in the ConfigMap (`job-template.json`), not in this image. */
let cachedTemplate = null;

async function loadTemplate() {
  if (cachedTemplate) return cachedTemplate;
  const fromEnv = process.env.JOB_TEMPLATE_PATH ?? "/etc/tts-audio/job-template.json";
  const { readFile } = await import("node:fs/promises");
  cachedTemplate = JSON.parse(await readFile(fromEnv, "utf8"));
  return cachedTemplate;
}
