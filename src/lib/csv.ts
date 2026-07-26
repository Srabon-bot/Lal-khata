import type { Customer, LedgerEntry } from "./db";

const ENTRY_TYPE_LABEL: Record<LedgerEntry["type"], string> = {
  credit_sale: "বাকি বিক্রি",
  cash_sale: "নগদ বিক্রি",
  repayment: "বাকি শোধ",
};

export function entriesToCsv(entries: LedgerEntry[], customersById: Map<number, Customer>): string {
  const header = ["তারিখ ও সময়", "ধরন", "কাস্টমার", "পণ্য", "টাকা"];
  const rows = entries.map((e) => [
    new Date(e.createdAt).toISOString(),
    ENTRY_TYPE_LABEL[e.type],
    e.customerId ? (customersById.get(e.customerId)?.name ?? "") : "",
    e.item ?? "",
    String(e.amountTaka),
  ]);

  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM so Bangla text opens correctly in Excel.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
