/**
 * Text preparation and voice selection for the TtsPlayer island.
 *
 * Kept free of DOM and network access so the risky part — staying under BOTH
 * Cloud TTS limits without corrupting multi-byte characters — is unit tested in
 * Node (tests/tts.test.mjs) instead of only in a browser.
 *
 * Two limits apply, and the second one is easy to miss:
 *
 *  1. A request may carry at most 5000 **bytes** (not characters), and the cap
 *     cannot be raised. Spanish and Portuguese accents cost two bytes each, so
 *     chunking on `String.length` overflows on exactly the /es/ and /br/ articles
 *     this theme publishes.
 *  2. A single **sentence** may not exceed roughly 610 bytes; past that the API
 *     answers 400 "This request contains sentences that are too long". This is
 *     undocumented and was found by probing the live endpoint. Article text read
 *     from the DOM can contain long unpunctuated runs (table cells, lists, inline
 *     code that was stripped), so sentences are bounded here as well.
 *
 * Everything is measured in UTF-8 bytes.
 */

/** Hard per-request limit for `text:synthesize`, in UTF-8 bytes. */
export const MAX_BYTES = 5000;

/**
 * Longest sentence to send, in UTF-8 bytes. Measured against the API: 610 bytes
 * of ordinary words passes, 620 fails. 400 leaves margin for other locales and
 * for word shapes that trip the limit sooner.
 */
export const MAX_SENTENCE_BYTES = 400;

/** Chirp 3: HD accepts a fixed voice-name shape: `{languageCode}-Chirp3-HD-{Name}`. */
const VOICE_NAME = "Leda";

/** Theme content key -> BCP-47 language code. Brazilian Portuguese is `br`, not `pt`. */
const LANGUAGE_BY_LOCALE = {
  en: "en-US",
  es: "es-US",
  br: "pt-BR",
};

const encoder = new TextEncoder();

