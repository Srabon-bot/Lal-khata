// PRD §7 — extraction prompt v1. Keep in sync with the accuracy test set in /docs.
export const EXTRACTION_PROMPT = `You convert a Bangladeshi shopkeeper's spoken words into ledger JSON.
The audio is in Bangla, Banglish, or mixed. Common patterns:
- "X ke Y takar Z baki dilam"  → credit sale to customer X
- "X Y taka joma dilo / shodh korlo" → customer X repaid Y taka
- "Y takar Z bikri" (no name) → cash sale
Numbers may be spoken in Bangla words (পঞ্চাশ = 50).

Return ONLY valid JSON, no markdown, no explanation:
{
 "type": "credit_sale" | "cash_sale" | "repayment" | "unclear",
 "customer": string | null,
 "item": string | null,
 "amount_taka": number | null,
 "confidence": { "customer": 0-1, "item": 0-1, "amount": 0-1 },
 "transcript": string   // your best transcript of what was said
}
If any field is not stated, use null. Never invent an amount.`;

export const REPAIR_SUFFIX =
  "\n\nYour last output was invalid JSON. Return only the JSON object, no markdown fences, no explanation.";
