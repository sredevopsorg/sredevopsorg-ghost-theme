/**
 * Theme config for islands.
 *
 * Handlebars writes `partials/island-config.hbs` into a
 * `<script id="theme-config" type="application/json">` block, using the `{{json}}`
 * helper (the documented safe way to serialise values into a script body).
 * Islands read it from here instead of receiving payloads through data attributes.
 *
 * Keep this payload small: it is inline on every page. Anything already rendered
 * in the DOM (content, headings, links) should be read from the DOM instead.
 */

/** Fallbacks, also used when the config block is missing or malformed. */
const FALLBACKS = {
  copyLink: "Copy link",
  linkCopied: "Link copied!",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  readingProgress: "Reading progress",
  toc: "Table of Contents",
};

let cached;

export function themeConfig() {
  if (cached) return cached;

  const el = document.getElementById("theme-config");
  if (!el) {
    cached = {};
    return cached;
  }

  try {
    cached = JSON.parse(el.textContent || "{}");
  } catch (err) {
    // A malformed config must not take the page down: islands fall back to
    // English strings and read everything else from the DOM.
    console.warn("[islands] theme-config is not valid JSON:", err.message);
    cached = {};
  }
  return cached;
}

/** Translated string for an island, falling back to English. */
export function t(key) {
  return themeConfig()[key] ?? FALLBACKS[key] ?? key;
}
