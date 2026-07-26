import { useEffect, useRef, useState } from "react";
import { createTimeline } from "animejs";

const SEEN_KEY = "lal-khata-cover-seen";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * First-load-only signature moment (PRD §5.3/§5.4): the closed red khata
 * "cover" opens to reveal the app. Shown once per browser via localStorage;
 * every load after that is instant, no animation.
 */
export function CoverSplash({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(SEEN_KEY);
    } catch {
      return false;
    }
  });

  const coverRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!visible) {
      onDone();
      return;
    }

    const finish = () => {
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      setVisible(false);
      onDone();
    };

    if (prefersReducedMotion() || !coverRef.current || !titleRef.current || !subtitleRef.current) {
      finish();
      return;
    }

    const timeline = createTimeline({ onComplete: finish });
    timeline
      .add(titleRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 450, ease: "outQuad" })
      .add(subtitleRef.current, { opacity: [0, 1], translateY: [10, 0], duration: 400, ease: "outQuad" }, "-=200")
      .add(coverRef.current, { duration: 650 }, "+=250")
      .add(
        coverRef.current,
        { opacity: [1, 0], scale: [1, 0.94], translateY: [0, -24], duration: 500, ease: "inOutQuad" },
        "-=100",
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={coverRef}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-khata-red"
      role="presentation"
      aria-hidden="true"
    >
      <div className="flex h-40 w-32 overflow-hidden rounded-lg shadow-2xl">
        <div className="w-5 bg-khata-red-deep" />
        <div className="flex-1 bg-page-cream" />
      </div>
      <p ref={titleRef} className="mt-6 font-bangla text-4xl font-bold text-page-cream opacity-0">
        লাল খাতা
      </p>
      <p ref={subtitleRef} className="mt-2 font-bangla text-sm text-page-cream/80 opacity-0">
        কথা বলে হিসাব লিখুন
      </p>
    </div>
  );
}
