import { useState, type ReactNode } from "react";
import type { ExtractionResult, ExtractionType } from "../lib/schema";
import { CONFIDENCE_FLAG_THRESHOLD } from "../config";

export interface EditedEntry {
  type: Exclude<ExtractionType, "unclear">;
  customer: string | null;
  item: string | null;
  amountTaka: number;
  edited: boolean;
}

interface ConfirmationCardProps {
  result: ExtractionResult;
  onConfirm: (entry: EditedEntry) => void;
  onReRecord: () => void;
}

const TYPE_OPTIONS: { value: Exclude<ExtractionType, "unclear">; label: string }[] = [
  { value: "credit_sale", label: "বাকি বিক্রি" },
  { value: "cash_sale", label: "নগদ বিক্রি" },
  { value: "repayment", label: "বাকি শোধ" },
];

export function ConfirmationCard({ result, onConfirm, onReRecord }: ConfirmationCardProps) {
  const initialType: Exclude<ExtractionType, "unclear"> = result.type === "unclear" ? "credit_sale" : result.type;

  const [type, setType] = useState(initialType);
  const [customer, setCustomer] = useState(result.customer ?? "");
  const [item, setItem] = useState(result.item ?? "");
  const [amount, setAmount] = useState(result.amount_taka != null ? String(result.amount_taka) : "");

  if (result.type === "unclear") {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-2xl border border-khata-red/30 bg-white p-6 text-center shadow-md"
        role="alert"
        aria-live="assertive"
      >
        <p className="font-bangla text-lg font-semibold text-khata-red">কথা বোঝা যায়নি — আবার বলুন</p>
        {result.transcript && <p className="text-sm text-ink/60">শোনা গেছে: "{result.transcript}"</p>}
        <button
          type="button"
          onClick={onReRecord}
          className="rounded-full bg-khata-red px-6 py-3 font-bangla font-semibold text-white"
        >
          আবার বলুন
        </button>
      </div>
    );
  }

  const flagCustomer = result.confidence.customer < CONFIDENCE_FLAG_THRESHOLD;
  const flagItem = result.confidence.item < CONFIDENCE_FLAG_THRESHOLD;
  const flagAmount = result.confidence.amount < CONFIDENCE_FLAG_THRESHOLD;

  const amountValue = Number(amount);
  const isAmountValid = amount.trim() !== "" && Number.isFinite(amountValue) && amountValue > 0;
  const showItemField = type !== "repayment";

  const edited =
    type !== initialType ||
    customer !== (result.customer ?? "") ||
    item !== (result.item ?? "") ||
    amount !== (result.amount_taka != null ? String(result.amount_taka) : "");

  const handleConfirm = () => {
    if (!isAmountValid) return;
    onConfirm({
      type,
      customer: customer.trim() ? customer.trim() : null,
      item: showItemField && item.trim() ? item.trim() : null,
      amountTaka: amountValue,
      edited,
    });
  };

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-md"
      aria-live="polite"
    >
      <div className="flex gap-2" role="radiogroup" aria-label="লেনদেনের ধরন">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={type === opt.value}
            onClick={() => setType(opt.value)}
            className={`flex-1 rounded-full px-3 py-2 font-bangla text-sm font-semibold transition-colors ${
              type === opt.value ? "bg-khata-red text-white" : "bg-page-cream text-ink/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Field label="কাস্টমার" flagged={flagCustomer} htmlFor="cc-customer">
        <input
          id="cc-customer"
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="নাম লিখুন (ঐচ্ছিক)"
          className="w-full rounded-lg border border-ink/15 bg-page-cream px-3 py-2 font-bangla text-lg text-ink"
        />
      </Field>

      {showItemField && (
        <Field label="পণ্য" flagged={flagItem} htmlFor="cc-item">
          <input
            id="cc-item"
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="যেমন: ডাল"
            className="w-full rounded-lg border border-ink/15 bg-page-cream px-3 py-2 font-bangla text-lg text-ink"
          />
        </Field>
      )}

      <Field label="টাকা" flagged={flagAmount} htmlFor="cc-amount">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-ink">৳</span>
          <input
            id="cc-amount"
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular-amount w-full rounded-lg border border-ink/15 bg-page-cream px-3 py-2 text-2xl font-bold text-ink"
          />
        </div>
      </Field>

      {result.transcript && <p className="text-xs text-ink/50">শোনা গেছে: "{result.transcript}"</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReRecord}
          className="flex-1 rounded-full border-2 border-ink/15 px-4 py-3 font-bangla font-semibold text-ink/70"
        >
          ✎ আবার বলুন
        </button>
        <button
          type="button"
          disabled={!isAmountValid}
          onClick={handleConfirm}
          className="flex-[2] rounded-full bg-joma-green px-4 py-3 font-bangla font-semibold text-white disabled:opacity-40"
        >
          ✓ খাতায় লিখুন
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  flagged,
  htmlFor,
  children,
}: {
  label: string;
  flagged: boolean;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className={flagged ? "rounded-xl bg-baki-amber/10 p-2" : undefined}>
      <label htmlFor={htmlFor} className="mb-1 flex items-center gap-1 font-bangla text-sm text-ink/60">
        {label}
        {flagged && (
          <span className="text-baki-amber" title="নিশ্চিত নয় — যাচাই করুন" aria-label="নিশ্চিত নয়, যাচাই করুন">
            ⚠
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
