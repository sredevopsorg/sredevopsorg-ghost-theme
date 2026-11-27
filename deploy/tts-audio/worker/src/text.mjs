/**
 * Article text extraction for the audio job.
 *
 * This module must read an article **the way `TtsPlayer.jsx` reads it**, because the
 * Cloud TTS fallback synthesises from the DOM on the page and the pipeline synthesises
 * from stored HTML here. If the two disagree, the same post sounds different depending
 * on which path produced the audio, and the download file is not the file that plays.
 *
 * The rules, copied from `assets/js/islands/TtsPlayer.jsx` and the theme's markup:
 *
 *  1. Drop `pre, code, script, style, nav, .table-responsive` — code is unreadable
 *     aloud and tables read as noise.
 *  2. Insert a space after every block element. `textContent` concatenates without
 *     separators, so `<li>uno</li><li>dos</li>` would read "unodoss".
 *  3. Skip the feature-image caption when it repeats the opening of the body — Ghost
 *     frequently repeats the excerpt there and it would be said twice.
 *  4. Strip the audio marker itself, which lives in the code injection and is not part
 *     of the article.
 *
 * Unlike the browser path there is no per-sentence byte cap: the 610-byte Cloud TTS
 * sentence limit does not exist for a local model. Sentences are still split on the
 * same boundaries and terminated, because that is what gives Kokoro natural pauses and
 * what keeps the chunk boundaries identical between regenerations.
 */

import { MARKER_NAME } from "./markers.mjs";

/** Elements removed entirely, with their text. Mirrors `STRIP_SELECTOR`. */
const STRIP_SELECTOR = ["pre", "code", "script", "style", "nav", "figcaption", "table", "svg", "noscript"];

/**
 * Elements whose end is also a boundary. Mirrors `BLOCK_SELECTOR` in the island.
 * `figcaption` is stripped (above) rather than spaced: it is a caption, and the
 * picture it captions is not on the page the reader hears.
 */
const BLOCK_SELECTOR = [
  "p", "div", "li", "br", "tr", "td", "th", "dt", "dd",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "figcaption", "section", "article", "ul", "ol", "aside",
];

/** Inline elements that must not glue two words together. */
const INLINE_BREAKS = ["br"];

/**
 * Headings become their own sentence. The closing tag is what matters — the opening one
 * adds the same boundary, which a following collapse makes harmless.
 */
const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

const ENTITIES = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&#x27;": "'",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
};

/** Named and numeric entities a Ghost post can carry; unknown ones are left alone. */
export function decodeEntities(value) {
  return (value ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);
}

