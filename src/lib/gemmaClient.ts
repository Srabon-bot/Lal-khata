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

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Strips ```json fences (or bare ```) that models sometimes wrap output in. */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

async function callProxy(audioBase64: string, mimeType: string, repair: boolean): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMMA_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GEMMA_PROXY_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType, repair }),
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
 * Sends a recorded clip to Gemma 3n via the /api/gemma proxy and returns a
 * validated ExtractionResult. Retries once with a repair instruction if the
 * model's first output isn't valid JSON (PRD §7).
 */
export async function extractFromAudio(audioBlob: Blob): Promise<ExtractionResult> {
  const audioBase64 = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || "audio/webm";

  const rawFirst = await callProxy(audioBase64, mimeType, false);
  const parsed = tryParse(rawFirst);
  if (parsed) return parsed;

  const rawRetry = await callProxy(audioBase64, mimeType, true);
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
