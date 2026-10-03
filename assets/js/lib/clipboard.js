/**
 * Clipboard helper — no framework, no DOM at import time.
 *
 * The async Clipboard API needs a secure context; on plain http (or an older
 * browser) it is missing or rejects. The fallback is the legacy
 * `document.execCommand("copy")` over a temporary textarea, which is what the
 * vendored Prism bundle does too.
 *
 * Both the navigator and the document are injectable so the decision logic can be
 * unit-tested without a browser (tests/clipboard.test.mjs).
 *
 * @returns {Promise<boolean>} whether the text ended up on the clipboard
 */
export async function copyText(text, { navigator: nav = globalThis.navigator, document: doc = globalThis.document } = {}) {
  if (typeof text !== "string" || text === "") return false;

  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context: fall through to the legacy path.
  }

  try {
    if (!doc?.createElement || !doc.body) return false;

    const textarea = doc.createElement("textarea");
    textarea.value = text;
    // Keep it out of sight and out of the layout, but still selectable.
    textarea.setAttribute("readonly", "");
    Object.assign(textarea.style, { position: "fixed", top: "0", left: "0", opacity: "0" });

    doc.body.appendChild(textarea);
    textarea.select();
    const ok = doc.execCommand?.("copy") === true;
    doc.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
