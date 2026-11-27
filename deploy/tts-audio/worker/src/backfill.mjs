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

import { localeOf, markerIsCurrent } from "./ghost.mjs";
import { markerOf } from "./markers.mjs";
import { contentHash } from "./hash.mjs";
import { postText } from "./job.mjs";
import { createPostJob } from "./k8s.mjs";

const PAGE_LIMIT = 50;

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
  const response = await fetchImpl(url, {
    headers: { Authorization: `Ghost ${config.adminKey}`, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`listing posts failed: Ghost ${response.status} ${response.statusText}`);
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
export async function backfill({ config, log = () => {}, fetchImpl = fetch, dryRun = process.env.DRY_RUN === "1" }) {
  let page = 1;
  let pages = 1;
  const totals = { scanned: 0, eligible: 0, created: 0, skipped: 0, ineligible: 0, failed: 0 };

  do {
    const { posts, pagination } = await listPosts(config, { fetchImpl, page });
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
        const result = await createPostJob(config, { postId: post.id, hash: plan.hash });
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

  log(JSON.stringify({ result: dryRun ? "dry-run" : "ok", ...totals }));
  return totals.failed > 0 ? 1 : 0;
}
