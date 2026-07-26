import { useEffect, useRef, useState } from "react";
import { MicRecorder } from "./MicRecorder";
import { ParsingIndicator } from "./ParsingIndicator";
import { ConfirmationCard, type EditedEntry } from "./ConfirmationCard";
import { extractFromAudio, GemmaError } from "../lib/gemmaClient";
import { recordEntry, queuePendingRecording } from "../lib/db";
import type { ExtractionResult } from "../lib/schema";

type Phase = "capture" | "parsing" | "confirm" | "error" | "queued";

interface RecordFlowProps {
  open: boolean;
  onClose: () => void;
  /** A previously-queued offline recording to process immediately on open. */
  initialBlob?: Blob | null;
}

const ERROR_COPY: Record<GemmaError["kind"], string> = {
  network: "ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।",
  timeout: "উত্তর দিতে বেশি সময় লাগছে। আবার চেষ্টা করুন।",
  server: "সাময়িক সমস্যা হয়েছে। একটু পর আবার চেষ্টা করুন।",
  invalid_json: "কথা বোঝা যায়নি — আবার বলুন",
};

export function RecordFlow({ open, onClose, initialBlob }: RecordFlowProps) {
  const [phase, setPhase] = useState<Phase>("capture");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const lastBlobRef = useRef<Blob | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const processedInitialRef = useRef<Blob | null>(null);

  const reset = () => {
    setPhase("capture");
    setResult(null);
    setErrorMessage("");
    lastBlobRef.current = null;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runExtraction = async (blob: Blob, mimeType?: string) => {
    lastBlobRef.current = blob;

    if (!navigator.onLine) {
      await queuePendingRecording(blob, mimeType ?? (blob.type || "audio/webm"));
      setPhase("queued");
      return;
    }

    setPhase("parsing");
    try {
      const extracted = await extractFromAudio(blob);
      setResult(extracted);
      setPhase("confirm");
    } catch (err) {
      const kind = err instanceof GemmaError ? err.kind : "server";
      setErrorMessage(ERROR_COPY[kind]);
      setPhase("error");
    }
  };

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !initialBlob) return;
    if (processedInitialRef.current === initialBlob) return;
    processedInitialRef.current = initialBlob;
    void runExtraction(initialBlob);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialBlob]);

  if (!open) return null;

  const handleConfirm = async (entry: EditedEntry) => {
    await recordEntry({
      type: entry.type,
      customerName: entry.customer,
      item: entry.item,
      amountTaka: entry.amountTaka,
      confidence: result?.confidence ?? null,
      transcript: result?.transcript ?? null,
      edited: entry.edited,
    });
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="নতুন হিসাব বলুন"
    >
      <div className="w-full max-w-md rounded-t-3xl bg-page-cream p-6 pb-8 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex justify-end">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink/50"
          >
            ✕
          </button>
        </div>

        {phase === "capture" && (
          <div className="flex justify-center pb-2">
            <MicRecorder onRecorded={runExtraction} />
          </div>
        )}

        {phase === "parsing" && <ParsingIndicator />}

        {phase === "confirm" && result && (
          <ConfirmationCard result={result} onConfirm={handleConfirm} onReRecord={reset} />
        )}

        {phase === "queued" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center" role="status" aria-live="polite">
            <p className="text-3xl" aria-hidden="true">
              📥
            </p>
            <p className="font-bangla text-lg font-semibold text-ink">
              অফলাইনে আছেন — ইন্টারনেট আসলে এটি প্রসেস হবে
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-rule-blue px-6 py-3 font-bangla font-semibold text-white"
            >
              ঠিক আছে
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center" role="alert">
            <p className="font-bangla text-lg font-semibold text-khata-red">{errorMessage}</p>
            <button
              type="button"
              onClick={() => lastBlobRef.current && runExtraction(lastBlobRef.current)}
              className="rounded-full bg-khata-red px-6 py-3 font-bangla font-semibold text-white"
            >
              আবার চেষ্টা করুন
            </button>
            <button type="button" onClick={reset} className="font-bangla text-sm text-ink/60 underline">
              নতুন করে বলুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
