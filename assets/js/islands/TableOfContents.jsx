import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { t } from "../lib/theme-config.js";
import { getRoot } from "../lib/island-root.js";
import { DEFAULT_OFFSET, buildTree, slugify, uniqueId } from "../lib/toc-model.js";
import { LISTENERS, listenOnce } from "../lib/toc-runtime.js";

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
 * Mounted twice is not a supported state, but it must not double the UI: the headings
 * are collected during render, so the first commit already produces the final <nav>
 * (see collectItems), the React root is resolved through assets/js/lib/island-root.js,
 * and the scroll-spy lives on the mount element (assets/js/lib/toc-runtime.js).
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

/**
 * Headings under `target`, with ids assigned to the ones that lack them.
 *
 * Runs during render, not in an effect. This island used to start with an empty list
 * and fill it in from an effect, so the component rendered `null` first and the <nav>
 * second. On a fraction of loads (measured: 1-3 of 8 in Chromium) the second commit
 * appended the <nav> next to the first instead of replacing it, and the page showed two
 * TOCs with duplicate ids. A render-time read gives the list at mount, so every commit
 * is the same single child. The headings are server-rendered and cannot change while
 * the page is loaded, so there is nothing to wait for.
 *
 * On the (not expected) second mount into the same element the headings already have
 * ids and the set of ids on the page is unchanged, so assigning them is idempotent.
 */
function collectItems(target, headingSelector) {
  const content = document.querySelector(target);
  if (!content) return [];

  const taken = new Set(
    Array.from(document.querySelectorAll("[id]"))
      .map((el) => el.id)
      .filter(Boolean),
  );

  const collected = Array.from(content.querySelectorAll(headingSelector))
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

  // A one-entry list (or a post without headings) is not worth a card.
  return collected.length < 2 ? [] : buildTree(collected);
}

/**
 * Detach `element`'s scroll-spy. The disposer deletes itself, so the next mount starts
 * a fresh pair and an element that never registered one is a no-op.
 */
function dropSpy(element) {
  if (typeof element[LISTENERS] === "function") element[LISTENERS]();
}

function TableOfContents({ target = ".gh-content", headings: headingSelector = "h2, h3", offset, islandRoot }) {
  // Read during render: see collectItems. This is what makes the first paint the only
  // paint — there is no later `setItems` to commit a second child for.
  const [items] = useState(() => collectItems(target, headingSelector));
  const [activeId, setActiveId] = useState("");
  const threshold = Number(offset) || DEFAULT_OFFSET;

  // Scroll-spy, owned by the mount element rather than by this component instance, so
  // a second render into the same root cannot register a second pair of listeners.
  // `islandRoot` is injected by mount(); without it (a bare render) nothing to own.
  useEffect(() => {
    if (!islandRoot || !items.length) return undefined;
    listenOnce(islandRoot, { items, threshold, onChange: setActiveId }, window);
    return () => dropSpy(islandRoot);
  }, [islandRoot, items, threshold]);

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
  // One root per element, reused (assets/js/lib/island-root.js): a second mount renders
  // into the existing root instead of creating a rival that would commit beside it. The
  // mount element is passed down so the scroll-spy is owned by the mount point rather
  // than by a render pass.
  getRoot(element, () => createRoot(element)).render(<TableOfContents {...props} islandRoot={element} />);
}
