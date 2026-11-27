/**
 * Kokoro inference, with a phonemizer that actually covers the three locales.
 *
 * ## Why this does not use `kokoro-js`'s `generate()`
 *
 * `kokoro-js` is a solid convenience wrapper, but its **voice table is English-only**
 * (`af_*`, `am_*`, `bf_*`, `bm_*` — 28 voices), and `_validate_voice` throws for every
 * other name, including the Spanish (`ef_dora`) and Brazilian Portuguese (`pf_dora`)
 * voices this publication needs. Its phonemizer is worse: it delegates to `phonemizer`,
 * whose bundled espeak build only carries **English** language data, and it hard-codes
 * `language = "en"` regardless of the voice. So a Spanish post through `generate()`
 * either throws or comes out in English phonetics — measured, not assumed.
 *
 * The *model* is multilingual: the ONNX weights and the 115-symbol phoneme vocabulary
 * are the same ones the upstream Python package uses for every language. The only thing
 * missing is text → IPA. So this module does the three steps itself:
 *
 *   1. **phonemize** with `espeak-ng` (Debian's full language data: 100+ languages),
 *   2. **tokenize** the IPA with the shipped tokenizer,
 *   3. **run** the ONNX session, picking the voice style row exactly as the upstream
 *      implementation does (`256 * (len - 2)`).
 *
 * This is the same pipeline `misaki[es]`/`misaki[pt]` uses upstream, minus the Python.
 *
 * ## Throughput
 *
 * Measured on a 2-vCPU container, packing whole sentences into ~450-character chunks:
 * **~8 characters of article per second of CPU**, plus ~10 s of model load per Job. That
 * is the number that sizes the Job — a 10k-character post is ~20 minutes — so the job
 * template asks for 4 CPUs (roughly halving it) and allows an hour. Threading barely
 * moved single-chunk throughput (4.5 -> 4.9 chars/s from 1 to 2 threads); chunk size
 * matters far more, because cost tracks audio length rather than call count.
 *
 * The consequences worth knowing:
 *  - The IPA comes from espeak-ng's *phonemic* mode. Upstream's Spanish/Portuguese G2P is
 *    more careful about numbers, dates and proper nouns; `text.mjs` already expands the
 *    constructs that matter most, and the results were judged by ear (see README).
 *  - espeak-ng's ES/PT output contains an invisible U+200D joiner (e.g. `a‍ɪ`). It is **not**
 *    in Kokoro's vocabulary, so `filterPhonemes` drops it before tokenizing. The diphthong
 *    survives because the orthographic spelling is what misaki produces too; the joiner is
 *    an espeak artefact, not part of the phoneme the model was trained on.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { SAMPLE_RATE } from "./config.mjs";

const run = promisify(execFile);

/** Directory the image bakes the model into. */
export const MODEL_DIR = process.env.KOKORO_MODEL_DIR ?? "/models";

/** Kokoro style tensors are 256 floats per row, 510 rows (one per padded length). */
const STYLE_DIM = 256;
const MAX_STYLE_ROW = 509;

/**
 * espeak-ng language for a theme content key.
 *
 * `br` is Brazilian Portuguese — espeak-ng has a dedicated `pt-br` voice; plain `pt`
 * is European Portuguese and produces different vowels and a different `r`.
 */
export const ESPEAK_LANG = { en: "en-us", es: "es", br: "pt-br" };

let runtime = null;
let phonemeCache = null;

/**
 * Load the model, tokenizer and voice tensors once per process.
 *
 * `@huggingface/transformers` is imported lazily: the webhook shares this image and must
 * not load an ONNX runtime into a pod that only answers webhooks.
 */
export async function loadModel({ dir = MODEL_DIR, dtype = process.env.KOKORO_DTYPE ?? "q8" } = {}) {
  if (runtime) return runtime;

  runtime = (async () => {
    const { StyleTextToSpeech2Model, AutoTokenizer, Tensor } = await import("@huggingface/transformers");
    const { existsSync } = await import("node:fs");

    for (const required of ["onnx/model_quantized.onnx", "tokenizer.json", "tokenizer_config.json"]) {
      if (!existsSync(join(dir, required))) {
        throw new Error(`Kokoro model missing: ${join(dir, required)}`);
      }
    }

    const [model, tokenizer] = await Promise.all([
      StyleTextToSpeech2Model.from_pretrained(dir, { dtype }),
      AutoTokenizer.from_pretrained(dir),
    ]);

    // Kokoro expects the phoneme ids **unpadded**: the style row is picked from the raw
    // length, which is how the upstream implementation does it.
    if (tokenizer.pad_token === undefined) {
      throw new Error("tokenizer has no pad token; the model directory is incomplete");
    }

    return { model, tokenizer, Tensor, dir };
  })();

  return runtime;
}

/** Which style row a padded phoneme length maps to. Mirrors upstream exactly. */
export function styleOffset(length) {
  return STYLE_DIM * Math.min(Math.max(length - 2, 0), MAX_STYLE_ROW);
}

