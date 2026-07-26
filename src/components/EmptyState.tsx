import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface EmptyStateProps {
  message: string;
  showArrow?: boolean;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function EmptyState({ message, showArrow = false }: EmptyStateProps) {
  const arrowRef = useRef<HTMLSpanElement>(null);

  // A few invitational bounces, then rest — the PRD's motion rules reserve
  // continuous looping for the record pulse alone, so this settles instead
  // of bouncing forever like the default Tailwind animation did.
  useEffect(() => {
    if (!showArrow || prefersReducedMotion() || !arrowRef.current) return;
    const anim = animate(arrowRef.current, {
      translateY: [0, 10, 0],
      loop: 3,
      duration: 550,
      ease: "inOutQuad",
    });
    return () => {
      anim.revert();
    };
  }, [showArrow]);

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="status">
      {showArrow && (
        <span ref={arrowRef} className="text-4xl" aria-hidden="true">
          ⬇️
        </span>
      )}
      <p className="max-w-[220px] font-bangla text-base text-ink/60">{message}</p>
    </div>
  );
}
