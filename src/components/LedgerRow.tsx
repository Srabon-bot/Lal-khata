import type { LedgerEntry } from "../lib/db";
import { formatTaka } from "../lib/numerals";

interface LedgerRowProps {
  entry: LedgerEntry;
  customerName: string | null;
  numeralStyle: "bn" | "en";
  className?: string;
}

const TYPE_META: Record<LedgerEntry["type"], { label: string; sign: "+" | "-" | ""; colorClass: string }> = {
  cash_sale: { label: "নগদ বিক্রি", sign: "+", colorClass: "text-joma-green" },
  credit_sale: { label: "বাকি বিক্রি", sign: "", colorClass: "text-baki-amber" },
  repayment: { label: "বাকি শোধ", sign: "+", colorClass: "text-joma-green" },
};

export function LedgerRow({ entry, customerName, numeralStyle, className }: LedgerRowProps) {
  const meta = TYPE_META[entry.type];
  const time = new Date(entry.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

  return (
    <li
      className={`flex items-center justify-between border-b border-rule-blue/10 px-3 py-3 last:border-none ${className ?? ""}`}
    >
      <div className="min-w-0">
        <p className="truncate font-bangla text-base font-medium text-ink">
          {customerName ?? (entry.type === "cash_sale" ? "নগদ" : "—")}
          {entry.item && <span className="text-ink/50"> · {entry.item}</span>}
        </p>
        <p className="font-bangla text-xs text-ink/50">
          {meta.label} · {time}
        </p>
      </div>
      <p className={`tabular-amount shrink-0 pl-3 text-lg font-bold ${meta.colorClass}`}>
        {meta.sign}
        {formatTaka(entry.amountTaka, numeralStyle)}
      </p>
    </li>
  );
}
