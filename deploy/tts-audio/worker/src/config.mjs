/**
 * Configuration for both workloads (webhook receiver and synthesis job).
 *
 * Every value comes from the ConfigMap or the Secret, never from a literal in the
 * image: the audio host is a ConfigMap value so moving the bucket (or losing Cloudflare
 * range support) is a `kubectl apply`, not a rebuild. The voices and speeds live in the
 * ConfigMap too, so a voice can be changed for one locale without touching code.
 *
 * Validation is deliberate and loud: a job that starts with a missing bucket would
 * synthesise for two minutes and then fail on upload.
 */

/**
 * Locale → voice, speed. The keys are the **theme content keys** (`br`, not `pt`),
 * because the job receives them from post tags and the theme uses the same keys.
 *
 * Kokoro-82M v1.0 voices:
 *   en: af_* / am_*   (af_heart is the highest-graded American English voice)
 *   es: ef_dora, em_alex, em_santa
 *   pt: pf_dora, pm_alex, pm_santa   (Brazilian Portuguese)
 *
 * Leda (the previous Cloud TTS voice) was the same female timbre across all three
 * locales, so the female voice is kept for all three. A male set would be
 * am_michael / em_alex / pm_alex.
 */
export const DEFAULT_VOICES = {
  en: { voice: "af_heart", speed: 1.0 },
  es: { voice: "ef_dora", speed: 0.98 },
  br: { voice: "pf_dora", speed: 0.98 },
};

/** Kokoro's output format; nothing downstream may change it without a re-encode. */
export const SAMPLE_RATE = 24000;

function env(name, fallback = "") {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

/** Parse a JSON env var, falling back to `fallback` when unset or malformed. */
function jsonEnv(name, fallback) {
  const raw = env(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${name} is not valid JSON: ${err.message}`);
  }
}

/** Shared config: anything both workloads need. */
export function baseConfig() {
  return {
    ghostApiUrl: env("GHOST_API_URL").replace(/\/+$/, ""),
    adminKey: env("GHOST_ADMIN_API_KEY"),
    webhookSecret: env("GHOST_TTS_WEBHOOK_SECRET"),
    siteUrl: env("SITE_URL").replace(/\/+$/, ""),
    bucket: env("GCS_BUCKET"),
    audioBaseUrl: env("AUDIO_BASE_URL").replace(/\/+$/, ""),
    namespace: env("POD_NAMESPACE", "tts-audio"),
    image: env("WORKER_IMAGE"),
    // Node-pool value for the Jobs this receiver creates; empty means "no selector", so a
    // cluster without pools is unaffected. See deploy/tts-audio/overlay/node-pool.yaml.
    nodePool: env("NODE_POOL"),
    nodePoolLabel: env("NODE_POOL_LABEL", "dsh.sredevops.org/node-pool"),
    voices: { ...DEFAULT_VOICES, ...jsonEnv("TTS_VOICES", {}) },
    chunkChars: Number(env("TTS_CHUNK_CHARS", "350")),
    gapMs: Number(env("TTS_SENTENCE_GAP_MS", "240")),
  };
}

/** Fail fast, naming every missing value at once instead of one per restart. */
export function requireConfig(config, keys) {
  const missing = keys.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`missing configuration: ${missing.join(", ")}`);
  }
}

/** The synthesis job's config. */
export function jobConfig() {
  const config = baseConfig();
  requireConfig(config, ["ghostApiUrl", "adminKey", "bucket", "audioBaseUrl"]);
  return config;
}

/** The receiver's config. */
export function receiverConfig() {
  const config = baseConfig();
  requireConfig(config, ["webhookSecret", "ghostApiUrl", "adminKey", "bucket", "audioBaseUrl", "image"]);
  return { ...config, port: Number(env("PORT", "8080")) };
}

/** Voice settings for a locale, with English as the documented fallback. */
export function voiceFor(config, locale) {
  return config.voices[locale] ?? config.voices.en;
}

/** Object path for a post's audio. See README: the lifecycle rule keys off `audio/`. */
export function objectPath(postId, hash) {
  return `audio/${postId}/${hash}.mp3`;
}

/** Public URL for an object path. */
export function publicUrl(config, path) {
  return `${config.audioBaseUrl}/${path.replace(/^\/+/, "")}`;
}
