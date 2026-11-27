import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Ghost client + webhook decisions.
 *
 * Everything here is driven through an injected `fetch`: these tests pin how the pipeline
 * reads a post, which pays for a re-read after a 409, which payloads are ignored, and
 * what the receiver does on delete/unpublish — none of which can be exercised against a
 * real Ghost in CI.
 */
const {
  localeOf,
  markdownToHtml,
  markerIsCurrent,
  mdUrl,
  parseMarkdown,
  readPost,
  verifyRepresentations,
  webhookSnapshot,
  writeCodeInjection,
} = await import("../src/ghost.mjs");
const { decide, handleDelivery, verifySignature } = await import("../src/receiver.mjs");
const { createHmac } = await import("node:crypto");

const config = {
  ghostApiUrl: "https://ghost.test",
  adminKey: "id:secret",
  audioBaseUrl: "https://audio.test",
  webhookSecret: "s3cret",
  siteUrl: "https://site.test",
};

/** A fetch stub: each call gets the next queued response. */
function fetchQueue(responses) {
  const calls = [];
  const impl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw new Error(`unexpected request ${url}`);
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      statusText: next.statusText ?? "",
      json: async () => next.body,
      text: async () => next.text ?? JSON.stringify(next.body),
    };
  };
  impl.calls = calls;
  return impl;
}

test("locale is the single public locale tag, and never a guess", () => {
  assert.equal(localeOf([{ name: "es" }, { name: "news" }]), "es");
  assert.equal(localeOf([{ name: "br", visibility: "public" }]), "br");
  assert.equal(localeOf([{ name: "en" }, { name: "es" }]), null, "two locales cannot be one voice");
  assert.equal(localeOf([{ name: "news" }]), null);
  // A `#hash` tag is not a locale, even when it is named like one.
  assert.equal(localeOf([{ name: "#es" }]), null);
  assert.equal(localeOf([{ name: "es", visibility: "internal" }]), null);
  assert.equal(localeOf(undefined), null);
});

test("the .md URL is the post's public path, not its API path", () => {
  assert.equal(mdUrl("https://site.test/", "/mi-post"), "https://site.test/mi-post/.md");
  assert.equal(mdUrl("https://site.test", "mi-post"), "https://site.test/mi-post/.md");
});

test("readPost asks the Admin API for both formats and keeps the stored post", async () => {
  const fetchImpl = fetchQueue([
    { status: 200, body: { posts: [{ id: "abc", slug: "s", html: "<p>x</p>", markdown: "# x" }] } },
  ]);
  const { post, source } = await readPost(config, "abc", { fetchImpl });

  const request = fetchImpl.calls[0];
  assert.match(request.url, /\/ghost\/api\/admin\/posts\/abc\/\?formats=html,md$/);
  assert.equal(request.init.headers.Authorization, "Ghost id:secret");
  assert.equal(source, "admin");
  assert.equal(post.slug, "s");
});

test("readPost falls back to the public .md when no key is configured", async () => {
  const md = '---\n{"slug":"s","title":"T"}\n---\n# Hola\n\nTexto del artículo.';
  const fetchImpl = fetchQueue([{ status: 200, text: md }]);
  const { post, source } = await readPost({ ...config, adminKey: "", ghostApiUrl: "" }, "s", { fetchImpl });

  assert.equal(source, "md");
  assert.equal(post.slug, "s");
  assert.match(post.html, /<h1>Hola<\/h1>/);
  assert.match(post.html, /<p>Texto del artículo\.<\/p>/);
  assert.equal(fetchImpl.calls[0].url, "https://site.test/s/.md");
});

test("a Ghost error surfaces its own message", async () => {
  const fetchImpl = fetchQueue([{ status: 404, body: { errors: [{ message: "Resource not found" }] } }]);
  await assert.rejects(() => readPost(config, "nope", { fetchImpl }), /Ghost 404: Resource not found/);
});

