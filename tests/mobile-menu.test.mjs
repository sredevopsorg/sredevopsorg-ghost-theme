import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Behaviour tests for the MobileMenu island (assets/js/islands/MobileMenu.js).
 *
 * The module is plain DOM code with no framework import, so it can be exercised
 * with a small hand-written stub instead of a headless browser. What is worth
 * testing here is exactly what `<details>` does NOT give us for free: Escape,
 * outside clicks, the desktop breakpoint, and the state-aware accessible name.
 *
 * The stub is deliberately minimal: `enhance` is called directly, so nothing in
 * the module needs a parser or a real document.
 */

/** Records listeners so tests can fire events by hand. */
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

function setup({ open = false } = {}) {
  const events = emitter();
  const summaryEvents = emitter();
  const summary = {
    attributes: {},
    focusCount: 0,
    addEventListener: summaryEvents.addEventListener,
    removeEventListener: summaryEvents.removeEventListener,
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    focus() {
      this.focusCount++;
    },
  };
  const details = {
    open,
    dataset: {},
    children: [summary],
    addEventListener: events.addEventListener,
    removeEventListener: events.removeEventListener,
    querySelector: (selector) => (selector === "summary" ? summary : null),
    contains: (node) => node === summary || node === details || node === "inside",
  };

  // Globals the module reads at call time.
  globalThis.document = { getElementById: () => null, ...emitter() };
  const listeners = emitter();
  globalThis.window = {
    matchMedia: () => ({ matches: false, addEventListener: listeners.addEventListener, removeEventListener: listeners.removeEventListener }),
  };

  return { details, summary, events, summaryEvents, breakpoint: listeners, doc: globalThis.document };
}

const { enhance } = await import("../assets/js/islands/MobileMenu.js");

test("labels the summary from the current state on start", () => {
  const { details, summary } = setup();
  enhance(details);
  assert.equal(summary.attributes["aria-label"], "Open menu");
  assert.equal(details.dataset.islandOpen, "false");
});

test("follows the toggle event and reports state on the element", () => {
  const { details, summary, events } = setup();
  enhance(details, { desktopMinWidth: "768" });

  details.open = true;
  events.fire("toggle");
  assert.equal(summary.attributes["aria-label"], "Close menu");
  assert.equal(details.dataset.islandOpen, "true");
});

test("Escape closes the open menu and returns focus to the summary", () => {
  const { details, summary, doc } = setup({ open: true });
  enhance(details);

  doc.fire("keydown", { key: "Escape" });

  assert.equal(details.open, false);
  assert.equal(summary.focusCount, 1);
});

test("Escape does nothing when the menu is already closed", () => {
  const { details, summary, doc } = setup();
  enhance(details);

  doc.fire("keydown", { key: "Escape" });

  assert.equal(details.open, false);
  assert.equal(summary.focusCount, 0, "focus must not be stolen on a closed menu");
});

test("a click inside the panel keeps the menu open", () => {
  const { details, doc } = setup({ open: true });
  enhance(details);

  doc.fire("click", { target: "inside" });

  assert.equal(details.open, true);
});

test("a click outside the panel closes the menu", () => {
  const { details, doc } = setup({ open: true });
  enhance(details);

  doc.fire("click", { target: "elsewhere" });

  assert.equal(details.open, false);
});

test("growing past the desktop breakpoint closes the menu", () => {
  const { details, breakpoint } = setup({ open: true });
  enhance(details);

  breakpoint.fire("change", { matches: true });
  assert.equal(details.open, false, "an open menu hidden by the breakpoint must not stay open");

  details.open = true;
  breakpoint.fire("change", { matches: false });
  assert.equal(details.open, true, "narrowing again must not close anything");
});

test("cleanup removes every listener it added", () => {
  const { details, doc, events, breakpoint } = setup({ open: true });
  const cleanup = enhance(details);

  cleanup();

  assert.equal(doc.count("keydown"), 0);
  assert.equal(doc.count("click"), 0);
  assert.equal(events.count("toggle"), 0);
  assert.equal(breakpoint.count("change"), 0);

  doc.fire("keydown", { key: "Escape" });
  assert.equal(details.open, true, "a cleaned-up island must be inert");
});
