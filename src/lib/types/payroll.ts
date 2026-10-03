export type SalaryComponentType = "EARNING" | "DEDUCTION";

export type PayrollRunStatus = "DRAFT" | "PROCESSED" | "APPROVED" | "PAID";

/** Minimal designation/employee projection attached to payroll payloads. */
export interface PayrollEmployeeRef {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  employmentType?: string;
  status?: string;
  designation?: {
    id: string;
    title: string;
    category?: string | null;
  } | null;
}

export interface SalaryComponent {
  id: string;
  code: string;
  name: string;
  type: SalaryComponentType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructureItem {
  id: string;
  salaryStructureId: string;
  componentId: string | null;
  customName: string;
  type: SalaryComponentType;
  amount: number;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  ctc: number;
  basicSalary: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: PayrollEmployeeRef | null;
  items?: SalaryStructureItem[];
}

/** A single printed payslip line, frozen at generation time. */
export interface PayrollLine {
  componentId?: string | null;
  name: string;
  amount: number;
}

export interface PayrollRunItem {
  id: string;
  runId: string;
  employeeId: string;
  salaryStructureId: string;
  ctc: number;
  basicSalary: number;
  workingDays: number;
  paidDays: number;
  lopDays: number;
  grossAmount: number;
  lopAmount: number;
  /** Includes loss of pay, so `gross - totalDeductions === net`. */
  totalDeductions: number;
  netAmount: number;
  earnings: PayrollLine[];
  deductions: PayrollLine[];
  createdAt: string;
  updatedAt: string;
  employee?: PayrollEmployeeRef | null;
  salaryStructure?: {
    id: string;
    effectiveFrom: string;
    ctc: number;
    basicSalary: number;
  } | null;
}

export interface PayrollRun {
  id: string;
  periodMonth: number;
  periodYear: number;
  status: PayrollRunStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  processedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  processedByUserId: string | null;
  approvedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PayrollRunItem[];
}

export interface SkippedEmployee {
  employeeId: string;
  employeeCode: string;
  reason: string;
}

export interface GeneratePayrollResult {
  run: PayrollRun;
  skipped: SkippedEmployee[];
}

export interface PayslipResult {
  item: PayrollRunItem;
  run: PayrollRun;
}

export interface PayrollRegisterGroup {
  category: string;
  employeeCount: number;
  gross: number;
  deductions: number;
  net: number;
}

export interface PayrollRegister {
  run: PayrollRun;
  departments: PayrollRegisterGroup[];
}

export interface MissingStructureEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  employmentType?: string;
  designation?: { title: string } | null;
}

// ── bonus / deduction register ─────────────────────────────────────────

export interface AdjustmentLine {
  name: string;
  amount: number;
}

/** One payroll period's adjustments for one employee. */
export interface PayrollAdjustmentPeriod {
  runId: string;
  year: number;
  month: number;
  label: string;
  runStatus: PayrollRunStatus;
  bonus: AdjustmentLine[];
  deductions: AdjustmentLine[];
  totalBonus: number;
  totalDeduction: number;
}

/** One employee row: their totals across every period in the filter. */
export interface PayrollAdjustmentEmployeeRow {
  employeeId: string;
  employeeCode: string;
  name: string;
  designation: string;
  totalBonus: number;
  totalDeduction: number;
  netEffect: number;
  periods: PayrollAdjustmentPeriod[];
}

export interface PayrollAdjustmentTotals {
  totalBonus: number;
  totalDeduction: number;
  netEffect: number;
}

export interface PayrollAdjustmentPeriodOption {
  runId: string;
  year: number;
  month: number;
  label: string;
  status: PayrollRunStatus;
}

export interface PayrollAdjustmentRegister {
  filters: { year: number | null; month: number | null };
  availablePeriods: PayrollAdjustmentPeriodOption[];
  rows: PayrollAdjustmentEmployeeRow[];
  totals: PayrollAdjustmentTotals;
}

export interface PayrollAdjustmentListParams {
  year?: number;
  month?: number;
  employeeId?: string;
}

// ── payloads ───────────────────────────────────────────────────────────

export interface GeneratePayrollPayload {
  periodMonth: number;
  periodYear: number;
  employeeIds?: string[];
  workingDays?: number;
  notes?: string;
}

export interface PayrollRunListParams {
  year?: number;
  month?: number;
  status?: PayrollRunStatus;
}

export interface UpdatePayrollRunItemPayload {
  workingDays?: number;
  paidDays?: number;
  bonusAmount?: number;
  otherDeductionAmount?: number;
  otherDeductionName?: string;
}

export interface MarkPayrollPaidPayload {
  paymentMethod?: string;
  paymentReference?: string;
  paidOn?: string;
  notes?: string;
}

export interface CreateSalaryComponentPayload {
  code: string;
  name: string;
  type: SalaryComponentType;
  description?: string;
}

export interface UpdateSalaryComponentPayload {
  code?: string;
  name?: string;
  type?: SalaryComponentType;
  description?: string;
  isActive?: boolean;
}

export interface SalaryStructureItemInput {
  componentId?: string;
  customName: string;
  type: SalaryComponentType;
  amount: number;
}

export interface CreateSalaryStructurePayload {
  employeeId: string;
  ctc: number;
  basicSalary: number;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  items?: SalaryStructureItemInput[];
}

export type UpdateSalaryStructurePayload = Omit<
  Partial<CreateSalaryStructurePayload>,
  "effectiveTo" | "notes"
> & {
  /** Explicit `null` clears the existing end date / notes on update. */
  effectiveTo?: string | null;
  notes?: string | null;
};