/**
 * Theme toggle — behaviour only, no framework.
 *
 * The button and its two icons are server-rendered, so the control exists (and is
 * labelled, and works) without JavaScript: the palette is dark by default through
 * `color-scheme`, and a choice is what moves it off that default. There is no third
 * state to manage, and no dependence on the operating system's preference — the
 * stylesheet sets `color-scheme: dark` on `:root` and only `data-theme` overrides it.
 *
 * Choosing writes `<html data-theme>` and localStorage. Nothing sets the attribute
 * until then, which is what keeps the default in charge; `partials/head.hbs` has the
 * small inline script that applies a stored choice before the first paint.
 */
const STORAGE_KEY = "theme";
const DEFAULT_THEME = "dark";

function stored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null; // storage blocked (private mode, cookies off): the default applies
  }
}

function store(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* nothing to do: the choice applies for this page view only */
  }
}

export function enhance(element, props = {}) {
  const root = document.documentElement;
  const buttons = element.matches("button") ? [element] : [...element.querySelectorAll("button")];
  if (buttons.length === 0) return undefined;

  // The applied theme is held here, not re-derived on every read: when storage is
  // unavailable (private mode), re-deriving would fall back to the default after every
  // click, so the toggle could move one way and never back.
  let current = stored() ?? DEFAULT_THEME;

  const labelFor = (theme) =>
    theme === "dark"
      ? props.switchToLight || "Switch to light theme"
      : props.switchToDark || "Switch to dark theme";

  const sync = () => {
    const theme = current;
    const label = labelFor(theme);
    for (const button of buttons) {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      // Reported state for styling and tests; the palette itself is set by CSS.
      button.dataset.themeState = theme;
    }
  };

  const apply = (theme, { persist = false } = {}) => {
    current = theme;
    root.setAttribute("data-theme", theme);
    if (persist) store(theme);
    sync();
    // Other mounts (the header, the mobile menu) label themselves from the same state.
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  };

  const onClick = () => apply(current === "dark" ? "light" : "dark", { persist: true });
  const onThemeChange = () => sync();

  for (const button of buttons) button.addEventListener("click", onClick);
  document.addEventListener("themechange", onThemeChange);
  sync();

  return () => {
    for (const button of buttons) button.removeEventListener("click", onClick);
    document.removeEventListener("themechange", onThemeChange);
  };
}
