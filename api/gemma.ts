// Vercel Edge Function — the ONLY place GEMINI_API_KEY is read.
// The browser never talks to generativelanguage.googleapis.com directly;
// every Gemma call is routed through this proxy. See PRD §6.
//
// Tried moving this to the Node.js runtime to get a longer maxDuration
// (measured gemma-4-*-it's "thinking" overhead pushing latency to 15-26s+,
// against Edge's non-configurable ~25s ceiling) — that broke the function
// outright (FUNCTION_INVOCATION_FAILED, handler signature mismatch with
// Vercel's Node builder) with limited time to debug further. Reverted to
// Edge, which does work correctly; the occasional timeout on the slowest
// requests is a known, documented limitation (see README/writeup).
import { GEMMA_MODEL, GEMMA_TIMEOUT_MS } from "../src/config";
import { buildExtractionPrompt, buildInsightPrompt, REPAIR_SUFFIX } from "../src/lib/prompt";

export const config = { runtime: "edge" };

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`;

// Best-effort in-memory rate limit per IP. Edge instances are ephemeral and
// distributed, so this does not enforce a hard global cap — it just blunts a
// single hot client hammering the free-tier quota during the demo/judging
// window. A real deployment would back this with Vercel KV or similar.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

interface GemmaRequestBody {
  /** PRD §7 extraction mode (default): transcript -> ledger JSON. */
  transcript?: string;
  /** Set on the automatic retry-with-repair pass after malformed JSON. */
  repair?: boolean;
  /** PRD §4.2 S3: weekly-summary text -> one short Bangla insight sentence. */
  mode?: "extract" | "insight";
  insightData?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: "server_misconfigured", message: "GEMINI_API_KEY is not set" }, 500);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return json({ error: "rate_limited" }, 429);
  }

  let body: GemmaRequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_request", message: "Body must be JSON" }, 400);
  }

  const mode = body.mode ?? "extract";

  let promptText: string;
  if (mode === "insight") {
    if (!body.insightData || !body.insightData.trim()) {
      return json({ error: "invalid_request", message: "insightData is required" }, 400);
    }
    promptText = buildInsightPrompt(body.insightData);
  } else {
    if (!body.transcript || !body.transcript.trim()) {
      return json({ error: "invalid_request", message: "transcript is required" }, 400);
    }
    promptText = buildExtractionPrompt(body.transcript) + (body.repair ? REPAIR_SUFFIX : "");
  }

  const geminiPayload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.2,
      // gemma-4-*-it spends part of its output budget on internal "thought"
      // tokens before the final answer (thinkingConfig can't disable it —
      // verified 400 "Thinking budget is not supported for this model").
      // Budget generously so the actual JSON isn't truncated away.
      maxOutputTokens: 4096,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMMA_TIMEOUT_MS);

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(geminiPayload),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return json({ error: "upstream_error", status: upstream.status, message: errText }, 502);
    }

    const data = await upstream.json();
    const parts: Array<{ text?: string; thought?: boolean }> = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("");

    if (!text) {
      return json({ error: "empty_response", message: "Gemma returned no text" }, 502);
    }

    return json({ text });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return json({ error: isAbort ? "timeout" : "proxy_error", message: String(err) }, isAbort ? 504 : 500);
  } finally {
    clearTimeout(timeout);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
