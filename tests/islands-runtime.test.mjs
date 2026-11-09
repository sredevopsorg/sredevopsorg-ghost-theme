import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Invariants of the island runtime (assets/js/islands.js): one mount per element, ever.
 *
 * This is a defensive rule, not the repair of the TOC double render — that was React
 * committing twice into a single root (the runtime was measured mounting the TOC once
 * per load). It still matters because the runtime is the only place that sees *every*
 * path to `mount()`, including a re-entrant scan and a lazy observer delivering twice
 * after an `await`, and a second mount would put a second copy of an island's UI next to
 * the first.
 *
 * The bundle is loaded from source with a hand-written DOM stub, the same approach as
 * tests/theme-toggle.test.mjs: the runtime only needs querySelectorAll, dataset,
 * IntersectionObserver and the console.
 */

/** Minimal element stub: just enough for the runtime's bookkeeping. */
function element(island, dataset = {}) {
  const el = {
    dataset: { island, ...dataset },
    childElementCount: 0,
    children: [],
    querySelectorAll: () => [],
    querySelector: () => null,
    contains: () => false,
    matches: () => false,
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
  };
  return el;
}

function emitter() {
  const handlers = new Map();
  return {
    addEventListener(type, fn) {
      handlers.set(type, [...(handlers.get(type) ?? []), fn]);
    },
    removeEventListener() {},
    fire(type, event = {}) {
      for (const fn of handlers.get(type) ?? []) fn(event);
    },
  };
}

/**
 * Install the globals the runtime touches and return the two elements it will see.
 * `mountCalls` counts how many times the island's `mount()` actually ran.
 */
function setup({ islands = [], lazy = false } = {}) {
  const mounts = [];
  const observers = [];
  const doc = emitter();

  globalThis.window = { addEventListener: emitter().addEventListener, location: { host: "sredevops.org" } };
  // MobileMenu (used by the teardown test) reads window.matchMedia at enhance() time.
  const mediaQuery = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.matchMedia = mediaQuery;
  globalThis.window.matchMedia = mediaQuery;
  globalThis.document = {
    ...doc,
    readyState: "loading", // keep the runtime from auto-mounting; the test drives it
    querySelectorAll: (selector) => (selector === "[data-island]" ? islands : []),
    querySelector: () => null,
    createElement: () => element("stub"),
    documentElement: element("html"),
    body: element("body"),
    getElementById: () => null,
  };
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
      observers.push(this);
    }
    observe(target) {
      this.target = target;
    }
    unobserve() {}
    disconnect() {}
    /** Deliver one "it scrolled into view" batch, as the browser would. */
    fire() {
      const entries = (this.targets ?? [this.target]).map((t) => ({ isIntersecting: true, target: t }));
      this.cb(entries);
    }
  };

  return { mounts, observers, lazy, doc };
}

/** A mount-island module whose mount() records each call. */
function recordingMount(record) {
  return {
    mount(element_, props) {
      record.push({ element: element_, props });
      return () => {};
    },
  };
}

// The registry points at the real island modules, and importing the runtime also runs
// them for real (MobileMenu is vanilla and works against the stub; ThemeToggle and the
// React islands are never declared in these fixtures). The assertions stay on the
// runtime's own bookkeeping, which is what "one mount per element" is about.

test("the runtime exposes its one-mount bookkeeping for inspection", async () => {
  setup({ islands: [] });
  await import(`../assets/js/islands.js?${Math.random()}`);
  assert.ok(globalThis.window.__themeIslands, "window.__themeIslands must exist");
  assert.ok(globalThis.window.__themeIslands.claimed instanceof WeakSet);
  assert.ok(globalThis.window.__themeIslands.handled instanceof WeakSet);
  assert.ok(globalThis.window.__themeIslands.cleanups instanceof Map);
});

test("a second scan does not consider an element the first scan already handled", async () => {
  const el = element("MobileMenu", { desktopMinWidth: "768" });
  setup({ islands: [el] });
  const { mountIslands } = await import(`../assets/js/islands.js?${Math.random()}`);

  assert.equal(mountIslands(document), 1, "the first scan finds the element");
  assert.equal(mountIslands(document), 0, "the second scan finds nothing: it is handled");
  assert.ok(document.readyState !== "complete", "the test drives mounting itself");
});

test("an unmounted island gives its element back, so a later scan can mount it again", async () => {
  // A real island is needed for `unmountIslands` to have a disposer to run; MobileMenu
  // is vanilla and returns one. It only needs the <details>/<summary> shape.
  const summary = { setAttribute() {}, focus() {}, addEventListener() {}, removeEventListener() {} };
  const el = element("MobileMenu", { desktopMinWidth: "768" });
  el.querySelector = () => summary;
  el.matches = () => false;
  setup({ islands: [el] });

  const { mountIslands, unmountIslands } = await import(`../assets/js/islands.js?${Math.random()}`);
  mountIslands(document);
  await new Promise((resolve) => setTimeout(resolve, 0)); // let the chunk import settle

  assert.equal(el.dataset.islandState, "enhanced", "the island was enhanced");
  assert.equal(unmountIslands(document), 1, "its cleanup ran");
  assert.equal(el.dataset.islandState, undefined, "the state mark is cleared");

  assert.equal(mountIslands(document), 1, "the element is mountable again after a teardown");
});
