import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

export type AuthMode = "signup" | "login";

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const COPY: Record<AuthMode, { title: string; cta: string; nameLabel: string }> = {
  signup: { title: "সাইন আপ করুন", cta: "সাইন আপ করুন", nameLabel: "দোকানের নাম বা আপনার নাম" },
  login: { title: "লগইন করুন", cta: "লগইন করুন", nameLabel: "আপনার নাম" },
};

/**
 * A sign up / log in form popup that looks and behaves like a real auth
 * flow, but doesn't transmit or store credentials anywhere — this app has
 * no backend or account system (matches the PRD's explicit non-goal on
 * accounts). Only the display name is kept, locally, on this device.
 */
export function AuthModal({ mode, onClose, onSubmit }: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const copy = COPY[mode];

  useEffect(() => {
    const backdrop = backdropRef.current;
    const card = cardRef.current;
    if (!backdrop || !card) return;

    if (prefersReducedMotion()) {
      backdrop.style.opacity = "1";
      card.style.opacity = "1";
      card.style.transform = "none";
      return;
    }
    animate(backdrop, { opacity: [0, 1], duration: 180, ease: "outQuad" });
    animate(card, { opacity: [0, 1], scale: [0.95, 1], duration: 260, ease: "outQuad" });
  }, []);

  const isValid = name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email) && password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label={copy.title}>
      <div ref={backdropRef} className="absolute inset-0 bg-ink/50 opacity-0" onClick={onClose} aria-hidden="true" />
      <div ref={cardRef} className="relative w-full max-w-sm rounded-3xl bg-page-cream p-6 opacity-0 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bangla text-xl font-bold text-ink">{copy.title}</h2>
          <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="text-xl text-ink/50">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-bangla text-xs text-ink/60">{copy.nameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 font-bangla text-base text-ink"
              placeholder="যেমন: রহিম স্টোর"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bangla text-xs text-ink/60">ইমেইল</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-base text-ink"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bangla text-xs text-ink/60">পাসওয়ার্ড</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-base text-ink"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={!isValid}
            className="mt-2 rounded-full bg-khata-red px-4 py-3 font-bangla font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
          >
            {copy.cta}
          </button>
          <p className="text-center font-bangla text-[11px] text-ink/50">
            শুধু আপনার ফোনে সংরক্ষিত হবে — কোনো সার্ভারে পাঠানো হয় না
          </p>
        </form>
      </div>
    </div>
  );
}
