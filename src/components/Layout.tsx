import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { RecordFlow } from "./RecordFlow";
import { KhataBackdrop } from "./KhataBackdrop";
import { db, popOldestPendingRecording } from "../lib/db";
import { ENTERED_KEY, SHOP_NAME_KEY } from "../pages/WelcomePage";

export function Layout() {
  const [recordOpen, setRecordOpen] = useState(false);
  const [initialTranscript, setInitialTranscript] = useState<string | null>(null);
  const navigate = useNavigate();

  // PRD F8: utterances transcribed while offline are queued locally; retry
  // them once we're back online (or on next load), surfacing the
  // confirmation card for review — never auto-writing a queued entry
  // without the shopkeeper's OK.
  useEffect(() => {
    if (recordOpen) return;

    let cancelled = false;
    const trySync = async () => {
      if (!navigator.onLine) return;
      const next = await popOldestPendingRecording();
      if (!next || cancelled) return;
      await db.pendingRecordings.delete(next.id!);
      setInitialTranscript(next.transcript);
      setRecordOpen(true);
    };

    void trySync();
    window.addEventListener("online", trySync);
    return () => {
      cancelled = true;
      window.removeEventListener("online", trySync);
    };
  }, [recordOpen]);

  const handleLogout = () => {
    try {
      localStorage.removeItem(ENTERED_KEY);
      localStorage.removeItem(SHOP_NAME_KEY);
    } catch {
      /* ignore */
    }
    navigate("/welcome");
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-page-cream pb-24">
      <KhataBackdrop tone="red" />
      <button
        type="button"
        onClick={handleLogout}
        aria-label="লগআউট"
        className="absolute right-4 top-4 z-20 rounded-full bg-white/70 px-3 py-1 font-bangla text-xs text-ink/50 shadow-sm"
      >
        লগআউট
      </button>
      <main className="relative z-10 flex-1 px-4 pt-6">
        <Outlet />
      </main>
      <BottomNav onMicClick={() => setRecordOpen(true)} />
      <RecordFlow
        open={recordOpen}
        initialTranscript={initialTranscript}
        onClose={() => {
          setRecordOpen(false);
          setInitialTranscript(null);
        }}
      />
    </div>
  );
}
