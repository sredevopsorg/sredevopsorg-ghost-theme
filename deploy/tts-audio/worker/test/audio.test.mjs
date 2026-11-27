import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * ffmpeg argv construction.
 *
 * Nothing here runs ffmpeg: what can silently break is the argument *shape* — a missing
 * `-write_xing` means the player re-learns the duration by reading frames, a wrong
 * `-id3v2_version` makes some players ignore the tags, and an unescaped path in the
 * concat list makes ffmpeg read the wrong file or die on a quote.
 */
import { EventEmitter } from "node:events";

const { MP3_BITRATE, concatList, concatMp3Args, encodeArticle, pcmToMp3Args, runFfmpeg, silenceMp3Args } =
  await import("../src/audio.mjs");

const valueAfter = (args, flag) => args[args.indexOf(flag) + 1];

test("PCM is read as raw float32 mono at the model's sample rate", () => {
  const args = pcmToMp3Args({ input: "/tmp/a.f32", output: "/tmp/a.mp3", sampleRate: 24000 });
  assert.equal(valueAfter(args, "-f"), "f32le");
  assert.equal(valueAfter(args, "-ar"), "24000");
  assert.equal(valueAfter(args, "-ac"), "1");
  assert.equal(valueAfter(args, "-c:a"), "libmp3lame");
  assert.equal(valueAfter(args, "-b:a"), MP3_BITRATE);
  assert.equal(args.at(-1), "/tmp/a.mp3");
});

test("silence is generated for the requested duration", () => {
  const args = silenceMp3Args({ output: "/tmp/gap.mp3", sampleRate: 24000, ms: 240 });
  assert.equal(valueAfter(args, "-t"), "0.240");
  assert.match(valueAfter(args, "-i"), /anullsrc=r=24000:cl=mono/);
  // A negative or zero gap must not produce a negative duration ffmpeg rejects.
  assert.equal(valueAfter(silenceMp3Args({ output: "x", sampleRate: 24000, ms: -5 }), "-t"), "0.000");
});

test("the final file is tagged and carries a duration header", () => {
  const args = concatMp3Args({
    list: "/tmp/list.txt",
    output: "/tmp/out.mp3",
    tags: { title: "Título", artist: "SREDevOps.org", date: "2026-11-26" },
  });
  assert.equal(valueAfter(args, "-f"), "concat");
  // `-c copy` is what keeps the encoded frames untouched.
  assert.equal(valueAfter(args, "-c"), "copy");
  assert.equal(valueAfter(args, "-write_xing"), "1");
  assert.equal(valueAfter(args, "-id3v2_version"), "3");
  assert.ok(args.includes("title=Título"));
  assert.ok(args.includes("artist=SREDevOps.org"));
  // No tag for an absent value: `-metadata title=` would write an empty frame.
  assert.ok(!args.some((arg) => arg.startsWith("comment=")));
});

test("the concat list escapes quotes and stays one entry per line", () => {
  const list = concatList(["/tmp/part-0000.mp3", "/tmp/it's.mp3"]);
  assert.equal(list, "file '/tmp/part-0000.mp3'\nfile '/tmp/it'\\''s.mp3'\n");
  assert.equal(concatList([]), "\n");
  assert.equal(concatList(undefined), "\n");
});

test("runFfmpeg reports a non-zero exit instead of rejecting", async () => {
  const spawnFail = () => {
    const child = new EventEmitter();
    child.stderr = new EventEmitter();
    setImmediate(() => {
      child.stderr.emit("data", Buffer.from("boom"));
      child.emit("close", 2);
    });
    return child;
  };
  const result = await runFfmpeg(["-version"], { spawnImpl: spawnFail });
  assert.equal(result.code, 2);
  assert.equal(result.stderr, "boom");
});

test("encoding with no parts is a loud error, not an empty file", async () => {
  await assert.rejects(() => encodeArticle({ parts: [], sampleRate: 24000 }), /no audio parts/);
});

