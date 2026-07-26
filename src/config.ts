// Single source of truth for the Gemma model used everywhere in the app.
//
// PRD §7 originally targeted gemma-3n-e2b/e4b-it for native audio input —
// verified live against the Gemini API that those models are no longer
// served on this project's key, and the Gemma models that are available
// (gemma-4-*-it) have audio input disabled at the API level ("Audio input
// modality is not enabled for this model"). That's an account/API-side
// gate, not something fixable in code. The app now transcribes speech
// client-side (Web Speech API, src/hooks/useSpeechRecognition.ts) and sends
// the transcript to Gemma as text — Gemma still does the actual hard part,
// turning a messy Bangla/Banglish transcript into typed ledger JSON.
export const GEMMA_MODEL = "gemma-4-26b-a4b-it";

export const GEMMA_PROXY_ENDPOINT = "/api/gemma";

export const MAX_RECORDING_SECONDS = 28; // hard cap on a single spoken turn

export const CONFIDENCE_FLAG_THRESHOLD = 0.7; // below this, a field gets an amber ambiguity flag

// Gemma 4 is a "thinking" model — it spends a real chunk of its response
// budget on internal reasoning before the final JSON, which adds latency
// versus a non-thinking model. Both Gemma models on this key are
// thinking-only (no faster non-thinking variant available), and measured
// live latency runs up to ~26s. The proxy (api/gemma.ts) runs on Vercel's
// Edge Runtime, which enforces a hard ~25s execution ceiling that isn't
// configurable — kept just under that so our own clean timeout (with a
// friendly message) fires before the platform kills the function outright.
export const GEMMA_TIMEOUT_MS = 24_000;

const isViteDev =
  typeof import.meta !== "undefined" && Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

if (isViteDev && !/^gemma-4-.+-it$/.test(GEMMA_MODEL)) {
  // eslint-disable-next-line no-console
  console.error(
    `[config] GEMMA_MODEL="${GEMMA_MODEL}" doesn't match the expected gemma-4-*-it naming. ` +
      `Verify against the live ListModels response before deploying — see src/lib/prompt.ts for context.`,
  );
}
