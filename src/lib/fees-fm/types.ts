// Domain types for the Fees & Financials module.
// These mirror the backend Prisma fee/finance models (FeeCategory, FeeStructure,
// StudentFeeAssignment, Discount, Fine, FeeCollection, FeeCollectionItem) and are
// enriched with derived invoice rows so the UI can always show an itemised breakdown.

export type RecurringInterval = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONCE";

export type FeeStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";

export type PaymentMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "ONLINE";

export type ReminderChannel = "SMS" | "EMAIL" | "WHATSAPP";

export type DiscountScope = "ROW" | "HEAD" | "STUDENT";

// ── Fee heads / categories ────────────────────────────────────────────
export interface FeeCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isRecurring: boolean;
  recurringInterval: RecurringInterval;
  isOptional: boolean;
  isAddOn: boolean;
  isActive: boolean;
}

// ── Class-wise fee structure (per academic session) ───────────────────
export interface FeeStructureItem {
  id: string;
  feeCategoryId: string;
  categoryName: string;
  amount: number;
  dueDay: number; // day of month the fee falls due
  lateFeeAmount: number; // flat late fee applied after grace period
  gracePeriodDays: number;
  proratable: boolean;
  isAddOn: boolean;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicSessionId: string;
  classId: string;
  className: string;
  isActive: boolean;
  items: FeeStructureItem[];
  createdAt: string;
}

// ── Student context ───────────────────────────────────────────────────
export interface StudentInfo {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  className: string;
  classId: string;
  sectionName: string;
  rollNumber: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  enrolledOn: string; // ISO date
  avatar?: string | null;
}

// ── Assignment: structure attached to an individual student ───────────
export interface StudentAssignment {
  id: string;
  enrollmentId: string;
  structureId: string;
  assignedAt: string;
}

// ── Per-student add-on allocation (transport, hostel, etc.) ───────────
export interface AddOnEntry {
  id: string;
  enrollmentId: string;
  feeCategoryId: string;
  amount: number;
  dueDay: number;
  gracePeriodDays: number;
  lateFeeAmount: number;
  proratable: boolean;
  active: boolean;
  attachedAt: string;
}

// ── Derived invoice row (one per fee head / period) ───────────────────
export interface InvoiceRow {
  id: string;
  enrollmentId: string;
  feeStructureId: string;
  feeCategoryId: string;
  categoryLabel: string;
  periodLabel: string; // e.g. "Monthly · Jun 2026", "Annual 2026-27"
  monthKey?: string; // "2026-06" for recurring rows
  baseAmount: number;
  gracePeriodDays: number;
  lateFeeAmount: number;
  discountAmount: number;
  lateFee: number;
  payableAmount: number; // baseAmount - discountAmount + lateFee
  paidAmount: number;
  balance: number; // payableAmount - paidAmount
  dueDate: string; // yyyy-mm-dd
  status: FeeStatus;
  source: "STRUCTURE" | "ADDON";
}

export interface DiscountEntry {
  id: string;
  enrollmentId: string;
  invoiceId?: string; // specific row, when scope === ROW
  feeCategoryId?: string; // head-level scope
  amount: number;
  reason: string;
  scope: DiscountScope;
  approvedBy: string;
  createdAt: string;
}

export interface FineEntry {
  id: string;
  enrollmentId: string;
  invoiceId: string;
  reason: string;
  amount: number;
  createdAt: string;
}

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  enrollmentId: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  remarks?: string;
  receivedBy: string;
  paymentDate: string; // ISO
  allocations: PaymentAllocation[];
}

export interface ReminderLog {
  id: string;
  enrollmentId: string;
  channel: ReminderChannel;
  type: "PRE_DUE" | "POST_DUE" | "DEFAULTER";
  sentAt: string;
  to: string;
}

export interface FeeStoreState {
  sessionId: string;
  structures: FeeStructure[];
  assignments: StudentAssignment[];
  addOns: AddOnEntry[];
  invoices: InvoiceRow[];
  discounts: DiscountEntry[];
  fines: FineEntry[];
  payments: Payment[];
  reminders: ReminderLog[];
  receiptCounter: number;
  expenses: ExpenseEntry[];
  version: number;
}

// ── View models (computed) ────────────────────────────────────────────
export type SummaryStatus = "PAID" | "PARTIAL" | "OVERDUE" | "NONE";

export interface StudentSummaryRow {
  enrollmentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  totalDue: number;
  paid: number;
  balance: number;
  discountTotal: number;
  fineTotal: number;
  status: SummaryStatus;
  overdueCount: number;
  overdueAmount: number;
  lastPaymentDate?: string;
}

export interface DashboardStats {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  totalDue: number;
  collectionRate: number;
  defaulterCount: number;
  paidStudents: number;
  partialStudents: number;
  overdueStudents: number;
  pendingStudents: number;
  collectedByMonth: { month: string; monthKey: string; collected: number; pending: number }[];
  collectedByClass: { name: string; collected: number; total: number }[];
  collectedByCategory: { name: string; code: string; collected: number; total: number }[];
  recentPayments: (Payment & { studentName: string; className: string })[];
}

export interface DefaulterRow {
  enrollmentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  totalDue: number;
  paid: number;
  balance: number;
  overdueCount: number;
  overdueAmount: number;
  lastPaymentDate?: string;
}

export interface ExpenseEntry {
  id: string;
  category: string;
  title: string;
  amount: number;
  date: string;
  paymentMode: string;
  paidTo: string;
}