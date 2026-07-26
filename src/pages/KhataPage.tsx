import { useLiveQuery } from "dexie-react-hooks";
import { db, startOfToday, computeTotals } from "../lib/db";
import { LedgerRow } from "../components/LedgerRow";
import { EmptyState } from "../components/EmptyState";
import { AnimatedTaka } from "../components/AnimatedTaka";
import { useSettings } from "../hooks/useSettings";
import { entriesToCsv, downloadCsv } from "../lib/csv";

export function KhataPage() {
  const { settings, setNumeralStyle } = useSettings();

  const todayEntries = useLiveQuery(
    () => db.entries.where("createdAt").aboveOrEqual(startOfToday()).reverse().sortBy("createdAt"),
    [],
  );
  const customers = useLiveQuery(() => db.customers.toArray(), []);

  const customersById = new Map((customers ?? []).map((c) => [c.id!, c]));
  const entries = todayEntries ?? [];
  const totals = computeTotals(entries);
  const totalOutstanding = Math.max(0, (customers ?? []).reduce((sum, c) => sum + c.balanceTaka, 0));

  const handleExport = async () => {
    const all = await db.entries.orderBy("createdAt").toArray();
    const allCustomers = await db.customers.toArray();
    const csv = entriesToCsv(
      all,
      new Map(allCustomers.map((c) => [c.id!, c])),
    );
    downloadCsv(`lal-khata-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="font-bangla text-2xl font-bold text-ink">আজকের খাতা</h1>
        <button
          type="button"
          onClick={() => setNumeralStyle(settings.numeralStyle === "bn" ? "en" : "bn")}
          className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink/60"
          aria-label="সংখ্যা পদ্ধতি পরিবর্তন করুন"
        >
          {settings.numeralStyle === "bn" ? "০-৯ → 0-9" : "0-9 → ০-৯"}
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <TotalCard label="আজকের নগদ" value={totals.cashTaka} numeralStyle={settings.numeralStyle} tone="green" />
        <TotalCard
          label="আজকে বাকি"
          value={totals.creditTaka}
          numeralStyle={settings.numeralStyle}
          tone="amber"
        />
        <TotalCard label="মোট বকেয়া" value={totalOutstanding} numeralStyle={settings.numeralStyle} tone="red" />
      </div>

      {entries.length === 0 ? (
        <EmptyState message="প্রথম হিসাব বলুন" showArrow />
      ) : (
        <ul className="ruled-paper rounded-2xl bg-white shadow-sm">
          {entries.map((entry) => (
            <LedgerRow
              key={entry.id}
              entry={entry}
              customerName={entry.customerId ? (customersById.get(entry.customerId)?.name ?? null) : null}
              numeralStyle={settings.numeralStyle}
              className="entry-enter"
            />
          ))}
        </ul>
      )}

      {entries.length > 0 && (
        <button
          type="button"
          onClick={handleExport}
          className="self-center font-bangla text-sm text-rule-blue underline"
        >
          CSV হিসেবে ডাউনলোড করুন
        </button>
      )}
    </div>
  );
}

function TotalCard({
  label,
  value,
  numeralStyle,
  tone,
}: {
  label: string;
  value: number;
  numeralStyle: "bn" | "en";
  tone: "green" | "amber" | "red";
}) {
  const toneClass = { green: "text-joma-green", amber: "text-baki-amber", red: "text-khata-red" }[tone];
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <p className="font-bangla text-xs text-ink/50">{label}</p>
      <AnimatedTaka value={value} numeralStyle={numeralStyle} className={`tabular-amount block text-lg font-bold ${toneClass}`} />
    </div>
  );
}
