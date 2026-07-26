import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db, startOfToday, computeTotals } from "../lib/db";
import { formatTaka } from "../lib/numerals";
import { useSettings } from "../hooks/useSettings";
import { EmptyState } from "../components/EmptyState";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
