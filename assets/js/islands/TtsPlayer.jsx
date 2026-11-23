import { createRoot } from "react-dom/client";
import { useEffect, useId, useRef, useState } from "react";
import { getRoot, forgetRoot } from "../lib/island-root.js";
import { t } from "../lib/theme-config.js";
import { chunkText, voiceFor } from "../lib/tts.js";

/**
 * Text-to-speech player for posts, powered by Cloud Text-to-Speech with a
 * Chirp 3: HD voice.
 *
 * Mount point (partials/post-layout.hbs, post context only):
 *   <div data-island="TtsPlayer" data-target=".gh-content" data-locale="es" ...></div>
 *
 * The article text is read from the DOM, not from a payload: it is already on the
 * page, and cloning before stripping code/tables keeps the server markup untouched.
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

function TtsPlayer({ apiKey, target = ".gh-content", locale, voice }) {
  const [status, setStatus] = useState("idle");
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const chunksRef = useRef([]);
  const cacheRef = useRef(new Map());
  const controllerRef = useRef(null);
  const aliveRef = useRef(true);
  const speedId = useId();

  const setSafeStatus = (next) => {
    if (aliveRef.current) setStatus(next);
  };

  const releaseAudioUrl = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const detachHandlers = (audio) => {
    audio.onended = null;
    audio.onerror = null;
  };

  /**
   * Abort in-flight requests and drop every buffer for the current session.
   * The audio element itself is kept: it carries the gesture unlock.
   */
  const endSession = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      detachHandlers(audio);
      audio.pause();
    }
    releaseAudioUrl();
    cacheRef.current.clear();
    chunksRef.current = [];
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

  /**
   * Create (once) and prime the audio element.
   *
   * Must be called synchronously from the click handler: iOS Safari ties playback
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
    audioRef.current = audio;
    return audio;
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

  const playChunk = async (index, controller) => {
    const chunks = chunksRef.current;
    if (!aliveRef.current || controller.signal.aborted) return;

    if (index >= chunks.length) {
      releaseAudioUrl();
      setSafeStatus("idle");
      return;
    }

    let blob = cacheRef.current.get(index);
    if (!blob) {
      // Only the very first chunk is "generating"; later gaps keep the button on
      // Pause, because the article is already playing.
      setSafeStatus(index === 0 ? "generating" : "playing");
      blob = await synthChunk(chunks[index], controller.signal);
      if (!aliveRef.current || controller.signal.aborted) return;
      cacheRef.current.set(index, blob);
    }

    // Warm the next chunk while this one is audible; a failed prefetch is not an
    // error, the chunk is simply requested on demand when its turn comes.
    const next = index + 1;
    if (next < chunks.length && !cacheRef.current.has(next)) {
      synthChunk(chunks[next], controller.signal)
        .then((prefetched) => {
          if (!controller.signal.aborted) cacheRef.current.set(next, prefetched);
        })
        .catch(() => {});
    }

    const audio = audioRef.current ?? ensureAudio();
    detachHandlers(audio);
    releaseAudioUrl();

    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    audio.src = url;
    audio.playbackRate = speedRef.current;

    audio.onended = () => {
      if (!aliveRef.current || controller.signal.aborted) return;
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
      if (aliveRef.current && !controller.signal.aborted) setSafeStatus("playing");
    } catch {
      if (!aliveRef.current || controller.signal.aborted) return;
      releaseAudioUrl();
      setSafeStatus("error");
    }
  };

  const start = () => {
    const chunks = chunkText(articleText(target));
    if (!chunks.length) {
      setSafeStatus("error");
      return;
    }

    endSession();
    chunksRef.current = chunks;
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
    start();
  };

  const stop = () => {
    endSession();
    setSafeStatus("idle");
  };

  const changeSpeed = (event) => {
    const next = Number(event.target.value);
    speedRef.current = next;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  if (!apiKey) {
    return (
      <div className="tts-player" data-state="unavailable">
        <button type="button" className="tts-control" disabled>
          {t("ttsUnavailable")}
        </button>
      </div>
    );
  }

  const statusText = status === "generating" ? t("ttsGenerating") : status === "error" ? t("ttsError") : "";

  return (
    <div className="tts-player" data-state={status} role="group">
      <button
        type="button"
        className="tts-control"
        onClick={togglePlay}
        disabled={status === "generating"}
      >
        {status === "playing" ? t("ttsPause") : t("ttsPlay")}
      </button>
      <button
        type="button"
        className="tts-control"
        onClick={stop}
        disabled={status === "idle" || status === "generating" || status === "error"}
      >
        {t("ttsStop")}
      </button>
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
