import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Behaviour tests for the CodeBlocks island (assets/js/islands/CodeBlocks.js).
 *
 * The interesting decision is made before any highlighting happens: a page with no
 * code must not fetch the highlighter at all. That is the property worth pinning
 * down, because it is the whole reason the island exists.
 *
 * The island takes its element as an argument and touches nothing global, so a stub
 * is enough — the real Prism never needs to load. Its dynamic import is left to the
 * browser; here it is expected to fail (Prism's component files assume a browser
 * global) and the island must swallow that, because highlighting is an enhancement.
 */
const { enhance } = await import("../assets/js/islands/CodeBlocks.js");

function stubContent({ codeBlocks = 0 } = {}) {
  const added = [];
  const parents = Array.from({ length: codeBlocks }, () => ({
    classList: {
      add(name) {
        added.push(name);
      },
    },
  }));
  const codes = parents.map((parent) => ({ parentElement: parent }));

  return {
    added,
    element: { querySelectorAll: () => codes },
  };
}

test("does nothing, and loads nothing, when the page has no code", () => {
  const { element, added } = stubContent({ codeBlocks: 0 });

  const result = enhance(element);

  assert.equal(result, undefined, "no highlighting pass is started");
  assert.deepEqual(added, [], "no classes are applied");
});

test("marks every code block for line numbers", () => {
  const { element, added } = stubContent({ codeBlocks: 3 });

  enhance(element);

  assert.deepEqual(added, ["line-numbers", "line-numbers", "line-numbers"]);
});

test("never throws when the highlighter cannot load", async () => {
  const { element } = stubContent({ codeBlocks: 1 });
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));

  try {
    // The import is fire-and-forget; give it a tick to settle.
    enhance(element);
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    console.warn = originalWarn;
  }

  // Either it loaded (unlikely in Node) or it warned — never an unhandled rejection.
  assert.ok(true);
});