function safeCodePoint(code) {
  if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return "";
  // Surrogates are not characters: `String.fromCodePoint` returns a lone surrogate,
  // which reaches the tokenizer as an invalid sequence. U+FFFD keeps the position.
  if (code >= 0xd800 && code <= 0xdfff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** Remove every element in `STRIP_SELECTOR` together with its content. */
function stripElements(html) {
  let out = html ?? "";
  for (const tag of STRIP_SELECTOR) {
    const re = new RegExp(String.raw`<${tag}\b[^>]*>[\s\S]*?<\/${tag}>|<${tag}\b[^>]*\/?>`, "gi");
    out = out.replace(re, "");
  }
  return out;
}

/** Remove every tag from a fragment, so a heading's text can be measured and terminated. */
function stripTags(fragment) {
  return decodeEntities(String(fragment ?? "").replace(/<[^>]*>/g, " "));
}

/**
 * Turn stored post HTML into the text the reader would hear.
 *
 * Comments are removed first, so the marker (`<meta name="sredevops:tts">` in the code
 * injection) and Ghost's annotation spans cannot leak into the audio even when the
 * caller passes a full document rather than just `post.html`.
 */
export function htmlToText(html) {
  let out = html ?? "";
  out = out.replace(/<!--[\s\S]*?-->/g, " ");
  out = out.replace(new RegExp(String.raw`<meta[^>]*name="${MARKER_NAME}"[^>]*>`, "gi"), " ");
  out = stripElements(out);
  // Any remaining tag becomes a boundary only if it is a block; inline tags vanish so
  // `<em>uno</em>dos` stays "unodos", exactly as the browser path keeps it.
  // Headings are terminated while the tags are still in place, so the full stop lands
  // *inside* the heading rather than being stranded at the start of the block. A heading
  // without punctuation would otherwise fuse with the paragraph after it ("Qué es X Lorem
  // ipsum"), and the model would stress the wrong word.
  out = out.replace(
    new RegExp(`<(${HEADINGS.join("|")})\\b[^>]*>([\\s\\S]*?)</\\1>`, "gi"),
    (_match, tag, inner) => `<${tag}>${terminate(stripTags(inner))}</${tag}>`,
  );

  out = out.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (_tag, name) => {
    const lower = name.toLowerCase();
    if (BLOCK_SELECTOR.includes(lower) || INLINE_BREAKS.includes(lower)) return " ";
    return "";
  });
  out = decodeEntities(out);
  return normalise(out);
}

/**
 * Canonical whitespace/punctuation for speech.
 *
 * Every replacement here changes what the model *sees*, so it also changes the content
 * hash — which is the point: the hash covers the text that was spoken, not the HTML
 * that produced it, so an edit to markup that does not change the words does not
 * re-bill a synthesis.
 */
export function normalise(value) {
  return (value ?? "")
    // Quotes: typographic quotes are fine for the model, straight ones are clearer.
    .replace(/[\u201c\u201d\u00ab\u00bb]/g, '"')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    // Zero-width and soft-hyphen characters would otherwise reach the tokenizer.
    .replace(/[\u200b\u200c\u200d\u2060\ufeff\u00ad]/g, "")
    // A hyphen split across a line break re-joins the word.
    .replace(/(\p{L})-\s*\n\s*(\p{L})/gu, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Does this text already end a sentence, so it needs no added terminator? */
const ENDS_SENTENCE = /[.!?…]["'”’)\]]*$/;

/**
 * Split a run of text into sentences, keeping the terminator and trailing space with
 * the sentence they belong to. The regex is the one in `assets/js/lib/tts.js`, whose
 * unit tests pin it, so a change there is a change here.
 */
export function sentences(text) {
  const parts = [];
  let start = 0;
  for (const match of (text ?? "").matchAll(/[.!?…]+["'”’)\]]*\s+/g)) {
    const end = match.index + match[0].length;
    parts.push(text.slice(start, end));
    start = end;
  }
  if (start < text.length) parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Make a fragment a sentence boundary, so the model never merges it with the next. */
export function terminate(fragment) {
  const trimmed = (fragment ?? "").trim();
  if (!trimmed) return "";
  return ENDS_SENTENCE.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * Whole article → terminated sentences.
 *
 * Headings are spoken as their own sentence (a short pause after them), and an
 * all-caps or symbol-only run that would read as nothing is dropped rather than
 * synthesised as noise.
 */
export function articleSentences(html) {
  return sentences(htmlToText(html))
    .map(terminate)
    .filter((sentence) => /\p{L}/u.test(sentence));
}

/**
 * Batch sentences into model-sized chunks.
 *
 * Kokoro degrades on very long inputs and each call has a fixed cost, so sentences are
 * packed up to `maxChars` — an article becomes tens of calls instead of hundreds. The
 * cap is characters, not bytes: there is no byte limit to respect here.
 */
export function chunkSentences(list, maxChars = 350) {
  const chunks = [];
  let current = "";
  for (const sentence of list ?? []) {
    if (!sentence) continue;
    if (current && current.length + 1 + sentence.length > maxChars) {
      chunks.push(current);
      current = "";
    }
    current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Skip a caption that repeats the opening of the article.
 *
 * Ghost's feature-image caption often repeats the excerpt, and the excerpt is the
 * first paragraph, so it would be read twice. Compared on a normalised prefix rather
 * than equality: the caption is usually a truncated version of the same sentence.
 */
export function dedupeCaption(caption, bodyText, minChars = 40) {
  const clean = normalise(caption);
  if (!clean) return "";
  const body = normalise(bodyText).toLowerCase();
  const probe = clean.toLowerCase().slice(0, minChars);
  return probe && body.includes(probe) ? "" : clean;
}
