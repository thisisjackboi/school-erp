export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE";
export type FeeInvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type RecurringInterval = "monthly" | "quarterly" | "yearly";

export interface FeeHead {
  id: string;
  name: string;
  code: string;
  description?: string;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  isOptional: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeStructureItem {
  id: string;
  feeStructureId: string;
  feeHeadId: string;
  amount: number;
  dueDate?: string;
  lateFeeAmount: number;
  gracePeriodDays: number;
  feeHead?: FeeHead;
}

export interface FeeStructure {
  id: string;
  academicSessionId: string;
  classId: string;
  name: string;
  isActive: boolean;
  items: FeeStructureItem[];
  academicSession?: { id: string; name: string };
  class?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentFee {
  id: string;
  studentEnrollmentId: string;
  feeStructureId: string;
  feeHeadId: string;
  periodLabel?: string;
  totalAmount: number;
  discountAmount: number;
  lateFee: number;
  payableAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: FeeInvoiceStatus;
  feeHead?: FeeHead;
  feeStructure?: FeeStructure;
  studentEnrollment?: {
    id: string;
    studentId: string;
    rollNumber?: string | null;
    student?: { id: string; firstName: string; lastName: string; admissionNumber: string };
    class?: { id: string; name: string };
    section?: { id: string; name: string };
    academicSession?: { id: string; name: string };
  };
  payments?: FeePayment[];
  discounts?: FeeDiscount[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FeePayment {
  id: string;
  studentFeeId: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  receiptNumber: string;
  receivedByEmployeeId?: string;
  remarks?: string;
  studentFee?: StudentFee;
  receivedBy?: { id: string; firstName?: string; lastName?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeDiscount {
  id: string;
  studentFeeId: string;
  amount: number;
  reason: string;
  approvedByEmployeeId?: string;
  studentFee?: StudentFee;
  approvedBy?: { id: string; firstName?: string; lastName?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeDashboardStats {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  totalDue: number;
  collectionRate: number;
  collectedByClass: { className: string; collected: number; total: number }[];
  collectedByMonth: { month: string; collected: number; pending: number }[];
  recentPayments: FeePayment[];
}

export interface DefaulterRow {
  studentEnrollmentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  overdueCount: number;
  overdueAmount: number;
  lastPaymentDate?: string;
}
