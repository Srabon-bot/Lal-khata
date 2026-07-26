import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db, startOfToday, computeTotals } from "../lib/db";
import { formatTaka } from "../lib/numerals";
import { useSettings } from "../hooks/useSettings";
import { EmptyState } from "../components/EmptyState";
import { ParsingIndicator } from "../components/ParsingIndicator";
import { getWeeklyInsight, GemmaError } from "../lib/gemmaClient";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type InsightState = "idle" | "loading" | "error";

export function SummaryPage() {
  const { settings } = useSettings();

  const todayEntries = useLiveQuery(
    () => db.entries.where("createdAt").aboveOrEqual(startOfToday()).toArray(),
    [],
  );
  const weekEntries = useLiveQuery(
    () => db.entries.where("createdAt").aboveOrEqual(Date.now() - SEVEN_DAYS_MS).toArray(),
    [],
  );
  const topCustomers = useLiveQuery(
    () => db.customers.where("balanceTaka").above(0).reverse().sortBy("balanceTaka"),
    [],
  );

  const todayTotals = computeTotals(todayEntries ?? []);
  const weekTotals = computeTotals(weekEntries ?? []);

  const [insight, setInsight] = useState<string | null>(null);
  const [insightState, setInsightState] = useState<InsightState>("idle");
  const [insightError, setInsightError] = useState("");

  const handleInsight = async () => {
    setInsightState("loading");
    setInsight(null);

    const lines = [
      `নগদ বিক্রি: ৳${Math.round(weekTotals.cashTaka)}`,
      `বাকি দেওয়া হয়েছে: ৳${Math.round(weekTotals.creditTaka)}`,
      `বাকি শোধ হয়েছে: ৳${Math.round(weekTotals.repaidTaka)}`,
      `মোট লেনদেন সংখ্যা: ${(weekEntries ?? []).length}`,
    ];
    if (topCustomers && topCustomers.length > 0) {
      lines.push(
        `সবচেয়ে বেশি বাকি: ${topCustomers
          .slice(0, 3)
          .map((c) => `${c.name} (৳${Math.round(c.balanceTaka)})`)
          .join(", ")}`,
      );
    }

    try {
      const text = await getWeeklyInsight(lines.join("\n"));
      setInsight(text);
      setInsightState("idle");
    } catch (err) {
      setInsightError(
        err instanceof GemmaError && err.kind === "timeout"
          ? "উত্তর দিতে বেশি সময় লাগছে। আবার চেষ্টা করুন।"
          : "এই মুহূর্তে বিশ্লেষণ আনা যায়নি। আবার চেষ্টা করুন।",
      );
      setInsightState("error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-bangla text-2xl font-bold text-ink">সারাংশ</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bangla text-sm font-semibold text-ink/60">আজকে</h2>
        <StatRow label="নগদ বিক্রি" value={todayTotals.cashTaka} numeralStyle={settings.numeralStyle} tone="green" />
        <StatRow label="বাকি দেওয়া" value={todayTotals.creditTaka} numeralStyle={settings.numeralStyle} tone="amber" />
        <StatRow label="বাকি শোধ" value={todayTotals.repaidTaka} numeralStyle={settings.numeralStyle} tone="green" />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bangla text-sm font-semibold text-ink/60">গত ৭ দিন</h2>
        <StatRow label="নগদ বিক্রি" value={weekTotals.cashTaka} numeralStyle={settings.numeralStyle} tone="green" />
        <StatRow label="বাকি দেওয়া" value={weekTotals.creditTaka} numeralStyle={settings.numeralStyle} tone="amber" />
        <StatRow label="বাকি শোধ" value={weekTotals.repaidTaka} numeralStyle={settings.numeralStyle} tone="green" />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bangla text-sm font-semibold text-ink/60">সাপ্তাহিক বিশ্লেষণ</h2>
          <span className="rounded-full bg-khata-red/10 px-2 py-0.5 text-[10px] font-semibold text-khata-red">
            Gemma
          </span>
        </div>

        {insightState === "idle" && !insight && (
          <button
            type="button"
            onClick={handleInsight}
            className="w-full rounded-full bg-khata-red/10 py-2 font-bangla text-sm font-semibold text-khata-red"
          >
            বিশ্লেষণ দেখুন
          </button>
        )}

        {insightState === "loading" && (
          <div className="flex flex-col items-center gap-1">
            <ParsingIndicator />
            <p className="-mt-3 font-bangla text-xs text-ink/50">একটু সময় লাগতে পারে...</p>
          </div>
        )}

        {insightState === "error" && (
          <div className="flex flex-col items-center gap-2 py-1 text-center">
            <p className="font-bangla text-sm text-khata-red">{insightError}</p>
            <button type="button" onClick={handleInsight} className="font-bangla text-xs text-rule-blue underline">
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {insightState === "idle" && insight && (
          <div>
            <p className="font-bangla text-sm leading-relaxed text-ink">{insight}</p>
            <button
              type="button"
              onClick={handleInsight}
              className="mt-2 font-bangla text-xs text-rule-blue underline"
            >
              নতুন করে দেখুন
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bangla text-sm font-semibold text-ink/60">সবচেয়ে বেশি বাকি</h2>
        {!topCustomers || topCustomers.length === 0 ? (
          <EmptyState message="কারো বাকি নেই" />
        ) : (
          <ul className="flex flex-col gap-2">
            {topCustomers.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link to={`/customers/${c.id}`} className="flex items-center justify-between py-1">
                  <span className="font-bangla text-ink">{c.name}</span>
                  <span className="tabular-amount font-bold text-baki-amber">
                    {formatTaka(c.balanceTaka, settings.numeralStyle)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatRow({
  label,
  value,
  numeralStyle,
  tone,
}: {
  label: string;
  value: number;
  numeralStyle: "bn" | "en";
  tone: "green" | "amber";
}) {
  const toneClass = tone === "green" ? "text-joma-green" : "text-baki-amber";
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-bangla text-sm text-ink/70">{label}</span>
      <span className={`tabular-amount font-bold ${toneClass}`}>{formatTaka(value, numeralStyle)}</span>
    </div>
  );
}