test("writeCodeInjection sends only the injection and the version it read", async () => {
  const fetchImpl = fetchQueue([{ status: 200, body: { posts: [{ id: "abc" }] } }]);
  await writeCodeInjection(config, { id: "abc", updated_at: "2026-11-26T10:00:00.000Z" }, "new foot", { fetchImpl });

  const request = fetchImpl.calls[0];
  assert.equal(request.init.method, "PUT");
  assert.match(request.url, /\?source=html$/);
  const body = JSON.parse(request.init.body);
  assert.deepEqual(Object.keys(body.posts[0]).sort(), ["codeinjection_foot", "updated_at"]);
  assert.equal(body.posts[0].codeinjection_foot, "new foot");
});

test("a 409 re-reads the post and writes once more with the fresh version", async () => {
  const fetchImpl = fetchQueue([
    { status: 409, body: { errors: [{ message: "Saving failed! Someone else is editing this post." }] } },
    { status: 200, body: { posts: [{ id: "abc", updated_at: "2026-11-26T11:00:00.000Z" }] } },
    { status: 200, body: { posts: [{ id: "abc" }] } },
  ]);
  await writeCodeInjection(config, { id: "abc", updated_at: "2026-11-26T10:00:00.000Z" }, "foot", { fetchImpl });

  assert.equal(fetchImpl.calls.length, 3);
  assert.equal(JSON.parse(fetchImpl.calls[2].init.body).posts[0].updated_at, "2026-11-26T11:00:00.000Z");
});

test("the marker is current only when the hash matches and the file still exists", async () => {
  const marker = { hash: "abc", file: "https://audio.test/audio/p/abc.mp3" };

  assert.equal(await markerIsCurrent(config, null, "abc", { fetchImpl: async () => ({ ok: true }) }), false);
  assert.equal(await markerIsCurrent(config, marker, "other", { fetchImpl: async () => ({ ok: true }) }), false);
  // A marker pointing at another host is not trusted, even with the right hash.
  assert.equal(
    await markerIsCurrent(config, { ...marker, file: "https://evil.test/x.mp3" }, "abc", { fetchImpl: async () => ({ ok: true }) }),
    false,
  );
  // A deleted object (lifecycle rule, manual cleanup) forces a regeneration.
  assert.equal(await markerIsCurrent(config, marker, "abc", { fetchImpl: async () => ({ ok: false }) }), false);
  assert.equal(
    await markerIsCurrent(config, marker, "abc", {
      fetchImpl: async () => {
        throw new Error("network down");
      },
    }),
    false,
    "an unreachable file must regenerate, not assume the audio is there",
  );

  let seen = null;
  const ok = await markerIsCurrent(config, marker, "abc", {
    fetchImpl: async (url, init) => {
      seen = { url, init };
      return { ok: true };
    },
  });
  assert.equal(ok, true);
  assert.equal(seen.init.method, "HEAD");
});

test("markdown frontmatter is JSON, and the body is converted to the same element names", () => {
  const { frontmatter, body } = parseMarkdown('---\n{"slug":"s","title":"T"}\n---\n## H\n\n- uno\n- dos\n');
  assert.equal(frontmatter.slug, "s");
  assert.match(markdownToHtml(body), /<h2>H<\/h2>/);
  assert.match(markdownToHtml(body), /<ul>\s*<li>uno<\/li>\s*<li>dos<\/li>\s*<\/ul>/);
  // Markdown without frontmatter is body only, not an error.
  assert.deepEqual(parseMarkdown("# Solo"), { frontmatter: {}, body: "# Solo" });
  assert.match(markdownToHtml("```\nkubectl\n```"), /<pre><code>/);
  assert.match(markdownToHtml("[texto](https://x.test)"), /<p>texto<\/p>/);
  assert.match(markdownToHtml('![alt](https://x.test/i.png)'), /^<p>\s*<\/p>$/);
});

test("representation drift is reported only for fields that disagree", () => {
  assert.deepEqual(verifyRepresentations({ slug: "s", title: "T" }, { slug: "s", title: "T" }), []);
  assert.deepEqual(verifyRepresentations({ slug: "a" }, { slug: "b" }), [{ field: "slug", md: "a", admin: "b" }]);
  // A field absent on one side is not a disagreement.
  assert.deepEqual(verifyRepresentations({}, { slug: "b" }), []);
});

