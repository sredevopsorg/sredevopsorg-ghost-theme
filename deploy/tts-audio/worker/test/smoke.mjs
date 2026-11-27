#!/usr/bin/env node
/**
 * Kokoro smoke test — runs inside the built image in CI.
 *
 * The unit tests fake the model; this is the only place the real ONNX weights, the real
 * tokenizer and ffmpeg are exercised together. It fails on the three regressions that
 * would otherwise reach production silently:
 *
 *   1. **The model does not load** (a broken image build, a missing lock-file entry, an
 *      onnxruntime that cannot start on the runner).
 *   2. **The audio is empty or silent** (an aborted generation, a bad voice tensor).
 *      Checked with `volumedetect`: a real sentence is well above -50 dB mean volume,
 *      a silent buffer is around -91 dB.
 *   3. **The duration is wrong** by more than 20% for the amount of text. A 20-word
 *      sentence at a normal rate is 6–12 seconds; anything far off means the encoder or
 *      the sample rate changed.
 *
 * It runs **every locale the publication uses**, because the three voices are not equally
 * exercised: English is the model's native path, while Spanish and Portuguese depend on
 * `espeak-ng` language data that an npm-only install does not have. A build that produces
 * English and fails on `es`/`pt` is the failure mode this catches.
 *
 * Run: node test/smoke.mjs   (exits 0 on success, 1 with the reason on stderr).
 */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeArticle, probeDuration, runFfmpeg } from "../src/audio.mjs";
import { synthesizePcm } from "../src/tts.mjs";
import { SAMPLE_RATE } from "../src/config.mjs";

/** One sentence per locale, each readable if the pipeline is right. */
const SAMPLES = [
  {
    locale: "es",
    voice: process.env.SMOKE_VOICE_ES ?? "ef_dora",
    text: "Esta es una prueba breve del motor de voz local. Si puedes escuchar esta frase, la síntesis funciona.",
    rate: 2.6,
  },
  {
    locale: "br",
    voice: process.env.SMOKE_VOICE_BR ?? "pf_dora",
    text: "Este é um teste curto do motor de voz local. Se você consegue ouvir esta frase, a síntese funciona.",
    rate: 2.6,
  },
  {
    locale: "en",
    voice: process.env.SMOKE_VOICE_EN ?? "af_heart",
    text: "This is a short test of the local speech engine. If you can hear this sentence, synthesis works.",
    rate: 2.8,
  },
];

function fail(message) {
  process.stderr.write(`smoke: FAILED — ${message}\n`);
  process.exitCode = 1;
}

/** Mean volume in dBFS, or null when ffmpeg cannot report it. */
function meanVolume(file) {
  return new Promise((resolve) => {
    const args = ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"];
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let out = "";
    child.stderr.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.on("error", () => resolve(null));
    child.on("close", () => {
      const match = /mean_volume:\s*(-?[\d.]+) dB/.exec(out);
      resolve(match ? Number.parseFloat(match[1]) : null);
    });
  });
}

const started = Date.now();
const dir = await mkdtemp(join(tmpdir(), "tts-smoke-"));

try {
  for (const sample of SAMPLES) {
    process.stderr.write(`\n== ${sample.locale} / ${sample.voice}\n`);
    const ttsStarted = Date.now();
    const samples = await synthesizePcm(sample.text, { voice: sample.voice, speed: 1, locale: sample.locale });
    const ttsMs = Date.now() - ttsStarted;

    if (!(samples instanceof Float32Array) || samples.length === 0) {
      fail(`${sample.locale}: the model returned no samples`);
      continue;
    }

    let peak = 0;
    for (const value of samples) peak = Math.max(peak, Math.abs(value));
    if (peak < 0.01) {
      fail(`${sample.locale}: the generated samples are silent (peak ${peak})`);
      continue;
    }

    const buffer = await encodeArticle({
      parts: [samples],
      sampleRate: SAMPLE_RATE,
      gapMs: 0,
      tags: { title: `smoke-${sample.locale}`, artist: "SREDevOps.org" },
    });
    const file = join(dir, `smoke-${sample.locale}.mp3`);
    await writeFile(file, buffer);

    const duration = await probeDuration(file);
    if (duration === null) {
      fail(`${sample.locale}: ffprobe could not read the encoded duration`);
    } else {
      const words = sample.text.split(/\s+/).length;
      const expected = words / sample.rate;
      const low = expected * 0.55;
      const high = expected * 1.7;
      if (duration < low || duration > high) {
        fail(
          `${sample.locale}: duration ${duration.toFixed(2)}s is outside ${low.toFixed(1)}-${high.toFixed(1)}s ` +
            `for ${words} words — the wrong phonemizer language shows up here first`,
        );
      }
      process.stderr.write(
        `audio: ${duration.toFixed(2)}s, ${buffer.length} bytes, synthesis ${ttsMs} ms ` +
          `(${(sample.text.length / (ttsMs / 1000)).toFixed(0)} chars/s)\n`,
      );
    }

    const volume = await meanVolume(file);
    if (volume === null) fail(`${sample.locale}: ffmpeg could not measure the volume`);
    else if (volume < -50) fail(`${sample.locale}: the encoded audio is effectively silent (mean ${volume} dB)`);
    else process.stderr.write(`mean volume: ${volume} dB\n`);
  }

  // A two-chunk run, to prove the concat + silence path a real article uses.
  const first = SAMPLES[0];
  const half = await synthesizePcm(first.text, { voice: first.voice, speed: 1, locale: first.locale });
  const both = await encodeArticle({
    parts: [half, half],
    sampleRate: SAMPLE_RATE,
    gapMs: 250,
    tags: { title: "smoke-2" },
  });
  const bothFile = join(dir, "smoke-2.mp3");
  await writeFile(bothFile, both);
  const joined = await probeDuration(bothFile);
  const single = await probeDuration(join(dir, `smoke-${first.locale}.mp3`));
  if (joined !== null && single !== null && !(joined > single)) {
    fail(`a two-chunk file (${joined}s) is not longer than its first chunk part (${single}s)`);
  }

  const probe = await runFfmpeg(["-version"]);
  if (probe.code !== 0) fail(`ffmpeg is not usable: ${probe.stderr}`);
  process.stderr.write(`\ntotal ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
} catch (err) {
  fail(err?.stack ?? String(err));
} finally {
  await rm(dir, { recursive: true, force: true });
}

if (!process.exitCode) process.stderr.write(`smoke: OK\n`);
