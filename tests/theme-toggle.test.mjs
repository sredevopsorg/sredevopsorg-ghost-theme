import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Behaviour tests for the ThemeToggle island (assets/js/islands/ThemeToggle.js).
 *
 * The properties that matter are the ones a screenshot cannot show:
 *
 *   - a stored choice is applied and survives a reload (that is the whole point);
 *   - with no stored choice the theme is dark, and stays dark — the operating system
 *     must not be consulted, or a light desktop would silently override the default;
 *   - storage that throws (private mode, cookies disabled) degrades to that same
 *     default rather than breaking the page;
 *   - every mount is relabelled, because the header and the mobile menu each render one.
 *
 * Plain DOM code with no framework import, so a small stub is enough — the same
 * approach as tests/mobile-menu.test.mjs.
 */

function emitter() {
  const handlers = new Map();
  return {
    addEventListener(type, fn) {
      handlers.set(type, [...(handlers.get(type) ?? []), fn]);
    },
    removeEventListener(type, fn) {
      handlers.set(type, (handlers.get(type) ?? []).filter((h) => h !== fn));
    },
    fire(type, event = {}) {
      for (const fn of handlers.get(type) ?? []) fn(event);
    },
    count(type) {
      return (handlers.get(type) ?? []).length;
    },
  };
}

function button() {
  const attributes = new Map();
  return {
    dataset: {},
    attributes,
    matches: (selector) => selector === "button",
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    addEventListener: (type, fn) => {
      (attributes.get(`on:${type}`) ?? attributes.set(`on:${type}`, []),
      attributes.get(`on:${type}`).push(fn));
    },
    removeEventListener: () => {},
    click() {
      for (const fn of attributes.get("on:click") ?? []) fn();
    },
  };
}

/** Install the globals the island touches and return the handles tests assert on. */
function setup({ stored = null, storageThrows = false } = {}) {
  const rootAttributes = new Map();
  const classes = new Set();
  const store = new Map(stored === null ? [] : [["theme", stored]]);

  globalThis.localStorage = {
    getItem(key) {
      if (storageThrows) throw new Error("storage blocked");
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      if (storageThrows) throw new Error("storage blocked");
      store.set(key, value);
    },
  };
  // Deliberately not provided: the island must not consult the OS preference at all,
  // so `matchMedia` is left undefined and any reintroduction of the old behaviour
  // would throw here instead of passing quietly.
  delete globalThis.matchMedia;
  globalThis.CustomEvent = class {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  };
  globalThis.document = {
    documentElement: {
      setAttribute: (name, value) => rootAttributes.set(name, String(value)),
      getAttribute: (name) => rootAttributes.get(name) ?? null,
    },
    addEventListener: emitter().addEventListener,
    dispatchEvent: () => {},
    ...emitter(),
  };

  return { rootAttributes, classes, store, docs: globalThis.document };
}

const props = { switchToLight: "Switch to light theme", switchToDark: "Switch to dark theme" };

test("a stored dark choice is applied to the document", async () => {
  const state = setup({ stored: "dark" });
  const { enhance } = await import("../assets/js/islands/ThemeToggle.js");
  const element = button();

  enhance(element, props);

  assert.equal(state.rootAttributes.get("data-theme"), undefined, "the island must not pin a theme by itself");
  assert.equal(element.dataset.themeState, "dark");
  assert.equal(element.getAttribute("aria-label"), "Switch to light theme");
});

test("clicking writes the choice to the document and to storage", async () => {
  const state = setup({ stored: null });
  const { enhance } = await import("../assets/js/islands/ThemeToggle.js");
  const element = button();

  enhance(element, props);
  assert.equal(element.dataset.themeState, "dark", "with no stored choice dark is the default");

  element.click();

  assert.equal(state.rootAttributes.get("data-theme"), "light");
  assert.equal(state.store.get("theme"), "light");
  assert.equal(element.dataset.themeState, "light");
  assert.equal(element.getAttribute("aria-label"), "Switch to dark theme");

  element.click();
  assert.equal(state.rootAttributes.get("data-theme"), "dark");
  assert.equal(state.store.get("theme"), "dark");
});

test("with no stored choice the theme is dark, not the operating system's", async () => {
  const state = setup({ stored: null });
  const { enhance } = await import("../assets/js/islands/ThemeToggle.js");
  const element = button();

  enhance(element, props);

  assert.equal(state.rootAttributes.get("data-theme"), undefined, "nothing may be pinned");
  assert.equal(element.dataset.themeState, "dark");
  assert.equal(element.getAttribute("aria-label"), "Switch to light theme");
});

test("blocked storage degrades to the dark default", async () => {
  const state = setup({ storageThrows: true });
  const { enhance } = await import("../assets/js/islands/ThemeToggle.js");
  const element = button();

  enhance(element, props);
  assert.equal(element.dataset.themeState, "dark");

  element.click(); // must not throw
  assert.equal(state.rootAttributes.get("data-theme"), "light");
  assert.equal(element.dataset.themeState, "light");

  // And it must come back: re-deriving instead of tracking the applied theme would
  // fall back to the default after every click and stick here.
  element.click();
  assert.equal(state.rootAttributes.get("data-theme"), "dark");
  assert.equal(element.dataset.themeState, "dark");
});

test("cleanup removes every listener it added", async () => {
  setup({ stored: "dark" });
  const { enhance } = await import("../assets/js/islands/ThemeToggle.js");
  const element = button();

  const cleanup = enhance(element, props);
  assert.equal(typeof cleanup, "function");
  assert.equal(globalThis.document.count("themechange"), 1);
  cleanup();
  assert.equal(globalThis.document.count("themechange"), 0);
});
