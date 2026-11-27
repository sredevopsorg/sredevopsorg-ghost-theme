/**
 * The webhook receiver.
 *
 * Ghost calls this on publish/edit/delete. It does three things — verify the signature,
 * decide, create a Job — and answers **202 in milliseconds**. It never synthesises,
 * so the API Gateway's 30 s timeout can never cut into real work, and a slow Ghost
 * render cannot make a webhook look failed.
 *
 * Signature: Ghost sends `X-Ghost-Signature: sha256=<hex>, t=<unix seconds>`, an
 * HMAC-SHA256 over `${t}.${rawBody}` with the integration's secret. Verification is on
 * the **raw** body, which is why the body is collected as a Buffer before parsing.
 * A timestamp older than five minutes is rejected: a replayed delivery must not
 * resurrect a Job after the admin disabled the webhook.
 *
 * Failures are logged with the event id but never with the body, which contains the
 * whole post.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { readPost, writeCodeInjection } from "./ghost.mjs";
import { webhookSnapshot } from "./ghost.mjs";
import { removeMarker } from "./markers.mjs";
import { GcsStore } from "./gcs.mjs";
import { createPostJob, deletePostJob } from "./k8s.mjs";

/** Reject deliveries older than this, in seconds. */
export const MAX_SKEW_SECONDS = 300;

/** Route constants, so the Gateway, the Ghost webhook URL and this file agree. */
export const ROUTES = { webhook: "/ghost", health: "/healthz" };

/**
 * Verify a Ghost webhook signature.
 *
 * Returns `{ ok: true }` or `{ ok: false, reason }`; the reason is logged and returned
 * to the caller so a misconfigured secret is obvious from Ghost's delivery log instead
 * of looking like a network failure.
 */
export function verifySignature({ header, rawBody, secret, now = Date.now() }) {
  if (!secret) return { ok: false, reason: "no webhook secret configured" };
  if (!header) return { ok: false, reason: "missing X-Ghost-Signature" };

  const parts = Object.fromEntries(
    String(header)
      .split(",")
      .map((pair) => pair.trim().split("=", 2))
      .filter(([key, value]) => key && value),
  );
  const provided = parts.sha256;
  const timestamp = Number(parts.t);
  if (!provided || !Number.isFinite(timestamp)) return { ok: false, reason: "malformed signature header" };

  const age = Math.abs(now / 1000 - timestamp);
  if (age > MAX_SKEW_SECONDS) return { ok: false, reason: `stale delivery (${Math.round(age)}s)` };

  const expected = createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(String(provided), "hex");
  // `timingSafeEqual` throws on a length mismatch, and the length of a wrong digest is
  // itself not a secret worth protecting.
  if (a.length !== b.length) return { ok: false, reason: "signature length mismatch" };
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: "signature mismatch" };
}

/**
 * Decide what a delivery needs.
 *
 * Pure so it can be unit tested against real payload shapes:
 *  - a delete/unpublish removes the marker and the audio; it never creates a Job
 *  - a draft never gets audio
 *  - a post without exactly one locale tag never gets audio
 *  - an edit that left `content_hash` untouched is a no-op (Ghost re-saves posts for
 *    reasons that have nothing to do with the text)
 */
export function decide(payload) {
  const snapshot = webhookSnapshot(payload);
  if (!snapshot) return { action: "ignore", reason: "payload has no post" };
  if (snapshot.deleted) return { action: "unwrap", snapshot };

  const event = snapshot.event;
  if (/delete|unpublish/i.test(event) || snapshot.status === "draft") {
    return { action: "unwrap", snapshot };
  }
  if (!snapshot.locale) return { action: "ignore", snapshot, reason: "no single locale tag" };
  if (snapshot.previousHash && snapshot.previousHash === snapshot.contentHash) {
    return { action: "ignore", snapshot, reason: "content hash unchanged" };
  }
  return { action: "create", snapshot };
}

/**
 * Handle one delivery. Separated from the HTTP plumbing so tests can drive it with a
 * plain object and a fake Job creator.
 */
