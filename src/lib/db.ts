import Dexie, { type EntityTable } from "dexie";

export type EntryType = "credit_sale" | "cash_sale" | "repayment";

export interface Confidence {
  customer: number;
  item: number;
  amount: number;
}

export interface LedgerEntry {
  id?: number;
  type: EntryType;
  customerId: number | null; // null only for anonymous cash sales
  item: string | null;
  amountTaka: number;
  createdAt: number; // epoch ms
  confidence: Confidence | null; // null for manually-entered rows
  transcript: string | null;
  edited: boolean; // user changed a field on the confirmation card
}

export interface Customer {
  id?: number;
  name: string; // display form, e.g. "রহিম ভাই"
  normalizedName: string; // lowercase/trimmed, unique index for dedupe
  balanceTaka: number; // positive = owes the shop (baki)
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  id: number; // fixed row id = 1
  numeralStyle: "bn" | "en";
}

export const SETTINGS_ID = 1;

/** An utterance transcribed while offline, queued for extraction once back online (PRD F8). */
export interface PendingRecording {
  id?: number;
  transcript: string;
  createdAt: number;
}

class LalKhataDB extends Dexie {
  entries!: EntityTable<LedgerEntry, "id">;
  customers!: EntityTable<Customer, "id">;
  settings!: EntityTable<Settings, "id">;
  pendingRecordings!: EntityTable<PendingRecording, "id">;

  constructor() {
    super("lal-khata");
    this.version(1).stores({
      entries: "++id, type, customerId, createdAt",
      customers: "++id, &normalizedName, balanceTaka",
      settings: "id",
    });
    this.version(2).stores({
      pendingRecordings: "++id, createdAt",
    });
  }
}

export const db = new LalKhataDB();

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) return existing;
  const defaults: Settings = { id: SETTINGS_ID, numeralStyle: "bn" };
  await db.settings.put(defaults);
  return defaults;
}

/** Finds a customer by (normalized) name, creating one if it doesn't exist yet. */
export async function getOrCreateCustomer(rawName: string): Promise<Customer> {
  const normalizedName = normalizeName(rawName);
  const existing = await db.customers.where("normalizedName").equals(normalizedName).first();
  if (existing) return existing;

  const now = Date.now();
  const id = await db.customers.add({
    name: rawName.trim(),
    normalizedName,
    balanceTaka: 0,
    createdAt: now,
    updatedAt: now,
  });
  return (await db.customers.get(id))!;
}

export interface RecordEntryInput {
  type: EntryType;
  customerName: string | null;
  item: string | null;
  amountTaka: number;
  confidence: Confidence | null;
  transcript: string | null;
  edited: boolean;
}

/** Records a ledger entry and applies its effect on the customer's baki balance. */
export async function recordEntry(input: RecordEntryInput): Promise<LedgerEntry> {
  return db.transaction("rw", db.entries, db.customers, async () => {
    let customerId: number | null = null;

    if (input.customerName && input.customerName.trim()) {
      const customer = await getOrCreateCustomer(input.customerName);
      customerId = customer.id!;

      const delta =
        input.type === "credit_sale" ? input.amountTaka : input.type === "repayment" ? -input.amountTaka : 0;

      if (delta !== 0) {
        await db.customers.update(customerId, {
          balanceTaka: customer.balanceTaka + delta,
          updatedAt: Date.now(),
        });
      }
    }

    const entry: LedgerEntry = {
      type: input.type,
      customerId,
      item: input.item,
      amountTaka: input.amountTaka,
      createdAt: Date.now(),
      confidence: input.confidence,
      transcript: input.transcript,
      edited: input.edited,
    };
    const id = await db.entries.add(entry);
    return { ...entry, id };
  });
}

/** Records a বাকি শোধ (baki repaid) action from a customer's page. */
export async function repayBaki(customerId: number, amountTaka: number): Promise<void> {
  const customer = await db.customers.get(customerId);
  if (!customer) throw new Error("Unknown customer");

  await db.transaction("rw", db.entries, db.customers, async () => {
    await db.entries.add({
      type: "repayment",
      customerId,
      item: null,
      amountTaka,
      createdAt: Date.now(),
      confidence: null,
      transcript: null,
      edited: false,
    });
    await db.customers.update(customerId, {
      balanceTaka: customer.balanceTaka - amountTaka,
      updatedAt: Date.now(),
    });
  });
}

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface DailyTotals {
  cashTaka: number;
  creditTaka: number;
  repaidTaka: number;
}

export function computeTotals(entries: LedgerEntry[]): DailyTotals {
  return entries.reduce<DailyTotals>(
    (acc, e) => {
      if (e.type === "cash_sale") acc.cashTaka += e.amountTaka;
      else if (e.type === "credit_sale") acc.creditTaka += e.amountTaka;
      else if (e.type === "repayment") acc.repaidTaka += e.amountTaka;
      return acc;
    },
    { cashTaka: 0, creditTaka: 0, repaidTaka: 0 },
  );
}

/** Queues an utterance transcribed while offline for extraction once connectivity returns. */
export async function queuePendingRecording(transcript: string): Promise<void> {
  await db.pendingRecordings.add({ transcript, createdAt: Date.now() });
}

export async function popOldestPendingRecording(): Promise<PendingRecording | undefined> {
  return db.pendingRecordings.orderBy("createdAt").first();
}
