// PRD §4.2 S2 — daily summary spoken aloud. Browser-native SpeechSynthesis,
// no extra Gemma call: closes the loop (voice in -> voice out) for the
// zero-typing story.
export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakDailySummary(cashTaka: number, creditTaka: number, repaidTaka: number): void {
  if (!speechSupported()) return;

  const parts: string[] = [];
  if (cashTaka > 0) parts.push(`নগদ বিক্রি হয়েছে ${Math.round(cashTaka)} টাকা`);
  if (creditTaka > 0) parts.push(`বাকি দেওয়া হয়েছে ${Math.round(creditTaka)} টাকা`);
  if (repaidTaka > 0) parts.push(`বাকি শোধ হয়েছে ${Math.round(repaidTaka)} টাকা`);

  const text = parts.length > 0 ? `আজকের হিসাব। ${parts.join("। ")}।` : "আজকে এখনো কোনো হিসাব লেখা হয়নি।";

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "bn-BD";
  utterance.rate = 0.95;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
