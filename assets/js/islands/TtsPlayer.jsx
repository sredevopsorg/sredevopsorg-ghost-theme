import { createRoot } from "react-dom/client";
import { useEffect, useId, useRef, useState } from "react";
import { getRoot, forgetRoot } from "../lib/island-root.js";
import { t, themeConfig } from "../lib/theme-config.js";
import { concatAudioBlobs } from "../lib/audio.js";
import {
  AUDIO_MARKER_NAME,
  chunkText,
  formatDuration,
  missingIndexes,
  resolveAudio,
  trackArtifactName,
  uniquePartsCount,
  voiceFor,
} from "../lib/tts.js";

/**
 * Text-to-speech miniplayer for posts, powered by Cloud Text-to-Speech with a
 * Chirp 3: HD voice.
 *
 * Mount point (partials/post-layout.hbs, post context only):
 *   <div data-island="TtsPlayer" data-target=".gh-content" data-locale="es"
 *        data-slug="the-post-slug" data-api-key="…"></div>
 *
 * The article text is read from the DOM, not from a payload: it is already on the
 * page, and cloning before stripping code/tables keeps the server markup untouched.
 *
 * The player is inline above the article and behaves like an audio miniplayer:
 * play/pause, back/forward 10 s, stop, speed, a timebar with elapsed and remaining
 * time, and a download that saves the whole article as one MP3. Only the play button
 * renders before the first press, so the page looks unchanged until someone asks for
 * audio.
 *
 * Three constraints shape the request code below:
 *
 *  - Cloud TTS accepts at most 5000 UTF-8 bytes per `text:synthesize` call, so the
 *    article is chunked (assets/js/lib/tts.js) and the chunks are fetched and played
 *    in order, prefetching the next one while the current one is audible.
 *  - Chirp 3: HD batch mode does not accept a speaking rate, so playback speed is the
 *    media element's `playbackRate`. That keeps the pitch and, more importantly,
 *    costs nothing: re-synthesising per speed would bill the article again.
 *  - The first `play()` happens after a synthesis request, and iOS Safari refuses
 *    playback that is not started inside the user gesture. One audio element is
 *    therefore created and primed on a silent clip inside the click, and reused for
 *    every chunk; see `ensureAudio`.
 *
 * The API key arrives as a data attribute because a Ghost theme has no server-side
 * runtime to proxy the request — treat that key as public, not as a secret.
 *
 * The audio element, object URL and in-flight requests are owned by refs and released
 * on stop, on end/error and on unmount, so no playback or download outlives the island.
 *
 * --- Pre-generated audio (the normal path) -------------------------------------
 *
 * The pipeline in deploy/tts-audio/ synthesises each article once with a local Kokoro
 * model and stores it in GCS; the post then carries a marker in its code injection:
 *
 *   <meta name="sredevops:tts" content='{"v":1,"hash":"…","file":"https://…"}' >
 *
 * When that marker resolves to a file on the theme's audio host, the island switches to
 * **file mode**: a single `<audio src>`, so seeking is native, the duration is exact, and
 * nothing is synthesised per listener. Cloud TTS stays as the **fallback** for a post
 * whose audio has not been generated yet (a new post between publish and the job finishing,
 * a deleted object, or a marker pointing somewhere the theme does not trust) — in that
 * mode the chunked path below is used unchanged.
 */

const ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";
const STRIP_SELECTOR = "pre, code, script, style, nav, .table-responsive";

/**
 * Elements whose boundaries must become spaces.
 *
 * `textContent` concatenates without separators, so `<li>uno</li><li>dos</li>`
 * reads as "unodoss" — long runs like that are what Cloud TTS rejects as
 * "sentences that are too long". A space after every block keeps words apart.
 */
const BLOCK_SELECTOR = [
  "p", "div", "li", "br", "tr", "td", "th", "dt", "dd",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "figcaption", "section", "article", "ul", "ol", "aside",
].join(", ");

/** 44-byte silent WAV. Primes the audio element inside the click; never audible. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/**
 * Is the element still holding the silent unlock clip?
 *
 * Not `audio.src === SILENT_WAV`: the property returns the *resolved* URL, and browsers
 * differ on whether a `data:` URL survives that resolution unchanged. Comparing the
 * attribute the island itself set is the only reliable test.
 */
