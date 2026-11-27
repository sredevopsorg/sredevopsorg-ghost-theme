/**
 * The synthesis job: one post in, one MP3 in GCS, one marker in the post.
 *
 * Steps, and each one is visible in the structured log line:
 *
 *   1. read the post (Admin API; `.md` without a key) and refuse anything that is not
 *      a published post tagged with exactly one of `en|es|br`
 *   2. extract the text the reader would hear (`text.mjs`)
 *   3. hash it with the voice and speed; stop if the marker is already current **and**
 *      the object still exists
 *   4. synthesise, encode one tagged MP3, upload it
 *   5. write the marker into `codeinjection_foot`
 *
 * A failure at any step exits non-zero and leaves the previous marker alone, so a
 * broken run never points a reader at audio that is not there. "Nothing to do" is a
 * skip, not a failure: a draft, an untagged post, or an unchanged article must not
 * turn the Job red and page anyone.
 */

import { contentHash } from "./hash.mjs";
import { buildMarker, markerOf, setMarker } from "./markers.mjs";
import { articleSentences, chunkSentences, dedupeCaption, terminate } from "./text.mjs";
import { synthesizeArticle } from "./tts.mjs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeArticle, probeDuration } from "./audio.mjs";
import { GcsStore } from "./gcs.mjs";
import { localeOf, markerIsCurrent, parseMarkdown, readPost, verifyRepresentations, writeCodeInjection } from "./ghost.mjs";
import { objectPath, publicUrl } from "./config.mjs";

/** Why a run finished without producing audio. Logged, never thrown to the caller. */
export class Skip extends Error {
  constructor(reason) {
    super(reason);
    this.name = "Skip";
    this.reason = reason;
  }
}

/**
 * The sentences to speak for a post.
 *
 * The feature-image caption, when it is not already repeated in the body, is said
 * **first**: it describes the picture the reader sees next to the title, and putting it
 * after the article would read as a detached fragment.
 */
export function postText(post) {
  const body = articleSentences(post?.html ?? "");
  const caption = dedupeCaption(post?.feature_image_caption, body.join(" "));
  // The caption is terminated like any other fragment: it is a sentence boundary.
  const sentences = caption ? [terminate(caption), ...body] : body;
  return { sentences, text: sentences.join(" ") };
}

/**
 * Synthesise one post.
 *
 * @param {object} options
 * @param {string} options.postId
 * @param {ReturnType<import("./config.mjs").jobConfig>} options.config
 * @param {{ upload: Function }} [options.store]  GcsStore, or a fake in tests
 * @param {Function} [options.log]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {AbortSignal} [options.signal]
 */
