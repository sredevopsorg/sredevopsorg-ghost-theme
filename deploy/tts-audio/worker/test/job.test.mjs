import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * The synthesis job end to end, with every outside hop faked: Ghost over an injected
 * `fetch`, the model over `setSynthesizer`, the bucket over a recorder.
 *
 * What this pins is the decision table — which posts produce audio, which are skipped,
 * and whether a failed run can leave a post pointing at audio that is not there.
 */
const { runJob, postText } = await import("../src/job.mjs");
const { setSynthesizer } = await import("../src/tts.mjs");
const { buildMarker, setMarker } = await import("../src/markers.mjs");

const config = {
  ghostApiUrl: "https://ghost.test",
  adminKey: "id:secret",
  audioBaseUrl: "https://audio.test",
  bucket: "bucket",
  chunkChars: 350,
  gapMs: 0,
  voices: { en: { voice: "af_heart", speed: 1 }, es: { voice: "ef_dora", speed: 0.98 }, br: { voice: "pf_dora", speed: 0.98 } },
};

function post(overrides = {}) {
  return {
    id: "abc",
    slug: "mi-post",
    status: "published",
    updated_at: "2026-11-26T10:00:00.000Z",
    published_at: "2026-11-20T10:00:00.000Z",
    title: "Mi post",
    html: "<p>Kubernetes es el orquestador. Después viene otra oración.</p>",
    tags: [{ name: "es" }],
    codeinjection_foot: "",
    ...overrides,
  };
}

/**
 * Build a `fetch` that serves a post read, a PUT, and HEADs for the current file.
 * `head` says whether the marker's file still exists on the CDN.
 */
function ghostFetch({ post: current, head = true, putStatus = 200 }) {
  const calls = [];
  const impl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const response = (status, body) => ({
      ok: status >= 200 && status < 300,
      status,
      statusText: "",
      json: async () => body,
      text: async () => JSON.stringify(body),
    });

    if (String(url).includes("/ghost/api/admin/posts/")) {
      if (init.method === "PUT") {
        return response(putStatus, { posts: [JSON.parse(init.body).posts[0]] });
      }
      return response(200, { posts: [current] });
    }
    if (init.method === "HEAD") return { ok: head, status: head ? 200 : 404 };
    throw new Error(`unexpected request ${url}`);
  };
  impl.calls = calls;
  return impl;
}

/** A store that records uploads instead of writing them. */
function recorder() {
  const uploads = [];
  return {
    uploads,
    upload: async (path, buffer) => {
      uploads.push({ path, buffer });
      return { path, bytes: buffer.length };
    },
  };
}

/** Kokoro stand-in: one second of a quiet tone per chunk, so ffmpeg has real frames. */
function fakeSynth() {
  const seen = [];
  setSynthesizer((text, options) => {
    seen.push({ text, ...options });
    const samples = new Float32Array(24000);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.sin(i / 100) * 0.05;
    return samples;
  });
  return seen;
}

test("a published locale post becomes one MP3 plus a marker", async () => {
  const synths = fakeSynth();
  const store = recorder();
  let read = post();
  const fetchImpl = async (url, init = {}) => {
    if (init.method === "PUT") {
      // Record what the job wrote so a later assertion can inspect it.
      read = { ...read, codeinjection_foot: JSON.parse(init.body).posts[0].codeinjection_foot };
      return { ok: true, status: 200, json: async () => ({ posts: [read] }) };
    }
    return { ok: true, status: 200, json: async () => ({ posts: [read] }) };
  };

  const stats = await runJob({ postId: "abc", config, store, fetchImpl, log: () => {} });

  assert.equal(stats.result, "ok");
  assert.equal(stats.locale, "es");
  assert.equal(store.uploads.length, 1);
  assert.match(store.uploads[0].path, /^audio\/abc\/[0-9a-f]{16}\.mp3$/);
  assert.ok(store.uploads[0].buffer.length > 0);
  // The MP3 carries an ID3v2 header, so players get title and duration immediately.
  assert.equal(store.uploads[0].buffer.subarray(0, 3).toString("latin1"), "ID3");
  // The voice is the locale's, at the configured speed, and every chunk was spoken.
  assert.equal(synths.length, stats.chunks);
  assert.ok(synths.every((call) => call.voice === "ef_dora" && call.speed === 0.98));
  assert.match(read.codeinjection_foot, /name="sredevops:tts"/);
  assert.match(read.codeinjection_foot, /https:\/\/audio\.test\/audio\/abc\/[0-9a-f]{16}\.mp3/);
});

