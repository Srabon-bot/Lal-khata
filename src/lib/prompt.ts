// PRD §7 — extraction prompt. Runs on a browser-transcribed text transcript
// (Web Speech API), not raw audio: the Gemini API's Gemma models available to
// this project's key don't have audio input enabled (verified against the
// live API — gemma-3n-e2b/e4b-it, the audio-native variants the original
// spec targeted, are no longer served at all). Gemma still does the actual
// understanding: turning a messy Bangla/Banglish transcript into typed
// ledger JSON with per-field confidence is the hard part, not the STT.
export function buildExtractionPrompt(transcript: string): string {
  return `You convert a transcript of a Bangladeshi shopkeeper's spoken words into ledger JSON.
The transcript may be in Bangla, Banglish, or mixed, and may contain minor speech-recognition
errors — read past small mistakes rather than treating them as unclear. Common patterns:
- "X ke Y takar Z baki dilam"  → credit sale to customer X
- "X Y taka joma dilo / shodh korlo" → customer X repaid Y taka
- "Y takar Z bikri" (no name) → cash sale
Numbers may be spoken as words (পঞ্চাশ = 50) or digits.

Transcript: """${transcript}"""

Return ONLY valid JSON, no markdown, no explanation:
{
 "type": "credit_sale" | "cash_sale" | "repayment" | "unclear",
 "customer": string | null,
 "item": string | null,
 "amount_taka": number | null,
 "confidence": { "customer": 0-1, "item": 0-1, "amount": 0-1 },
 "transcript": string
}
If any field is not stated, use null. Never invent an amount.
If the transcript is empty, nonsensical, or unrelated to a shop transaction, use type "unclear".`;
}

export const REPAIR_SUFFIX =
  "\n\nYour last output was invalid JSON. Return only the JSON object, no markdown fences, no explanation.";

// PRD §4.2 S3 — weekly insight card. A second, independent use of Gemma:
// given the week's already-computed totals (no raw ledger/PII beyond
// customer names already visible in the app), write one short, friendly
// observation a shopkeeper would actually find useful.
export function buildInsightPrompt(summaryText: string): string {
  return `You are a friendly assistant for a Bangladeshi shopkeeper reviewing their week.
Given this week's ledger summary, write ONE short observation in Bangla (1-2 sentences,
plain text, no markdown, no JSON) that highlights something useful — a trend, a notable
customer balance, or an encouraging note. Be concrete with numbers when you have them.
Write only the observation itself, nothing else.

Weekly summary:
${summaryText}`;
}