/** Does this text already end a sentence, so it needs no added terminator? */
const ENDS_SENTENCE = /[.!?…]["'”’)\]]*$/;

/** A word that ends a clause: the preferred place to break an over-long sentence. */
const ENDS_CLAUSE = /[,;:—–]$/;

export function byteLength(value) {
  return encoder.encode(value).length;
}

/** Make a fragment a sentence boundary, so the API never merges it with the next. */
function terminate(fragment) {
  const trimmed = fragment.trim();
  if (!trimmed) return "";
  return ENDS_SENTENCE.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * Split a run of text into sentences, keeping the terminator and trailing space
 * with the sentence they belong to.
 *
 * Uses `matchAll` rather than a lookbehind split because lookbehind is still
 * missing in older Safari, where it throws at parse time and would break the
 * whole island chunk on load.
 */
function sentences(text) {
  const parts = [];
  let start = 0;
  for (const match of text.matchAll(/[.!?…]+["'”’)\]]*\s+/g)) {
    const end = match.index + match[0].length;
    parts.push(text.slice(start, end));
    start = end;
  }
  if (start < text.length) parts.push(text.slice(start));
  return parts;
}

/** Break one word (a URL, a base64 blob) into pieces under the budget, by code point. */
function splitWord(word, maxBytes) {
  const pieces = [];
  let slice = "";
  for (const char of Array.from(word)) {
    if (byteLength(slice) + byteLength(char) > maxBytes) {
      if (slice) pieces.push(slice);
      slice = "";
    }
    slice += char;
  }
  if (slice) pieces.push(slice);
  return pieces;
}

/**
 * Bound one sentence to `maxBytes`, breaking at clause punctuation when possible
 * and at word boundaries otherwise.
 *
 * Every returned piece is terminated, because pieces are packed back together
 * into a request later: joining unterminated fragments would recreate the very
 * over-long sentence this function exists to avoid.
 */
export function splitLongSentence(sentence, maxBytes = MAX_SENTENCE_BYTES) {
  // One byte is reserved for the terminator `terminate` may append, so a finished
  // piece can never exceed the budget it was measured against.
  const budget = Math.max(1, maxBytes - 1);
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  const pieces = [];
  let current = [];
  // Index within `current` just past the last clause-ending word, or -1.
  let clauseAt = -1;

  const emit = (upTo) => {
    const part = current.slice(0, upTo).join(" ");
    if (part) pieces.push(part);
    current = current.slice(upTo);
    clauseAt = -1;
  };

  for (const word of words) {
    if (byteLength(word) > budget) {
      if (current.length) emit(current.length);
      pieces.push(...splitWord(word, budget));
      continue;
    }

    const candidate = current.length ? `${current.join(" ")} ${word}` : word;
    if (byteLength(candidate) > budget) {
      // Prefer the last clause boundary, unless it would emit nothing.
      emit(clauseAt > 0 && clauseAt < current.length ? clauseAt : current.length);
    }

    current.push(word);
    if (ENDS_CLAUSE.test(word)) clauseAt = current.length;
  }

  if (current.length) emit(current.length);
  return pieces.map(terminate).filter(Boolean);
}

/**
 * Split article text into request-sized chunks, packing whole sentences where
 * they fit so the speech keeps its natural pauses.
 *
 * Sentences that pass `MAX_SENTENCE_BYTES` are first broken down (see
 * `splitLongSentence`), so no request can carry a sentence the API rejects.
 * Returns `[]` for text that is empty or whitespace only, which the island
 * treats as "nothing to read" rather than as a network error.
 */
export function chunkText(text, maxBytes = MAX_BYTES) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const units = sentences(clean).flatMap((sentence) =>
    byteLength(sentence) > MAX_SENTENCE_BYTES ? splitLongSentence(sentence) : [sentence.trim()],
  );

  const chunks = [];
  let current = "";

  for (const unit of units) {
    if (!unit) continue;

    if (current && byteLength(`${current} ${unit}`) > maxBytes) {
      chunks.push(current);
      current = "";
    }

    current = current ? `${current} ${unit}` : unit;
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Resolve the voice for a theme locale.
 *
 * `name` is overridable from the mount point so a voice can be swapped without
 * a JS edit; an unknown or absent locale falls back to English, matching the
 * theme's behaviour elsewhere.
 */
export function voiceFor(locale, name = VOICE_NAME) {
  const languageCode = LANGUAGE_BY_LOCALE[locale] ?? LANGUAGE_BY_LOCALE.en;
  return { languageCode, name: `${languageCode}-Chirp3-HD-${name}` };
}

/* --- Miniplayer helpers ---------------------------------------------------
 *
 * The player shows a timebar built from the chunk sequence (one chunk plays
 * after the other), a downloaded-file name, and the count of chunks that still
 * have to be synthesised. All of that is arithmetic on numbers and a Map, so it
 * lives here — free of DOM and network — and is unit tested in Node.
 */

/** Short language code used in the download file name. */
const FILENAME_LANG_BY_LOCALE = { en: "en", es: "es", br: "pt" };

/**
 * Media time as `m:ss`, or `h:mm:ss` past an hour.
 *
 * Non-finite or negative input — an MP3 whose duration is not known yet, an
 * empty session — renders `0:00` rather than `NaN:NaN`.
 */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/** Indexes of an article's chunks that the cache does not hold yet. */
export function missingIndexes(total, cached) {
  const missing = [];
  for (let index = 0; index < total; index += 1) {
    if (!cached?.has(index)) missing.push(index);
  }
  return missing;
}

/** How many chunks of an article are already cached. */
export function uniquePartsCount(total, cached) {
  return total - missingIndexes(total, cached).length;
}

/**
 * Download file name for a generated article audio: `<slug>-<lang>.mp3`.
 *
 * The slug is reduced to `[a-z0-9-]` so the browser cannot be handed a path or
 * an odd Unicode name; an empty result falls back to `article`.
 */
export function trackArtifactName({ slug, locale } = {}) {
  const safeSlug =
    String(slug ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "article";
  const lang = FILENAME_LANG_BY_LOCALE[locale] ?? FILENAME_LANG_BY_LOCALE.en;
  return `${safeSlug}-${lang}.mp3`;
}
