let uidCounter = 0;
export function uid(prefix = "id"): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export const PAYMENT_MODES: { value: string; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE", label: "Online" },
];

export const DEFAULT_GRACE_DAYS = 7;

export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isoToDate(iso: string): Date {
  if (!iso) return new Date(2026, 3, 1);
  const value = iso.includes("T") ? iso : `${iso}T00:00:00`;
  const date = new Date(value);
  if (isNaN(date.getTime())) return new Date(2026, 3, 1);
  return date;
}