/**
 * The audio marker a generated post carries in Ghost's code injection.
 *
 * Why a `<meta name>` line in `codeinjection_foot` and not a data attribute or a
 * Handlebars comment:
 *
 *  - Ghost *parses* code injection before rendering it, so a `{{!-- … --}}` marker
 *    is stripped and never reaches the page.
 *  - The theme's mount point is an empty `<div>`; a `<meta>`/`<link>` inside it is
 *    invalid HTML and browsers hoist or drop it unpredictably.
 *  - `codeinjection_foot` is rendered by `{{ghost_foot}}` inside `<body>`
 *    (partials/shell.hbs), which is exactly where a `<meta name>` is legal.
 *
 * The island finds it with `document.querySelector('meta[name="sredevops:tts"]')`
 * and reads the JSON in its `content` attribute, so `partials/post-layout.hbs`
 * needs no marker markup at all.
 *
 * The value is stored as a **single line** with single-quoted attribute value, so
 * the admin can still see and edit the rest of the injection by hand.
 */

export const MARKER_NAME = "sredevops:tts";

/**
 * Matches the whole line this module owns, including leading/trailing whitespace and
 * an optional trailing newline, so replacing or removing it cannot leave a blank line
 * behind (which would make every regeneration change the post one byte, and fight the
 * content hash the skip logic depends on).
 */
export const MARKER_LINE = new RegExp(
  String.raw`^[ \t]*<meta[ \t]+name="${MARKER_NAME}"[^>]*>[ \t]*(?:\r?\n|$)`,
  "m",
);

/** Extractor for the value of a marker line, tolerant of attribute order and quotes. */
const MARKER_CONTENT = new RegExp(
  String.raw`<meta[^>]*name="${MARKER_NAME}"[^>]*content=(?:"([^"]*)"|'([^']*)')`,
);

/** Attributes of the value are a flat object of scalars; anything else is a bad marker. */
const ALLOWED_KEYS = new Set(["v", "hash", "file", "voice", "bytes", "duration", "at"]);

/**
 * Build the marker line (no trailing newline; the caller joins lines).
 *
 * `file` must be absolute: the value is rendered on every page and a relative URL
 * would resolve against the post URL, not the audio host.
 */
export function buildMarker({ hash, file, voice, bytes, duration, at }) {
  if (!/^https:\/\//.test(file ?? "")) {
    throw new TypeError(`marker file must be an absolute https URL, got ${JSON.stringify(file)}`);
  }
  const value = { v: 1, hash, voice, bytes, duration, at, file };
  // Single quotes are what the attribute uses, so a value cannot end the attribute.
  // JSON.stringify never emits a raw single quote inside a string, but escape anyway.
  const json = JSON.stringify(value).replace(/'/g, "\\u0027");
  return `<meta name="${MARKER_NAME}" content='${json}'>`;
}

/** Parse a marker line's JSON payload; `null` for a missing or malformed marker. */
export function parseMarker(line) {
  const match = MARKER_LINE.exec(line ?? "");
  if (!match) return null;
  const content = MARKER_CONTENT.exec(match[0]);
  if (!content) return null;

  const raw = (content[1] ?? content[2] ?? "").replace(/\\u0027/g, "'");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  for (const key of Object.keys(value)) {
    if (!ALLOWED_KEYS.has(key)) return null;
  }
  return value;
}

/**
 * Replace the marker in an injection block, or append one when it is absent.
 *
 * Every other character of the block is preserved byte for byte: the injection may
 * hold analytics snippets the publication maintains by hand, and a regeneration must
 * not be an excuse to rewrite them.
 */
export function setMarker(injection, line) {
  const block = injection ?? "";
  if (MARKER_LINE.test(block)) {
    // `replace` with a function, so `$&` in the payload can never be read as a group.
    return block.replace(MARKER_LINE, () => `${line}\n`);
  }
  const trimmed = block.replace(/\s+$/, "");
  return trimmed ? `${trimmed}\n${line}\n` : `${line}\n`;
}

/** Remove the marker, leaving the rest of the injection as it was. */
export function removeMarker(injection) {
  const block = injection ?? "";
  if (!MARKER_LINE.test(block)) return block;
  return block.replace(MARKER_LINE, "").replace(/\n{3,}/g, "\n\n");
}

/**
 * Read the current marker of a post.
 *
 * Optional chaining rather than a guard at every level: Ghost omits `codeinjection_foot`
 * from webhook payloads when it is empty, so the property is genuinely absent there.
 */
export function markerOf(post) {
  return parseMarker(post?.codeinjection_foot);
}
