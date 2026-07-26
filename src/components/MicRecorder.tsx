import { useEffect, useRef } from "react";
import { animate, type JSAnimation } from "animejs";
import { useRecorder } from "../hooks/useRecorder";
import { Waveform } from "./Waveform";
import { MAX_RECORDING_SECONDS } from "../config";

interface MicRecorderProps {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MicRecorder({ onRecorded, disabled }: MicRecorderProps) {
  const { status, elapsedSeconds, levels, start, stop, cancel } = useRecorder(onRecorded);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const pulseRef = useRef<JSAnimation | null>(null);

  useEffect(() => {
    if (status === "recording" && micButtonRef.current && !prefersReducedMotion()) {
      pulseRef.current = animate(micButtonRef.current, {
        scale: [1, 1.08],
        duration: 900,
        direction: "alternate",
        loop: true,
        ease: "inOutSine",
      });
    } else {
      pulseRef.current?.revert();
      pulseRef.current = null;
    }
    return () => {
      pulseRef.current?.revert();
      pulseRef.current = null;
    };
  }, [status]);

  const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsedSeconds);

  if (status === "denied") {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="alert">
        <p className="font-bangla text-lg font-semibold text-khata-red">
          মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি
        </p>
        <p className="max-w-xs text-sm text-ink/80">
          ব্রাউজারের ঠিকানা বারে (address bar) মাইক্রোফোন আইকনে চেপে অনুমতি দিন, তারপর আবার চেষ্টা করুন।
        </p>
        <button
          type="button"
          onClick={start}
          className="rounded-full bg-rule-blue px-6 py-3 font-bangla font-semibold text-white"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="max-w-xs text-center font-bangla text-sm text-khata-red" role="alert">
        এই ব্রাউজারে ভয়েস রেকর্ডিং সমর্থিত নয়। Chrome ব্যবহার করে দেখুন।
      </p>
    );
  }

  if (status === "recording") {
    return (
      <div className="flex flex-col items-center gap-3">
        <Waveform levels={levels} />
        <p className="tabular-amount font-bangla text-sm text-ink/70" aria-live="polite">
          {Math.ceil(remaining)} সেকেন্ড বাকি
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={cancel}
            aria-label="বাতিল করুন"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink/20 text-2xl text-ink/60"
          >
            ✕
          </button>
          <button
            ref={micButtonRef}
            type="button"
            onClick={stop}
            aria-label="রেকর্ডিং থামান"
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-khata-red text-3xl text-white shadow-lg"
          >
            ■
          </button>
        </div>
        <p className="font-bangla text-sm text-ink/70">বলুন... শেষ হলে থামুন চাপুন</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        ref={micButtonRef}
        type="button"
        disabled={disabled || status === "requesting"}
        onClick={start}
        aria-label="হিসাব বলার জন্য মাইক চাপুন"
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-khata-red text-3xl text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
      >
        🎙️
      </button>
      <p className="font-bangla text-sm text-ink/70">
        {status === "requesting" ? "অনুমতি চাওয়া হচ্ছে..." : "কথা বলতে চাপুন"}
      </p>
    </div>
  );
}
