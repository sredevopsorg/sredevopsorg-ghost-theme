/**
 * Content hash for the skip-if-current check.
 *
 * The hash covers **what is spoken**: the normalised sentences, the voice and the
 * speaking speed. It deliberately does not cover the HTML, the title or the excerpt —
 * an edit that changes only markup (a class, a link target, a caption that is skipped)
 * must not re-synthesise the article, because a synthesis is ~1–2 CPU-minutes and the
 * point of the pipeline is that it only runs when the words change.
 */

import { createHash } from "node:crypto";

/** How many hex characters go into the object name and the marker. 64 bits. */
const HASH_CHARS = 16;

/**
 * @param {object} input
 * @param {string} input.voice  Kokoro voice id, e.g. `ef_dora`. A voice change is a re-synthesis.
 * @param {number} input.speed  Speaking rate. A speed change is a re-synthesis too.
 * @param {string} input.text   Normalised article text (the joined sentences).
 */
export function contentHash({ voice, speed, text }) {
  const digest = createHash("sha256");
  // Field separators, so `voice="a", text="bc"` cannot collide with `voice="ab", text="c"`.
  digest.update(`v1\u0000${voice}\u0000${speed}\u0000${text}`);
  return digest.digest("hex").slice(0, HASH_CHARS);
}

/**
 * Stable job name for a post + hash.
 *
 * Kubernetes object names are RFC 1123 labels: lower case, `[a-z0-9-]`, at most 63
 * characters. Ghost post ids are already 24 lowercase hex characters, but the name is
 * sanitised anyway so a payload with an unexpected id cannot make the API reject the
 * Job (which the receiver would then have to explain in a 500).
 */
export function jobName(postId, hash) {
  const safe = String(postId ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "post";
  return `tts-${safe}-${String(hash ?? "").slice(0, 10)}`.slice(0, 63).replace(/-+$/, "");
}
