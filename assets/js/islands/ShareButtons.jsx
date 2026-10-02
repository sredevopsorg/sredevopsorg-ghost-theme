import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { copyText } from "../lib/clipboard.js";
import { t } from "../lib/theme-config.js";

/**
 * Share controls that need an API or state.
 *
 * The hardcoded share links (email, X, Facebook, LinkedIn, WhatsApp, Reddit,
 * Mastodon) stay server-rendered in partials/social-share.hbs: they are plain
 * navigations that work without JavaScript, so re-rendering them here would
 * duplicate server output for no gain.
 *
 * This island adds only what the links cannot do:
 *
 *   - the native share sheet (Web Share API) where the platform has one;
 *   - copy-to-clipboard, which used to be an inline `onclick` with an `alert()` —
 *     an inline handler needs `unsafe-inline` in a CSP and cannot be covered by
 *     Ghost's nonce, and an alert is a modal interruption;
 *   - confirmation as an icon change plus an `aria-live` announcement, so it is
 *     visible without being a dialog and announced without stealing focus.
 *
 * The URL and title come from the DOM (canonical/og tags Ghost already emits),
 * with data attributes as an override — no payload is passed from Handlebars.
 */

function readMeta(selector) {
  return document.querySelector(selector)?.getAttribute("content") || "";
}

function shareTarget(props) {
  const url =
    props.url ||
    readMeta('meta[property="og:url"]') ||
    document.querySelector('link[rel="canonical"]')?.href ||
    window.location.href;
  const title = props.title || readMeta('meta[property="og:title"]') || document.title;
  return { url, title };
}

function ShareButtons(props) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const onCopy = async () => {
    const { url } = shareTarget(props);
    if (await copyText(url)) setCopied(true);
  };

  const onShare = async () => {
    const { url, title } = shareTarget(props);
    try {
      await navigator.share({ url, title });
    } catch {
      // The user dismissed the sheet; nothing to do and nothing to report.
    }
  };

  return (
    <>
      {canShare && (
        <button
          type="button"
          onClick={onShare}
          className="social-icon-box"
          aria-label={t("share")}
          title={t("share")}
        >
          <i className="fas fa-share-nodes text-sm" aria-hidden="true"></i>
        </button>
      )}

      <button
        type="button"
        onClick={onCopy}
        className="social-icon-box"
        aria-label={t("copyLink")}
        title={t("copyLink")}
      >
        <i className={copied ? "fas fa-check text-sm" : "fas fa-link text-sm"} aria-hidden="true"></i>
      </button>

      {/* Confirmation for assistive tech; sighted users get the icon change. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? t("linkCopied") : ""}
      </span>
    </>
  );
}

/** Island contract: see assets/js/islands.js. */
export function mount(element, props) {
  createRoot(element).render(<ShareButtons {...props} />);
}
