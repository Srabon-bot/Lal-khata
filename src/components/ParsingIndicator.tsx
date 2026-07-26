import { useEffect, useRef } from "react";
import { animate, type JSAnimation } from "animejs";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** "Pen writing a line" wait state while Gemma parses the clip (PRD §5.4). */
export function ParsingIndicator() {
  const lineRef = useRef<SVGRectElement>(null);
  const animRef = useRef<JSAnimation | null>(null);

  useEffect(() => {
    if (!lineRef.current || prefersReducedMotion()) return;
    animRef.current = animate(lineRef.current, {
      scaleX: [0, 1],
      duration: 1100,
      loop: true,
      alternate: true,
      ease: "inOutQuad",
    });
    return () => {
      animRef.current?.revert();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
      <svg width="120" height="24" viewBox="0 0 120 24" aria-hidden="true">
        <rect
          ref={lineRef}
          x="4"
          y="10"
          width="112"
          height="4"
          rx="2"
          fill="var(--color-khata-red)"
          style={{ transformOrigin: "4px 12px" }}
        />
      </svg>
      <p className="font-bangla text-sm text-ink/70">লেখা হচ্ছে...</p>
    </div>
  );
}
