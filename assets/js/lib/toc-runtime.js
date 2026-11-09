/**
 * Scroll-spy state for the TableOfContents island — pure logic, no framework.
 *
 * Kept out of the JSX so it can be unit-tested in plain Node, which cannot import a
 * `.jsx` file without a loader (tests/table-of-contents.test.mjs). The React root is not
 * this module's business: there is exactly one root store in the theme,
 * assets/js/lib/island-root.js, which imports `getRoot` from. What lives here is the
 * island's other per-element state — the scroll listeners — so that a second commit or
 * a second mount into the same element cannot add a second pair, which was the other
 * half of "the TOC ran twice". It only touches the element it is given, so "the DOM"
 * here can be any object with those keys.
 */

import { activeIdFor, flatten } from "./toc-model.js";

/**
 * Where the disposer of the scroll-spy is stored on the mount element.
 *
 * Exported because the component detaches the spy on teardown and must use the same key;
 * a second `Symbol("…")` with the same description would be a different symbol.
 */
export const LISTENERS = Symbol.for("sredevopsorg.theme.toc.listeners");

/**
 * Start the scroll-spy for `element`: at most one scroll/resize listener pair, ever.
 *
 * Each mount, or each pass that reached the effect, used to add a pair, so a page with
 * two TOC navs also measured every scroll twice. The disposer is stored on the element
 * rather than returned by a component, so the listeners are owned by the mount point
 * and not by whichever render pass happened to run.
 */
export function listenOnce(element, options, environment = globalThis) {
  if (element[LISTENERS]) return;
  const { items, threshold, onChange } = options;
  const doc = environment.document;
  const win = environment.window;
  const headings = flatten(items)
    .map((item) => doc.getElementById(item.id))
    .filter(Boolean);
  let frame = 0;

  const measure = () => {
    frame = 0;
    const positions = headings.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
    onChange(activeIdFor(positions, threshold));
  };

  const onScroll = () => {
    if (frame) return;
    frame = win.requestAnimationFrame(measure);
  };

  measure();
  win.addEventListener("scroll", onScroll, { passive: true });
  win.addEventListener("resize", onScroll, { passive: true });
  // Stored on the element: remounting stops and re-measures instead of stacking.
  element[LISTENERS] = () => {
    if (frame) win.cancelAnimationFrame(frame);
    win.removeEventListener("scroll", onScroll);
    win.removeEventListener("resize", onScroll);
    delete element[LISTENERS];
  };
}
