/**
 * Audio assembly: N float32 PCM chunks → **one** MP3 file.
 *
 * Two properties matter, and both are the reason this is not the browser's approach:
 *
 *  1. **One encoder, one frame stream.** The reader may seek anywhere in the article,
 *     so the file must be a single valid MP3 rather than a byte concatenation of
 *     independently encoded chunks (which the old browser download did, because the
 *     chunks came from Cloud TTS with identical settings). Here each chunk is its own
 *     ffmpeg WAV, and one final ffmpeg pass encodes the whole article, inserting the
 *     inter-chunk silence in the same pass.
 *
 *  2. **Known duration.** The final file carries ID3v2.3 tags and an `Xing`/`Info`
 *     header, so a player shows the full length the moment it loads instead of reading
 *     frames to discover it. The old reader had to guess chunk lengths (the README's
 *     "length appears a moment later" caveat).
 *
 * Everything is pure argument construction plus two `save*` helpers, so the argv can be
 * unit tested without running ffmpeg.
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";

/** Mono, 96 kbps — Cloud TTS's MP3 output is roughly this, and speech needs no more. */
export const MP3_BITRATE = "96k";

/** Silence inserted between two model chunks, which already contain their own padding. */
export const DEFAULT_GAP_MS = 240;

/** Encode raw float32 PCM (mono) straight to an MP3 file. */
export function pcmToMp3Args({ input, output, sampleRate, bitrate = MP3_BITRATE }) {
  return [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "f32le",
    "-ar", String(sampleRate),
    "-ac", "1",
    "-i", input,
    "-c:a", "libmp3lame",
    "-b:a", bitrate,
    "-ar", String(sampleRate),
    "-ac", "1",
    output,
  ];
}

/** Generate a silent MP3 of `ms` milliseconds. */
export function silenceMp3Args({ output, sampleRate, ms, bitrate = MP3_BITRATE }) {
  const seconds = Math.max(0, ms) / 1000;
  return [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi",
    "-i", `anullsrc=r=${sampleRate}:cl=mono`,
    "-t", seconds.toFixed(3),
    "-c:a", "libmp3lame",
    "-b:a", bitrate,
    "-ac", "1",
    output,
  ];
}

/**
 * Concatenate MP3 files (all from the same encoder) and tag the result.
 *
 * `-c copy` keeps every frame as encoded; only the container-level tags and the
 * Xing header are added. `-id3v2_version 3` is what the widest range of players reads,
 * and `-write_xing 1` is the frame count that makes the duration exact.
 */
export function concatMp3Args({ list, output, tags }) {
  const args = [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "concat", "-safe", "0",
    "-i", list,
    "-c", "copy",
  ];
  const map = [
    ["title", tags?.title],
    ["artist", tags?.artist],
    ["album", tags?.album],
    ["date", tags?.date],
    ["genre", tags?.genre],
    ["comment", tags?.comment],
  ];
  for (const [key, value] of map) {
    if (value) args.push("-metadata", `${key}=${value}`);
  }
  args.push("-id3v2_version", "3", "-write_xing", "1", "-f", "mp3", output);
  return args;
}

/**
 * ffmpeg's concat demuxer takes a text file with one `file '<path>'` per input.
 *
 * Paths are single-quoted, and a single quote inside a path is written by ending the
 * quote, escaping it and reopening — the demuxer's documented escaping. The temp
 * directory is ours, but escaping anyway keeps a future caller from depending on that.
 */
export function concatList(entries) {
  return `${(entries ?? [])
    .map((file) => `file '${String(file).replace(/'/g, "'\\''")}'`)
    .join("\n")}\n`;
}

/**
 * Run ffmpeg with the given argv, buffering stderr for the error message.
 *
 * Resolves to `{ code, stderr }` and never rejects on a non-zero exit: callers decide
 * what a failure means, and an unexpected rejection in a Job would lose the message.
 */
export function runFfmpeg(args, { spawnImpl = spawn } = {}) {
  return new Promise((resolve) => {
    let stderr = "";
    const child = spawnImpl("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    child.stderr?.on("data", (chunk) => {
      if (stderr.length < 8192) stderr += chunk.toString();
    });
    child.on("error", (err) => resolve({ code: -1, stderr: err.message }));
    child.on("close", (code) => resolve({ code: code ?? -1, stderr: stderr.trim() }));
  });
}

/** Write one Float32Array as a raw f32le file ffmpeg can read. */
export async function writePcm(path, samples) {
  await writeFile(path, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
}

/**
 * Full pipeline: chunk PCM in, one tagged MP3 out (`path`).
 *
 * Files live in a fresh temp directory under $TMPDIR (an `emptyDir` in the Job), so a
 * failed run leaves nothing behind for the next one.
 */
export async function encodeArticle({
  parts,
  sampleRate,
  output,
  tags,
  gapMs = DEFAULT_GAP_MS,
  workDir,
  log = () => {},
}) {
  if (!parts?.length) throw new Error("no audio parts to encode");
  const dir = workDir ?? (await mkdtemp(join(tmpdir(), "tts-audio-")));

  try {
    const segments = [];
    for (const [index, samples] of parts.entries()) {
      const pcm = join(dir, `part-${String(index).padStart(4, "0")}.f32`);
      const mp3 = join(dir, `part-${String(index).padStart(4, "0")}.mp3`);
      await writePcm(pcm, samples);
      const result = await runFfmpeg(pcmToMp3Args({ input: pcm, output: mp3, sampleRate }));
      if (result.code !== 0) throw new Error(`ffmpeg failed encoding part ${index}: ${result.stderr}`);
      segments.push(mp3);
    }

    if (gapMs > 0 && segments.length > 1) {
      const silence = join(dir, "gap.mp3");
      const gap = await runFfmpeg(silenceMp3Args({ output: silence, sampleRate, ms: gapMs }));
      if (gap.code !== 0) throw new Error(`ffmpeg failed generating silence: ${gap.stderr}`);
      // Interleave, never trailing: a trailing silence only pads the end of the file.
      const withGaps = [];
      for (const [index, segment] of segments.entries()) {
        if (index > 0) withGaps.push(silence);
        withGaps.push(segment);
      }
      segments.length = 0;
      segments.push(...withGaps);
    }

    const list = join(dir, "concat.txt");
    await writeFile(list, concatList(segments));
    const joined = join(dir, "joined.mp3");
    const result = await runFfmpeg(concatMp3Args({ list, output: joined, tags }));
    if (result.code !== 0) throw new Error(`ffmpeg failed joining ${segments.length} segments: ${result.stderr}`);

    const buffer = await readFile(joined);
    if (output) await writeFile(output, buffer);
    log(`encoded ${parts.length} chunks → ${buffer.length} bytes`);
    return buffer;
  } finally {
    if (!workDir) await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Read the duration of an MP3 with ffprobe. Used by the smoke test and the structured
 * log; a missing duration (ffprobe absent) is not an error.
 */
export function probeDuration(file) {
  return new Promise((resolve) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1",
      file,
    ], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout?.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.on("error", () => resolve(null));
    child.on("close", () => {
      const value = Number.parseFloat(out.trim());
      resolve(Number.isFinite(value) ? value : null);
    });
  });
}

/** A Writable that discards input; keeps a future streaming path from buffering. */
export const discard = () => new Writable({ write(_chunk, _enc, done) { done(); } });
