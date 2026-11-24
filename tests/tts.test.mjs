import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for the text-preparation half of the TTS island
 * (assets/js/lib/tts.js).
 *
 * The island itself needs a browser and a Google Cloud key; what is worth
 * pinning down here is what Cloud TTS rejects at runtime with a 400:
 *
 *  - requests over 5000 UTF-8 bytes (the request cap), and
 *  - sentences over ~610 bytes (an undocumented per-sentence cap).
 *
 * Both limits were measured against the live API, and both are easy to violate
 * with real articles: accented Spanish doubles the byte cost, and DOM text can
 * contain long runs without any sentence punctuation.
 */
const {
  MAX_BYTES,
  MAX_SENTENCE_BYTES,
  byteLength,
  chunkText,
  formatDuration,
  missingIndexes,
  splitLongSentence,
  trackArtifactName,
  uniquePartsCount,
  voiceFor,
} = await import("../assets/js/lib/tts.js");

const article = (n) =>
  Array.from({ length: n }, (_, i) => `Oración número ${i} sobre Kubernetes y SRE con métricas.`).join(" ");

/** Sentence sizes of a chunk, the way the API splits them: on terminal punctuation. */
const sentenceSizes = (chunk) =>
  chunk
    .split(/(?<=[.!?…])\s+/)
    .filter(Boolean)
    .map(byteLength);

const assertWithinLimits = (chunks) => {
  for (const chunk of chunks) {
    assert.ok(byteLength(chunk) <= MAX_BYTES, `chunk is ${byteLength(chunk)}B, over the request cap`);
    for (const size of sentenceSizes(chunk)) {
      assert.ok(
        size <= MAX_SENTENCE_BYTES,
        `a sentence is ${size}B, over the ${MAX_SENTENCE_BYTES}B per-sentence cap`,
      );
    }
  }
};

test("chunkText returns nothing for empty or blank input", () => {
  assert.deepEqual(chunkText(""), []);
  assert.deepEqual(chunkText("   \n\t "), []);
  assert.deepEqual(chunkText(undefined), []);
});

test("short text stays a single request", () => {
  const chunks = chunkText("DevOpsDays llega a Chile.");
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], "DevOpsDays llega a Chile.");
});

test("no chunk exceeds the request or sentence limits", () => {
  const chunks = chunkText(article(200));
  assert.ok(chunks.length > 1, "expected the article to be split");
  assertWithinLimits(chunks);
});

test("accented Spanish stays under the limit where characters would not", () => {
  // 3000 accented characters are 6000 bytes: fine by String.length, over the
  // cap in bytes. This is the case that would fail in production on /es/.
  const chunks = chunkText("á".repeat(3000));
  assertWithinLimits(chunks);
  assert.ok(chunks.length >= 2, "expected the accent-heavy text to be split");
});

test("a long unpunctuated run is bounded, not sent as one sentence", () => {
  // What the API rejects: 2000 bytes with no sentence punctuation, as produced
  // by table cells or a list whose markup carries no full stops.
  const run = Array.from({ length: 200 }, (_, i) => `palabra${i}`).join(" ");
  assert.ok(byteLength(run) > 1500);

  const chunks = chunkText(run);
  assertWithinLimits(chunks);
  // Every piece must end a sentence, or the API would merge it with the next.
  for (const chunk of chunks) assert.match(chunk, /[.!?…]$/);
});

test("splitLongSentence breaks at clause punctuation when it can", () => {
  const sentence =
    "Primero preparamos el clúster, después instalamos el operador, " +
    "luego configuramos los secretos, y finalmente desplegamos la aplicación " +
    "en el namespace de producción con las réplicas necesarias para soportar la carga.";

  const pieces = splitLongSentence(sentence, 80);
  assert.ok(pieces.length > 1);
  for (const piece of pieces) {
    assert.ok(byteLength(piece) <= 80, `piece is ${byteLength(piece)}B`);
    assert.match(piece, /[.!?…]$/, "each piece must terminate a sentence");
  }
});

