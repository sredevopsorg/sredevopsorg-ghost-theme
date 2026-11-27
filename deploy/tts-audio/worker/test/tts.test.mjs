import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Phonemization and the phoneme filter — the part of the synthesis path that decides
 * *what the model hears*.
 *
 * This module exists because `kokoro-js` cannot do Spanish or Portuguese: its voice table
 * is English-only and its bundled `phonemizer` carries English language data only. The
 * functions here are pure precisely so the two mistakes that would silently produce
 * wrong-language audio — a wrong espeak language and a wrong vocabulary lookup — are
 * pinned without loading a 92 MB model.
 */
const { ESPEAK_LANG, filterPhonemes, normaliseIpa, phonemize, styleOffset } = await import("../src/tts.mjs");

test("each theme locale maps to the right espeak-ng language", () => {
  assert.equal(ESPEAK_LANG.en, "en-us");
  assert.equal(ESPEAK_LANG.es, "es");
  // `br` is Brazilian Portuguese. Plain `pt` is European Portuguese and produces
  // different vowels and a different rhotic.
  assert.equal(ESPEAK_LANG.br, "pt-br");
});

test("espeak output is flattened to one line of phonemes", () => {
  // espeak separates words with newlines; a newline inside the tokenizer input becomes a
  // real symbol, not whitespace, and the model reads it as a hard break.
  assert.equal(normaliseIpa("ˈola\nel kˌuβeɾnˈetes\n"), "ˈola el kˌuβeɾnˈetes");
  assert.equal(normaliseIpa("a\r\n\r\nb"), "a b");
  assert.equal(normaliseIpa("  many   spaces  "), "many spaces");
  assert.equal(normaliseIpa(null), "");
});

test("phonemes outside the vocabulary are dropped and reported", () => {
  // A representative slice of Kokoro's 115-symbol vocabulary.
  const vocab = new Set(["h", "ə", "l", "ˈ", "o", " ", "ɾ", "e", "s", "k", "u", "β", "n", "t", "a"]);

  const kept = filterPhonemes("ˈola el kˌuβeɾnˈetes", vocab);
  // Only `ˌ` (secondary stress) is missing from this vocabulary; every other symbol in
  // the Spanish phonemization survives — including the flap `ɾ`, the bilabial `β` and the
  // stress mark, which are exactly what makes it sound Spanish and not English.
  assert.equal(kept.ipa, "ˈola el kuβeɾnˈetes");
  assert.deepEqual(kept.dropped, ["ˌ"]);

  // Nothing in the vocab at all: an empty string, not a throw — the caller turns that
  // into a loud per-chunk error instead of synthesising silence.
  assert.deepEqual(filterPhonemes("✗✗✗", vocab), { ipa: "", dropped: ["✗"] });
});

test("the filter keeps spaced separators and collapses what is left", () => {
  const vocab = new Set(["a", "b", "ˈ"]);
  assert.equal(filterPhonemes("a  b  a", vocab).ipa, "a b a");
  assert.deepEqual(filterPhonemes("  a  ", vocab).dropped, []);
});

test("the voice style row follows the upstream formula", () => {
  // Kokoro selects one of 510 style rows by padded length: 256 * (len - 2), clamped.
  assert.equal(styleOffset(2), 0);
  assert.equal(styleOffset(10), 256 * 8);
  assert.equal(styleOffset(1), 0, "a length below the floor must not index backwards");
  assert.equal(styleOffset(0), 0);
  // Beyond the table: clamped to the last row, never out of bounds.
  assert.equal(styleOffset(600), 256 * 509);
});

test("phonemize reports a missing espeak-ng instead of a cryptic spawn error", async () => {
  // The image always has espeak-ng; a developer machine or a slim base does not. The
  // message has to say so, because the symptom (no audio) does not point at it.
  const original = process.env.PATH;
  process.env.PATH = "/nonexistent-for-the-duration-of-this-test";
  try {
    await assert.rejects(() => phonemize("hola", "es"), /espeak-ng is not installed/);
  } finally {
    process.env.PATH = original;
  }
});
