import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Node-pool placement for the Jobs the receiver stamps.
 *
 * The template in `tts-job-template` carries an empty `nodeSelector: {}`; the receiver
 * fills it from its own `NODE_POOL` environment. These tests pin the two behaviours that
 * matter: a configured pool reaches the Job, and an unconfigured one removes the field
 * rather than leaving `node-pool: ""` behind — an empty value is a selector that matches
 * no node, so the Job would sit Pending forever instead of running anywhere.
 *
 * The values are captured by injecting a fake API request, so nothing here needs a cluster.
 */
const { createPostJob } = await import("../src/k8s.mjs");
const { baseConfig } = await import("../src/config.mjs");

const template = {
  apiVersion: "batch/v1",
  kind: "Job",
  metadata: { generateName: "tts-", labels: {} },
  spec: {
    template: {
      spec: {
        nodeSelector: {},
        restTemplate: false,
        containers: [{ name: "worker", image: "${IMAGE}" }],
      },
    },
  },
};

/** Run createPostJob against a recorder and return the manifest that would be POSTed. */
async function captured(config) {
  let sent;
  const requestImpl = async (method, path, { body }) => {
    sent = body;
    return { status: 201, body: {} };
  };
  await createPostJob(
    { namespace: "tts-audio", image: "ghcr.io/x/y:tag", ...config },
    { postId: "abc123", hash: "deadbeefcafe", template: structuredClone(template), requestImpl },
  );
  return sent;
}

test("a configured node pool lands on the Job", async () => {
  const job = await captured({ nodePool: "dsh", nodePoolLabel: "dsh.sredevops.org/node-pool" });
  assert.deepEqual(job.spec.template.spec.nodeSelector, { "dsh.sredevops.org/node-pool": "dsh" });
});

test("an empty node pool removes the selector instead of pinning an empty value", async () => {
  const job = await captured({ nodePool: "", nodePoolLabel: "dsh.sredevops.org/node-pool" });
  assert.equal("nodeSelector" in job.spec.template.spec, false);
});

test("a custom pool label is honoured", async () => {
  const job = await captured({ nodePool: "arm64", nodePoolLabel: "example.com/pool" });
  assert.deepEqual(job.spec.template.spec.nodeSelector, { "example.com/pool": "arm64" });
});

test("the receiver still honours a template with no nodeSelector block", async () => {
  const noSelector = structuredClone(template);
  delete noSelector.spec.template.spec.nodeSelector;
  let sent;
  await createPostJob(
    { namespace: "tts-audio", image: "ghcr.io/x/y:tag", nodePool: "dsh", nodePoolLabel: "p" },
    {
      postId: "abc123",
      hash: "deadbeefcafe",
      template: noSelector,
      requestImpl: async (m, p, { body }) => {
        sent = body;
        return { status: 201, body: {} };
      },
    },
  );
  // Not invented out of thin air: a template without the block stays that way.
  assert.equal("nodeSelector" in sent.spec.template.spec, false);
});

test("config reads NODE_POOL and defaults the label", () => {
  const previous = { pool: process.env.NODE_POOL, label: process.env.NODE_POOL_LABEL };
  try {
    delete process.env.NODE_POOL_LABEL;
    process.env.NODE_POOL = "dsh";
    let config = baseConfig();
    assert.equal(config.nodePool, "dsh");
    assert.equal(config.nodePoolLabel, "dsh.sredevops.org/node-pool");

    delete process.env.NODE_POOL;
    config = baseConfig();
    assert.equal(config.nodePool, "");
  } finally {
    if (previous.pool === undefined) delete process.env.NODE_POOL;
    else process.env.NODE_POOL = previous.pool;
    if (previous.label === undefined) delete process.env.NODE_POOL_LABEL;
    else process.env.NODE_POOL_LABEL = previous.label;
  }
});
