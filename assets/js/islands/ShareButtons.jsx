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
          {/* Inline SVG rather than an icon font: same shape the native-share
              affordance needs, no third-party stylesheet, inherits currentColor. */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            fill="currentColor"
            className="w-3.5 h-3.5"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9l-94.1 47C145.4 170.2 121.9 160 96 160c-53 0-96 43-96 96s43 96 96 96c25.9 0 49.4-10.2 66.6-26.9l94.1 47c-.5 3.9-.7 7.8-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.9 0-49.4 10.2-66.6 26.9l-94.1-47c.5-3.9 .7-7.8 .7-11.9s-.2-8-.7-11.9l94.1-47c17.2 16.7 40.7 26.9 66.6 26.9z"/>
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={onCopy}
        className="social-icon-box"
        aria-label={t("copyLink")}
        title={t("copyLink")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-3.5 h-3.5"
          aria-hidden="true"
          focusable="false"
        >
          {copied ? (
            <path  />
          ) : (
            <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"/>
          )}
        </svg>
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
