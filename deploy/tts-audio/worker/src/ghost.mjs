/**
 * Ghost Admin API client, split into the two things this pipeline does with it:
 * **reading** a post (the job) and **writing** the marker back (the job and the
 * receiver). Code injection is an admin-only column, so both need an admin key.
 *
 * ## Authentication: the key is not the token
 *
 * Ghost's `Authorization: Ghost <token>` header takes a **signed JWT**, not the
 * `id:secret` string from Ghost Admin. This is the single most expensive thing to get
 * wrong here: sending the raw key produces `400 INVALID_JWT`, which reads like a bad
 * key, so every symptom points at the credential rather than at the request. Ghost's own
 * code makes it unambiguous (`core/server/auth/api-key/admin.js`):
 *
 *     const decoded = jwt.decode(token, { complete: true });
 *     if (!decoded || !decoded.header) throw BadRequestError({ code: 'INVALID_JWT' });
 *     const apiKeyId = decoded.header.kid;
 *
 * So: header `{ alg: "HS256", typ: "JWT", kid: <id> }`, payload `{ iat, exp, aud: "/admin/" }`,
 * signed with the **hex-decoded** secret as an HMAC key. See `signAdminToken`.
 *
 * Why the Admin API and not the public `<url>.md`: `.md` needs no key, and the job
 * fetches it anyway as a divergence check (see `readPost` / `mdUrl`), but it is a
 * *rendered* representation. The Admin API returns the stored source and an
 * `updated_at` that the marker round-trip needs for optimistic concurrency. When no
 * key is configured — local runs, unit tests — `readPost` falls back to `.md`, which is
 * also how the tests get a real post without a Ghost instance.
 */

import { createHmac } from "node:crypto";
import { parseMarker, removeMarker } from "./markers.mjs";

/** Locales a post may be tagged with, in the theme's content keys. `br` is not `pt`. */
export const LOCALES = ["en", "es", "br"];

/** Ghost API versions this client was exercised against. */
const API = "v6.0";

/**
 * Locale of a post, from its public (non-internal, non-`#`) tags.
 *
 * `null` means "do not synthesise": either no locale tag or more than one. A post with
 * both `es` and `br` has no single correct voice, and guessing would produce audio in
 * the wrong language — the pipeline §"Content scope" limit, not an oversight.
 */
export function localeOf(tags) {
  // Match on the **slug**, and fall back to the name only when there is no slug.
  //
  // The slugs are what `routes.yaml` filters on (`tag:es+tag:-en+tag:-br`), and they are
  // stable. The *names* are editorial: this publication's locale tags are named
  // "Español", "English" and "Português", so matching names found nothing and marked
  // every real post ineligible. A tag with slug `es` and name `Español` is still `es`.
  const slugs = (tags ?? [])
    .filter((tag) => tag && tag.visibility !== "internal")
    .map((tag) => {
      const slug = String(tag.slug ?? "").trim().toLowerCase();
      if (slug) return slug;
      // Webhook payloads may omit the slug; the name is the only identifier then, and a
      // `#hash` name is a private tag, not a locale.
      const name = String(tag.name ?? "").trim().toLowerCase();
      return name.startsWith("#") ? "" : name;
    })
    .filter(Boolean);

  const matches = LOCALES.filter((locale) => slugs.includes(locale));
  return matches.length === 1 ? matches[0] : null;
}

class GhostError extends Error {
  constructor(status, message, body) {
    super(`Ghost ${status}: ${message}`);
    this.name = "GhostError";
    this.status = status;
    this.body = body;
  }
}

/** How long a signed token is valid. Ghost rejects anything older than 5 minutes. */
export const TOKEN_TTL_SECONDS = 300;

/** Ghost's Admin API audience. Requests to another route are refused. */
const ADMIN_AUDIENCE = "/admin/";

const base64url = (value) => Buffer.from(value).toString("base64url");

/**
 * Sign a Ghost Admin API token.
 *
 * Split `id:secret` at the **first** colon only: the secret is hex, but splitting on the
 * last colon instead breaks a malformed key in a confusing way rather than failing loudly.
 *
 * The secret is hex, so it is decoded to bytes before being used as the HMAC key — using
 * the hex *string* as the key produces a valid-looking JWT that Ghost rejects.
 */