export async function runJob({ postId, config, store, log = () => {}, fetchImpl = fetch, signal }) {
  const started = Date.now();
  const stats = { post_id: postId };

  try {
    // 1. read + eligibility ------------------------------------------------------
    const { post, md, source } = await readPost(config, postId, { fetchImpl });
    stats.source = source;
    stats.slug = post.slug;

    if ((post.status ?? "published") !== "published") throw new Skip(`status is ${post.status}`);

    const locale = localeOf(post.tags);
    stats.locale = locale;
    if (!locale) throw new Skip("not tagged with exactly one of en|es|br");

    if (source === "admin" && md) {
      // The only in-band way to learn that the public `.md` drifted from the stored
      // post. Drift is logged, not fatal: the Admin copy is the stored source.
      const diffs = verifyRepresentations(parseMarkdown(md).frontmatter, post);
      if (diffs.length) log(`representation drift for ${post.slug}: ${JSON.stringify(diffs)}`);
    }

    // 2. text --------------------------------------------------------------------
    const { sentences, text } = postText(post);
    stats.sentences = sentences.length;
    stats.chars = text.length;
    if (!text) throw new Skip("no spoken text in the post");

    const voice = config.voices[locale];
    const chunks = chunkSentences(sentences, config.chunkChars);
    stats.chunks = chunks.length;

    // 3. skip-if-current ---------------------------------------------------------
    const hash = contentHash({ voice: voice.voice, speed: voice.speed, text });
    stats.hash = hash;
    if (await markerIsCurrent(config, markerOf(post), hash, { fetchImpl })) {
      throw new Skip(`audio already current (${hash})`);
    }

    // 4. synthesise + upload -----------------------------------------------------
    const ttsStarted = Date.now();
    const { parts, sampleRate } = await synthesizeArticle(chunks, {
      voice: voice.voice,
      speed: voice.speed,
      // The locale decides espeak-ng's language, and therefore the IPA the model sees.
      // Getting this wrong is not an error: it produces a Spanish post read with English
      // phonetics.
      locale,
      signal,
      onProgress: ({ index, total }) => {
        // Every tenth chunk: enough to see a long post move without flooding the log.
        if (index % 10 === 0 || index === total - 1) log(`synthesised ${index + 1}/${total} chunks`);
      },
    });
    stats.tts_ms = Date.now() - ttsStarted;

    const published = (post.published_at ?? "").slice(0, 10);
    const audio = await encodeArticle({
      parts,
      sampleRate,
      gapMs: config.gapMs,
      tags: {
        title: post.title ?? post.slug ?? postId,
        artist: "SREDevOps.org",
        album: LOCALE_LABEL[locale] ?? locale,
        date: published || undefined,
        comment: `voice=${voice.voice} speed=${voice.speed}`,
      },
      log,
    });
    stats.bytes = audio.length;
    stats.duration = await probeDurationFromBuffer(audio);

    const path = objectPath(postId, hash);
    const file = publicUrl(config, path);
    const storeImpl = store ?? new GcsStore({ bucket: config.bucket, log });
    // The saved file name the reader sees. The island links the object directly, so the
    // name has to travel with the object rather than with the link.
    const downloadName = `${safeSlug(post.slug ?? postId)}-${FILENAME_LANG[locale] ?? "en"}.mp3`;
    await storeImpl.upload(path, audio, { downloadName });

    // 5. marker ------------------------------------------------------------------
    const line = buildMarker({
      hash,
      file,
      voice: voice.voice,
      bytes: audio.length,
      duration: stats.duration ? Math.round(stats.duration) : undefined,
      at: new Date().toISOString().slice(0, 10),
    });
    const foot = setMarker(post.codeinjection_foot, line);
    if (foot !== (post.codeinjection_foot ?? "")) {
      await writeCodeInjection(config, post, foot, { fetchImpl, log });
      stats.marker = "written";
    } else {
      stats.marker = "unchanged";
    }

    stats.result = "ok";
    return finish(stats, started, log);
  } catch (err) {
    if (err instanceof Skip) {
      stats.reason = `skip: ${err.reason}`;
      stats.result = "skipped";
      return finish(stats, started, log);
    }
    stats.reason = err.message;
    stats.result = "failed";
    finish(stats, started, log);
    throw err;
  }
}

const LOCALE_LABEL = { en: "English", es: "Español", br: "Português (BR)" };

/** Short language code used in the saved file name; mirrors the theme's `tts.js`. */
const FILENAME_LANG = { en: "en", es: "es", br: "pt" };

/**
 * Reduce a slug to `[a-z0-9-]` for the Content-Disposition filename.
 *
 * The same rules as `trackArtifactName` in assets/js/lib/tts.js, so a file downloaded from
 * the player and one saved from the CDN link have the same name.
 */
function safeSlug(slug) {
  return (
    String(slug ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "article"
  );
}

function finish(stats, started, log) {
  stats.duration_ms = Date.now() - started;
  log(JSON.stringify(stats));
  return stats;
}

/**
 * Duration of an in-memory MP3.
 *
 * `probeDuration` reads a file and the encoded article is only in memory here, so it is
 * written to a temp directory ffprobe can see. A missing duration is not fatal: it only
 * means the marker omits a cosmetic field.
 */
async function probeDurationFromBuffer(buffer) {
  const dir = await mkdtemp(join(tmpdir(), "tts-probe-"));
  try {
    const file = join(dir, "probe.mp3");
    await writeFile(file, buffer);
    return await probeDuration(file);
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
