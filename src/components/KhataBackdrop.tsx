/**
 * Faint watermark of an open khata (ledger book) that gently "breathes" in
 * the background of every page — sits as a sibling behind page content
 * (not a fixed viewport layer) so it's actually visible rather than hidden
 * under the app's opaque card background. Ambient decorative motion, not
 * core UI feedback, so a continuous loop is fine here (see CoverSplash/
 * WelcomePage for the same reasoning) and is neutralized globally under
 * prefers-reduced-motion via the blanket rule in index.css.
 */
export function KhataBackdrop({ tone = "red" }: { tone?: "red" | "cream" }) {
  const fillA = tone === "red" ? "var(--color-khata-red-deep)" : "var(--color-page-cream)";
  const fillB = tone === "red" ? "var(--color-khata-red)" : "var(--color-page-cream)";
  const opacityClass = tone === "red" ? "opacity-[0.05]" : "opacity-[0.12]";

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 200 200" className={`khata-breathe h-[70%] max-h-[420px] w-auto ${opacityClass}`}>
        <polygon points="100,15 15,35 15,175 100,158" fill={fillA} />
        <polygon points="100,15 185,35 185,175 100,158" fill={fillB} />
        <line x1="100" y1="15" x2="100" y2="158" stroke={fillA} strokeWidth="1.5" opacity="0.6" />
      </svg>
    </div>
  );
}
