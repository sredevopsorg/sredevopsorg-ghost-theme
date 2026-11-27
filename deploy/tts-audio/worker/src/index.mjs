#!/usr/bin/env node
/**
 * Entrypoint for both in-cluster workloads. The image is shared; the command decides.
 *
 *   node src/index.mjs <post-id>     # synthesis Job: one post
 *   node src/index.mjs --backfill    # one-shot Job: fan out one Job per post
 *   node src/index.mjs --serve       # webhook receiver Deployment
 *
 * Exit codes: 0 for success **and for a skip** (a draft or an unchanged article is not
 * a failure), 1 for a real failure. Kubernetes retries on 1 only, which is exactly the
 * distinction the Job needs.
 */

import { jobConfig } from "./config.mjs";
import { runJob } from "./job.mjs";

/** One line per event on stderr; stdout stays empty so nothing mixes with JSON logs. */
export function log(message) {
  process.stderr.write(`${new Date().toISOString()} ${message}\n`);
}

async function main(argv) {
  const [arg] = argv;

  if (arg === "--serve") {
    const { serve } = await import("./receiver.mjs");
    await serve({ log });
    return 0;
  }

  const config = jobConfig();

  if (arg === "--backfill") {
    const { backfill } = await import("./backfill.mjs");
    return backfill({ config, log });
  }

  if (!arg || arg.startsWith("-")) {
    log("usage: index.mjs <post-id> | --backfill | --serve");
    return 2;
  }

  const stats = await runJob({ postId: arg, config, log });
  return stats.result === "failed" ? 1 : 0;
}

const code = await main(process.argv.slice(2)).catch((err) => {
  log(`failed: ${err?.stack ?? err}`);
  return 1;
});
process.exitCode = code;