export async function handleDelivery({
  payload,
  config,
  log = () => {},
  createJob = createPostJob,
  removeJob = deletePostJob,
  // Clear the marker and delete the objects. The default implementation is wired in
  // `serve()` so tests can pass a recorder instead.
  unwrap = defaultUnwrap,
}) {
  const decision = decide(payload);
  const id = decision.snapshot?.id ?? "-";

  if (decision.action === "ignore") {
    log(`ignore ${id}: ${decision.reason}`);
    return { status: 202, body: { ok: true, action: "ignore", reason: decision.reason } };
  }

  if (decision.action === "unwrap") {
    // Unpublish/delete: the audio must stop being served, and the marker must not point
    // at a file for a post that is no longer public. The prompt reply is what matters:
    // a failure here is logged and retried by Ghost on its next delivery, never a 500
    // that would make a finished delete look failed.
    const result = await unwrap(decision.snapshot, { config, log }).catch((err) => {
      log(`unwrap failed for ${id}: ${err.message}`);
      return { marker: "failed", objects: 0 };
    });
    await removeJob(config, id).catch((err) => log(`could not delete job for ${id}: ${err.message}`));
    return { status: 202, body: { ok: true, action: "unwrap", ...result } };
  }

  // Ghost's webhook post objects do not always carry `content_hash`, and without it the
  // Job name cannot include the article's identity. Falling back to a constant would make
  // the *second* edit of a post collide with the first one's completed Job name and be
  // silently dropped, so the fallback is a hash of the event time: unique per delivery,
  // and the job still does the authoritative skip check itself.
  const hash = decision.snapshot.contentHash || `e${createHash("sha256").update(String(payload?.post?.current?.updated_at ?? Date.now())).digest("hex").slice(0, 9)}`;
  const result = await createJob(config, { postId: id, hash });
  log(`create ${id} (${decision.snapshot.locale ?? "?"}) → ${result}`);
  return { status: 202, body: { ok: true, action: "create", result } };
}

/**
 * Default unpublish/delete action: remove the marker, then the post's objects.
 *
 * The GCS store is built lazily (the receiver otherwise never needs credentials) and a
 * missing bucket only disables the object sweep, not the marker cleanup.
 */
export async function defaultUnwrap(snapshot, { config, log = () => {} }) {
  const result = { marker: "absent", objects: 0 };

  if (snapshot.marker) {
    try {
      // Re-read: the payload's `updated_at` may be stale, and the PUT must not use it.
      const { post } = await readPost(config, snapshot.id);
      const foot = removeMarker(post.codeinjection_foot);
      if (foot !== (post.codeinjection_foot ?? "")) {
        await writeCodeInjection(config, post, foot, { log });
        result.marker = "removed";
      }
    } catch (err) {
      // On a hard delete the read answers 404: the post is gone, so only the objects
      // are left to remove.
      const gone = err?.status === 404;
      result.marker = gone ? "post-deleted" : `failed: ${err.message}`;
      if (!gone) log(`could not clear marker for ${snapshot.id}: ${err.message}`);
    }
  }

  if (config.bucket) {
    const store = new GcsStore({ bucket: config.bucket, log });
    result.objects = await store.removePrefix(`audio/${snapshot.id}/`).catch((err) => {
      log(`could not delete objects for ${snapshot.id}: ${err.message}`);
      return 0;
    });
  }

  return result;
}

/** Read a request body with a hard cap; a webhook carries one post, never a payload. */
function readBody(req, limit = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, body) {
  const payload = JSON.stringify(body ?? {});
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    // Nothing here is cacheable, and a cached 202 would hide a broken webhook.
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

/**
 * Start the HTTP server.
 *
 * `config` is the receiver config (see config.mjs); `deps` exists for tests.
 */
export async function serve({ config, log = () => {}, deps = {} } = {}) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    try {
      if (req.method === "GET" && url.pathname === ROUTES.health) {
        send(res, 200, { ok: true, version: process.env.IMAGE_TAG ?? "dev" });
        return;
      }

      if (req.method !== "POST" || url.pathname !== ROUTES.webhook) {
        send(res, 404, { ok: false, error: "not found" });
        return;
      }

      const rawBody = await readBody(req);
      const check = verifySignature({
        header: req.headers["x-ghost-signature"],
        rawBody,
        secret: config.webhookSecret,
      });
      if (!check.ok) {
        // 401, not 400: Ghost's delivery log distinguishes a rejected secret from a
        // broken receiver, and so does whoever debugs it.
        log(`rejected delivery: ${check.reason}`);
        send(res, 401, { ok: false, error: check.reason });
        return;
      }

      let payload;
      try {
        payload = JSON.parse(rawBody.toString("utf8"));
      } catch {
        send(res, 400, { ok: false, error: "body is not JSON" });
        return;
      }

      const result = await handleDelivery({ payload, config, log, ...deps });
      send(res, result.status, result.body);
    } catch (err) {
      // A 500 makes Ghost retry, which is the right outcome for a transient API or
      // cluster failure; it must not leak the body or the secret into the response.
      log(`delivery failed: ${err.message}`);
      send(res, 500, { ok: false, error: "internal error" });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, "0.0.0.0", resolve);
  });
  log(`tts-webhook listening on :${config.port}`);
  return server;
}

