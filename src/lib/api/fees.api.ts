import { API_BASE_URL } from "./config";
import type {
  FeeHead,
  FeeStructure,
  FeeStructureItem,
  StudentFee,
  FeePayment,
  FeeDiscount,
  FeeDashboardStats,
  DefaulterRow,
  PaymentMode,
} from "../types/fee";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

// ── Fee Categories (live backend: GET /fees/categories) ───
export interface LiveFeeCategory {
  id: string;
  name: string;
  isRecurring: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function toFeeCategory(c: LiveFeeCategory) {
  return {
    id: c.id,
    name: c.name,
    code: c.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 20),
    description: "",
    isRecurring: c.isRecurring,
    recurringInterval: c.isRecurring ? "MONTHLY" : "ONCE",
    isOptional: false,
    isAddOn: false,
    isActive: true,
  } as const;
}

export async function getFeeCategories(accessToken?: string | null): Promise<LiveFeeCategory[]> {
  const response = await fetch(`${API_BASE_URL}/fees/categories`, { headers: getAuthHeaders(accessToken) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch fee categories");
  return result.data;
}

// ── Fee Heads ──────────────────────────────────────────────
export interface CreateFeeHeadPayload {
  name: string;
  code: string;
  description?: string;
  isRecurring?: boolean;
  recurringInterval?: "monthly" | "quarterly" | "yearly";
  isOptional?: boolean;
  isActive?: boolean;
}

export async function getFeeHeads(accessToken?: string | null): Promise<FeeHead[]> {
  const response = await fetch(`${API_BASE_URL}/fee-heads`, { headers: getAuthHeaders(accessToken) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch fee heads");
  return result.data;
}

export async function createFeeHead(data: CreateFeeHeadPayload, accessToken?: string | null): Promise<FeeHead> {
  const response = await fetch(`${API_BASE_URL}/fee-heads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to create fee head");
  return result.data;
}

export async function updateFeeHead(id: string, data: Partial<CreateFeeHeadPayload>, accessToken?: string | null): Promise<FeeHead> {
  const response = await fetch(`${API_BASE_URL}/fee-heads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to update fee head");
  return result.data;
}

// ── Fee Structures ─────────────────────────────────────────
export interface CreateFeeStructurePayload {
  academicSessionId: string;
  classId: string;
  name: string;
  items: {
    feeHeadId: string;
    amount: number;
    dueDate?: string;
    lateFeeAmount?: number;
    gracePeriodDays?: number;
  }[];
}

export async function getFeeStructures(filters?: { academicSessionId?: string; classId?: string }, accessToken?: string | null): Promise<FeeStructure[]> {
  const query = new URLSearchParams();
  if (filters?.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters?.classId) query.append("classId", filters.classId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/fee-structures${qs}`, { headers: getAuthHeaders(accessToken) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch fee structures");
  return result.data;
}

export async function createFeeStructure(data: CreateFeeStructurePayload, accessToken?: string | null): Promise<FeeStructure> {
  const response = await fetch(`${API_BASE_URL}/fee-structures`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to create fee structure");
  return result.data;
}

export async function updateFeeStructure(id: string, data: Partial<CreateFeeStructurePayload>, accessToken?: string | null): Promise<FeeStructure> {
  const response = await fetch(`${API_BASE_URL}/fee-structures/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to update fee structure");
  return result.data;
}

// ── Student Fees (Invoices) ───────────────────────────────
export interface GetStudentFeesFilters {
  academicSessionId?: string;
  classId?: string;
  sectionId?: string;
  studentEnrollmentId?: string;
  status?: string;
}

export async function getStudentFees(filters?: GetStudentFeesFilters, accessToken?: string | null): Promise<StudentFee[]> {
  const query = new URLSearchParams();
  if (filters?.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters?.classId) query.append("classId", filters.classId);
  if (filters?.sectionId) query.append("sectionId", filters.sectionId);
  if (filters?.studentEnrollmentId) query.append("studentEnrollmentId", filters.studentEnrollmentId);
  if (filters?.status) query.append("status", filters.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/student-fees${qs}`, { headers: getAuthHeaders(accessToken) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch student fees");
  return result.data;
}

export async function generateInvoicesForClass(filters: { academicSessionId: string; classId: string; sectionId?: string }, accessToken?: string | null): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/student-fees/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify(filters),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to generate invoices");
  return result.data;
}

export async function generateMonthlyInvoices(academicSessionId: string, month?: string, accessToken?: string | null): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/student-fees/generate-monthly${month ? `?month=${month}` : ""}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify({ academicSessionId }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to generate monthly invoices");
  return result.data;
}

// ── Payments ──────────────────────────────────────────────
export interface CreatePaymentPayload {
  studentFeeIds: string[];
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  remarks?: string;
  receivedByEmployeeId?: string;
}

export interface PaymentResult {
  payment: FeePayment;
  receipts: { studentFeeId: string; receiptNumber: string; amount: number; balanceAfter: number }[];
}

export async function createPayment(data: CreatePaymentPayload, accessToken?: string | null): Promise<PaymentResult> {
  const response = await fetch(`${API_BASE_URL}/fee-payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to record payment");
  return result.data;
}

export async function getPayments(filters?: { studentFeeId?: string; studentEnrollmentId?: string }, accessToken?: string | null): Promise<FeePayment[]> {
  const query = new URLSearchParams();
  if (filters?.studentFeeId) query.append("studentFeeId", filters.studentFeeId);
  if (filters?.studentEnrollmentId) query.append("studentEnrollmentId", filters.studentEnrollmentId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/fee-payments${qs}`, { headers: getAuthHeaders(accessToken) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch payments");
  return result.data;
}

// ── Discounts ─────────────────────────────────────────────
export interface CreateDiscountPayload {
  studentFeeId: string;
  amount: number;
  reason: string;
  approvedByEmployeeId?: string;
}

export async function createDiscount(data: CreateDiscountPayload, accessToken?: string | null): Promise<FeeDiscount> {
  const response = await fetch(`${API_BASE_URL}/fee-discounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to add discount");
  return result.data;
}

// ── Dashboard / Reports ───────────────────────────────────
export async function getFeeDashboard(filters?: { academicSessionId?: string; classId?: string; from?: string; to?: string }, accessToken?: string | null): Promise<FeeDashboardStats> {
  const query = new URLSearchParams();
  if (filters?.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters?.classId) query.append("classId", filters.classId);
  if (filters?.from) query.append("from", filters.from);
  if (filters?.to) query.append("to", filters.to);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/fee/dashboard${qs}`, { headers: getAuthHeaders(accessToken) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch dashboard");
  return result.data;
}

export async function getDefaulters(filters?: { academicSessionId?: string; classId?: string }, accessToken?: string | null): Promise<DefaulterRow[]> {
  const query = new URLSearchParams();
  if (filters?.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters?.classId) query.append("classId", filters.classId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/fee/defaulters${qs}`, { headers: getAuthHeaders(accessToken) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch defaulters");
  return result.data;
}