test("a webhook payload is reduced to the facts the receiver needs", () => {
  const snapshot = webhookSnapshot({
    event: "post.published.edited",
    post: {
      current: { id: "abc", slug: "s", status: "published", content_hash: "h2", tags: [{ name: "es" }] },
      previous: { id: "abc", content_hash: "h1" },
    },
  });
  assert.equal(snapshot.locale, "es");
  assert.equal(snapshot.contentHash, "h2");
  assert.equal(snapshot.previousHash, "h1");
  assert.equal(snapshot.deleted, false);
  assert.equal(webhookSnapshot({}), null);
});

test("decisions: only a published, single-locale, changed post creates work", () => {
  const edited = (overrides = {}) =>
    decide({
      event: "post.published.edited",
      post: {
        current: {
          id: "abc",
          status: "published",
          content_hash: "h2",
          tags: [{ name: "es" }],
          ...overrides,
        },
        previous: { id: "abc", content_hash: "h1" },
      },
    });

  assert.equal(edited().action, "create");
  assert.equal(edited({ content_hash: "h1" }).action, "ignore", "a re-save is not an edit");
  assert.equal(edited({ tags: [{ name: "news" }] }).action, "ignore");
  assert.equal(edited({ status: "draft" }).action, "unwrap");
  assert.equal(decide({ event: "post.deleted", post: { previous: { id: "abc", tags: [{ name: "es" }] } } }).action, "unwrap");
  assert.equal(decide({ event: "post.unpublished", post: { current: { id: "abc", status: "draft", tags: [] } } }).action, "unwrap");
  assert.equal(decide({}).action, "ignore");
});

test("a create decision becomes a Job with a deterministic name, and a duplicate is fine", async () => {
  const payload = {
    event: "post.published.edited",
    post: { current: { id: "abc", status: "published", content_hash: "deadbeef00", tags: [{ name: "br" }] } },
  };
  const created = [];
  const createJob = async (_config, { postId, hash }) => {
    created.push({ postId, hash });
    return "created";
  };

  const result = await handleDelivery({ payload, config, createJob });
  assert.equal(result.status, 202);
  assert.deepEqual(created, [{ postId: "abc", hash: "deadbeef00" }]);

  const duplicate = await handleDelivery({ payload, config, createJob: async () => "exists" });
  assert.equal(duplicate.status, 202);
  assert.equal(duplicate.body.result, "exists");
});

test("an ignored delivery never touches the cluster", async () => {
  let called = false;
  const result = await handleDelivery({
    payload: { event: "post.published.edited", post: { current: { id: "abc", status: "published", tags: [{ name: "news" }] } } },
    config,
    createJob: async () => {
      called = true;
    },
  });
  assert.equal(result.status, 202);
  assert.equal(called, false);
});

test("unpublish clears the marker and the objects, then drops the Job", async () => {
  const seen = {};
  const result = await handleDelivery({
    payload: {
      event: "post.deleted",
      post: { previous: { id: "abc", tags: [{ name: "es" }], codeinjection_foot: "<meta name=\"sredevops:tts\" content='{\"v\":1}'>" } },
    },
    config,
    unwrap: async (snapshot) => {
      seen.id = snapshot.id;
      return { marker: "removed", objects: 3 };
    },
    removeJob: async (_config, id) => {
      seen.job = id;
      return "deleted";
    },
  });
  assert.equal(result.body.marker, "removed");
  assert.equal(result.body.objects, 3);
  assert.deepEqual(seen, { id: "abc", job: "abc" });
});

test("a failing unwrap is logged, not returned as a 500 to Ghost", async () => {
  const result = await handleDelivery({
    payload: { event: "post.deleted", post: { previous: { id: "abc", tags: [{ name: "es" }] } } },
    config,
    unwrap: async () => {
      throw new Error("GCS down");
    },
    removeJob: async () => "deleted",
  });
  assert.equal(result.status, 202);
  assert.equal(result.body.marker, "failed");
});