function isSilentClip(element) {
  return element.getAttribute("src") === SILENT_WAV;
}

/**
 * The host pre-generated audio is served from, read from the theme config.
 *
 * A pipeline ConfigMap value mirrored in partials/island-config.hbs so the island never
 * hard-codes it: moving the bucket is a theme setting, not a JS release.
 */
const DEFAULT_AUDIO_HOST = "https://audio.sredevops.org";

/** Read the marker the pipeline writes into the post's code injection. */
function readAudioMarker() {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`meta[name="${AUDIO_MARKER_NAME}"]`);
  return el?.getAttribute("content") ?? null;
}

/** How far the skip buttons move the playhead, in seconds. */
const SKIP_SECONDS = 10;

function articleText(target) {
  const article = document.querySelector(target);
  if (!article) return "";
  const clone = article.cloneNode(true);
  for (const node of clone.querySelectorAll(STRIP_SELECTOR)) node.remove();
  for (const element of clone.querySelectorAll(BLOCK_SELECTOR)) element.after(" ");
  return (clone.textContent || "").replace(/\s+/g, " ").trim();
}

/** Cloud TTS returns base64 audio; hand it to the audio element as a Blob URL. */
function base64ToBlob(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "audio/mpeg" });
}

/** Save a Blob as a file through a temporary link, then release the URL. */
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Deferred: Safari reads the URL after the click handler returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Assume a chunk lasts this long until its metadata says otherwise. Only used to
 * turn a timebar drag on a chunk nobody has played into an offset; Cloud TTS
 * chunks are a few thousand characters each, so a few minutes.
 */
const ASSUMED_CHUNK_SECONDS = 90;

