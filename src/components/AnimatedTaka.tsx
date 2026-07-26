import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { formatTaka } from "../lib/numerals";

interface AnimatedTakaProps {
  value: number;
  numeralStyle: "bn" | "en";
  className?: string;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Totals that count up to their new value on change (PRD §5.4). */
export function AnimatedTaka({ value, numeralStyle, className }: AnimatedTakaProps) {
  const [displayed, setDisplayed] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current === value) return;

    if (prefersReducedMotion()) {
      setDisplayed(value);
      prevValueRef.current = value;
      return;
    }

    const counter = { val: prevValueRef.current };
    const anim = animate(counter, {
      val: value,
      duration: 500,
      ease: "outExpo",
      onUpdate: () => setDisplayed(counter.val),
    });
    prevValueRef.current = value;
    return () => {
      anim.revert();
    };
  }, [value]);

  return <span className={className}>{formatTaka(displayed, numeralStyle)}</span>;
}
