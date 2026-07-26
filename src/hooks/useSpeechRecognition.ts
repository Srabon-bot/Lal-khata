import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "../config";

export type RecognitionStatus = "idle" | "requesting" | "listening" | "denied" | "unsupported";

// The Web Speech API's SpeechRecognition/webkitSpeechRecognition isn't part
// of TypeScript's DOM lib. Minimal shape for what this hook actually uses —
// not a full spec implementation.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  status: RecognitionStatus;
  interimText: string;
  elapsedSeconds: number;
  start: () => void;
  stop: () => void;
  cancel: () => void;
}

/**
 * Captures a spoken transaction as text via the browser's built-in speech
 * recognition (Chrome/Android — same browser support bar the app already
 * targets). Replaces raw-audio capture: Gemma's audio input isn't enabled
 * for this project's API key (see src/config.ts), so the transcript is what
 * gets sent to Gemma for structured extraction.
 */
export function useSpeechRecognition(onFinished: (transcript: string) => void): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");
  const deniedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.abort();
    }
    recognitionRef.current = null;
    clearTimer();
    finalTranscriptRef.current = "";
    setStatus("idle");
    setInterimText("");
    setElapsedSeconds(0);
  }, [clearTimer]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting");
    deniedRef.current = false;
    finalTranscriptRef.current = "";

    const recognition = new Ctor();
    recognition.lang = "bn-BD";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus("listening");
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        const secs = (Date.now() - startedAtRef.current) / 1000;
        setElapsedSeconds(secs);
        if (secs >= MAX_RECORDING_SECONDS) recognition.stop();
      }, 100);
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        deniedRef.current = true;
        setStatus("denied");
      }
      // Other errors (no-speech, aborted, network) resolve via onend below.
    };

    recognition.onend = () => {
      clearTimer();
      recognitionRef.current = null;
      if (deniedRef.current) return;

      const finished = finalTranscriptRef.current.trim();
      setStatus("idle");
      setInterimText("");
      setElapsedSeconds(0);
      if (finished) onFinished(finished);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setStatus("denied");
    }
  }, [clearTimer, onFinished]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      clearTimer();
    },
    [clearTimer],
  );

  return { status, interimText, elapsedSeconds, start, stop, cancel };
}
