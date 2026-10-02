import { t } from "../lib/theme-config.js";

/**
 * Mobile menu — a behaviour island (vanilla, no framework).
 *
 * Why not React: the menu is server-rendered markup whose open state is owned by
 * a native `<details>` element. Nothing here needs React's rendering model, and
 * shipping ~70 kB gzip of runtime to toggle an attribute on a header would be
 * indefensible. The runtime supports two island modes for exactly this reason:
 * `mount()` when the island owns dynamic UI, `enhance()` when it only augments
 * server markup.
 *
 * Without JavaScript the disclosure already works: `<summary>` is focusable,
 * Enter/Space toggles it, and screen readers announce the expanded state from the
 * element itself. This module adds what `<details>` does not do on its own:
 *
 *   - Escape closes the menu and returns focus to the summary;
 *   - a click outside closes it;
 *   - growing past the desktop breakpoint closes it (the panel is hidden there,
 *     so leaving it "open" is a trap for the next viewport change);
 *   - the summary's accessible name follows the state (Open/Close menu).
 *
 * `enhance` returns a cleanup function; nothing unmounts in a Ghost theme, but
 * returning it keeps the module testable and honest.
 */
export function enhance(details, props = {}) {
  const summary = details.querySelector("summary");
  const desktopMinWidth = Number(props.desktopMinWidth) || 768;
  const desktop = window.matchMedia(`(min-width: ${desktopMinWidth}px)`);

  const label = () => {
    if (summary) summary.setAttribute("aria-label", details.open ? t("closeMenu") : t("openMenu"));
  };

  const close = ({ focusSummary = false } = {}) => {
    if (!details.open) return;
    details.open = false;
    if (focusSummary && summary) summary.focus();
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") close({ focusSummary: true });
  };

  const onDocumentClick = (event) => {
    if (details.open && !details.contains(event.target)) close();
  };

  // The panel is display:none on desktop; an open menu there would silently
  // reappear if the viewport narrowed again.
  const onBreakpoint = (event) => {
    if (event.matches) close();
  };

  const onToggle = () => {
    details.dataset.islandOpen = String(details.open);
    label();
  };

  // The click has already toggled `open` by the time this runs; refresh the label.
  const onSummaryClick = () => label();

  if (summary) summary.addEventListener("click", onSummaryClick);
  details.addEventListener("toggle", onToggle);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onDocumentClick);
  desktop.addEventListener("change", onBreakpoint);

  onToggle();

  return () => {
    if (summary) summary.removeEventListener("click", onSummaryClick);
    details.removeEventListener("toggle", onToggle);
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onDocumentClick);
    desktop.removeEventListener("change", onBreakpoint);
  };
}