test("splitLongSentence leaves a sentence already under budget alone", () => {
  assert.deepEqual(splitLongSentence("Una frase corta."), ["Una frase corta."]);
});

test("chunks never split a multi-byte sequence", () => {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const text = "ñ".repeat(4000) + " " + "🚀".repeat(1000);
  for (const chunk of chunkText(text)) {
    assert.doesNotThrow(
      () => decoder.decode(new TextEncoder().encode(chunk)),
      "chunk is invalid UTF-8",
    );
  }
});

test("chunking preserves every word in order", () => {
  const source = article(120);
  const words = (s) => s.replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/);
  assert.deepEqual(
    words(chunkText(source).join(" ")),
    words(source),
    "no word may be dropped or reordered",
  );
});

test("a single oversized token is broken up, not dropped", () => {
  const url = `https://example.test/${"a".repeat(12000)}`;
  const chunks = chunkText(url);

  assertWithinLimits(chunks);
  // The splitter inserts sentence terminators, so compare without punctuation.
  const letters = chunks.join("").replace(/[^a-z]/gi, "");
  assert.equal(letters, url.replace(/[^a-z]/gi, ""));
});

test("chunk boundaries prefer sentence ends", () => {
  const chunks = chunkText(article(80));
  for (const chunk of chunks.slice(0, -1)) {
    assert.match(chunk, /[.!?…]$/, `chunk should end on a sentence boundary: ...${chunk.slice(-24)}`);
  }
});

test("voiceFor maps theme locales to Chirp 3: HD voice names", () => {
  assert.deepEqual(voiceFor("en"), { languageCode: "en-US", name: "en-US-Chirp3-HD-Leda" });
  assert.deepEqual(voiceFor("es"), { languageCode: "es-US", name: "es-US-Chirp3-HD-Leda" });
  assert.deepEqual(voiceFor("br"), { languageCode: "pt-BR", name: "pt-BR-Chirp3-HD-Leda" });
  assert.deepEqual(voiceFor("pt"), { languageCode: "en-US", name: "en-US-Chirp3-HD-Leda" });
  assert.deepEqual(voiceFor(undefined), { languageCode: "en-US", name: "en-US-Chirp3-HD-Leda" });
  assert.deepEqual(voiceFor("es", "Charon"), { languageCode: "es-US", name: "es-US-Chirp3-HD-Charon" });
});

test("formatDuration renders media time and never NaN", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(5), "0:05");
  assert.equal(formatDuration(65), "1:05");
  assert.equal(formatDuration(3599), "59:59");
  assert.equal(formatDuration(3600), "1:00:00");
  assert.equal(formatDuration(-3), "0:00");
  assert.equal(formatDuration(undefined), "0:00");
  assert.equal(formatDuration(Number.NaN), "0:00");
  assert.equal(formatDuration(Number.POSITIVE_INFINITY), "0:00");
});

test("cache helpers count the chunks of an article", () => {
  const cache = new Map([
    [0, "a"],
    [2, "c"],
  ]);
  assert.deepEqual(missingIndexes(4, cache), [1, 3]);
  assert.deepEqual(missingIndexes(4, new Map()), [0, 1, 2, 3]);
  assert.deepEqual(missingIndexes(0, cache), []);
  assert.equal(uniquePartsCount(4, cache), 2);
  assert.equal(uniquePartsCount(4, new Map()), 0);
});

test("trackArtifactName builds a safe locale-aware file name", () => {
  assert.equal(
    trackArtifactName({ slug: "kubernetes-en-chile", locale: "es" }),
    "kubernetes-en-chile-es.mp3",
  );
  assert.equal(
    trackArtifactName({ slug: "DevOps Days: Santiago!", locale: "en" }),
    "devops-days-santiago-en.mp3",
  );
  assert.equal(trackArtifactName({ slug: "Año luz", locale: "br" }), "ano-luz-pt.mp3");
  assert.equal(trackArtifactName({ slug: undefined, locale: "es" }), "article-es.mp3");
  assert.equal(trackArtifactName({ slug: "post", locale: "pt" }), "post-en.mp3");
  assert.equal(trackArtifactName(), "article-en.mp3");
});
