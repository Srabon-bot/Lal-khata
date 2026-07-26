import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, repayBaki } from "../lib/db";
import { LedgerRow } from "../components/LedgerRow";
import { EmptyState } from "../components/EmptyState";
import { formatTaka } from "../lib/numerals";
import { useSettings } from "../hooks/useSettings";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();
  const { settings } = useSettings();

  const customer = useLiveQuery(() => db.customers.get(customerId), [customerId]);
  const history = useLiveQuery(
    () => db.entries.where("customerId").equals(customerId).reverse().sortBy("createdAt"),
    [customerId],
  );

  const [repaying, setRepaying] = useState(false);
  const [amount, setAmount] = useState("");

  if (!customer) return null;

  const amountValue = Number(amount);
  const isValid = amount.trim() !== "" && Number.isFinite(amountValue) && amountValue > 0;

  const handleRepay = async () => {
    if (!isValid) return;
    await repayBaki(customerId, amountValue);
    setAmount("");
    setRepaying(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="পেছনে যান" className="text-xl text-ink/60">
          ←
        </button>
        <h1 className="font-bangla text-2xl font-bold text-ink">{customer.name}</h1>
      </div>

      <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <p className="font-bangla text-sm text-ink/50">মোট বাকি</p>
        <p
          className={`tabular-amount text-3xl font-bold transition-colors duration-300 ${
            customer.balanceTaka > 0 ? "text-baki-amber" : "text-joma-green"
          }`}
        >
          {formatTaka(Math.max(0, customer.balanceTaka), settings.numeralStyle)}
        </p>

        {customer.balanceTaka > 0 &&
          (repaying ? (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-lg font-bold text-ink">৳</span>
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="কত টাকা"
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-lg font-bold text-ink"
              />
              <button
                type="button"
                disabled={!isValid}
                onClick={handleRepay}
                className="shrink-0 rounded-full bg-joma-green px-4 py-2 font-bangla font-semibold text-white disabled:opacity-40"
              >
                নিশ্চিত
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRepaying(true)}
              className="mt-4 rounded-full bg-joma-green px-6 py-2 font-bangla font-semibold text-white"
            >
              বাকি শোধ
            </button>
          ))}
      </div>

      <h2 className="font-bangla text-lg font-semibold text-ink">লেনদেনের ইতিহাস</h2>
      {!history || history.length === 0 ? (
        <EmptyState message="এখনো কোনো লেনদেন নেই" />
      ) : (
        <ul className="ruled-paper rounded-2xl bg-white shadow-sm">
          {history.map((entry) => (
            <LedgerRow key={entry.id} entry={entry} customerName={customer.name} numeralStyle={settings.numeralStyle} />
          ))}
        </ul>
      )}

      <Link to="/customers" className="self-center font-bangla text-sm text-rule-blue underline">
        সব কাস্টমার দেখুন
      </Link>
    </div>
  );
}
