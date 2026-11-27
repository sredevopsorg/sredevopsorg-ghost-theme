import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Hash and job-name rules.
 *
 * The hash decides whether a post is re-synthesised, so its inputs are the property
 * worth pinning: a voice or speed change **is** a re-synthesis (the audio would differ),
 * while a change that does not reach the spoken words — markup, whitespace, a skipped
 * caption — is not. Getting this backwards either bills every keystroke or serves audio
 * in the previous voice.
 */
const { contentHash, jobName } = await import("../src/hash.mjs");

const base = { voice: "ef_dora", speed: 0.98, text: "Una oración sobre Kubernetes. Otra más." };

test("the same text, voice and speed hash the same", () => {
  assert.equal(contentHash(base), contentHash({ ...base }));
});

test("a voice or a speed change produces a different hash", () => {
  assert.notEqual(contentHash(base), contentHash({ ...base, voice: "em_alex" }));
  assert.notEqual(contentHash(base), contentHash({ ...base, speed: 1 }));
});

test("a text change produces a different hash", () => {
  assert.notEqual(contentHash(base), contentHash({ ...base, text: `${base.text} Y una nueva.` }));
});

test("field boundaries cannot be shifted to collide", () => {
  // Without separators, ("ab","c") and ("a","bc") would hash identically.
  const a = contentHash({ voice: "a", speed: 1, text: "bc" });
  const b = contentHash({ voice: "ab", speed: 1, text: "c" });
  assert.notEqual(a, b);
});

test("the hash is 16 lowercase hex characters", () => {
  assert.match(contentHash(base), /^[0-9a-f]{16}$/);
});

test("job names are valid RFC 1123 labels and stay within 63 characters", () => {
  const name = jobName("66f1a2b3c4d5e6f7a8b9c0d1", "0123456789abcdef");
  assert.match(name, /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
  assert.ok(name.length <= 63);
  assert.equal(name, "tts-66f1a2b3c4d5e6f7a8b9c0d1-0123456789");
});

test("a hostile or empty post id cannot produce an invalid job name", () => {
  assert.match(jobName("../../etc/PASSWD", "abcd"), /^tts-[a-z0-9-]+-abcd$/);
  assert.equal(jobName("", ""), "tts-post");
  assert.ok(jobName("x".repeat(200), "y".repeat(40)).length <= 63);
});
