import type { BadgeProps } from "@/components/ui/badge";

import type { PayrollLine, PayrollRunStatus } from "../types/payroll";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** `12` / `2026` → `December 2026`. Payroll periods are 1-based months. */
export function periodLabel(month: number, year: number): string {
  if (!month || !year) return "-";
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function periodShortLabel(month: number, year: number): string {
  if (!month || !year) return "-";
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

/** Calendar days in the payroll period; used to pre-fill working days. */
export function daysInMonth(year: number, month: number): number {
  if (!year || !month) return 30;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function toISODate(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function employeeFullName(
  employee?: { firstName?: string; lastName?: string } | null,
): string {
  if (!employee) return "-";
  return `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || "-";
}

const RUN_STATUS_VARIANTS: Record<
  PayrollRunStatus,
  { variant: BadgeProps["variant"]; label: string }
> = {
  DRAFT: { variant: "secondary", label: "Draft" },
  PROCESSED: { variant: "info", label: "Processed" },
  APPROVED: { variant: "warning", label: "Approved" },
  PAID: { variant: "success", label: "Paid" },
};

export function runStatusMeta(status: PayrollRunStatus) {
  return RUN_STATUS_VARIANTS[status] ?? RUN_STATUS_VARIANTS.DRAFT;
}

/** The single action that moves a run forward from its current state. */
export function nextRunAction(status: PayrollRunStatus): string | null {
  switch (status) {
    case "DRAFT":
      return "Process Payroll";
    case "PROCESSED":
      return "Approve Payroll";
    case "APPROVED":
      return "Mark as Paid";
    default:
      return null;
  }
}

export function sumLines(payLines: PayrollLine[]): number {
  return round2(payLines.reduce((sum, line) => sum + line.amount, 0));
}

/** Ad-hoc bonus that was appended to a payslip snapshot at generation time. */
export function bonusAmountOf(payLines: PayrollLine[]): number {
  return sumLines(payLines.filter((line) => line.name === "Bonus"));
}

/**
 * Ad-hoc deductions the payroll officer typed in for this month. The backend
 * treats a line named "Other Deduction" as the default, so it is included too.
 */
export function otherDeductionOf(payLines: PayrollLine[]): number {
  const extra = payLines.filter(
    (line) => line.componentId === null && line.name !== "Other Deduction",
  );
  if (extra.length) return sumLines(extra);
  const fallback = payLines.find((line) => line.name === "Other Deduction");
  return fallback ? fallback.amount : 0;
}

export function otherDeductionNameOf(payLines: PayrollLine[]): string {
  const extra = payLines.find(
    (line) => line.componentId === null && line.name !== "Other Deduction",
  );
  return extra?.name ?? "Other Deduction";
}

/** Years a payroll period can plausibly cover, for the filter dropdowns. */
export function yearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let year = current + 1; year >= current - 5; year -= 1) years.push(year);
  return years;
}