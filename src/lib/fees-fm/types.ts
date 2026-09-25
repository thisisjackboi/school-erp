// Domain types for the Fees & Financials module.
// These mirror the backend Prisma fee/finance models (FeeCategory, FeeStructure,
// StudentFeeAssignment, Discount, Fine, FeeCollection, FeeCollectionItem) and are
// derived server-side, so the UI always renders the source of truth from the API.

export type RecurringInterval = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONCE";

export type FeeStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
export type SummaryStatus = "PAID" | "PARTIAL" | "OVERDUE" | "NONE";

export type PaymentMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "ONLINE";

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
  dueDay: number;
  lateFeeAmount: number;
  gracePeriodDays: number;
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
  enrolledOn: string;
  avatar?: string | null;
}

// ── Derived invoice row (one per fee structure item × period) ─────────
export interface InvoiceRow {
  id: string;
  assignmentId: string;
  feeStructureItemId: string;
  enrollmentId: string;
  feeStructureId: string;
  feeCategoryId: string;
  categoryLabel: string;
  categoryCode: string;
  periodKey: string;
  periodLabel: string; // e.g. "Monthly - Jun 2026", "Annual - 2026-27"
  monthKey?: string; // "2026-06" for monthly rows
  baseAmount: number;
  gracePeriodDays: number;
  lateFeeAmount: number;
  discountAmount: number;
  fineAmount: number;
  lateFee: number;
  payableAmount: number; // baseAmount - discountAmount + fineAmount + lateFee
  paidAmount: number;
  balance: number; // payableAmount - paidAmount
  dueDate: string; // yyyy-mm-dd
  status: FeeStatus;
  source: "STRUCTURE" | "ADDON";
}

export interface DiscountEntry {
  id: string;
  enrollmentId: string;
  assignmentId: string;
  feeStructureItemId?: string;
  periodLabel?: string;
  amount: number;
  reason: string;
  scope: DiscountScope;
  approvedBy: string;
  createdAt: string;
}

export interface FineEntry {
  id: string;
  enrollmentId: string;
  assignmentId: string;
  feeStructureItemId?: string;
  invoiceId: string; // representative invoice row for display
  periodLabel?: string;
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
  paymentMode: string;
  referenceNumber?: string;
  remarks?: string;
  receivedBy: string;
  paymentDate: string; // ISO
  allocations: PaymentAllocation[];
}

// ── View models (server-computed) ─────────────────────────────────────
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
  amount: number;
  date: string;
  paidTo?: string;
}