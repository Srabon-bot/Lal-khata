import { GEMMA_PROXY_ENDPOINT, GEMMA_TIMEOUT_MS } from "../config";
import { ExtractionResultSchema, type ExtractionResult } from "./schema";

export type GemmaErrorKind = "network" | "timeout" | "invalid_json" | "server";

export class GemmaError extends Error {
  readonly kind: GemmaErrorKind;

  constructor(message: string, kind: GemmaErrorKind) {
    super(message);
    this.kind = kind;
    this.name = "GemmaError";
  }
}

/** Strips ```json fences (or bare ```) that models sometimes wrap output in. */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

async function callProxy(transcript: string, repair: boolean): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMMA_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GEMMA_PROXY_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript, repair }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new GemmaError("Gemma request timed out", "timeout");
    }
    throw new GemmaError("Network error reaching /api/gemma", "network");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new GemmaError(`Proxy responded ${res.status}`, res.status >= 500 ? "server" : "network");
  }

  const data = (await res.json()) as { text?: string; error?: string };
  if (!data.text) {
    throw new GemmaError(data.error ?? "Empty response from proxy", "server");
  }
  return data.text;
}

/**
 * Sends a browser-transcribed utterance to Gemma via the /api/gemma proxy
 * and returns a validated ExtractionResult. Retries once with a repair
 * instruction if the model's first output isn't valid JSON (PRD §7).
 */
export async function extractFromTranscript(transcript: string): Promise<ExtractionResult> {
  const rawFirst = await callProxy(transcript, false);
  const parsed = tryParse(rawFirst);
  if (parsed) return parsed;

  const rawRetry = await callProxy(transcript, true);
  const repaired = tryParse(rawRetry);
  if (repaired) return repaired;

  throw new GemmaError("Gemma did not return valid ledger JSON after repair retry", "invalid_json");
}

function tryParse(text: string): ExtractionResult | null {
  try {
    const json = JSON.parse(stripCodeFences(text));
    const result = ExtractionResultSchema.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * PRD §4.2 S3 — sends the week's already-computed summary to Gemma and
 * returns one short Bangla observation. Independent of the extraction
 * path above (different request shape, plain-text response, no JSON
 * parsing) so it can't regress the already-verified extraction flow.
 */
export async function getWeeklyInsight(summaryText: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMMA_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GEMMA_PROXY_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "insight", insightData: summaryText }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new GemmaError("Gemma request timed out", "timeout");
    }
    throw new GemmaError("Network error reaching /api/gemma", "network");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new GemmaError(`Proxy responded ${res.status}`, res.status >= 500 ? "server" : "network");
  }

  const data = (await res.json()) as { text?: string; error?: string };
  if (!data.text) {
    throw new GemmaError(data.error ?? "Empty response from proxy", "server");
  }
  return data.text.trim();
}
