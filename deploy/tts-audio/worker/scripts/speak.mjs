#!/usr/bin/env node
/**
 * Speak one sentence with the real model, into a file. The `make dev-synth` entrypoint.
 *
 * This exists so the Spanish and Portuguese voices can be judged by ear **before** the
 * pipeline is deployed, and again whenever a voice or speed changes: Kokoro's es/pt
 * voices are not the Chirp 3: HD voice this publication used, and nobody should discover
 * that from the live site.
 *
 *   docker run --rm -e TEXT="Hola mundo" -e LOCALE=es -v $PWD/.dev-out:/out \
 *     -w /app tts-audio-runner:dev node scripts/speak.mjs
 *
 * Variables: TEXT (required), LOCALE (en|es|br, default es), VOICE (override), SPEED,
 * OUT (file name inside /out, default sample.mp3), GAP_MS between two sentence runs.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DEFAULT_VOICES, SAMPLE_RATE } from "../src/config.mjs";
import { chunkSentences, articleSentences } from "../src/text.mjs";
import { synthesizeArticle } from "../src/tts.mjs";
import { encodeArticle, probeDuration } from "../src/audio.mjs";

const text = process.env.TEXT;
if (!text) {
  process.stderr.write("speak: set TEXT\n");
  process.exit(2);
}

const locale = process.env.LOCALE ?? "es";
const fallback = DEFAULT_VOICES[locale] ?? DEFAULT_VOICES.en;
const voice = process.env.VOICE ?? fallback.voice;
const speed = Number(process.env.SPEED ?? fallback.speed);
const outDir = process.env.OUT_DIR ?? "/out";
const out = process.env.OUT ?? "sample.mp3";

// The same chunking the job uses, so a sample sounds like the real thing: sentences are
// converted from the raw text rather than from HTML here, which is the only difference.
const sentences = articleSentences(text.replace(/\n+/g, " "));
const chunks = chunkSentences(sentences.length ? sentences : [text], 350);

process.stderr.write(`speak: ${locale}/${voice} at ${speed}x, ${chunks.length} chunk(s)\n`);
const started = Date.now();
const { parts } = await synthesizeArticle(chunks, { voice, speed });
const ttsMs = Date.now() - started;

const buffer = await encodeArticle({
  parts,
  sampleRate: SAMPLE_RATE,
  gapMs: Number(process.env.GAP_MS ?? 240),
  tags: { title: "sample", artist: "SREDevOps.org", comment: `voice=${voice} speed=${speed}` },
});

await mkdir(outDir, { recursive: true });
const target = join(outDir, out);
await writeFile(target, buffer);
const duration = await probeDuration(target);

process.stderr.write(
  `speak: ${target} — ${buffer.length} bytes, ${duration ? `${duration.toFixed(1)}s` : "duration unknown"}, ` +
    `synthesis ${ttsMs} ms, ${(text.length / (ttsMs / 1000)).toFixed(0)} chars/s\n`,
);
