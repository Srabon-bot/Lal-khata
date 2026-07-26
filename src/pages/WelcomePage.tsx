import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTimeline, stagger } from "animejs";
import { AuthModal, type AuthMode } from "../components/AuthModal";
import { KhataBackdrop } from "../components/KhataBackdrop";

export const ENTERED_KEY = "lal-khata-entered";
export const SHOP_NAME_KEY = "lal-khata-shop-name";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const FEATURES = [
  { icon: "🎙️", title: "কথা বলে লিখুন", body: "টাইপ নয় — শুধু বলুন, খাতায় লেখা হয়ে যাবে।" },
  { icon: "🧾", title: "বাকি মনে রাখুন", body: "কে কত বাকি রেখেছে, সব এক জায়গায়।" },
  { icon: "🔒", title: "আপনার ফোনেই থাকে", body: "কোনো অ্যাকাউন্ট লাগে না — আপনার ডেটা আপনার কাছেই।" },
] as const;

// Real market context (see Sources) — grounds the pitch in the actual scale
// of the problem instead of an abstract claim.
const STATS = [
  { value: "৪৫ লাখ+", label: "মুদি দোকান বাংলাদেশে" },
  { value: "৭৩%+", label: "বিক্রি হয় বাকিতে" },
  { value: "৯৪%", label: "পরিবার মুদি দোকান থেকে কেনে" },
] as const;

export function WelcomePage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const pitchRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = (
      [titleRef.current, subtitleRef.current, pitchRef.current, statsRef.current, ctaRef.current] as (
        | HTMLElement
        | null
      )[]
    ).filter((el): el is HTMLElement => el !== null);
    const cards = cardsRef.current ? Array.from(cardsRef.current.children) : [];

    if (prefersReducedMotion()) {
      for (const el of [...targets, ...cards]) {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
      }
      return;
    }

    const timeline = createTimeline();
    targets.forEach((el, i) => {
      timeline.add(el, { opacity: [0, 1], translateY: [16, 0], duration: 500, ease: "outQuad" }, i === 0 ? 0 : "-=300");
    });
    if (cards.length) {
      timeline.add(
        cards,
        { opacity: [0, 1], translateY: [20, 0], duration: 450, delay: stagger(90), ease: "outQuad" },
        "-=200",
      );
    }
  }, []);

  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  const enter = (shopName?: string) => {
    try {
      localStorage.setItem(ENTERED_KEY, "1");
      if (shopName) localStorage.setItem(SHOP_NAME_KEY, shopName);
    } catch {
      /* ignore */
    }
    navigate("/");
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-khata-red">
      {/* Ambient themed background — decorative marketing motion, not core UI
          feedback, so a slow continuous loop is fine here (PRD §5.4's "nothing
          loops except the record pulse" rule is about in-app interaction
          states, not a landing page backdrop). Neutralized globally under
          prefers-reduced-motion via the blanket rule in index.css. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="blob blob-a bg-khata-red-deep" />
        <div className="blob blob-b bg-rule-blue" />
        <div className="blob blob-c bg-baki-amber" />
        <div className="ruled-paper absolute inset-0 opacity-[0.06]" />
      </div>
      <KhataBackdrop tone="cream" />

      <div ref={heroRef} className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 pb-10 pt-14 text-center">
        <h1 ref={titleRef} className="font-bangla text-5xl font-bold text-page-cream opacity-0">
          লাল খাতা
        </h1>
        <p ref={subtitleRef} className="mt-2 font-bangla text-lg text-page-cream/90 opacity-0">
          Lal Khata — Voice-First Bookkeeper
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-page-cream/15 px-3 py-1 text-xs font-medium text-page-cream/90 ring-1 ring-page-cream/25">
          <span
            aria-hidden="true"
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)" }}
          >
            ✦
          </span>
          <span>Google Gemma দ্বারা চালিত</span>
        </div>
        <p ref={pitchRef} className="mt-6 max-w-xs font-bangla text-base leading-relaxed text-page-cream/85 opacity-0">
          মুদি দোকানের হিসাব রাখুন কথা বলে — লিখতে হবে না, টাইপ করতে হবে না। বাংলায়, সহজে, নিজের ফোনেই।
        </p>

        <div ref={statsRef} className="mt-6 grid w-full grid-cols-3 gap-2 opacity-0">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-page-cream/10 px-2 py-3 ring-1 ring-page-cream/20">
              <p className="font-bangla text-lg font-bold text-page-cream">{s.value}</p>
              <p className="font-bangla text-[11px] leading-tight text-page-cream/75">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-page-cream/50">TBS News · Baki.bd</p>

        <div ref={cardsRef} className="mt-8 flex w-full flex-col gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-3 rounded-2xl bg-page-cream/95 p-3 text-left opacity-0 shadow-lg"
            >
              <span className="text-2xl" aria-hidden="true">
                {f.icon}
              </span>
              <div>
                <p className="font-bangla text-sm font-semibold text-ink">{f.title}</p>
                <p className="font-bangla text-xs text-ink/60">{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div ref={ctaRef} className="mt-9 flex w-full flex-col items-center gap-3 opacity-0">
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className="flex-1 rounded-full bg-page-cream px-4 py-3 font-bangla font-semibold text-khata-red shadow-lg transition-transform active:scale-95"
            >
              সাইন আপ
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className="flex-1 rounded-full border-2 border-page-cream/70 px-4 py-3 font-bangla font-semibold text-page-cream transition-transform active:scale-95"
            >
              লগইন
            </button>
          </div>
          <p className="font-bangla text-xs text-page-cream/70">শুধু আপনার ফোনে থাকে — কোনো সার্ভারে যায় না</p>
        </div>

        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSubmit={(name) => enter(name)}
          />
        )}

        <div className="mt-auto flex flex-col items-center gap-2 pt-10">
          <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true">
            <g className="xeno-ring">
              <polygon
                points="20,2 35,11 35,29 20,38 5,29 5,11"
                fill="none"
                stroke="var(--color-page-cream)"
                strokeOpacity="0.6"
                strokeWidth="1.5"
              />
            </g>
            <text x="20" y="25" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-page-cream)">
              X
            </text>
          </svg>
          <p className="font-bangla text-xs text-page-cream/60">Made with ♥ by Team Xenomorphic</p>
        </div>
      </div>
    </div>
  );
}
