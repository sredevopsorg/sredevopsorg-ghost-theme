import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for assets/js/lib/island-root.js — the framework-free half of the
 * "island rendered twice" fix.
 *
 * The bug (verified in a real browser): one `<div data-island="TableOfContents">`
 * ended up with two `<nav aria-labelledby="toc-title">`, duplicate `id="toc-title"`
 * and two scroll listeners. A React container only gains a second child when two
 * independent roots commit into it, so the guard is "one root per element, ever".
 *
 * The module only touches the keys it is given, so a plain object stands in for an
 * element — the same approach as tests/theme-toggle.test.mjs.
 */

const { getRoot, hasRoot, forgetRoot } = await import("../assets/js/lib/island-root.js");

/** Stand-in for a React root: identity is all the tests need. */
function fakeRoot(label) {
  return { label };
}

test("getRoot creates the root once and returns the same one afterwards", () => {
  const element = {};
  let calls = 0;

  const first = getRoot(element, () => {
    calls++;
    return fakeRoot("a");
  });
  const second = getRoot(element, () => {
    calls++;
    return fakeRoot("b");
  });

  assert.equal(calls, 1, "the factory must not run a second time");
  assert.equal(second, first, "a second mount gets the existing root, not a rival");
  assert.equal(first.label, "a");
});

test("a mount island mounted twice reuses its root instead of creating a second", () => {
  // The island's mount() after the fix is `getRoot(el, () => createRoot(el)).render(...)`;
  // calling it twice must not create a second root, which is what produced two children.
  const element = {};
  const created = [];
  const createRoot = () => {
    const root = { rendered: [], render(node) { this.rendered.push(node); } };
    created.push(root);
    return root;
  };

  const mountOnce = (node) => getRoot(element, () => createRoot(element)).render(node);
  mountOnce("first");
  mountOnce("second");

  assert.equal(created.length, 1, "createRoot ran once for the element");
  assert.deepEqual(created[0].rendered, ["first", "second"], "both renders reached the one root");
});

test("each element gets its own root", () => {
  const a = {};
  const b = {};

  const rootA = getRoot(a, () => fakeRoot("a"));
  const rootB = getRoot(b, () => fakeRoot("b"));

  assert.notEqual(rootA, rootB);
  assert.ok(hasRoot(a));
  assert.ok(hasRoot(b));
});

test("hasRoot reports whether an element already has a root", () => {
  const element = {};
  assert.equal(hasRoot(element), false);
  getRoot(element, () => fakeRoot("a"));
  assert.equal(hasRoot(element), true);
});

test("getRoot without a factory throws instead of recording a useless root", () => {
  const element = {};
  assert.throws(() => getRoot(element), { name: "TypeError" });
  assert.equal(hasRoot(element), false, "a rejected call must not claim the element");
});

test("a factory that throws leaves the element unclaimed, so a retry works", () => {
  const element = {};
  assert.throws(
    () =>
      getRoot(element, () => {
        throw new Error("createRoot failed");
      }),
    /createRoot failed/,
  );
  assert.equal(hasRoot(element), false);

  const root = getRoot(element, () => fakeRoot("retry"));
  assert.equal(root.label, "retry");
});

test("forgetRoot drops the record so a deliberate teardown can start over", () => {
  const element = {};
  getRoot(element, () => fakeRoot("a"));
  assert.equal(forgetRoot(element), true);
  assert.equal(hasRoot(element), false);

  const fresh = getRoot(element, () => fakeRoot("b"));
  assert.equal(fresh.label, "b");
  assert.equal(forgetRoot(element), true);
  assert.equal(forgetRoot(element), false, "forgetting twice is harmless");
});

test("a root is recorded even when the factory returns a falsy value", () => {
  // `createRoot` always returns an object, but the guard must key on "has an entry",
  // not on truthiness, or a stub returning undefined in a test would be re-created.
  const element = {};
  let calls = 0;
  const create = () => {
    calls++;
    return undefined;
  };

  getRoot(element, create);
  getRoot(element, create);

  assert.equal(calls, 1);
  assert.equal(hasRoot(element), true);
});
