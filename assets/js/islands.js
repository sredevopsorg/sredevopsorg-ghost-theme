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
 *   2. An island module exports ONE of:
 *        - `mount(element, props)` — the island owns dynamic UI; the framework it
 *          imports renders into the element, which must be empty;
 *        - `enhance(element, props)` — behaviour only; the element keeps its
 *          server-rendered children and no framework is loaded at all.
 *      Either way the island owns its framework import; this file never imports
 *      one, so a page with no islands downloads zero framework bytes and an
 *      island could be vanilla (see MobileMenu), Preact or Svelte.
 *      Return a cleanup function when the island adds listeners.
 *   3. Props come from the mount element's `dataset`. Anything already rendered
 *      should be read from the DOM instead (see `data-target`, which for an
 *      `enhance` island selects the element to augment when it is not the mount
 *      element itself).
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

/**
 * name -> () => import("./islands/<Name>.{js,jsx}"). Keys must equal the
 * `data-island` values used in templates (scripts/smoke-bundle.mjs enforces it).
 */
const registry = {
  CodeBlocks: () => import("./islands/CodeBlocks.js"),
  MobileMenu: () => import("./islands/MobileMenu.js"),
  ReadingProgress: () => import("./islands/ReadingProgress.jsx"),
  ShareButtons: () => import("./islands/ShareButtons.jsx"),
  TableOfContents: () => import("./islands/TableOfContents.jsx"),
};

const SELECTOR = "[data-island]";

/** Elements already handled, so a second scan cannot double-mount. */
const handled = new WeakSet();

/** Cleanup functions returned by `enhance` islands, keyed by element. */
const cleanups = new Map();

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
    const props = { ...el.dataset };

    // `mount` renders into an empty element; `enhance` augments existing markup.
    if (typeof mod.mount === "function") {
      mod.mount(el, props);
      markHandled(el, "mounted");
      return;
    }
    if (typeof mod.enhance === "function") {
      // Enhance augments existing markup, so it needs an element with children:
      // data-target selects one, otherwise the mount element itself is used and
      // nothing is rendered into it.
      const target = props.target ? document.querySelector(props.target) : el;
      if (!target) throw new Error(`enhance island "${name}" target not found: ${props.target}`);
      const cleanup = mod.enhance(target, props);
      if (typeof cleanup === "function") cleanups.set(el, cleanup);
      markHandled(el, "enhanced");
      return;
    }
    throw new TypeError(`island "${name}" must export mount(element, props) or enhance(element, props)`);
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
window.__themeIslands = { mountIslands, cleanups, registry: Object.keys(registry) };

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountIslands());
} else {
  mountIslands();
}