function TtsPlayer({ apiKey, target = ".gh-content", locale, voice, slug }) {
  // Resolved once at mount: the marker does not change while the page is open, and a
  // re-read during render would make the mode flip on an unrelated state update.
  const [audio] = useState(() => resolveAudio(readAudioMarker(), themeConfig().audioHost || DEFAULT_AUDIO_HOST));
  const [status, setStatus] = useState("idle");
  // `file` when a pre-generated MP3 is available, `cloud` for the Cloud TTS fallback.
  const [mode, setMode] = useState(audio ? "file" : "cloud");
  const modeRef = useRef(audio ? "file" : "cloud");
  const [speed, setSpeed] = useState(1);
  // Playhead: the loaded chunk, and how far into it playback is.
  const [index, setIndex] = useState(null);
  const [current, setCurrent] = useState(0);
  // How many chunks have been played through to their end.
  const [heard, setHeard] = useState(0);
  // Download state: `null` when idle, `{done, total}` while synthesising.
  const [download, setDownload] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  const speedRef = useRef(1);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const chunksRef = useRef([]);
  const cacheRef = useRef(new Map());
  const controllerRef = useRef(null);
  const aliveRef = useRef(true);
  // Newest status, readable from media-event callbacks outside React's render.
  const statusRef = useRef(status);
  statusRef.current = status;
  const indexRef = useRef(null);
  const heardRef = useRef(0);
  const durationsRef = useRef({});
  const downloadRef = useRef(null);
  // Separate from `controllerRef` so a download and playback can run at once.
  const downloadControllerRef = useRef(null);
  // True while a seek deliberately pauses the outgoing chunk.
  const switchingRef = useRef(false);
  const speedId = useId();
  const seekId = useId();

  const setSafeStatus = (next) => {
    if (aliveRef.current) setStatus(next);
  };

  const releaseAudioUrl = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  /** Drop the element's per-chunk handlers; the element lives on for the unlock. */
  const detachHandlers = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
  };

  /** Mark every chunk up to and including `position` as heard. */
  const markHeard = (position) => {
    if (position + 1 > heardRef.current) {
      heardRef.current = position + 1;
      if (aliveRef.current) setHeard(heardRef.current);
    }
  };

  /**
   * Abort in-flight requests and drop every buffer for the current session.
   * The audio element itself is kept: it carries the gesture unlock.
   */
  const endSession = () => {
    downloadRef.current = null;
    downloadControllerRef.current?.abort();
    downloadControllerRef.current = null;
    controllerRef.current?.abort();
    controllerRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      detachHandlers();
      audio.pause();
    }
    releaseAudioUrl();
    cacheRef.current.clear();
    chunksRef.current = [];
  };

  /**
   * Create (once) and prime the audio element, and install the listeners that keep
   * the timebar current for whichever chunk is loaded.
   *
   * Must be called synchronously from a click handler: iOS Safari ties playback
   * permission to the gesture, and the await on the synthesis request would end it.
   * A silent clip is played and discarded; the same element then carries the real
   * chunks, so no later `play()` needs its own gesture.
   */
  const ensureAudio = () => {
    const existing = audioRef.current;
    if (existing) return existing;

    const audio = new Audio(SILENT_WAV);
    audio.preload = "auto";
    audio.play().catch(() => {
      // Browsers that do not require an unlock reject or ignore this; the real
      // play() below still reports a genuine failure.
    });

    const onMetadata = () => {
      if (!aliveRef.current) return;
      const known = Number.isFinite(audio.duration) && audio.duration > 0;
      if (!known) return;
      const at = indexRef.current;
      if (at !== null) durationsRef.current[at] = audio.duration;
    };

    audio.onloadedmetadata = onMetadata;
    audio.ondurationchange = onMetadata;
    audio.ontimeupdate = () => {
      if (!aliveRef.current) return;
      setCurrent(audio.currentTime || 0);
      // A chunk counts as heard once its last quarter second starts playing.
      const known = Number.isFinite(audio.duration) && audio.duration > 0;
      if (known && (audio.currentTime || 0) >= audio.duration - 0.25 && indexRef.current !== null) {
        markHeard(indexRef.current);
      }
    };
    audio.onplaying = () => {
      // The silent unlock clip also fires `playing`; it must not make the UI claim
      // the article is audible before the first chunk is loaded.
      if (modeRef.current !== "cloud" || isSilentClip(audio) || indexRef.current === null) return;
      if (aliveRef.current && statusRef.current !== "generating") setSafeStatus("playing");
    };
    audio.onpause = () => {
      // Only a reader-initiated pause lands here; an ended chunk moves straight on,
      // and a seek pauses the old chunk on purpose before loading the next one.
      if (modeRef.current !== "cloud" || isSilentClip(audio) || indexRef.current === null || switchingRef.current) return;
      if (aliveRef.current && statusRef.current === "playing") setSafeStatus("paused");
    };

    audioRef.current = audio;
    return audio;
  };

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      endSession();
    };
    // endSession only touches refs, so capturing it once is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- File mode: one pre-generated file, streamed from the audio host ----------
   *
   * No chunking, no synthesis, no API key. The media element is the source of truth for
   * time, so the transport UI (seek slider, skip, speed) drives it directly and the
   * "n/N parts" counter — which describes a chunk cache — is not shown.
   */

  /** Mark the file as heard once its final quarter second starts. */
  const markFileProgress = () => {
    const element = audioRef.current;
    if (!element || !aliveRef.current) return;
    const known = Number.isFinite(element.duration) && element.duration > 0;
    if (known && element.currentTime >= element.duration - 0.25) markHeard(0);
  };

  /**
   * Attach the pre-generated file to the media element and play it.
   *
   * Called from a click, so iOS's gesture requirement is satisfied by calling `play()`
   * synchronously — the file needs no synthesis round trip before playback starts.
   */
  const playFile = () => {
    const element = audioRef.current ?? ensureAudio();
    detachHandlers();

    releaseAudioUrl();
    indexRef.current = 0;
    setIndex(0);
    setCurrent(0);
    heardRef.current = 0;
    setHeard(0);

    element.onloadedmetadata = () => {
      if (aliveRef.current) setCurrent(0);
    };
    element.ontimeupdate = () => {
      if (!aliveRef.current) return;
      setCurrent(element.currentTime || 0);
      markFileProgress();
    };
    element.onended = () => {
      if (!aliveRef.current) return;
      markHeard(0);
      setSafeStatus("idle");
    };
    element.onerror = () => {
      // `stop()` clears the source and a media element with no source fires `error` too;
      // only a failure to load the actual file is a reason to fall back.
      if (!aliveRef.current || element.getAttribute("src") !== audio.file) return;
      console.warn("[tts] pre-generated audio failed to load; falling back to Cloud TTS");
      releaseAudioUrl();
      fallBackToCloud();
    };

    element.src = audio.file;
    element.playbackRate = speedRef.current;
    setSafeStatus("loading");
    element.play().then(
      () => {
        if (aliveRef.current) setSafeStatus("playing");
      },
      () => {
        if (aliveRef.current) setSafeStatus("error");
      },
    );
  };

  /**
   * Switch from file mode to the Cloud TTS path after the file failed.
   *
   * The mode lives in a ref as well as state so the decision survives re-renders without
   * a second React commit racing the audio events.
   */
  const fallBackToCloud = () => {
    modeRef.current = "cloud";
    setMode("cloud");
    if (!apiKey) {
      setSafeStatus("error");
      return;
    }
    startCloud();
  };

  const synthChunk = async (text, signal) => {
    const { languageCode, name } = voiceFor(locale, voice);
    const response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name },
        // MP3 keeps the response small; the sample rate is left to the voice's
        // natural output, which the browser resamples anyway.
        audioConfig: { audioEncoding: "MP3" },
      }),
    });

    if (!response.ok) {
      // Keep the API's own message: "sentences that are too long" and quota errors
      // are indistinguishable from a generic 400 otherwise.
      let detail = "";
      try {
        detail = (await response.json())?.error?.message ?? "";
      } catch {
        // A non-JSON error body adds nothing; the status is still reported.
      }
      throw new Error(`Cloud TTS ${response.status}${detail ? `: ${detail}` : ""}`);
    }

    const payload = await response.json();
    if (!payload?.audioContent) throw new Error("Cloud TTS returned no audio");
    return base64ToBlob(payload.audioContent);
  };

  /**
   * Load `position` into the audio element and play it from `offset` seconds.
   * A chunk not in the cache is synthesised first (status `generating`).
   */
  const playChunk = async (position, controller, offset = 0) => {
    const chunks = chunksRef.current;
    if (!aliveRef.current || controller.signal.aborted) return;

    if (position >= chunks.length) {
      releaseAudioUrl();
      markHeard(chunks.length - 1);
      setSafeStatus("idle");
      return;
    }

    let blob = cacheRef.current.get(position);
    if (!blob) {
      // The first chunk of a session, or a jump to one never reached, both wait on
      // a synthesis request; the play button shows Generating meanwhile.
      setSafeStatus("generating");
      blob = await synthChunk(chunks[position], controller.signal);
      if (!aliveRef.current || controller.signal.aborted) return;
      cacheRef.current.set(position, blob);
    }

    // The previous chunk must not answer its own end/error once this one takes over.
    detachHandlers();

    // Warm the next chunk while this one is audible; a failed prefetch is not an
    // error, the chunk is simply requested on demand when its turn comes.
    const next = position + 1;
    if (next < chunks.length && !cacheRef.current.has(next)) {
      synthChunk(chunks[next], controller.signal)
        .then((prefetched) => {
          if (!controller.signal.aborted) cacheRef.current.set(next, prefetched);
        })
        .catch(() => {});
    }

    indexRef.current = position;
    setIndex(position);

    const audio = audioRef.current ?? ensureAudio();
    releaseAudioUrl();

    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    audio.src = url;
    audio.playbackRate = speedRef.current;
    setCurrent(offset);

    audio.onended = () => {
      if (!aliveRef.current || controller.signal.aborted) return;
      markHeard(position);
      playChunk(next, controller).catch((err) => {
        console.warn("[tts]", err.message);
        setSafeStatus("error");
      });
    };
    audio.onerror = () => {
      if (!aliveRef.current || controller.signal.aborted) return;
      releaseAudioUrl();
      setSafeStatus("error");
    };

    try {
      await audio.play();
      // Applied after play() resolves: some browsers ignore a seek on a source
      // whose metadata has not loaded yet.
      if (offset > 0) {
        try {
          audio.currentTime = offset;
        } catch {
          // A browser that refuses the seek plays the chunk from its start.
        }
      }
      if (aliveRef.current && !controller.signal.aborted) setSafeStatus("playing");
    } catch {
      if (!aliveRef.current || controller.signal.aborted) return;
      releaseAudioUrl();
      setSafeStatus("error");
    }
  };

  /** Take over from the loaded chunk: stop it and forget its handlers. */
  const switchChunk = (position, offset) => {
    const controller = controllerRef.current ?? new AbortController();
    controllerRef.current = controller;
    detachHandlers();
    // The pause below is deliberate; do not let it surface as a reader's pause.
    switchingRef.current = true;
    audioRef.current?.pause();
    switchingRef.current = false;
    playChunk(position, controller, offset).catch((err) => {
      if (!aliveRef.current || controller.signal.aborted) return;
      console.warn("[tts]", err.message);
      setSafeStatus("error");
    });
  };

  const startCloud = () => {
    const chunks = chunkText(articleText(target));
    if (!chunks.length) {
      setSafeStatus("error");
      return;
    }

    endSession();
    chunksRef.current = chunks;
    durationsRef.current = {};
    heardRef.current = 0;
    setHeard(0);
    setIndex(null);
    setCurrent(0);
    setDownloaded(false);
    const controller = new AbortController();
    controllerRef.current = controller;
    setSafeStatus("generating");

    playChunk(0, controller).catch((err) => {
      if (!aliveRef.current || controller.signal.aborted) return;
      console.warn("[tts]", err.message);
      setSafeStatus("error");
    });
  };

  const togglePlay = () => {
    const audio = audioRef.current;

    if (audio && status === "playing") {
      audio.pause();
      setStatus("paused");
      return;
    }

    if (audio && status === "paused") {
      audio.playbackRate = speedRef.current;
      audio.play().then(
        () => {
          if (aliveRef.current) setSafeStatus("playing");
        },
        () => {
          if (aliveRef.current) setSafeStatus("error");
        },
      );
      return;
    }

    // Synchronous within the click: this is what makes iOS allow the later play().
    ensureAudio();
    // File mode assigns `src` immediately, which is itself inside the gesture.
    if (modeRef.current === "file" && audio) playFile();
    else startCloud();
  };

  const stop = () => {
    endSession();
    // File mode plays from the element with no chunk cache, so stopping must release the
    // source; otherwise the next play resumes at the old position with no handlers left.
    if (modeRef.current === "file") {
      audioRef.current?.removeAttribute("src");
      audioRef.current?.load();
    }
    indexRef.current = null;
    heardRef.current = 0;
    durationsRef.current = {};
    setIndex(null);
    setCurrent(0);
    setHeard(0);
    setDownload(null);
    setDownloaded(false);
    setSafeStatus("idle");
  };

  const changeSpeed = (event) => {
    const next = Number(event.target.value);
    speedRef.current = next;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  // `loading` only exists in file mode (a metadata round trip) and is treated as usable so
  // the transport strip lays out while the file arrives.
  const usable = status === "playing" || status === "paused" || status === "loading";
  const total = chunksRef.current.length;

  /**
   * Seconds into the article, from the loaded chunk and the media element's live
   * position (not the last render's `current`, which lags behind a skip).
   */
  const elapsedTrackSeconds = () => {
    // File mode: the element's own currentTime *is* the article timeline.
    if (mode === "file") return audioRef.current?.currentTime || 0;
    let seconds = 0;
    for (let before = 0; before < (indexRef.current ?? 0); before += 1) {
      seconds += durationsRef.current[before] ?? ASSUMED_CHUNK_SECONDS;
    }
    return seconds + (audioRef.current?.currentTime || 0);
  };
  const totalTrackSeconds = () => {
    // File mode: the duration comes from the MP3's Xing header, so it is exact once
    // metadata loads; the marker's value covers the moment before that.
    if (mode === "file") {
      const measured = audioRef.current?.duration;
      if (Number.isFinite(measured) && measured > 0) return measured;
      return audio?.duration || 0;
    }
    let seconds = 0;
    for (let at = 0; at < chunksRef.current.length; at += 1) {
      seconds += durationsRef.current[at] ?? ASSUMED_CHUNK_SECONDS;
    }
    return seconds;
  };

  /** Move the playhead to the article timeline position in seconds. */
  const seekToTrackSeconds = (trackSeconds) => {
    if (!usable || indexRef.current === null) return;
    if (mode === "file") {
      const element = audioRef.current;
      if (!element) return;
      try {
        element.currentTime = Math.max(0, Math.min(trackSeconds, totalTrackSeconds() || trackSeconds));
        setCurrent(element.currentTime);
      } catch {
        // Ignore; the slider snaps back on the next timeupdate.
      }
      return;
    }
    const last = chunksRef.current.length - 1;
    let remaining = Math.max(0, trackSeconds);
    let target = 0;
    while (target < last) {
      const length = durationsRef.current[target] ?? ASSUMED_CHUNK_SECONDS;
      if (remaining < length) break;
      remaining -= length;
      target += 1;
    }
    const offset = Math.min(remaining, (durationsRef.current[target] ?? ASSUMED_CHUNK_SECONDS) - 1);

    const audio = audioRef.current;
    if (target === indexRef.current && audio) {
      try {
        audio.currentTime = Math.max(0, offset);
        setCurrent(audio.currentTime);
      } catch {
        // Ignore; the slider snaps back on the next timeupdate.
      }
      return;
    }
    // Seeking forward does NOT mark the chunks passed over as heard: they were
    // never played, so the "n/N" counter must not claim otherwise.
    switchChunk(target, Math.max(0, offset));
  };

  const seekBar = (event) => {
    seekToTrackSeconds(Number(event.target.value));
  };

  /** Move the playhead by `delta` seconds, crossing chunk starts. */
  const skip = (delta) => {
    seekToTrackSeconds(elapsedTrackSeconds() + delta);
  };

  /**
   * Download the whole article as one MP3.
   *
   * Chunks already cached (played or prefetched) are reused; the rest are
   * synthesised here, so the download always saves the complete article and bills
   * exactly what one uninterrupted listen would. Synthesis is sequential to stay
   * inside the API's per-second quota, and Stop cancels it along with playback.
   *
   * It runs on its own AbortController so a download can finish while the article
   * keeps playing; `endSession` (Stop, unmount) aborts that one too.
   */
  const downloadAudio = () => {
    if (mode === "file" && audio?.file) {
      // File mode: the bytes already exist on the CDN. The link points straight at the
      // object, whose `Content-Disposition` names the saved file (a `download` attribute
      // is ignored cross-origin). This click never costs a synthesis.
      const link = document.createElement("a");
      link.href = audio.file;
      link.download = trackArtifactName({ slug, locale });
      link.rel = "noopener";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloaded(true);
      return;
    }
    if (!chunksRef.current.length || downloadRef.current) return;

    const controller = new AbortController();
    downloadControllerRef.current = controller;
    const missing = missingIndexes(chunksRef.current.length, cacheRef.current);
    const job = {};
    downloadRef.current = job;
    setDownload({ done: 0, total: missing.length });
    setDownloaded(false);

    (async () => {
      try {
        for (const [step, position] of missing.entries()) {
          const blob = await synthChunk(chunksRef.current[position], controller.signal);
          if (job !== downloadRef.current || controller.signal.aborted) return;
          cacheRef.current.set(position, blob);
          if (aliveRef.current) setDownload({ done: step + 1, total: missing.length });
        }
        const parts = [];
        for (let at = 0; at < chunksRef.current.length; at += 1) parts.push(cacheRef.current.get(at));
        const blob = await concatAudioBlobs(parts, "audio/mpeg");
        if (job !== downloadRef.current || controller.signal.aborted) return;
        saveBlob(blob, trackArtifactName({ slug, locale }));
        if (aliveRef.current) setDownloaded(true);
      } catch (err) {
        if (err?.name === "AbortError" || job !== downloadRef.current) return;
        console.warn("[tts]", err.message);
        setSafeStatus("error");
      } finally {
        if (downloadRef.current === job) downloadRef.current = null;
        if (downloadControllerRef.current === controller) downloadControllerRef.current = null;
        if (aliveRef.current) setDownload(null);
      }
    })();
  };

  // No pre-generated audio *and* no Cloud TTS key: there is nothing this player can do.
  // With a file it works without any key, which is the point of the pipeline.
  if (mode === "cloud" && !apiKey) {
    return (
      <div className="tts-player" data-state="unavailable">
        <button type="button" className="tts-control" disabled>
          {t("ttsUnavailable")}
        </button>
      </div>
    );
  }

  const downloadLabel = download
    ? t("ttsDownloading").replace("%done", String(download.done)).replace("%total", String(download.total))
    : downloaded
      ? t("ttsDownloaded")
      : t("ttsDownload");

  const statusText =
    status === "loading"
      ? t("ttsAudioLoading")
      : status === "generating"
        ? t("ttsGenerating")
        : status === "error"
          ? t("ttsError")
          : "";
  const cachedCount = uniquePartsCount(total, cacheRef.current);
  // File mode can always be downloaded: the bytes already exist on the CDN.
  const canDownload =
    mode === "file" ? Boolean(audio?.file) && !download : total > 0 && cachedCount > 0 && !download;
  const elapsed = elapsedTrackSeconds();
  const length = totalTrackSeconds();

  return (
    <div className="tts-player" data-state={status} data-mode={mode} role="group" aria-label={t("ttsPlayer")}>
      <button
        type="button"
        className="tts-control tts-play"
        onClick={togglePlay}
        disabled={status === "generating" || status === "loading"}
        aria-label={
          status === "playing" ? t("ttsPause") : status === "loading" ? t("ttsAudioLoading") : t("ttsPlay")
        }
      >
        {status === "playing" ? (
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M4 3h2v10H4zM10 3h2v10h-2z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M5 3l6 4-6 4z" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="tts-control"
        onClick={() => skip(-SKIP_SECONDS)}
        disabled={!usable}
        aria-label={t("ttsBack")}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 4h2v8H4zM8 3l-4 4 4 4z" />
        </svg>
      </button>
      <button
        type="button"
        className="tts-control"
        onClick={() => skip(SKIP_SECONDS)}
        disabled={!usable}
        aria-label={t("ttsForward")}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 3l4 4-4 4zM8 4h2v8H8z" />
        </svg>
      </button>
      <button
        type="button"
        className="tts-control"
        onClick={stop}
        disabled={status === "idle" || status === "error"}
        aria-label={t("ttsStop")}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 4h8v8H4z" />
        </svg>
      </button>

      <div className="tts-progress">
        <span className="tts-time">{formatDuration(elapsed)}</span>
        <input
          id={seekId}
          type="range"
          className="tts-range"
          min={0}
          max={Math.round(length)}
          step={1}
          value={Math.min(Math.round(elapsed), Math.round(length))}
          onInput={seekBar}
          disabled={!usable}
          aria-label={t("ttsSeek")}
          aria-valuetext={`${formatDuration(elapsed)} / ${formatDuration(length)}`}
        />
        <span className="tts-time">-{formatDuration(Math.max(0, length - elapsed))}</span>
        {/* The "n/N" counter describes a chunk cache, which file mode does not have: a
            single streamed file has nothing to count, so it is hidden there. */}
        {mode === "cloud" && (
          <span
            className="tts-parts"
            title={t("ttsParts").replace("%cached", String(cachedCount)).replace("%total", String(total))}
          >
            {heard}/{total}
          </span>
        )}
      </div>

      <label className="tts-speed" htmlFor={speedId}>
        {t("ttsSpeed")}
        <select id={speedId} value={speed} onChange={changeSpeed}>
          {[0.5, 1, 1.5, 2].map((rate) => (
            <option key={rate} value={rate}>
              {rate}×
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="tts-control tts-download"
        onClick={downloadAudio}
        disabled={!canDownload}
        aria-label={downloadLabel}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M8 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V2.5a.5.5 0 0 1 .5-.5zM4 8v4h8V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
        </svg>
      </button>
      {/* Always mounted so aria-live announces its text; `.tts-status:empty` is hidden. */}
      <span className="tts-status" role="status" aria-live="polite">
        {statusText}
      </span>
    </div>
  );
}

/** Island contract: see assets/js/islands.js. */
export function mount(element, props) {
  const root = getRoot(element, () => createRoot(element));
  root.render(<TtsPlayer {...props} />);
  return () => {
    root.unmount();
    forgetRoot(element);
  };
}
