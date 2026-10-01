import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { FeeCategory } from "../fees-fm/types";

const GENERATE_FEES_TIMEOUT_MS = 60_000;

// ── Fee categories ─────────────────────────────────────────────────────
export async function listFeeCategories(
  accessToken?: string | null,
): Promise<FeeCategory[]> {
  return apiData<FeeCategory[]>(
    `${API_BASE_URL}/fees/categories`,
    { headers: authHeaders(accessToken) },
  );
}

export async function createFeeCategory(
  data: Omit<FeeCategory, "id">,
  accessToken?: string | null,
): Promise<FeeCategory> {
  return apiData<FeeCategory>(
    `${API_BASE_URL}/fees/categories`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function updateFeeCategory(
  id: string,
  data: Partial<FeeCategory>,
  accessToken?: string | null,
): Promise<FeeCategory> {
  return apiData<FeeCategory>(
    `${API_BASE_URL}/fees/categories/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function deleteFeeCategory(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<{ message: string }>(
    `${API_BASE_URL}/fees/categories/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );
}

// ── Payment methods ────────────────────────────────────────────────────
export interface PaymentMethod {
  id: string;
  name: string;
}

export async function listPaymentMethods(
  accessToken?: string | null,
): Promise<PaymentMethod[]> {
  return apiData<PaymentMethod[]>(
    `${API_BASE_URL}/payment-methods`,
    { headers: authHeaders(accessToken) },
  );
}

// ── Fee structures ─────────────────────────────────────────────────────
export interface FeeStructureItemPayload {
  feeCategoryId: string;
  amount: number;
  dueDate?: string;
  dueDay?: number;
  lateFeeAmount?: number;
  gracePeriodDays?: number;
}

export interface CreateFeeStructurePayload {
  name: string;
  classId: string;
  academicSessionId: string;
  isActive?: boolean;
  items: FeeStructureItemPayload[];
}

export interface UpdateFeeStructurePayload {
  name?: string;
  classId?: string;
  academicSessionId?: string;
  isActive?: boolean;
  items?: FeeStructureItemPayload[];
}

export interface FeeStructureRaw {
  id: string;
  name: string;
  classId: string;
  academicSessionId: string;
  isActive: boolean;
  createdAt: string;
  class: { id: string; name: string };
  academicSession: { id: string; name: string };
  feeStructureItems: {
    id: string;
    feeStructureId: string;
    feeCategoryId: string;
    amount: number;
    dueDate?: string | null;
    dueDay: number | null;
    lateFeeAmount: number;
    gracePeriodDays: number;
    feeCategory: FeeCategory;
  }[];
}

export async function listFeeStructures(
  filters: { academicSessionId?: string; classId?: string },
  accessToken?: string | null,
): Promise<FeeStructureRaw[]> {
  const query = new URLSearchParams();
  if (filters.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters.classId) query.append("classId", filters.classId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiData<FeeStructureRaw[]>(
    `${API_BASE_URL}/fees/structures${qs}`,
    { headers: authHeaders(accessToken) },
  );
}

export async function createFeeStructure(
  data: CreateFeeStructurePayload,
  accessToken?: string | null,
): Promise<FeeStructureRaw> {
  return apiData<FeeStructureRaw>(
    `${API_BASE_URL}/fees/structures`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function updateFeeStructure(
  id: string,
  data: UpdateFeeStructurePayload,
  accessToken?: string | null,
): Promise<FeeStructureRaw> {
  return apiData<FeeStructureRaw>(
    `${API_BASE_URL}/fees/structures/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function deleteFeeStructure(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<{ message: string }>(
    `${API_BASE_URL}/fees/structures/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );
}

// ── Invoice rows / summaries / generation ──────────────────────────────
export interface InvoiceRowRaw {
  id: string;
  assignmentId: string;
  feeStructureItemId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  feeStructureId: string;
  feeCategoryId: string;
  categoryName: string;
  categoryCode: string;
  periodKey: string;
  periodLabel: string;
  monthKey?: string;
  baseAmount: number;
  gracePeriodDays: number;
  lateFeeAmount: number;
  discountAmount: number;
  fineAmount: number;
  lateFee: number;
  payableAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  source: "STRUCTURE" | "ADDON";
}

export interface StudentSummaryRaw {
  enrollmentId: string;
  studentId: string;
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
  status: "PAID" | "PARTIAL" | "OVERDUE" | "NONE";
  overdueCount: number;
  overdueAmount: number;
  lastPaymentDate?: string;
}

export interface EnrollmentAccountSummary {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
}

export interface EnrollmentAccount {
  summary: EnrollmentAccountSummary | null;
  invoices: InvoiceRowRaw[];
}

export async function listInvoiceRows(
  filters: { academicSessionId?: string; classId?: string; sectionId?: string },
  accessToken?: string | null,
): Promise<InvoiceRowRaw[]> {
  const query = new URLSearchParams();
  if (filters.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters.classId) query.append("classId", filters.classId);
  if (filters.sectionId) query.append("sectionId", filters.sectionId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiData<InvoiceRowRaw[]>(
    `${API_BASE_URL}/fees/students${qs}`,
    { headers: authHeaders(accessToken) },
  );
}

export async function listStudentSummaries(
  filters: { academicSessionId?: string; classId?: string; sectionId?: string },
  accessToken?: string | null,
): Promise<StudentSummaryRaw[]> {
  const query = new URLSearchParams();
  if (filters.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters.classId) query.append("classId", filters.classId);
  if (filters.sectionId) query.append("sectionId", filters.sectionId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiData<StudentSummaryRaw[]>(
    `${API_BASE_URL}/fees/students/summary${qs}`,
    { headers: authHeaders(accessToken) },
  );
}

export async function generateFees(
  data: {
    academicSessionId: string;
    classId?: string;
    sectionId?: string;
    monthKey?: string;
  },
  accessToken?: string | null,
): Promise<{ generated: number }> {
  return apiData<{ generated: number }>(
    `${API_BASE_URL}/fees/students/generate`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Request failed",
    { timeoutMs: GENERATE_FEES_TIMEOUT_MS, retry: false },
  );
}

export async function getEnrollmentAccount(
  studentEnrollmentId: string,
  accessToken?: string | null,
): Promise<EnrollmentAccount> {
  return apiData<EnrollmentAccount>(
    `${API_BASE_URL}/fees/students/${studentEnrollmentId}`,
    { headers: authHeaders(accessToken) },
  );
}

// ── Student fee head assignments (per-student add/remove) ──────────────
export type FeeItemAction = "ADD" | "REMOVE";

export interface StudentFeeHeadRaw {
  feeStructureItemId: string;
  feeStructureId: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  isRecurring: boolean;
  recurringInterval: string | null;
  amount: number;
  dueDate: string | null;
  dueDay: number | null;
  lateFeeAmount: number;
  gracePeriodDays: number;
  assigned: boolean;
  overriddenBy: "ADD" | "REMOVE" | null;
  paidAmount: number;
  removable: boolean;
  required: boolean;
}

export interface StudentFeeHeadsResponse {
  heads: StudentFeeHeadRaw[];
  totalHeads: number;
  totalAssigned: number;
}

export async function listStudentFeeHeads(
  studentEnrollmentId: string,
  accessToken?: string | null,
): Promise<StudentFeeHeadsResponse> {
  return apiData<StudentFeeHeadsResponse>(
    `${API_BASE_URL}/fees/students/${studentEnrollmentId}/fee-heads`,
    { headers: authHeaders(accessToken) },
  );
}

export async function setStudentFeeHead(
  studentEnrollmentId: string,
  feeStructureItemId: string,
  action: FeeItemAction,
  accessToken?: string | null,
): Promise<EnrollmentAccount> {
  return apiData<EnrollmentAccount>(
    `${API_BASE_URL}/fees/students/${studentEnrollmentId}/fee-heads`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({ feeStructureItemId, action }),
    },
  );
}

export async function clearStudentFeeHead(
  studentEnrollmentId: string,
  feeStructureItemId: string,
  accessToken?: string | null,
): Promise<EnrollmentAccount> {
  return apiData<EnrollmentAccount>(
    `${API_BASE_URL}/fees/students/${studentEnrollmentId}/fee-heads/${feeStructureItemId}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );
}

// ── Collections ────────────────────────────────────────────────────────
export interface CollectionItemPayload {
  studentFeeAssignmentId: string;
  /** Optional: target a specific fee head within the assignment (assignment = student+structure+period). */
  feeStructureItemId?: string;
  amount: number;
}

export interface CreateFeeCollectionPayload {
  studentEnrollmentId: string;
  items: CollectionItemPayload[];
  paymentMode: string;
  referenceNumber?: string;
  remarks?: string;
}

export interface FeeCollectionItemRaw {
  id: string;
  amountPaid: number;
  studentFeeAssignment: { id: string; periodKey: string };
  feeStructureItem: {
    id: string;
    feeCategory: { id: string; name: string; code: string };
  };
}

export interface FeeCollectionRaw {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentDate: string;
  transactionReference?: string | null;
  remarks?: string | null;
  studentEnrollmentId: string;
  paymentMethod: { id: string; name: string };
  collectedByUser: {
    id: string;
    username: string;
    employee: { id: string; firstName: string; lastName: string } | null;
  } | null;
  feeCollectionItems: FeeCollectionItemRaw[];
}

export async function createFeeCollection(
  data: CreateFeeCollectionPayload,
  accessToken?: string | null,
): Promise<FeeCollectionRaw> {
  return apiData<FeeCollectionRaw>(
    `${API_BASE_URL}/fees/collections`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function listFeeCollections(
  filters: { studentEnrollmentId?: string },
  accessToken?: string | null,
): Promise<FeeCollectionRaw[]> {
  const query = new URLSearchParams();
  if (filters.studentEnrollmentId) query.append("studentEnrollmentId", filters.studentEnrollmentId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiData<FeeCollectionRaw[]>(
    `${API_BASE_URL}/fees/collections${qs}`,
    { headers: authHeaders(accessToken) },
  );
}

export async function getFeeCollection(
  idOrReceipt: string,
  accessToken?: string | null,
): Promise<FeeCollectionRaw> {
  return apiData<FeeCollectionRaw>(
    `${API_BASE_URL}/fees/collections/${idOrReceipt}`,
    { headers: authHeaders(accessToken) },
  );
}

// ── Discounts & fines ──────────────────────────────────────────────────
export interface DiscountRaw {
  id: string;
  studentFeeAssignmentId: string;
  feeStructureItemId: string | null;
  value: number;
  reason: string;
  createdAt: string;
  studentFeeAssignment: { id: string; periodKey: string; studentEnrollmentId: string };
  approvedByEmployee: { id: string; firstName: string; lastName: string } | null;
}

export interface FineRaw {
  id: string;
  studentFeeAssignmentId: string;
  feeStructureItemId: string | null;
  amount: number;
  reason: string;
  createdAt: string;
  studentFeeAssignment: { id: string; periodKey: string; studentEnrollmentId: string };
}

export async function createFeeDiscount(
  data: { studentFeeAssignmentId: string; feeStructureItemId?: string; amount: number; reason: string },
  accessToken?: string | null,
): Promise<DiscountRaw> {
  return apiData<DiscountRaw>(
    `${API_BASE_URL}/fees/discounts`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        studentFeeAssignmentId: data.studentFeeAssignmentId,
        ...(data.feeStructureItemId ? { feeStructureItemId: data.feeStructureItemId } : {}),
        amount: data.amount,
        reason: data.reason,
      }),
    },
  );
}

export async function listFeeDiscounts(
  filters: { studentEnrollmentId?: string },
  accessToken?: string | null,
): Promise<DiscountRaw[]> {
  const query = new URLSearchParams();
  if (filters.studentEnrollmentId) query.append("studentEnrollmentId", filters.studentEnrollmentId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiData<DiscountRaw[]>(
    `${API_BASE_URL}/fees/discounts${qs}`,
    { headers: authHeaders(accessToken) },
  );
}

export async function createFeeFine(
  data: { studentFeeAssignmentId: string; feeStructureItemId?: string; amount: number; reason: string },
  accessToken?: string | null,
): Promise<FineRaw> {
  return apiData<FineRaw>(
    `${API_BASE_URL}/fees/fines`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        studentFeeAssignmentId: data.studentFeeAssignmentId,
        ...(data.feeStructureItemId ? { feeStructureItemId: data.feeStructureItemId } : {}),
        amount: data.amount,
        reason: data.reason,
      }),
    },
  );
}

export async function updateFeeFine(
  id: string,
  data: { amount: number; reason: string },
  accessToken?: string | null,
): Promise<FineRaw> {
  return apiData<FineRaw>(
    `${API_BASE_URL}/fees/fines/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function deleteFeeFine(
  id: string,
  accessToken?: string | null,
): Promise<{ message: string }> {
  return apiData<{ message: string }>(
    `${API_BASE_URL}/fees/fines/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );
}

export async function listFeeFines(
  filters: { studentEnrollmentId?: string },
  accessToken?: string | null,
): Promise<FineRaw[]> {
  const query = new URLSearchParams();
  if (filters.studentEnrollmentId) query.append("studentEnrollmentId", filters.studentEnrollmentId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiData<FineRaw[]>(
    `${API_BASE_URL}/fees/fines${qs}`,
    { headers: authHeaders(accessToken) },
  );
}

// ── Expenses ───────────────────────────────────────────────────────────
export interface ExpenseRaw {
  id: string;
  category: string;
  amount: number;
  expenseDate: string;
  paidTo?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  recordedByEmployee: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateExpensePayload {
  category: string;
  amount: number;
  expenseDate: string;
  paidTo?: string;
}

export async function listExpenses(
  filters: { from?: string; to?: string; category?: string },
  accessToken?: string | null,
): Promise<ExpenseRaw[]> {
  const query = new URLSearchParams();
  if (filters.from) query.append("from", filters.from);
  if (filters.to) query.append("to", filters.to);
  if (filters.category) query.append("category", filters.category);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiData<ExpenseRaw[]>(
    `${API_BASE_URL}/expenses${qs}`,
    { headers: authHeaders(accessToken) },
  );
}

export async function createExpense(
  data: CreateExpensePayload,
  accessToken?: string | null,
): Promise<ExpenseRaw> {
  return apiData<ExpenseRaw>(
    `${API_BASE_URL}/expenses`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function updateExpense(
  id: string,
  data: Partial<CreateExpensePayload>,
  accessToken?: string | null,
): Promise<ExpenseRaw> {
  return apiData<ExpenseRaw>(
    `${API_BASE_URL}/expenses/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
  );
}

export async function deleteExpense(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<{ message: string }>(
    `${API_BASE_URL}/expenses/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );
}