test("the signature check follows Ghost's scheme and rejects replays", () => {
  const body = Buffer.from('{"hello":"world"}');
  const t = Math.floor(Date.now() / 1000);
  const good = createHmac("sha256", "s3cret").update(`${t}.`).update(body).digest("hex");
  const header = `sha256=${good}, t=${t}`;

  assert.equal(verifySignature({ header, rawBody: body, secret: "s3cret" }).ok, true);
  assert.equal(verifySignature({ header, rawBody: body, secret: "wrong" }).ok, false);
  assert.equal(verifySignature({ header, rawBody: Buffer.from("{}"), secret: "s3cret" }).ok, false);
  assert.equal(verifySignature({ header: undefined, rawBody: body, secret: "s3cret" }).ok, false);
  assert.equal(verifySignature({ header, rawBody: body, secret: "" }).ok, false);
  assert.match(verifySignature({ header: "garbage", rawBody: body, secret: "s3cret" }).reason, /malformed/);

  // Five minutes of skew is tolerated; six is a replay.
  const stale = t - 600;
  const staleHeader = `sha256=${createHmac("sha256", "s3cret").update(`${stale}.`).update(body).digest("hex")}, t=${stale}`;
  assert.match(verifySignature({ header: staleHeader, rawBody: body, secret: "s3cret" }).reason, /stale/);
});

test("a payload without content_hash still gets a unique job name per delivery", async () => {
  // Two edits of the same post, no content_hash in either payload: a constant fallback
  // would make the second Job name collide with the first and be dropped as "exists".
  const payloadAt = (updated_at) => ({
    event: "post.published.edited",
    post: { current: { id: "abc", status: "published", updated_at, tags: [{ name: "es" }] } },
  });
  const created = [];
  const createJob = async (_config, { postId, hash }) => {
    created.push({ postId, hash });
    return "created";
  };

  await handleDelivery({ payload: payloadAt("2026-11-26T10:00:00.000Z"), config, createJob });
  await handleDelivery({ payload: payloadAt("2026-11-26T12:00:00.000Z"), config, createJob });

  assert.equal(created.length, 2);
  assert.notEqual(created[0].hash, created[1].hash);
  assert.match(created[0].hash, /^e[0-9a-f]{9}$/);
});

test("a rejected Admin key is reported as an auth failure, not a bad request", async () => {
  // Ghost answers a revoked key with 400 INVALID_JWT, which reads like a malformed query.
  // Both the post client and the backfill listing must say what to do about it.
  const wrongKey = {
    status: 400,
    statusText: "Bad Request",
    json: async () => ({ errors: [{ message: "Invalid token", code: "INVALID_JWT" }] }),
    text: async () => "",
  };
  const fetchImpl = async () => wrongKey;

  await assert.rejects(() => readPost(config, "abc", { fetchImpl }), /Admin API key was rejected/);
});

test("the backfill listing names the failing key on INVALID_JWT", async () => {
  const { backfill } = await import("../src/backfill.mjs");
  const wrongKey = {
    status: 400,
    statusText: "Bad Request",
    ok: false,
    json: async () => ({ errors: [{ message: "Invalid token", code: "INVALID_JWT" }] }),
  };
  // The first listing request fails, so `backfill` reports through its own log and exits 1.
  const lines = [];
  const code = await backfill({ config, log: (line) => lines.push(line), fetchImpl: async () => wrongKey });
  assert.equal(code, 1);
  const joined = lines.join("\n");
  assert.match(joined, /INVALID_JWT/);
  // The key id is named so an operator can tell *which* integration to regenerate. This
  // config's key is `id:s`, so the id is `id`.
  assert.match(joined, /key id id\)/);
  assert.match(joined, /regenerate its Admin API key/);
  // And the run ends with a structured line rather than an escaping exception.
  assert.match(joined, /"result":"failed"/);
});
