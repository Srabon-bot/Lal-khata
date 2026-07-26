// Single source of truth for the Gemma model used everywhere in the app.
// Switching variants (e.g. e4b -> e2b for latency) is a one-line change here.
// PRD §7: only gemma-3n-* variants accept native audio input — larger Gemma
// models reject audio, so this is guarded at startup below.
export const GEMMA_MODEL = "gemma-3n-e4b-it"; // fallback: "gemma-3n-e2b-it"

export const GEMMA_PROXY_ENDPOINT = "/api/gemma";

export const MAX_RECORDING_SECONDS = 28; // hard cap under Gemma's 30s clip limit

export const CONFIDENCE_FLAG_THRESHOLD = 0.7; // below this, a field gets an amber ambiguity flag

export const GEMMA_TIMEOUT_MS = 15_000;

// import.meta.env only exists under Vite; this file is also imported by the
// Vercel edge function (api/gemma.ts), which runs outside Vite entirely.
const isViteDev =
  typeof import.meta !== "undefined" && Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

if (isViteDev && !/^gemma-3n-(e2b|e4b)-it$/.test(GEMMA_MODEL)) {
  // eslint-disable-next-line no-console
  console.error(
    `[config] GEMMA_MODEL="${GEMMA_MODEL}" is not a known gemma-3n audio-capable variant. ` +
      `Larger Gemma models reject audio input — see PRD §7. Fix src/config.ts before continuing.`,
  );
}
