import { createRoot } from "react-dom/client";
import { useEffect, useId, useRef, useState } from "react";
import { getRoot, forgetRoot } from "../lib/island-root.js";
import { t } from "../lib/theme-config.js";

/**
 * Text-to-speech player for posts, powered by the ElevenLabs HTTP API.
 *
 * Mount point (partials/post-layout.hbs, post context only):
 *   <div data-island="TtsPlayer" data-target=".gh-content" ...></div>
 *
 * The article text is read from the DOM, not from a payload: it is already on the
 * page, and cloning before stripping code/tables keeps the server markup untouched.
 * The API key arrives as a data attribute because a Ghost theme has no server-side
 * runtime to proxy the request — treat that key as public, not as a secret.
 *
 * The audio object, object URL and in-flight request are owned by refs and released
 * on stop, on end/error and on unmount, so no playback or download outlives the island.
 */

const DEFAULT_VOICE = "EXAVITQu4vr4xnSDxMaL"; // Rachel
const DEFAULT_MODEL = "eleven_multilingual_v2";
const SPEEDS = [0.5, 1, 1.5, 2];
const STRIP_SELECTOR = "pre, code, script, style, nav, .table-responsive";

function articleText(target) {
  const article = document.querySelector(target);
  if (!article) return "";
  const clone = article.cloneNode(true);
  for (const node of clone.querySelectorAll(STRIP_SELECTOR)) node.remove();
  return (clone.textContent || "").replace(/\s+/g, " ").trim();
}

function TtsPlayer({
  apiKey,
  target = ".gh-content",
  voice = DEFAULT_VOICE,
  model = DEFAULT_MODEL,
}) {
  const [status, setStatus] = useState("idle");
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);
  const aliveRef = useRef(true);
  const speedId = useId();

  const setSafeStatus = (next) => {
    if (aliveRef.current) setStatus(next);
  };

  const releaseUrl = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    audioRef.current = null;
  };

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
      stopAudio();
      releaseUrl();
    };
  }, []);

  const playAudio = async (url) => {
    releaseUrl();
    urlRef.current = url;
    const audio = new Audio(url);
    audio.playbackRate = speedRef.current;
    audio.onended = () => {
      stopAudio();
      releaseUrl();
      setSafeStatus("idle");
    };
    audio.onerror = () => {
      stopAudio();
      releaseUrl();
      setSafeStatus("error");
    };
    audioRef.current = audio;
    try {
      await audio.play();
      if (audioRef.current === audio) setSafeStatus("playing");
    } catch {
      if (audioRef.current !== audio) return;
      stopAudio();
      releaseUrl();
      setSafeStatus("error");
    }
  };

  const generate = async () => {
    const text = articleText(target);
    if (!text) {
      setSafeStatus("error");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setSafeStatus("generating");

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          output_format: "mp3_22050_32",
        }),
      });
      if (!response.ok) throw new Error(`ElevenLabs responded with ${response.status}`);

      const blob = await response.blob();
      if (!aliveRef.current || controller.signal.aborted) return;
      await playAudio(URL.createObjectURL(blob));
    } catch (err) {
      if (err?.name === "AbortError" || !aliveRef.current) return;
      setSafeStatus("error");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (status === "playing") {
        audio.pause();
        setStatus("paused");
      } else {
        audio.playbackRate = speedRef.current;
        audio.play().then(
          () => {
            if (audioRef.current === audio) setSafeStatus("playing");
          },
          () => {
            if (audioRef.current === audio) setSafeStatus("error");
          },
        );
      }
      return;
    }
    generate();
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopAudio();
    releaseUrl();
    setStatus("idle");
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

  const statusText =
    status === "generating"
      ? t("ttsGenerating")
      : status === "error"
        ? t("ttsError")
        : "";

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
          {SPEEDS.map((rate) => (
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