export function signAdminToken(adminKey, { now = Date.now(), ttl = TOKEN_TTL_SECONDS } = {}) {
  const key = String(adminKey ?? "");
  const colon = key.indexOf(":");
  if (colon < 1) {
    throw new Error("GHOST_ADMIN_API_KEY is not in `id:secret` form");
  }
  const id = key.slice(0, colon);
  const secret = key.slice(colon + 1);
  if (!/^[0-9a-f]+$/i.test(secret) || secret.length % 2 !== 0) {
    throw new Error("GHOST_ADMIN_API_KEY secret is not hex — copy the Admin API key from Ghost Admin");
  }

  const issuedAt = Math.floor(now / 1000);
  const header = { alg: "HS256", typ: "JWT", kid: id };
  const payload = { iat: issuedAt, exp: issuedAt + ttl, aud: ADMIN_AUDIENCE };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = createHmac("sha256", Buffer.from(secret, "hex")).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

/** The request headers for an Admin API call, including a freshly signed token. */
export function ghostHeaders(adminKey) {
  return {
    Authorization: `Ghost ${signAdminToken(adminKey)}`,
    Accept: "application/json",
    "User-Agent": "sredevops-tts-audio/1",
  };
}

/** Turn a non-2xx response into a GhostError carrying Ghost's own message. */
async function fail(response) {
  let message = response.statusText;
  let body = null;
  let code = "";
  try {
    body = await response.json();
    message = body?.errors?.[0]?.message ?? message;
    code = body?.errors?.[0]?.code ?? "";
  } catch {
    // A non-JSON body adds nothing; the status is still reported.
  }
  // A rejected key is the most common first-run failure and the least self-explanatory:
  // Ghost answers `INVALID_JWT` with a 400, which reads like a malformed request.
  if (code === "INVALID_JWT") {
    message += " (the Admin API key was rejected — regenerate it in Ghost Admin → Integrations and update the Secret)";
  }
  throw new GhostError(response.status, message, body);
}

/** Public `.md` URL for a post, used as the key-less source and as the cross-check. */
export function mdUrl(siteUrl, slug) {
  return `${String(siteUrl).replace(/\/+$/, "")}/${String(slug).replace(/^\/+/, "")}/.md`;
}

/**
 * Fetch one post with its HTML and Markdown representations.
 *
 * Returns `{ post, md, source }` where `source` names which representation supplied
 * `post` (`admin` or `md`). The Markdown is always fetched when `siteUrl` is set, even
 * when the Admin API answered, because `verifyRepresentations` compares the two.
 *
 * The Admin API's accepted formats are `html`, `mobiledoc`, `lexical` and `plaintext` —
 * **not** `md`. Requesting `formats=html,md` is a `422 Validation (AllowedValues) failed
 * for formats`, which the client used to report as an unexplained read failure.
 *
 * `plaintext` is what the drift check actually wants: Ghost derives it from the same
 * stored source in the same request, so it is the *same revision* of the article and
 * comparing it with `html` is meaningful rather than a race between two renders.
 */
export async function readPost(config, postId, { fetchImpl = fetch } = {}) {
  if (config.adminKey && config.ghostApiUrl) {
    const url = `${config.ghostApiUrl}/ghost/api/admin/posts/${encodeURIComponent(postId)}/?formats=html,plaintext`;
    const response = await fetchImpl(url, { headers: ghostHeaders(config.adminKey) });
    if (!response.ok) await fail(response);
    const payload = await response.json();
    const post = payload?.posts?.[0];
    if (!post) throw new Error(`Ghost returned no post for id ${postId}`);
    // `plaintext` is the second representation when the Admin API answered.
    return { post, md: post.plaintext ?? "", source: "admin" };
  }

  if (!config.siteUrl) {
    throw new Error("no Ghost client configured: set GHOST_API_URL + GHOST_ADMIN_API_KEY, or SITE_URL");
  }
  // Without a key only the slug is known through `.md`, so the caller passes a slug.
  const response = await fetchImpl(mdUrl(config.siteUrl, postId), { headers: { Accept: "text/markdown" } });
  if (!response.ok) await fail(response);
  const md = await response.text();
  const { frontmatter, body } = parseMarkdown(md);
  return {
    post: { id: postId, slug: frontmatter.slug, markdown: body, html: markdownToHtml(body), ...frontmatter },
    md,
    source: "md",
  };
}

/**
 * Compare the JSON frontmatter of a `.md` fetch with the Admin API post.
 *
 * Returns a list of differences as `{ field, md, admin }`. A drift here means the audio
 * would be generated from text the theme does not render (or the reverse), so the job
 * logs it and — by policy — proceeds from the **Admin** copy, which is the stored
 * source. The check exists so drift is visible, not so it can be ignored silently.
 */
export function verifyRepresentations(mdFrontmatter, post) {
  const diffs = [];
  const pairs = [
    ["slug", mdFrontmatter?.slug, post?.slug],
    ["title", mdFrontmatter?.title, post?.title],
  ];
  for (const [field, mdValue, adminValue] of pairs) {
    const a = mdValue === undefined ? null : String(mdValue);
    const b = adminValue === undefined ? null : String(adminValue);
    // Only a *present* pair that disagrees is drift; a missing field is not a claim.
    if (a !== null && b !== null && a !== b) diffs.push({ field, md: a, admin: b });
  }
  return diffs;
}

/**
 * Parse a Ghost `.md` response.
 *
 * Ghost emits a JSON frontmatter block delimited by `---` lines. The body is Markdown,
 * which is *not* the HTML the theme renders, so it is only used as a fallback source
 * (key-less runs). `markdownToHtml` covers the constructs the pipeline reads: headings,
 * paragraphs, lists, quotes and fenced code (which is stripped later anyway).
 */
export function parseMarkdown(md) {
  const text = String(md ?? "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) return { frontmatter: {}, body: text.trim() };
  let frontmatter = {};
  try {
    frontmatter = JSON.parse(match[1]);
  } catch {
    // Ghost always writes valid JSON here; an unparseable block means a hand-edited
    // file, which is worth ignoring rather than failing the run over.
    frontmatter = {};
  }
  return { frontmatter, body: text.slice(match[0].length).trim() };
}

/**
 * Minimal Markdown → HTML for the key-less path.
 *
 * Not a general Markdown engine on purpose: it produces the same element names the
 * extractor strips, so `htmlToText` treats a `.md` post and an Admin post identically.
 */
export function markdownToHtml(markdown) {
  const lines = String(markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let list = null;
  let inFence = false;

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (inFence) {
        closeList();
        out.push("</code></pre>");
      } else {
        closeList();
        out.push("<pre><code>");
      }
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      out.push(`${escapeHtml(line)}\n`);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ordered) {
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${inline(ordered[1])}</li>`);
      continue;
    }
    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (quote) {
      closeList();
      out.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`);
      continue;
    }
    closeList();
    // A soft-wrapped paragraph: consecutive plain lines join with a space.
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inFence) out.push("</code></pre>");
  closeList();
  return out.join("\n");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Inline Markdown → HTML: links keep their text, images are dropped, code is marked. */
function inline(value) {
  return escapeHtml(value)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2");
}

/**
 * Write the marker into a post's code injection.
 *
 * Only `codeinjection_foot` and `updated_at` are sent: `source=html` requires the
 * `updated_at` the client last saw, and omitting every other field is what keeps a
 * regeneration from rewriting the article body or racing an editor.
 *
 * Ghost answers `409 Conflict` when the post changed in between (someone edited it
 * while the audio was synthesising); `retryOnConflict` re-reads and writes again once.
 */
export async function writeCodeInjection(config, post, foot, { fetchImpl = fetch, log = () => {} } = {}) {
  const url = `${config.ghostApiUrl}/ghost/api/admin/posts/${encodeURIComponent(post.id)}/?source=html`;
  const attempt = async () => {
    const response = await fetchImpl(url, {
      method: "PUT",
      headers: { ...ghostHeaders(config.adminKey), "Content-Type": "application/json" },
      body: JSON.stringify({ posts: [{ updated_at: post.updated_at, codeinjection_foot: foot }] }),
    });
    if (!response.ok) await fail(response);
    return response.json();
  };

  try {
    return await attempt();
  } catch (err) {
    if (err?.status !== 409) throw err;
    log(`post ${post.id} changed during synthesis (409); re-reading and writing once more`);
    const { post: fresh } = await readPost(config, post.id, { fetchImpl });
    post = fresh;
    return attempt();
  }
}

/**
 * Is the marker already current? True only when the hash matches **and** the object
 * the marker points at still answers 200 — an object deleted by the lifecycle rule or
 * by hand must force a regeneration even though the marker is unchanged.
 */
export async function markerIsCurrent(config, marker, hash, { fetchImpl = fetch } = {}) {
  if (!marker || marker.hash !== hash || !marker.file) return false;
  if (!marker.file.startsWith(config.audioBaseUrl)) return false;
  try {
    const response = await fetchImpl(marker.file, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Snapshot the facts the receiver needs from a webhook payload.
 *
 * Ghost's payload shape is `{ post: { current, previous }, event }`; `current` is
 * absent on delete. Everything is optional-chained because a payload is external
 * input: a malformed one must produce a 4xx, never a TypeError.
 */
export function webhookSnapshot(payload) {
  const current = payload?.post?.current ?? null;
  const previous = payload?.post?.previous ?? null;
  const post = current ?? previous;
  if (!post?.id) return null;
  return {
    event: typeof payload?.event === "string" ? payload.event : "",
    id: post.id,
    slug: post.slug,
    status: (current ?? previous)?.status ?? null,
    locale: localeOf((current ?? previous)?.tags),
    contentHash: current?.content_hash ?? previous?.content_hash ?? "",
    previousHash: previous?.content_hash ?? "",
    marker: parseMarker((current ?? previous)?.codeinjection_foot),
    deleted: !current,
  };
}