/** Read a voice tensor once and keep it; they are ~2 MB each and never change. */
async function voiceData(dir, voice) {
  phonemeCache ??= new Map();
  if (phonemeCache.has(voice)) return phonemeCache.get(voice);

  const buf = await readFile(join(dir, "voices", `${voice}.bin`));
  if (buf.byteLength % 4 !== 0) {
    throw new Error(`voice ${voice} is not a float32 tensor (${buf.byteLength} bytes)`);
  }
  const data = new Float32Array(buf.byteLength / 4);
  for (let i = 0; i < data.length; i += 1) data[i] = buf.readFloatLE(i * 4);

  if (data.length !== STYLE_DIM * 510) {
    throw new Error(`voice ${voice} has ${data.length} floats, expected ${STYLE_DIM * 510}`);
  }
  phonemeCache.set(voice, data);
  return data;
}

/**
 * Text → IPA with espeak-ng.
 *
 * `--ipa=3` is the espeak-ng-documented combined phoneme output (segments plus ties and
 * stress), which is what Kokoro's vocabulary is built from. Not every phoneme espeak can
 * emit is in that vocabulary, so the result is filtered against it — an unknown symbol
 * would be tokenized to the unknown token and spoken as noise.
 */
export async function phonemize(text, locale) {
  const lang = ESPEAK_LANG[locale] ?? ESPEAK_LANG.en;
  try {
    const { stdout } = await run("espeak-ng", ["-q", "--ipa=3", "-v", lang, text], {
      maxBuffer: 8 * 1024 * 1024,
    });
    return normaliseIpa(stdout);
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error("espeak-ng is not installed in this image; cannot phonemize");
    }
    throw new Error(`espeak-ng failed for ${lang}: ${err.message}`);
  }
}

/**
 * Clean espeak-ng's output into the phoneme stream Kokoro was trained on.
 *
 * The joins are the interesting part: espeak separates words with newlines, and an
 * unhandled newline inside a phoneme string becomes the vertical-tab symbol that is *in*
 * the vocabulary (id for `\u21b5`-like separators), which the model reads as a hard break
 * mid-sentence.
 */
export function normaliseIpa(raw) {
  return (raw ?? "")
    .replace(/\r/g, "")
    // One space between words; a newline would be a phoneme, not whitespace.
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    // espeak may emit a bare language-switch marker or bracketed hints.
    .replace(/_/g, "")
    .trim();
}

/**
 * Filter a phoneme string to the symbols the tokenizer knows.
 *
 * Returns the filtered string and the dropped symbols so the caller can log them: a
 * symbol silently vanishing turns into a missing syllable, which is hard to notice by ear
 * but obvious in a log.
 */
export function filterPhonemes(ipa, vocab) {
  const dropped = new Set();
  let out = "";
  for (const char of ipa) {
    if (char === " " || vocab.has(char)) out += char;
    else dropped.add(char);
  }
  return { ipa: out.replace(/\s+/g, " ").trim(), dropped: [...dropped] };
}

/**
 * Test seam: replace the model with a function of `(text, { voice, speed, locale })`.
 *
 * The job and the audio pipeline are tested without an ONNX session or a 92 MB download;
 * the real model is covered by `test/smoke.mjs` in the built image instead.
 */
let synthesizer = null;

export function setSynthesizer(fn) {
  synthesizer = fn;
}

/**
 * Synthesise one chunk and return raw 32-bit float PCM (mono, 24 kHz).
 */
export async function synthesizePcm(text, { voice, speed = 1, locale = "en", speech }) {
  if (speech) return speech(text, { voice, speed, locale });
  if (synthesizer) return synthesizer(text, { voice, speed, locale });

  const { model, tokenizer, Tensor, dir } = await loadModel();
  const rawIpa = await phonemize(text, locale);

  // `tokenizer.model.vocab` is keyed by *numeric id*; the symbol -> id map is
  // `tokens_to_ids`. Using the wrong one silently drops every phoneme.
  const vocab = new Set(tokenizer.model.tokens_to_ids.keys());
  const { ipa, dropped } = filterPhonemes(rawIpa, vocab);
  if (dropped.length) {
    console.warn(`[tts] phonemes not in the vocabulary, dropped: ${dropped.join(" ")}`);
  }
  if (!ipa) return new Float32Array(0);

  const { input_ids } = tokenizer(ipa, { truncation: true });
  const length = input_ids.dims.at(-1);
  const styles = await voiceData(dir, voice);
  const offset = styleOffset(length);
  const style = styles.slice(offset, offset + STYLE_DIM);

  const { waveform } = await model({
    input_ids,
    style: new Tensor("float32", style, [1, STYLE_DIM]),
    speed: new Tensor("float32", [speed], [1]),
  });

  const samples = waveform.data;
  return samples instanceof Float32Array ? samples : Float32Array.from(samples);
}

/**
 * Synthesise a whole article chunk by chunk, in order.
 *
 * `onProgress` reports `{ index, total }` so a long post shows progress in the log; the
 * text itself is never logged, because it is the article.
 */
export async function synthesizeArticle(chunks, { voice, speed, locale, onProgress = () => {}, signal, speech }) {
  const parts = [];
  for (const [index, chunk] of chunks.entries()) {
    if (signal?.aborted) throw new Error("aborted");
    const pcm = await synthesizePcm(chunk, { voice, speed, locale, speech });
    if (pcm.length === 0) throw new Error(`chunk ${index} produced no audio: ${JSON.stringify(chunk.slice(0, 60))}`);
    parts.push(pcm);
    onProgress({ index, total: chunks.length, chars: chunk.length });
  }
  return { parts, sampleRate: SAMPLE_RATE };
}
