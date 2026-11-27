import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * The marker is the contract between the pipeline and the theme: the job writes it into
 * `codeinjection_foot`, the island reads it with a DOM query. What is pinned here is
 * everything that makes that round-trip safe — the exact line shape, that surrounding
 * injection survives byte for byte, and that a malformed marker reads as "no audio"
 * rather than as an error.
 */
const { MARKER_NAME, buildMarker, markerOf, parseMarker, removeMarker, setMarker } = await import(
  "../src/markers.mjs"
);

const FILE = "https://audio.sredevops.org/audio/abc123/0123456789abcdef.mp3";

const marker = () => buildMarker({ hash: "0123456789abcdef", file: FILE, voice: "ef_dora", bytes: 42, duration: 90, at: "2026-11-26" });

test("a marker is a single line in <body>-legal HTML", () => {
  const line = marker();
  assert.equal(line.split("\n").length, 1);
  assert.ok(line.startsWith(`<meta name="${MARKER_NAME}"`));
  assert.ok(line.endsWith(">"));
  // Single-quoted attribute value, so the JSON inside cannot end the attribute early.
  assert.match(line, /content='\{/);
});

test("a marker round-trips through parse", () => {
  const parsed = parseMarker(`${marker()}\n`);
  assert.equal(parsed.hash, "0123456789abcdef");
  assert.equal(parsed.file, FILE);
  assert.equal(parsed.voice, "ef_dora");
  assert.equal(parsed.v, 1);
});

test("a marker with a relative or non-https URL is refused at build time", () => {
  assert.throws(() => buildMarker({ hash: "a", file: "/audio/x.mp3" }), /absolute https/);
  assert.throws(() => buildMarker({ hash: "a", file: "http://audio.sredevops.org/x.mp3" }), /absolute https/);
});

test("parse returns null for missing, malformed or foreign markers", () => {
  assert.equal(parseMarker(""), null);
  assert.equal(parseMarker(undefined), null);
  assert.equal(parseMarker("<script>alert(1)</script>"), null);
  assert.equal(parseMarker(`<meta name="${MARKER_NAME}" content='{not json}'>`), null);
  assert.equal(parseMarker(`<meta name="${MARKER_NAME}" content='{"v":1,"evil":true}'>`), null);
  assert.equal(parseMarker(`<meta name="something:else" content='{"v":1}'>`), null);
});

test("setting a marker appends to empty and to existing injection, preserving the rest", () => {
  const analytics = '<script async src="https://plausible.io/js/script.js"></script>\n';
  const first = setMarker(analytics, `${marker()}`);
  assert.ok(first.startsWith(analytics), "existing injection must be preserved verbatim");
  assert.ok(first.includes(marker()));

  const empty = setMarker("", `${marker()}`);
  assert.equal(empty, `${marker()}\n`);

  const none = setMarker(undefined, `${marker()}`);
  assert.equal(none, `${marker()}\n`);
});

test("setting a marker twice replaces the line instead of appending a second", () => {
  const other = buildMarker({ hash: "ffffffffffffffff", file: FILE, voice: "ef_dora" });
  const once = setMarker("keep me\n", marker());
  const twice = setMarker(once, other);

  assert.equal((twice.match(new RegExp(`name="${MARKER_NAME}"`, "g")) ?? []).length, 1);
  assert.ok(twice.includes("keep me"));
  assert.ok(twice.includes(other));
  // No blank line left behind: every regeneration would otherwise change the injection.
  assert.ok(!/\n\s*\n/.test(twice), `left a blank line: ${JSON.stringify(twice)}`);
});

test("removing a marker leaves the rest of the injection untouched", () => {
  const analytics = "<script>x()</script>";
  const withMarker = setMarker(analytics, marker());
  assert.equal(removeMarker(withMarker).trim(), analytics);
  assert.equal(removeMarker(""), "");
  assert.equal(removeMarker(undefined), "");
  // Removing a marker that was never there is a no-op, so the PUT can be skipped.
  assert.equal(removeMarker(analytics), analytics);
});

test("markerOf reads the marker straight off a post object", () => {
  assert.equal(markerOf({ codeinjection_foot: setMarker("", marker()) }).hash, "0123456789abcdef");
  // Ghost omits the property entirely when the injection is empty.
  assert.equal(markerOf({ slug: "no-injection" }), null);
  assert.equal(markerOf(undefined), null);
});
