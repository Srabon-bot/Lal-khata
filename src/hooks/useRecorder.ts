import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "../config";

export type RecorderStatus = "idle" | "requesting" | "recording" | "denied" | "unsupported";

const CANDIDATE_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

const WAVEFORM_BARS = 32;

export interface UseRecorderResult {
  status: RecorderStatus;
  elapsedSeconds: number;
  levels: number[];
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
}

/**
 * Owns mic capture: permission request, MediaRecorder lifecycle, a live
 * amplitude buffer for the waveform, and the 28s auto-stop cap (PRD F1).
 */
export function useRecorder(onRecorded: (blob: Blob) => void): UseRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array(WAVEFORM_BARS).fill(0));

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  }, []);

  const sampleLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const dev = Math.abs(data[i] - 128) / 128;
      if (dev > peak) peak = dev;
    }
    setLevels((prev) => [...prev.slice(1), Math.min(1, peak * 1.6)]);
    rafRef.current = requestAnimationFrame(sampleLevels);
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    chunksRef.current = [];
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    cleanup();
    setStatus("idle");
    setElapsedSeconds(0);
    setLevels(new Array(WAVEFORM_BARS).fill(0));
  }, [cleanup]);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    const mimeType = pickMimeType();
    if (typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        chunksRef.current = [];
        cleanup();
        setStatus("idle");
        setElapsedSeconds(0);
        setLevels(new Array(WAVEFORM_BARS).fill(0));
        if (blob.size > 0) onRecorded(blob);
      };
      recorderRef.current = recorder;

      recorder.start();
      startedAtRef.current = Date.now();
      setStatus("recording");
      setElapsedSeconds(0);

      timerRef.current = window.setInterval(() => {
        const secs = (Date.now() - startedAtRef.current) / 1000;
        setElapsedSeconds(secs);
        if (secs >= MAX_RECORDING_SECONDS) {
          stop();
        }
      }, 100);

      rafRef.current = requestAnimationFrame(sampleLevels);
    } catch {
      setStatus("denied");
      cleanup();
    }
  }, [cleanup, onRecorded, sampleLevels, stop]);

  useEffect(() => cleanup, [cleanup]);

  return { status, elapsedSeconds, levels, start, stop, cancel };
}
