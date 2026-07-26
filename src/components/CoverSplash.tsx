import { useEffect, useRef, useState } from "react";
import { createTimeline } from "animejs";

const SEEN_KEY = "lal-khata-cover-seen";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * First-load-only signature moment (PRD §5.3/§5.4): the closed red khata
 * literally opens like a book — two cover panels hinged at the spine swing
 * outward on rotateY to reveal the app underneath. Shown once per browser
 * via localStorage; every load after that is instant, no animation.
 */
export function CoverSplash({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(SEEN_KEY);
    } catch {
      return false;
    }
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
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

    if (
      prefersReducedMotion() ||
      !rootRef.current ||
      !leftPanelRef.current ||
      !rightPanelRef.current ||
      !titleRef.current ||
      !subtitleRef.current
    ) {
      finish();
      return;
    }

    const timeline = createTimeline({ onComplete: finish });
    timeline
      .add(titleRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 450, ease: "outQuad" })
      .add(subtitleRef.current, { opacity: [0, 1], translateY: [10, 0], duration: 400, ease: "outQuad" }, "-=200")
      .add([titleRef.current, subtitleRef.current], { opacity: [1, 0], duration: 250, ease: "inQuad" }, "+=500")
      .add(leftPanelRef.current, { rotateY: [0, -100], duration: 750, ease: "inOutQuad" }, "-=100")
      .add(rightPanelRef.current, { rotateY: [0, 100], duration: 750, ease: "inOutQuad" }, "<<")
      .add(rootRef.current, { opacity: [1, 0], duration: 200, ease: "linear" }, "-=150");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink"
      style={{ perspective: "1800px" }}
      role="presentation"
      aria-hidden="true"
    >
      <div
        ref={leftPanelRef}
        className="absolute inset-y-0 left-0 w-1/2 border-r border-black/20 bg-khata-red-deep shadow-[inset_-12px_0_24px_rgba(0,0,0,0.35)]"
        style={{ transformOrigin: "right center", transformStyle: "preserve-3d" }}
      />
      <div
        ref={rightPanelRef}
        className="absolute inset-y-0 right-0 w-1/2 bg-khata-red shadow-[inset_12px_0_24px_rgba(0,0,0,0.25)]"
        style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <p ref={titleRef} className="font-bangla text-4xl font-bold text-page-cream opacity-0">
          লাল খাতা
        </p>
        <p ref={subtitleRef} className="mt-2 font-bangla text-sm text-page-cream/80 opacity-0">
          কথা বলে হিসাব লিখুন
        </p>
      </div>
    </div>
  );
}
