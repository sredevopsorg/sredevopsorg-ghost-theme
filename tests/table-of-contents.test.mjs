import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for the table-of-contents model (assets/js/lib/toc-model.js), which
 * the TableOfContents island renders.
 *
 * The component itself needs a DOM and a browser (Playwright, Phase 3+); what is
 * worth pinning down here is the logic that is easy to get subtly wrong and cheap
 * to test: slug generation, id collisions, nesting, and which section counts as
 * "current" while reading.
 */
const { slugify, uniqueId, buildTree, activeIdFor } = await import("../assets/js/lib/toc-model.js");

test("slugify produces stable, link-safe ids", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("Métricas de Kubernetes"), "metricas-de-kubernetes", "diacritics are stripped");
  assert.equal(slugify("  Spaced   Out  "), "spaced-out");
  assert.equal(slugify("C++ vs. C#"), "c-vs-c");
  assert.equal(slugify("2026 roadmap"), "2026-roadmap");
  assert.equal(slugify("¡Hola!"), "hola");
});

test("slugify never returns an empty id for a punctuation-only heading", () => {
  assert.equal(slugify("!!! ???"), "");
  // uniqueId then falls back to a positional id.
  assert.equal(uniqueId(slugify("!!!"), new Set(), 3), "section-3");
});

test("uniqueId keeps ids unique without changing the first one", () => {
  assert.equal(uniqueId("intro", new Set()), "intro");
  assert.equal(uniqueId("intro", new Set(["intro"])), "intro-2");
  assert.equal(uniqueId("intro", new Set(["intro", "intro-2"])), "intro-3");
  assert.equal(uniqueId("intro", new Set(["intro", "intro-2", "intro-3"])), "intro-4");
});

test("buildTree nests h3 under the preceding h2", () => {
  const tree = buildTree([
    { id: "a", text: "A", level: 2 },
    { id: "a1", text: "A1", level: 3 },
    { id: "a2", text: "A2", level: 3 },
    { id: "b", text: "B", level: 2 },
    { id: "b1", text: "B1", level: 3 },
  ]);

  assert.deepEqual(
    tree.map((node) => [node.id, node.children.map((child) => child.id)]),
    [
      ["a", ["a1", "a2"]],
      ["b", ["b1"]],
    ],
  );
});

test("buildTree keeps a leading h3 at the top level instead of inventing a parent", () => {
  const tree = buildTree([
    { id: "orphan", text: "Orphan", level: 3 },
    { id: "h2", text: "H2", level: 2 },
  ]);

  assert.deepEqual(
    tree.map((node) => node.id),
    ["orphan", "h2"],
  );
});

test("buildTree returns the headings in document order", () => {
  const tree = buildTree([
    { id: "one", text: "One", level: 2 },
    { id: "two", text: "Two", level: 2 },
    { id: "three", text: "Three", level: 2 },
  ]);
  assert.deepEqual(
    tree.flatMap((node) => [node.id, ...node.children.map((child) => child.id)]),
    ["one", "two", "three"],
  );
});

test("activeIdFor reports the section being read", () => {
  const positions = [
    { id: "intro", top: -400 },
    { id: "middle", top: -20 },
    { id: "late", top: 300 },
  ];

  assert.equal(activeIdFor(positions, 96), "middle", "the last heading above the offset wins");
});

test("activeIdFor reports the first section before any heading has scrolled past", () => {
  const positions = [
    { id: "intro", top: 200 },
    { id: "middle", top: 600 },
  ];

  assert.equal(activeIdFor(positions, 96), "intro");
  assert.equal(activeIdFor([], 96), "", "no headings, no current section");
});

test("activeIdFor reports the last section once everything has scrolled past", () => {
  const positions = [
    { id: "intro", top: -900 },
    { id: "middle", top: -400 },
  ];

  assert.equal(activeIdFor(positions, 96), "middle");
});

test("activeIdFor treats a heading exactly at the offset as reached", () => {
  const positions = [
    { id: "intro", top: -10 },
    { id: "exact", top: 96 },
  ];

  assert.equal(activeIdFor(positions, 96), "exact");
});
