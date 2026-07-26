import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { RecordFlow } from "./RecordFlow";
import { db, popOldestPendingRecording } from "../lib/db";

export function Layout() {
  const [recordOpen, setRecordOpen] = useState(false);
  const [initialBlob, setInitialBlob] = useState<Blob | null>(null);

  // PRD F8: clips recorded while offline are queued locally; retry them once
  // we're back online (or on next load), surfacing the confirmation card for
  // review — never auto-writing a queued entry without the shopkeeper's OK.
  useEffect(() => {
    if (recordOpen) return;

    let cancelled = false;
    const trySync = async () => {
      if (!navigator.onLine) return;
      const next = await popOldestPendingRecording();
      if (!next || cancelled) return;
      await db.pendingRecordings.delete(next.id!);
      setInitialBlob(next.blob);
      setRecordOpen(true);
    };

    void trySync();
    window.addEventListener("online", trySync);
    return () => {
      cancelled = true;
      window.removeEventListener("online", trySync);
    };
  }, [recordOpen]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-page-cream pb-24">
      <main className="flex-1 px-4 pt-6">
        <Outlet />
      </main>
      <BottomNav onMicClick={() => setRecordOpen(true)} />
      <RecordFlow
        open={recordOpen}
        initialBlob={initialBlob}
        onClose={() => {
          setRecordOpen(false);
          setInitialBlob(null);
        }}
      />
    </div>
  );
}
