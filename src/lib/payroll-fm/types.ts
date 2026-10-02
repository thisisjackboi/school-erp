import type { Employee } from "../types/employee";
import type {
  PayrollRunStatus,
  SalaryComponentType,
} from "../types/payroll";

export type PayrollTab = "runs" | "structures" | "components";

/** Flattened employee used by payroll screens (no user/designation nesting). */
export interface PayrollEmployee extends Employee {
  fullName: string;
}

export const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const RUN_STATUS_OPTIONS: { value: PayrollRunStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PROCESSED", label: "Processed" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
];

export const COMPONENT_TYPE_OPTIONS: {
  value: SalaryComponentType;
  label: string;
}[] = [
  { value: "EARNING", label: "Earning" },
  { value: "DEDUCTION", label: "Deduction" },
];

export const PAYMENT_METHOD_OPTIONS: string[] = [
  "Bank Transfer",
  "Cash",
  "Cheque",
  "UPI",
  "Card",
];