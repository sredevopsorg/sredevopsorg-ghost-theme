import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { t } from "../lib/theme-config.js";
import { DEFAULT_OFFSET, activeIdFor, buildTree, flatten, slugify, uniqueId } from "../lib/toc-model.js";

/**
 * Table of contents for a post.
 *
 * Mount point (partials/sidebar.hbs, post context):
 *   <div data-island="TableOfContents" data-island-lazy
 *        data-target=".gh-content" data-headings="h2, h3"></div>
 *
 * Why an island at all: the list is *derived from the rendered headings*, which
 * Handlebars cannot enumerate. It replaces tocbot, which cost a third-party
 * request plus an inline `setTimeout(…, 500)` race against Ghost's content.
 *
 * No-JS behaviour: the sidebar still renders "share" and "subscribe"; the TOC card
 * is simply absent (it used to be an empty labelled card).
 *
 * Scroll-spy is a rAF-coalesced scroll listener rather than an IntersectionObserver
 * because "which section am I in" depends on the sticky header offset, and
 * reading positions gives a deterministic answer that is unit-testable.
 */

function TocLink({ item, activeId, depth }) {
  const isActive = item.id === activeId;
  return (
    <li>
      <a
        href={`#${item.id}`}
        aria-current={isActive ? "location" : undefined}
        className={[
          "block border-l-2 py-1 text-sm leading-relaxed transition-colors",
          depth > 0 ? "pl-6" : "pl-3",
          isActive
            ? "border-brand-blue font-bold text-strong"
            : "border-transparent text-muted hover:text-strong",
        ].join(" ")}
      >
        {item.text}
      </a>
      {item.children.length > 0 && (
        <ul className="list-none">
          {item.children.map((child) => (
            <TocLink key={child.id} item={child} activeId={activeId} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function TableOfContents({ target = ".gh-content", headings: headingSelector = "h2, h3", offset }) {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState("");
  const threshold = Number(offset) || DEFAULT_OFFSET;

  // Read the headings once and make them linkable.
  useEffect(() => {
    const root = document.querySelector(target);
    if (!root) return;

    const taken = new Set(
      Array.from(document.querySelectorAll("[id]"))
        .map((el) => el.id)
        .filter(Boolean),
    );

    const collected = Array.from(root.querySelectorAll(headingSelector))
      .filter((el) => el.textContent.trim().length > 0)
      .map((el, index) => {
        if (!el.id) {
          el.id = uniqueId(slugify(el.textContent), taken, index + 1);
        }
        taken.add(el.id);
        // Lets keyboard users land on the section after following an anchor.
        el.setAttribute("tabindex", "-1");
        return { id: el.id, text: el.textContent.trim(), level: Number(el.tagName.slice(1)) };
      });

    // A one-entry list is not worth a card.
    if (collected.length < 2) return;
    setItems(buildTree(collected));
  }, [target, headingSelector]);

  // Scroll-spy.
  useEffect(() => {
    if (!items.length) return undefined;

    const headings = flatten(items)
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);
    let frame = 0;

    const measure = () => {
      frame = 0;
      const positions = headings.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
      const next = activeIdFor(positions, threshold);
      setActiveId((current) => (current === next ? current : next));
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
  }, [items, threshold]);

  if (!items.length) return null;

  return (
    <nav
      aria-labelledby="toc-title"
      className="rounded-lg border border-border-strong bg-raised p-5"
      data-island-state="mounted"
    >
      <h4
        id="toc-title"
        className="mb-3 border-b border-border-strong pb-2 text-sm font-bold tracking-wider text-strong uppercase"
      >
        {t("toc")}
      </h4>
      <ul className="list-none space-y-1">
        {items.map((item) => (
          <TocLink key={item.id} item={item} activeId={activeId} depth={0} />
        ))}
      </ul>
    </nav>
  );
}

/** Island contract: see assets/js/islands.js. */
export function mount(element, props) {
  createRoot(element).render(<TableOfContents {...props} />);
}