test("an up-to-date post is skipped without synthesising anything", async () => {
  const synths = fakeSynth();
  const store = recorder();
  // Compute the hash the job will compute, then present a current marker for it.
  const probe = await runJob({
    postId: "abc",
    config,
    store: recorder(),
    fetchImpl: ghostFetch({ post: post() }),
    log: () => {},
  });
  const marker = setMarker("", buildMarker({ hash: probe.hash, file: `https://audio.test/audio/abc/${probe.hash}.mp3`, voice: "ef_dora" }));
  synths.length = 0;

  const stats = await runJob({
    postId: "abc",
    config,
    store,
    fetchImpl: ghostFetch({ post: post({ codeinjection_foot: marker }) }),
    log: () => {},
  });

  assert.equal(stats.result, "skipped");
  assert.match(stats.reason, /already current/);
  assert.equal(store.uploads.length, 0);
  assert.equal(synths.length, 0);
});

test("a marker whose file disappeared is regenerated", async () => {
  const synths = fakeSynth();
  const store = recorder();
  const probe = await runJob({ postId: "abc", config, store: recorder(), fetchImpl: ghostFetch({ post: post() }), log: () => {} });
  const marker = setMarker("", buildMarker({ hash: probe.hash, file: `https://audio.test/audio/abc/${probe.hash}.mp3`, voice: "ef_dora" }));
  synths.length = 0;

  const stats = await runJob({
    postId: "abc",
    config,
    store,
    // HEAD answers 404: the lifecycle rule or a manual cleanup removed the object.
    fetchImpl: ghostFetch({ post: post({ codeinjection_foot: marker }), head: false }),
    log: () => {},
  });

  assert.equal(stats.result, "ok");
  assert.ok(synths.length > 0);
  assert.equal(store.uploads.length, 1);
});

test("ineligible posts are skipped, and nothing is uploaded or written", async () => {
  const cases = [
    [{ status: "draft" }, /status is draft/],
    [{ tags: [{ name: "news" }] }, /exactly one of/],
    [{ tags: [{ name: "es" }, { name: "en" }] }, /exactly one of/],
    [{ html: "<pre><code>kubectl get pods</code></pre>" }, /no spoken text/],
  ];
  for (const [overrides, reason] of cases) {
    const store = recorder();
    const fetchImpl = ghostFetch({ post: post(overrides) });
    const stats = await runJob({ postId: "abc", config, store, fetchImpl, log: () => {} });
    assert.equal(stats.result, "skipped", JSON.stringify(overrides));
    assert.match(stats.reason, reason);
    assert.equal(store.uploads.length, 0);
    assert.ok(!fetchImpl.calls.some((call) => call.init.method === "PUT"), "no marker write on a skip");
  }
});

test("a synthesis failure throws and writes no marker", async () => {
  setSynthesizer(() => {
    throw new Error("model exploded");
  });
  const store = recorder();
  const fetchImpl = ghostFetch({ post: post() });

  await assert.rejects(() => runJob({ postId: "abc", config, store, fetchImpl, log: () => {} }), /model exploded/);
  assert.equal(store.uploads.length, 0);
  assert.ok(!fetchImpl.calls.some((call) => call.init.method === "PUT"));
  setSynthesizer(null);
});

test("an upload failure throws and leaves the old marker in place", async () => {
  fakeSynth();
  const old = setMarker("", buildMarker({ hash: "ffffffffffffffff", file: "https://audio.test/audio/abc/ffffffffffffffff.mp3", voice: "ef_dora" }));
  const fetchImpl = ghostFetch({ post: post({ codeinjection_foot: old }), head: false });
  const store = {
    upload: async () => {
      throw new Error("bucket is gone");
    },
  };

  await assert.rejects(() => runJob({ postId: "abc", config, store, fetchImpl, log: () => {} }), /bucket is gone/);
  assert.ok(!fetchImpl.calls.some((call) => call.init.method === "PUT"), "the old audio stays advertised");
});

test("the caption is spoken first when it is not already in the body", () => {
  const { sentences } = postText({
    html: "<p>Primera oración del artículo.</p>",
    feature_image_caption: "Vista del evento en Santiago",
  });
  assert.deepEqual(sentences, ["Vista del evento en Santiago.", "Primera oración del artículo."]);

  const repeated = postText({
    html: "<p>Vista del evento en Santiago, con más gente.</p>",
    feature_image_caption: "Vista del evento en Santiago",
  });
  assert.deepEqual(repeated.sentences, ["Vista del evento en Santiago, con más gente."]);
});
