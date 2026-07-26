import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { MicRecorder } from "./MicRecorder";
import { ParsingIndicator } from "./ParsingIndicator";
import { ConfirmationCard, type EditedEntry } from "./ConfirmationCard";
import { extractFromTranscript, GemmaError } from "../lib/gemmaClient";
import { recordEntry, queuePendingRecording } from "../lib/db";
import type { ExtractionResult } from "../lib/schema";

type Phase = "capture" | "parsing" | "confirm" | "error" | "queued";

interface RecordFlowProps {
  open: boolean;
  onClose: () => void;
  /** A previously-queued offline utterance to process immediately on open. */
  initialTranscript?: string | null;
}

const ERROR_COPY: Record<GemmaError["kind"], string> = {
  network: "ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।",
  timeout: "উত্তর দিতে বেশি সময় লাগছে। আবার চেষ্টা করুন।",
  server: "সাময়িক সমস্যা হয়েছে। একটু পর আবার চেষ্টা করুন।",
  invalid_json: "কথা বোঝা যায়নি — আবার বলুন",
};

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RecordFlow({ open, onClose, initialTranscript }: RecordFlowProps) {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<Phase>("capture");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const lastTranscriptRef = useRef<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const processedInitialRef = useRef<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const errorBoxRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setPhase("capture");
    setResult(null);
    setErrorMessage("");
    lastTranscriptRef.current = null;
  };

  const handleClose = () => {
    onClose();
  };

  // Bottom sheet slide-up on open, slide-down before actually unmounting on
  // close — a real transition instead of the modal snapping in/out (PRD §5.4
  // motion table calls for settled, deliberate transitions everywhere).
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;

    if (open) {
      if (prefersReducedMotion()) {
        backdrop.style.opacity = "1";
        sheet.style.opacity = "1";
        sheet.style.transform = "none";
        return;
      }
      animate(backdrop, { opacity: [0, 1], duration: 200, ease: "outQuad" });
      animate(sheet, { translateY: [48, 0], opacity: [0, 1], duration: 320, ease: "outQuad" });
      return;
    }

    if (prefersReducedMotion()) {
      reset();
      setMounted(false);
      return;
    }
    animate(backdrop, { opacity: [1, 0], duration: 180, ease: "inQuad" });
    animate(sheet, {
      translateY: [0, 48],
      opacity: [1, 0],
      duration: 220,
      ease: "inQuad",
      onComplete: () => {
        reset();
        setMounted(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  const runExtraction = async (transcript: string) => {
    lastTranscriptRef.current = transcript;

    if (!navigator.onLine) {
      await queuePendingRecording(transcript);
      setPhase("queued");
      return;
    }

    setPhase("parsing");
    try {
      const extracted = await extractFromTranscript(transcript);
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
    if (!open || !initialTranscript) return;
    if (processedInitialRef.current === initialTranscript) return;
    processedInitialRef.current = initialTranscript;
    void runExtraction(initialTranscript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTranscript]);

  // A single gentle shake on arrival at the error state — never looping
  // (PRD §5.4: "gentle single shake / fade-in, nothing looping").
  useEffect(() => {
    if (phase !== "error" || prefersReducedMotion() || !errorBoxRef.current) return;
    animate(errorBoxRef.current, {
      translateX: [0, -8, 8, -6, 6, 0],
      duration: 400,
      ease: "inOutQuad",
    });
  }, [phase]);

  if (!mounted) return null;

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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="নতুন হিসাব বলুন">
      <div ref={backdropRef} className="absolute inset-0 bg-ink/40 opacity-0" aria-hidden="true" />
      <div ref={sheetRef} className="relative w-full max-w-md rounded-t-3xl bg-page-cream p-6 pb-8 opacity-0 shadow-xl sm:rounded-3xl">
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
          <div ref={errorBoxRef} className="flex flex-col items-center gap-4 py-4 text-center" role="alert">
            <p className="font-bangla text-lg font-semibold text-khata-red">{errorMessage}</p>
            <button
              type="button"
              onClick={() => lastTranscriptRef.current && runExtraction(lastTranscriptRef.current)}
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
