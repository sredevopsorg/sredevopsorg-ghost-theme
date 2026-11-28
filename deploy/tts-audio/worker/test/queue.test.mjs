import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * The synthesis queue: create the next Job only when fewer than MAX_CONCURRENT_JOBS are
 * active, so the archive is processed one article at a time.
 *
 * This exists because a synthesis Job requests **0 CPU**. The scheduler therefore admits
 * every Job immediately and lets them contend for the node, which is the opposite of what a
 * backfill wants: 221 articles that each crawl instead of one finishing. `parallelism` does
 * not help — it caps pods inside a single Job, and every post gets its own Job — so the
 * limiter has to live in the code that creates them.
 *
 * Every hop is injected: no cluster, no sleeping.
 */
const { waitForSlot, countActiveJobs } = await import("../src/k8s.mjs");

const config = { namespace: "tts-audio" };

/** A fake API that reports `active` Jobs until told otherwise. */
function fakeApi({ active, onGet } = {}) {
  let current = active;
  const impl = async (method, path) => {
    assert.equal(method, "GET");
    assert.match(path, /\/apis\/batch\/v1\/namespaces\/tts-audio\/jobs\?labelSelector=/);
    onGet?.(path);
    return { status: 200, body: { items: Array.from({ length: current }, () => ({ status: { active: 1 } })) } };
  };
  impl.setActive = (n) => {
    current = n;
  };
  return impl;
}

test("countActiveJobs counts only Jobs that are active", async () => {
  const requestImpl = async () => ({
    status: 200,
    body: {
      items: [
        { status: { active: 1 } }, // running or pending pod
        { status: { active: 0, succeeded: 1 } },
        { status: { failed: 1 } },
        { status: {} },
        { status: { active: 2 } }, // counts once, not twice
      ],
    },
  });
  assert.equal(await countActiveJobs(config, { requestImpl }), 2);
});

test("countActiveJobs scopes the listing to this pipeline", async () => {
  let seen = "";
  const requestImpl = async (m, path) => {
    seen = path;
    return { status: 200, body: { items: [] } };
  };
  await countActiveJobs(config, { requestImpl });
  // An unrelated Job in the same namespace must not be able to stall the queue.
  assert.match(decodeURIComponent(seen), /app\.kubernetes\.io\/component=worker/);
  assert.match(decodeURIComponent(seen), /app\.kubernetes\.io\/name=tts-audio/);
});

test("waitForSlot returns immediately when the queue is empty", async () => {
  const requestImpl = fakeApi({ active: 0 });
  let slept = 0;
  await waitForSlot(config, { limit: 1, requestImpl, waitFor: async () => slept++ });
  assert.equal(slept, 0, "nothing to wait for");
});

test("waitForSlot waits while another Job is active, then proceeds", async () => {
  const requestImpl = fakeApi({ active: 1 });
  const sleeps = [];
  await waitForSlot(config, {
    limit: 1,
    requestImpl,
    pollMs: 1000,
    // The first wait is the one under test; the second poll sees the slot free.
    waitFor: async (ms) => {
      sleeps.push(ms);
      if (sleeps.length === 1) requestImpl.setActive(0);
    },
  });
  assert.deepEqual(sleeps, [1000], "slept exactly one poll interval");
});

test("waitForSlot allows parallelism up to the limit", async () => {
  const requestImpl = fakeApi({ active: 2 });
  let slept = 0;
  await waitForSlot(config, { limit: 3, requestImpl, waitFor: async () => slept++ });
  assert.equal(slept, 0, "2 active is under a limit of 3");
});

test("a stalled queue fails loudly instead of waiting forever", async () => {
  // The real failure this catches: Jobs that are active but can never be scheduled.
  const requestImpl = fakeApi({ active: 1 });
  await assert.rejects(
    () =>
      waitForSlot(config, {
        limit: 1,
        requestImpl,
        pollMs: 1000,
        maxWaitMs: 3000,
        waitFor: async () => {},
      }),
    /queue stalled: 1 Job\(s\) still active/,
  );
});

test("the wait is announced once, not on every poll", async () => {
  const requestImpl = fakeApi({ active: 1 });
  const notices = [];
  await assert.rejects(
    () =>
      waitForSlot(config, {
        limit: 1,
        requestImpl,
        pollMs: 1000,
        maxWaitMs: 2000,
        waitFor: async () => {},
        onWait: (active, limit) => notices.push([active, limit]),
      }),
    /queue stalled/,
  );
  assert.deepEqual(notices, [[1, 1]], "logged once, not once per poll");
});

test("limit 0 or negative disables the queue", async () => {
  let called = false;
  const requestImpl = async () => {
    called = true;
    return { status: 200, body: { items: [] } };
  };
  await waitForSlot(config, { limit: 0, requestImpl });
  assert.equal(called, false, "a disabled queue must not poll the API");
});

test("an unreachable API server surfaces as an error, not a silent pass", async () => {
  const requestImpl = async () => {
    throw new Error("connect ECONNREFUSED 10.43.0.1:443");
  };
  await assert.rejects(() => waitForSlot(config, { limit: 1, requestImpl }), /ECONNREFUSED/);
});
