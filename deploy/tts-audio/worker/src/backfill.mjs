/**
 * Backfill: every published `en|es|br` post that has no current audio gets a Job.
 *
 * Needed because the webhook only fires on future events: the archive that predates the
 * pipeline would otherwise never get audio. The fan-out is deliberately resumable —
 * each candidate's Job name is derived from the **global job name pattern**, so running
 * the backfill twice creates nothing new, and a run that dies halfway is a
 * `kubectl create job --from=...` away from continuing where it stopped.
 *
 * The backfill Job itself does no synthesis: it reads the index, decides, and creates
 * Jobs. That keeps it short (it is the part that can time out on a slow API) and keeps
 * the expensive work in retryable, per-post Jobs.
 */

import { ghostHeaders, localeOf, markerIsCurrent } from "./ghost.mjs";
import { markerOf } from "./markers.mjs";
import { contentHash } from "./hash.mjs";
import { postText } from "./job.mjs";
import { createPostJob, waitForSlot } from "./k8s.mjs";

const PAGE_LIMIT = 50;

/**
 * Ghost's machine-readable error code (`INVALID_JWT`, `RESOURCE_NOT_FOUND`, …), or "".
 *
 * The body has to be read once; a non-JSON body (an HTML error page from a proxy) is not
 * an error in itself, it just adds nothing.
 */
async function ghostErrorCode(response) {
  try {
    const body = await response.json();
    return body?.errors?.[0]?.code ?? "";
  } catch {
    return "";
  }
}

/**
 * List published posts with the fields the backfill needs.
 *
 * `filter=status:published` is applied server-side; the locale test is client-side
 * because NQL cannot express "exactly one of three tags" cleanly and getting it wrong
 * would mean a wrong voice rather than a slow query.
 */
async function listPosts(config, { fetchImpl = fetch, page = 1, limit = PAGE_LIMIT } = {}) {
  const url =
    `${config.ghostApiUrl}/ghost/api/admin/posts/` +
    `?filter=${encodeURIComponent("status:published")}` +
    `&formats=html&include=tags` +
    `&limit=${limit}&page=${page}`;
  // Same signing as the shared client — the key is never sent directly.
  const response = await fetchImpl(url, { headers: ghostHeaders(config.adminKey) });
  if (!response.ok) {
    // Keep Ghost's own error, and say which key failed when it is an auth failure.
    // "Ghost 400 Bad Request" is what a revoked or wrong admin key looks like: the whole
    // backfill dies on its first request and the runbook's debugging section is about
    // buckets, so the message has to carry both facts.
    const code = await ghostErrorCode(response);
    const keyId = String(config.adminKey ?? "").split(":")[0] || "(unset)";
    const hint =
      code === "INVALID_JWT"
        ? ` — the Admin API key was rejected (key id ${keyId}). Check that the integration ` +
          `still exists in Ghost Admin → Integrations, regenerate its Admin API key, and ` +
          `update the tts-audio Secret`
        : "";
    throw new Error(`listing posts failed: Ghost ${response.status}${code ? ` ${code}` : ""}${hint}`);
  }
  const payload = await response.json();
  return { posts: payload?.posts ?? [], pagination: payload?.meta?.pagination ?? { page, pages: 1 } };
}

/**
 * Decide what a post needs, without synthesising anything.
 *
 * Returns `{ hash, locale, action }` where `action` is `create`, `skip`, or `ineligible`.
 * Hashes are computed exactly as `runJob` does, so the Job created here is the same Job
 * the webhook would have created for the same edit — which is what makes re-running the
 * backfill idempotent.
 */
export async function planPost(config, post, { fetchImpl = fetch } = {}) {
  const locale = localeOf(post.tags);
  if (!locale) return { action: "ineligible", reason: "no single locale tag" };

  const voice = config.voices[locale];
  const { text } = postText(post);
  if (!text) return { action: "ineligible", reason: "no spoken text" };

  const hash = contentHash({ voice: voice.voice, speed: voice.speed, text });
  const marker = markerOf(post);
  const current = await markerIsCurrent(config, marker, hash, { fetchImpl });
  return { action: current ? "skip" : "create", hash, locale };
}

/**
 * Walk the archive and create the missing Jobs.
 *
 * `dryRun` prints the plan and creates nothing — the first thing to run against
 * production, because it says how many posts and how many minutes of CPU a full
 * backfill is about to cost.
 */
export async function backfill({
  config,
  log = () => {},
  fetchImpl = fetch,
  dryRun = process.env.DRY_RUN === "1",
  // Injectable so a test can drive the "the API server is unreachable" path, which is
  // exactly what a NetworkPolicy blocking the backfill looks like.
  createJob = createPostJob,
  // Queue: create the next Job only when fewer than this many are already active, so the
  // archive synthesises one article at a time instead of all 221 contending at once.
  // Injected in tests; defaults to the cluster-facing poller.
  queue = (cfg) => waitForSlot(cfg, { onWait: (active, limit) => log(`queue: ${active} Job(s) active, waiting for a free slot (MAX_CONCURRENT_JOBS=${limit})`) }),
}) {
  let page = 1;
  let pages = 1;
  const totals = { scanned: 0, eligible: 0, created: 0, skipped: 0, ineligible: 0, failed: 0 };

  do {
    let posts;
    let pagination;
    try {
      ({ posts, pagination } = await listPosts(config, { fetchImpl, page }));
    } catch (err) {
      // A listing failure is the whole run failing — most often a rejected Admin key. Log
      // it the same way as a per-post failure and stop, instead of letting the exception
      // escape with no structured line around it.
      log(`listing page ${page} failed: ${err.message}`);
      log(JSON.stringify({ result: "failed", ...totals, page }));
      return 1;
    }
    pages = pagination.pages ?? 1;
    log(`page ${page}/${pages}: ${posts.length} post(s)`);

    for (const post of posts) {
      totals.scanned += 1;
      try {
        const plan = await planPost(config, post, { fetchImpl });
        if (plan.action === "ineligible") {
          totals.ineligible += 1;
          continue;
        }
        totals.eligible += 1;
        if (plan.action === "skip") {
          totals.skipped += 1;
          continue;
        }
        if (dryRun) {
          log(`[dry-run] would create audio for ${post.slug} (${plan.locale}, ${plan.hash})`);
          totals.created += 1;
          continue;
        }
        // Wait for a free slot *before* creating, so at most `MAX_CONCURRENT_JOBS` are
        // active. A dry run never queues, so it does not wait either.
        await queue(config);
        const result = await createJob(config, { postId: post.id, hash: plan.hash });
        // `exists` is a success: a previous run already queued this exact article.
        if (result === "exists") {
          totals.skipped += 1;
        } else {
          totals.created += 1;
        }
        log(`queued ${post.slug} (${plan.locale}, ${plan.hash}) → ${result}`);
      } catch (err) {
        totals.failed += 1;
        log(`failed for ${post.slug ?? post.id}: ${err.message}`);
      }
    }
    page += 1;
  } while (page <= pages);

  // The exit code already reflected failures, but the line said "ok" — so a run that
  // queued nothing out of 221 posts finished as `{"result":"ok","failed":221}`.
  const result = dryRun ? "dry-run" : totals.failed > 0 ? "failed" : "ok";
  log(JSON.stringify({ result, ...totals }));
  return totals.failed > 0 ? 1 : 0;
}
