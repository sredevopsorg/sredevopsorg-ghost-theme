/**
 * Island runtime — framework-agnostic by design.
 *
 * Ghost renders every page server-side; React is added only where a template
 * declares a mount point:
 *
 *   <div data-island="ReadingProgress" data-target=".gh-content"></div>
 *
 * The contract:
 *
 *   1. Templates own the document. An island renders *inside* its mount element
 *      and never replaces server-rendered content.
 *   2. An island module exports `mount(element, props)` and owns its framework
 *      import. This file therefore never imports React: a page with no islands
 *      downloads zero framework bytes, and an island could be written in vanilla
 *      JS or Preact without touching this runtime.
 *   3. Props come from the mount element's `dataset`. Anything already rendered
 *      should be read from the DOM instead (see `data-target`).
 *   4. Nothing may break without JavaScript: mount points are empty containers.
 *   5. One island failing must not affect the others or the page.
 *
 * Modules are code-split through the registry thunks, so the island chunk (and
 * the framework chunk it pulls in) is fetched only when a mount point exists.
 * Islands marked `data-island-lazy` are not even imported until they scroll near
 * the viewport.
 *
 * Styles are Tailwind classes written in the component (assets/js/** is a
 * Tailwind `@source` glob), so `yarn test:classes` keeps them honest.
 */

/** name -> () => import("./islands/<Name>.jsx"). Keys must match data-island values. */
const registry = {
  ReadingProgress: () => import("./islands/ReadingProgress.jsx"),
};

const SELECTOR = "[data-island]";

/** Elements already handled, so a second scan cannot double-mount. */
const handled = new WeakSet();

function markHandled(el, state) {
  handled.add(el);
  el.dataset.islandState = state;
}

async function mountElement(el) {
  const name = el.dataset.island;
  const loader = registry[name];

  if (!loader) {
    // A template typo must be visible in the console, not fatal for the page.
    console.warn(`[islands] unknown island: "${name}" — add it to the registry in assets/js/islands.js`);
    markHandled(el, "unknown");
    return;
  }

  try {
    const mod = await loader();
    if (typeof mod.mount !== "function") {
      throw new TypeError(`island "${name}" must export a mount(element, props) function`);
    }
    mod.mount(el, { ...el.dataset });
    markHandled(el, "mounted");
  } catch (err) {
    console.error(`[islands] "${name}" failed to mount:`, err);
    markHandled(el, "failed");
  }
}

/** Mount every island in `scope` (default: the document). Returns the number scanned. */
export function mountIslands(scope = document) {
  const elements = Array.from(scope.querySelectorAll(SELECTOR)).filter((el) => !handled.has(el));
  if (!elements.length) return 0;

  let lazyObserver = null;
  const observeLazy = () => {
    if (lazyObserver) return lazyObserver;
    lazyObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          lazyObserver.unobserve(entry.target);
          mountElement(entry.target);
        }
      },
      { rootMargin: "200px" },
    );
    return lazyObserver;
  };

  for (const el of elements) {
    // Mark before awaiting: mountElement is async, and a re-entrant scan would
    // otherwise start a second root on the same element.
    markHandled(el, "pending");
    if (el.dataset.islandLazy !== undefined) observeLazy().observe(el);
    else mountElement(el);
  }

  return elements.length;
}

/** Exposed for tests and for debugging in the browser console. */
window.__themeIslands = { mountIslands, registry: Object.keys(registry) };

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountIslands());
} else {
  mountIslands();
}
