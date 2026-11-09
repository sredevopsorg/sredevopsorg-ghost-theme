/**
 * One root per mount element — a defensive invariant, not the TOC fix.
 *
 * Provenance, so nobody mistakes this for the repair of the duplicate TOC:
 *
 *   - MEASURED, on the buggy tree (before any fix): the runtime started the TOC
 *     exactly once per page load. `assets/js/islands.js` marks an element before it
 *     awaits the chunk import, so its own scans never re-mount, and it is called once
 *     from the entry. The duplicate `<nav>` therefore came from React committing twice
 *     into the ONE root the island had created — not from two roots, and not from two
 *     runtime mounts. The actual fixes are in the island: read the headings during
 *     render instead of from an effect (`collectItems` as the `useState` initialiser),
 *     so there is no second commit to append a child.
 *   - This module is the belt to that braces. `createRoot` must run at most once per
 *     container — React warns on a second call and the two roots then commit
 *     independently — and nothing else in the theme enforces it. `getRoot` makes that
 *     a property of the container instead of a convention each island remembers.
 *   - `assets/js/islands.js` enforces the sibling invariant (one `mount()` per element,
 *     ever) with its own `claimed` WeakSet; also defensive: on the measured pages it
 *     never fires, because the runtime already mounts once.
 *
 * Why the framework stays out: `assets/js/islands.js` must not import React
 * (scripts/smoke-bundle.mjs fails the build if framework code reaches the entry
 * chunk), so a per-element root registry has to live in a plain module like this one.
 *
 * Contract, unit-tested without a DOM in tests/island-root.test.mjs:
 *
 *   getRoot(el, create)  -> create() runs at most once per element, ever
 *   hasRoot(el)          -> whether a root is recorded for an element
 *   forgetRoot(el)       -> drop the record (deliberate teardown / tests)
 *
 * The WeakMap is keyed by the element, so mount points that leave the document are
 * garbage-collected with it and nothing has to be cleaned up on page unload.
 */

/** element -> the value the factory returned (in practice, a React root). */
const roots = new WeakMap();

/**
 * The root for `element`, creating it with `create` on first use and reusing it after.
 *
 * @template T
 * @param {Element} element mount element (an `[data-island]` container)
 * @param {() => T} create factory, e.g. `() => createRoot(element)`
 * @returns {T} the root created for this element, or the one created earlier
 */
export function getRoot(element, create) {
  // `has`, not `!== undefined`: the guard must key on "there is an entry for this
  // element", so a factory that returns undefined (a stub in a test, a future API) is
  // still recorded once instead of being re-created on the next call.
  if (roots.has(element)) return roots.get(element);
  if (typeof create !== "function") {
    throw new TypeError("getRoot(element, create): create must be a function");
  }
  const root = create();
  roots.set(element, root);
  return root;
}

/** Whether a root is already recorded for `element`. */
export function hasRoot(element) {
  return roots.has(element);
}

/**
 * Forget the root recorded for `element` and return whether it had one.
 *
 * For a teardown that really did destroy the roots (and for tests). Calling it while a
 * root is still live is exactly how the double-render comes back, so the theme does not
 * call it outside `unmountIslands()`.
 */
export function forgetRoot(element) {
  return roots.delete(element);
}
