import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for the download assembly half of the TTS island
 * (assets/js/lib/audio.js).
 *
 * The download saves the article as one MP3 by concatenating the chunk Blobs in
 * play order, so what matters is that no byte is dropped, reordered or padded,
 * and that an empty session produces an empty file rather than throwing.
 */
const { concatAudioBlobs } = await import("../assets/js/lib/audio.js");

const bytes = async (blob) => Array.from(new Uint8Array(await blob.arrayBuffer()));

test("chunks are concatenated in order, byte for byte", async () => {
  const first = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mpeg" });
  const second = new Blob([new Uint8Array([4, 5])], { type: "audio/mpeg" });
  const third = new Blob([new Uint8Array([6])], { type: "audio/mpeg" });

  const joined = await concatAudioBlobs([first, second, third], "audio/mpeg");

  assert.equal(joined.type, "audio/mpeg");
  assert.deepEqual(await bytes(joined), [1, 2, 3, 4, 5, 6]);
});

test("an empty or missing chunk list makes an empty audio blob", async () => {
  assert.deepEqual(await bytes(await concatAudioBlobs([])), []);
  assert.deepEqual(await bytes(await concatAudioBlobs(undefined)), []);
});

test("missing entries are skipped, not written as gaps", async () => {
  const first = new Blob([new Uint8Array([9, 9])], { type: "audio/mpeg" });
  const joined = await concatAudioBlobs([first, null, first], "audio/mpeg");

  assert.deepEqual(await bytes(joined), [9, 9, 9, 9]);
});
