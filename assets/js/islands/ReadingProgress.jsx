import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { t } from "../lib/theme-config.js";

/**
 * Reading progress for a post: a fixed 2px bar along the top edge.
 *
 * Mount point (post.hbs, post context only):
 *   <div data-island="ReadingProgress" data-target=".gh-content"></div>
 *
 * - Reads the article bounds from the DOM rather than taking a payload.
 * - `position: fixed`, so it cannot shift layout or contribute to CLS.
 * - Scroll work is coalesced into one rAF per frame; listeners are passive.
 * - The width transition is disabled under `prefers-reduced-motion`.
 */
function ReadingProgress({ target = ".gh-content", islandState }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.querySelector(target);
    if (!article) return undefined;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
      const scrollable = rect.height - viewport;
      const read = -rect.top;

      // Content shorter than the viewport: complete as soon as its top passes.
      if (scrollable <= 0) {
        setProgress(read > 0 ? 100 : 0);
        return;
      }
      setProgress(Math.min(100, Math.max(0, (read / scrollable) * 100)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target]);

  return (
    <div
      role="progressbar"
      aria-label={t("readingProgress")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      // Runtime bookkeeping from the mount element, surfaced for debugging/tests.
      data-island-state={islandState}
      className="pointer-events-none fixed top-0 left-0 z-[60] h-[2px] bg-brand-purple transition-[width] duration-150 ease-out motion-reduce:transition-none"
      style={{ width: `${progress}%` }}
    />
  );
}

/** Island contract: see assets/js/islands.js. */
export function mount(element, props) {
  createRoot(element).render(<ReadingProgress {...props} />);
}
