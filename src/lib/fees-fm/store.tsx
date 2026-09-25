import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getStudents } from "@/lib/api/students.api";
import {
  createExpense,
  createFeeCategory,
  createFeeCollection,
  createFeeDiscount,
  createFeeFine,
  createFeeStructure,
  deleteFeeCategory,
  deleteFeeFine,
  deleteFeeStructure,
  listExpenses,
  listFeeCategories,
  listFeeCollections,
  listFeeDiscounts,
  listFeeFines,
  listFeeStructures,
  listInvoiceRows,
  listPaymentMethods,
  listStudentSummaries,
  updateFeeCategory,
  updateFeeFine,
  updateFeeStructure,
  generateFees,
  type FeeCollectionRaw,
  type FeeStructureRaw,
  type InvoiceRowRaw,
} from "@/lib/api/fees.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";

import type {
  DashboardStats,
  DefaulterRow,
  DiscountEntry,
  ExpenseEntry,
  FeeCategory,
  FeeStatus,
  FeeStructure,
  FeeStructureItem,
  FineEntry,
  InvoiceRow,
  Payment,
  PaymentAllocation,
  PaymentMode,
  StudentInfo,
  StudentSummaryRow,
} from "./types";
import { round2, isoToDate, toISODate } from "./helpers";

export interface FeeFilters {
  className?: string;
  feeCategoryId?: string;
  from?: string;
  to?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Mapping helpers (backend raw → domain)
// ═══════════════════════════════════════════════════════════════════════

function invoiceLabel(row: InvoiceRow): string {
  return `${row.categoryLabel} · ${row.periodLabel}`;
}

function toInvoiceRow(raw: InvoiceRowRaw): InvoiceRow {
  return {
    id: raw.id,
    assignmentId: raw.assignmentId,
    feeStructureItemId: raw.feeStructureItemId,
    enrollmentId: raw.enrollmentId,
    feeStructureId: raw.feeStructureId,
    feeCategoryId: raw.feeCategoryId,
    categoryLabel: raw.categoryName,
    categoryCode: raw.categoryCode,
    periodKey: raw.periodKey,
    periodLabel: raw.periodLabel,
    monthKey: raw.monthKey,
    baseAmount: raw.baseAmount,
    gracePeriodDays: raw.gracePeriodDays,
    lateFeeAmount: raw.lateFeeAmount,
    discountAmount: raw.discountAmount,
    fineAmount: raw.fineAmount,
    lateFee: raw.lateFee,
    payableAmount: raw.payableAmount,
    paidAmount: raw.paidAmount,
    balance: raw.balance,
    dueDate: raw.dueDate,
    status: raw.status,
    source: raw.source,
  };
}

function toFeeStructure(raw: FeeStructureRaw): FeeStructure {
  const items: FeeStructureItem[] = raw.feeStructureItems.map((i) => ({
    id: i.id,
    feeCategoryId: i.feeCategoryId,
    categoryName: i.feeCategory.name,
    amount: Number(i.amount),
    dueDay: i.dueDay ?? 10,
    lateFeeAmount: Number(i.lateFeeAmount),
    gracePeriodDays: Number(i.gracePeriodDays),
  }));
  return {
    id: raw.id,
    name: raw.name,
    academicSessionId: raw.academicSessionId,
    classId: raw.classId,
    className: raw.class.name,
    isActive: raw.isActive,
    items,
    createdAt: raw.createdAt,
  };
}

function toPayment(raw: FeeCollectionRaw): Payment {
  const allocations: PaymentAllocation[] = raw.feeCollectionItems.map((i) => ({
    invoiceId: `${i.studentFeeAssignment.id}:${i.feeStructureItem.id}`,
    amount: Number(i.amountPaid),
  }));
  return {
    id: raw.id,
    receiptNumber: raw.receiptNumber,
    enrollmentId: raw.studentEnrollmentId,
    amount: Number(raw.totalAmount),
    paymentMode: raw.paymentMethod.name,
    referenceNumber: raw.transactionReference || undefined,
    remarks: raw.remarks || undefined,
    receivedBy: raw.collectedByUser
      ? raw.collectedByUser.employee
        ? `${raw.collectedByUser.employee.firstName} ${raw.collectedByUser.employee.lastName}`.trim()
        : raw.collectedByUser.username.charAt(0).toUpperCase() +
          raw.collectedByUser.username.slice(1)
      : "Accountant",
    paymentDate: toISODate(new Date(raw.paymentDate)),
    allocations,
  };
}

function periodLabelOf(key: string): string {
  if (key === "ANNUAL") return "Annual";
  return key;
}

function toDiscount(raw: {
  id: string;
  studentFeeAssignmentId: string;
  feeStructureItemId: string | null;
  value: number;
  reason: string;
  createdAt: string;
  studentFeeAssignment: { id: string; periodKey: string; studentEnrollmentId: string };
  approvedByEmployee: { id: string; firstName: string; lastName: string } | null;
}): DiscountEntry {
  return {
    id: raw.id,
    enrollmentId: raw.studentFeeAssignment.studentEnrollmentId,
    assignmentId: raw.studentFeeAssignmentId,
    ...(raw.feeStructureItemId && { feeStructureItemId: raw.feeStructureItemId }),
    periodLabel: periodLabelOf(raw.studentFeeAssignment.periodKey),
    amount: Number(raw.value),
    reason: raw.reason,
    scope: "STUDENT",
    approvedBy: raw.approvedByEmployee
      ? `${raw.approvedByEmployee.firstName} ${raw.approvedByEmployee.lastName}`.trim()
      : "Accountant",
    createdAt: raw.createdAt,
  };
}

function toFine(
  raw: {
    id: string;
    studentFeeAssignmentId: string;
    feeStructureItemId: string | null;
    amount: number;
    reason: string;
    createdAt: string;
    studentFeeAssignment: { id: string; periodKey: string; studentEnrollmentId: string };
  },
  rowsByAssignmentId: Map<string, InvoiceRow[]>,
): FineEntry {
  const rows = rowsByAssignmentId.get(raw.studentFeeAssignmentId) || [];
  const representative =
    rows.find((r) => r.feeStructureItemId === raw.feeStructureItemId) || rows[0];
  return {
    id: raw.id,
    enrollmentId: raw.studentFeeAssignment.studentEnrollmentId,
    assignmentId: raw.studentFeeAssignmentId,
    ...(raw.feeStructureItemId && { feeStructureItemId: raw.feeStructureItemId }),
    invoiceId: representative ? representative.id : `${raw.studentFeeAssignmentId}:`,
    periodLabel: periodLabelOf(raw.studentFeeAssignment.periodKey),
    reason: raw.reason,
    amount: Number(raw.amount),
    createdAt: raw.createdAt,
  };
}

function toExpense(raw: {
  id: string;
  category: string;
  amount: number;
  expenseDate: string;
  paidTo?: string | null;
}): ExpenseEntry {
  return {
    id: raw.id,
    category: raw.category,
    amount: Number(raw.amount),
    date: (raw.expenseDate || "").slice(0, 10),
    paidTo: raw.paidTo || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════════

interface FeeModuleContextType {
  loading: boolean;
  reloading: boolean;
  error: string | null;
  session?: AcademicSession;
  sessions: AcademicSession[];
  classes: { id: string; name: string; displayOrder: number }[];
  categories: FeeCategory[];
  paymentMethods: { id: string; name: string }[];
  students: StudentInfo[];
  structures: FeeStructure[];
  expenses: ExpenseEntry[];
  derivedInvoices: InvoiceRow[];
  studentSummaries: StudentSummaryRow[];
  // helpers
  invoicesForEnrollment: (enrollmentId: string) => InvoiceRow[];
  paymentsForEnrollment: (enrollmentId: string) => Payment[];
  discountsForEnrollment: (enrollmentId: string) => DiscountEntry[];
  finesForEnrollment: (enrollmentId: string) => FineEntry[];
  addOnsForEnrollment: (enrollmentId: string) => never[];
  discountsForInvoice: (invoiceId: string) => DiscountEntry[];
  finesForInvoice: (invoiceId: string) => FineEntry[];
  structureForEnrollment: (enrollmentId: string) => FeeStructure | undefined;
  studentsInClass: (className: string, classId?: string) => StudentInfo[];
  dashboardStats: (filters?: FeeFilters) => DashboardStats;
  defaulters: (filters?: FeeFilters) => DefaulterRow[];
  reload: () => Promise<void>;
  // mutations
  updateCategory: (cat: FeeCategory) => Promise<void>;
  addCategory: (cat: FeeCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveStructure: (structure: FeeStructure) => Promise<void>;
  deleteStructure: (id: string) => Promise<void>;
  generateForEnrollment: (enrollmentId: string) => Promise<number>;
  generateForClass: (className: string, classId?: string) => Promise<number>;
  collectPayment: (args: {
    enrollmentId: string;
    amount: number;
    paymentMode: PaymentMode | string;
    referenceNumber?: string;
    remarks?: string;
    invoiceIds?: string[];
  }) => Promise<{
    payment: Payment;
    rows: { invoiceId: string; label: string; amount: number; balanceAfter: number }[];
  } | null>;
  addDiscount: (args: {
    assignmentId: string;
    feeStructureItemId?: string;
    amount: number;
    reason: string;
  }) => Promise<DiscountEntry>;
  addFine: (args: {
    assignmentId: string;
    feeStructureItemId?: string;
    reason: string;
    amount: number;
  }) => Promise<FineEntry>;
  updateFine: (args: { id: string; amount: number; reason: string }) => Promise<FineEntry>;
  deleteFine: (id: string) => Promise<void>;
  addExpense: (exp: {
    category: string;
    amount: number;
    date: string;
    paidTo?: string;
  }) => Promise<void>;
}

const FeeModuleContext = createContext<FeeModuleContextType | undefined>(undefined);

export function FeeModuleProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; displayOrder: number }[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; name: string }[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([]);
  const [summaries, setSummaries] = useState<StudentSummaryRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [discounts, setDiscounts] = useState<DiscountEntry[]>([]);
  const [fines, setFines] = useState<FineEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);

  const session = useMemo(
    () => sessions.find((s) => s.isCurrent) || sessions[0],
    [sessions],
  );

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setReloading(true);
    setError(null);
    try {
      const [s, c, catRes, methodRes] = await Promise.all([
        getAcademicSessions(accessToken).catch(() => [] as AcademicSession[]),
        getClasses(accessToken).catch(() => [] as SchoolClass[]),
        listFeeCategories(accessToken).catch(() => [] as FeeCategory[]),
        listPaymentMethods(accessToken).catch(() => [] as { id: string; name: string }[]),
      ]);

      const sess = s.length ? s : sessions;
      const cls = c.length
        ? c
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((x) => ({ id: x.id, name: x.name, displayOrder: x.displayOrder }))
        : classes;
      const cats = catRes.length ? catRes : categories;
      const methods = methodRes.length ? methodRes : paymentMethods;

      setSessions(sess);
      setClasses(cls);
      setCategories(cats);
      setPaymentMethods(methods);

      const activeSession = sess.find((x) => x.isCurrent) || sess[0];
      if (!activeSession) return;

      const sessionId = activeSession.id;

      const [stuRes, structRes, rowRes, summaryRes, colRes, discRes, fineRes, expRes] =
        await Promise.all([
          getStudents(accessToken, { academicSessionId: sessionId }).catch(() => []),
          listFeeStructures({ academicSessionId: sessionId }, accessToken).catch(() => []),
          listInvoiceRows({ academicSessionId: sessionId }, accessToken).catch(() => []),
          listStudentSummaries({ academicSessionId: sessionId }, accessToken).catch(() => []),
          listFeeCollections({}, accessToken).catch(() => []),
          listFeeDiscounts({}, accessToken).catch(() => []),
          listFeeFines({}, accessToken).catch(() => []),
          listExpenses({}, accessToken).catch(() => []),
        ]);

      const mappedStudents: StudentInfo[] = stuRes.map((sr) => ({
        enrollmentId: sr.enrollment?.id || sr.id,
        studentId: sr.id,
        admissionNumber: sr.admissionNumber,
        firstName: sr.firstName,
        lastName: sr.lastName,
        gender: sr.gender,
        className: (sr.enrollment?.class?.name || "").trim(),
        classId: sr.enrollment?.class?.id || "",
        sectionName: sr.enrollment?.section?.name || "",
        rollNumber: sr.enrollment?.rollNumber || null,
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        enrolledOn:
          sr.enrollment?.enrollmentDate || sr.admissionDate || toISODate(isoToDate(activeSession?.startDate || "")),
        avatar: sr.photoUrl,
      }));

      setStudents(mappedStudents);
      setStructures(structRes.map(toFeeStructure));
      setInvoiceRows(rowRes.map(toInvoiceRow));
      setSummaries(summaryRes as StudentSummaryRow[]);
      setPayments(colRes.map(toPayment));
      setDiscounts(discRes.map(toDiscount));
      setFines(finesFor(fineRes, rowRes.map(toInvoiceRow)));
      setExpenses(expRes.map(toExpense));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load fee data");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && accessToken) {
      initialized.current = true;
      void reload();
    }
  }, [accessToken, reload]);

  function finesFor(
    fineRes: Awaited<ReturnType<typeof listFeeFines>>,
    rows: InvoiceRow[],
  ): FineEntry[] {
    const rowsByAssignmentId = new Map<string, InvoiceRow[]>();
    for (const r of rows) {
      const arr = rowsByAssignmentId.get(r.assignmentId) || [];
      arr.push(r);
      rowsByAssignmentId.set(r.assignmentId, arr);
    }
    return fineRes.map((f) => toFine(f, rowsByAssignmentId));
  }

  // ── derived memo ────────────────────────────────────────────────────
  const studentInfoMap = useMemo(
    () => new Map(students.map((s) => [s.enrollmentId, s])),
    [students],
  );

  const derivedInvoices = invoiceRows;

  const studentSummaries = summaries;

  // ── selectors ───────────────────────────────────────────────────────
  const invoicesForEnrollment = useCallback(
    (enrollmentId: string) =>
      derivedInvoices
        .filter((r) => r.enrollmentId === enrollmentId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [derivedInvoices],
  );
  const paymentsForEnrollment = useCallback(
    (enrollmentId: string) =>
      payments
        .filter((p) => p.enrollmentId === enrollmentId)
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [payments],
  );
  const discountsForEnrollment = useCallback(
    (enrollmentId: string) =>
      discounts
        .filter((d) => d.enrollmentId === enrollmentId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [discounts],
  );
  const finesForEnrollment = useCallback(
    (enrollmentId: string) =>
      fines
        .filter((f) => f.enrollmentId === enrollmentId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [fines],
  );
  const addOnsForEnrollment = useCallback((_enrollmentId: string) => [] as never[], []);
  const discountsForInvoice = useCallback(
    (invoiceId: string) => {
      const assignmentId = invoiceId.split(":")[0];
      return discounts.filter((d) => d.assignmentId === assignmentId);
    },
    [discounts],
  );
  const finesForInvoice = useCallback(
    (invoiceId: string) => {
      const assignmentId = invoiceId.split(":")[0];
      return fines.filter((f) => f.assignmentId === assignmentId);
    },
    [fines],
  );
  const structureForEnrollment = useCallback(
    (enrollmentId: string) => {
      const stu = studentInfoMap.get(enrollmentId);
      if (!stu?.classId || !session) return undefined;
      return structures.find(
        (s) => s.classId === stu.classId && s.academicSessionId === session.id,
      );
    },
    [studentInfoMap, structures, session],
  );
  const studentsInClass = useCallback(
    (className: string, classId?: string) =>
      students.filter(
        (s) => s.className === className || (!!classId && !!s.classId && s.classId === classId),
      ),
    [students],
  );

  // ── dashboard stats (computed from live API data) ──────────────────
  const today = useMemo(() => new Date(), []);
  const monthKeyOfDate = useCallback((d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const monthLabelOf = useCallback((key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }, []);

  const dashboardStats = useCallback(
    (filters?: FeeFilters): DashboardStats => {
      const rows = derivedInvoices.filter((r) => {
        if (filters?.className) {
          const s = studentInfoMap.get(r.enrollmentId);
          if (s?.className !== filters.className) return false;
        }
        if (filters?.feeCategoryId && r.feeCategoryId !== filters.feeCategoryId) return false;
        return true;
      });
      const classOf = (enrollmentId: string) => studentInfoMap.get(enrollmentId)?.className || "-";
      const collected = round2(rows.reduce((s, r) => s + r.paidAmount, 0));
      const totalDue = round2(rows.reduce((s, r) => s + r.payableAmount, 0));
      const pending = round2(rows.reduce((s, r) => s + r.balance, 0));
      const overdueRows = rows.filter((r) => r.status === "OVERDUE");
      const totalOverdue = round2(overdueRows.reduce((s, r) => s + r.balance, 0));
      const collectionRate = totalDue > 0 ? (collected / totalDue) * 100 : 0;

      const scopedSummaries = studentSummaries.filter((s) => {
        if (filters?.className && s.className !== filters.className) return false;
        return true;
      });
      const paidStudents = scopedSummaries.filter((s) => s.status === "PAID").length;
      const partialStudents = scopedSummaries.filter((s) => s.status === "PARTIAL").length;
      const overdueStudents = scopedSummaries.filter((s) => s.status === "OVERDUE").length;
      const pendingStudents = scopedSummaries.filter((s) => s.status === "NONE").length;

      const monthBuckets: { key: string; collected: number; pending: number }[] = [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = monthKeyOfDate(d);
        monthBuckets.push({ key, collected: 0, pending: 0 });
      }
      for (const p of payments) {
        const pdate = isoToDate(p.paymentDate);
        const key = monthKeyOfDate(pdate);
        const bucket = monthBuckets.find(
          (b) =>
            b.key === key &&
            (filters?.from ? pdate >= isoToDate(filters.from) : true) &&
            (filters?.to ? pdate <= isoToDate(filters.to) : true),
        );
        if (bucket) bucket.collected = round2(bucket.collected + p.amount);
      }
      for (const r of rows) {
        const key = r.monthKey || r.dueDate.slice(0, 7);
        const bucket = monthBuckets.find((b) => b.key === key);
        if (bucket) bucket.pending = round2(bucket.pending + r.balance);
      }

      const classMap = new Map<string, { collected: number; total: number }>();
      for (const r of rows) {
        const name = classOf(r.enrollmentId);
        const cur = classMap.get(name) || { collected: 0, total: 0 };
        cur.total = round2(cur.total + r.payableAmount);
        cur.collected = round2(cur.collected + r.paidAmount);
        classMap.set(name, cur);
      }
      const collectedByClass = Array.from(classMap.entries())
        .map(([name, v]) => ({ name, collected: v.collected, total: v.total }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const catMap = new Map<string, { name: string; code: string; collected: number; total: number }>();
      for (const r of rows) {
        const cur = catMap.get(r.feeCategoryId) || {
          name: r.categoryLabel,
          code: r.categoryCode,
          collected: 0,
          total: 0,
        };
        cur.name = r.categoryLabel;
        cur.total = round2(cur.total + r.payableAmount);
        cur.collected = round2(cur.collected + r.paidAmount);
        catMap.set(r.feeCategoryId, cur);
      }
      const collectedByCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

      const recentPayments = payments
        .filter((p) => {
          const pd = isoToDate(p.paymentDate);
          return (
            (!filters?.from || pd >= isoToDate(filters.from)) &&
            (!filters?.to || pd <= isoToDate(filters.to))
          );
        })
        .slice()
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
        .slice(0, 8)
        .map((p) => {
          const s = studentInfoMap.get(p.enrollmentId);
          return {
            ...p,
            studentName: s ? `${s.firstName} ${s.lastName}` : "Student",
            className: classOf(p.enrollmentId),
          };
        });

      return {
        totalCollected: collected,
        totalPending: pending,
        totalOverdue,
        totalDue,
        collectionRate,
        defaulterCount: overdueStudents,
        paidStudents,
        partialStudents,
        overdueStudents,
        pendingStudents,
        collectedByMonth: monthBuckets.map((b) => ({
          ...b,
          month: monthLabelOf(b.key),
          monthKey: b.key,
        })),
        collectedByClass,
        collectedByCategory,
        recentPayments,
      };
    },
    [derivedInvoices, payments, studentSummaries, studentInfoMap, today, monthKeyOfDate, monthLabelOf],
  );

  const defaulters = useCallback(
    (filters?: FeeFilters): DefaulterRow[] => {
      return studentSummaries
        .filter((s) => s.overdueAmount > 0)
        .filter((s) => {
          if (!filters?.className) return true;
          return s.className === filters.className;
        })
        .map((s) => ({
          enrollmentId: s.enrollmentId,
          studentName: s.studentName,
          admissionNumber: s.admissionNumber,
          className: s.className,
          sectionName: s.sectionName,
          totalDue: s.totalDue,
          paid: s.paid,
          balance: s.balance,
          overdueCount: s.overdueCount,
          overdueAmount: s.overdueAmount,
          lastPaymentDate: s.lastPaymentDate,
        }));
    },
    [studentSummaries],
  );

  // ── mutations ───────────────────────────────────────────────────────
  const refetchAll = useCallback(async () => {
    await reload();
  }, [reload]);

  const updateCategory = useCallback(
    async (cat: FeeCategory) => {
      const { id: _id, ...data } = cat;
      await updateFeeCategory(cat.id, data, accessToken);
      await refetchAll();
    },
    [accessToken, refetchAll],
  );

  const addCategory = useCallback(
    async (cat: FeeCategory) => {
      const { id: _id, ...data } = cat;
      await createFeeCategory(data, accessToken);
      await refetchAll();
    },
    [accessToken, refetchAll],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await deleteFeeCategory(id, accessToken);
      await refetchAll();
    },
    [accessToken, refetchAll],
  );

  const saveStructure = useCallback(
    async (structure: FeeStructure) => {
      const items = structure.items.map((i) => ({
        feeCategoryId: i.feeCategoryId,
        amount: i.amount,
        dueDay: i.dueDay,
        lateFeeAmount: i.lateFeeAmount,
        gracePeriodDays: i.gracePeriodDays,
      }));
      const isExisting = !String(structure.id).startsWith("struct_draft_");
      if (isExisting) {
        await updateFeeStructure(
          structure.id,
          { name: structure.name, isActive: structure.isActive, items },
          accessToken,
        );
      } else {
        await createFeeStructure(
          {
            name: structure.name,
            classId: structure.classId,
            academicSessionId: structure.academicSessionId,
            isActive: structure.isActive,
            items,
          },
          accessToken,
        );
      }
      await refetchAll();
    },
    [accessToken, refetchAll],
  );

  const deleteStructure = useCallback(
    async (id: string) => {
      await deleteFeeStructure(id, accessToken);
      await refetchAll();
    },
    [accessToken, refetchAll],
  );

  const generateForEnrollment = useCallback(
    async (enrollmentId: string) => {
      if (!session) return 0;
      const stu = studentInfoMap.get(enrollmentId);
      const classId = stu?.classId;
      if (!classId) return 0;
      const res = await generateFees(
        { academicSessionId: session.id, classId },
        accessToken,
      );
      await refetchAll();
      return res.generated || 0;
    },
    [session, studentInfoMap, accessToken, refetchAll],
  );

  const generateForClass = useCallback(
    async (className: string, requestedClassId?: string) => {
      if (!session) return 0;
      const classId =
        requestedClassId ||
        classes.find((c) => c.name === className)?.id ||
        students.find((s) => s.className === className)?.classId;
      if (!classId) return 0;
      const res = await generateFees(
        { academicSessionId: session.id, classId },
        accessToken,
      );
      await refetchAll();
      return res.generated || 0;
    },
    [session, classes, students, accessToken, refetchAll],
  );

  const collectPayment = useCallback(
    async (args: {
      enrollmentId: string;
      amount: number;
      paymentMode: PaymentMode | string;
      referenceNumber?: string;
      remarks?: string;
      invoiceIds?: string[];
    }) => {
      const amount = round2(args.amount);
      if (amount <= 0) return null;
      let candidates = derivedInvoices
        .filter((r) => r.enrollmentId === args.enrollmentId && r.balance > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      if (args.invoiceIds?.length) {
        candidates = candidates
          .filter((r) => args.invoiceIds!.includes(r.id))
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      }
      if (!candidates.length) return null;

      const byHead = new Map<
        string,
        { assignmentId: string; feeStructureItemId?: string; max: number; dueDate: string }
      >();
      for (const r of candidates) {
        const key = r.feeStructureItemId
          ? `${r.assignmentId}:${r.feeStructureItemId}`
          : r.assignmentId;
        const cur =
          byHead.get(key) || {
            assignmentId: r.assignmentId,
            feeStructureItemId: r.feeStructureItemId,
            max: 0,
            dueDate: r.dueDate,
          };
        cur.max = round2(cur.max + r.balance);
        if (r.dueDate < cur.dueDate) cur.dueDate = r.dueDate;
        byHead.set(key, cur);
      }
      const ordered = Array.from(byHead.values()).sort(
        (a, b) => a.dueDate.localeCompare(b.dueDate),
      );

      const items: {
        studentFeeAssignmentId: string;
        feeStructureItemId?: string;
        amount: number;
      }[] = [];
      let remaining = amount;
      for (const cfg of ordered) {
        if (remaining <= 0) break;
        const applied = round2(Math.min(remaining, cfg.max));
        if (applied > 0) {
          items.push({
            studentFeeAssignmentId: cfg.assignmentId,
            ...(cfg.feeStructureItemId
              ? { feeStructureItemId: cfg.feeStructureItemId }
              : {}),
            amount: applied,
          });
          remaining = round2(remaining - applied);
        }
      }
      if (!items.length) return null;
      if (remaining > 0) return null;

      const raw = await createFeeCollection(
        {
          studentEnrollmentId: args.enrollmentId,
          items,
          paymentMode: args.paymentMode,
          ...(args.referenceNumber && { referenceNumber: args.referenceNumber }),
          ...(args.remarks && { remarks: args.remarks }),
        },
        accessToken,
      );

      const payment = toPayment(raw);
      const rows = raw.feeCollectionItems.map((i) => {
        const invoiceId = `${i.studentFeeAssignment.id}:${i.feeStructureItem.id}`;
        const inv = derivedInvoices.find((r) => r.id === invoiceId);
        const amt = Number(i.amountPaid);
        return {
          invoiceId,
          label: inv ? invoiceLabel(inv) : invoiceId,
          amount: amt,
          balanceAfter: inv ? round2(Math.max(0, inv.balance - amt)) : 0,
        };
      });

      void refetchAll();
      return { payment, rows };
    },
    [derivedInvoices, accessToken, refetchAll],
  );

  const addDiscount = useCallback(
    async (args: { assignmentId: string; feeStructureItemId?: string; amount: number; reason: string }) => {
      const raw = await createFeeDiscount(
        {
          studentFeeAssignmentId: args.assignmentId,
          ...(args.feeStructureItemId ? { feeStructureItemId: args.feeStructureItemId } : {}),
          amount: round2(args.amount),
          reason: args.reason,
        },
        accessToken,
      );
      const row = args.feeStructureItemId
        ? derivedInvoices.find(
            (r) => r.assignmentId === args.assignmentId && r.feeStructureItemId === args.feeStructureItemId,
          )
        : derivedInvoices.find((r) => r.assignmentId === args.assignmentId);
      const entry = toDiscount({
        id: raw.id,
        studentFeeAssignmentId: raw.studentFeeAssignmentId,
        feeStructureItemId: raw.feeStructureItemId,
        value: raw.value,
        reason: raw.reason,
        createdAt: raw.createdAt,
        studentFeeAssignment: raw.studentFeeAssignment,
        approvedByEmployee: raw.approvedByEmployee,
      });
      await refetchAll();
      return { ...entry, periodLabel: row ? row.periodLabel : entry.periodLabel };
    },
    [derivedInvoices, accessToken, refetchAll],
  );

  const addFine = useCallback(
    async (args: { assignmentId: string; feeStructureItemId?: string; reason: string; amount: number }) => {
      const raw = await createFeeFine(
        {
          studentFeeAssignmentId: args.assignmentId,
          ...(args.feeStructureItemId ? { feeStructureItemId: args.feeStructureItemId } : {}),
          amount: round2(args.amount),
          reason: args.reason,
        },
        accessToken,
      );
      const row = args.feeStructureItemId
        ? derivedInvoices.find(
            (r) => r.assignmentId === args.assignmentId && r.feeStructureItemId === args.feeStructureItemId,
          )
        : derivedInvoices.find((r) => r.assignmentId === args.assignmentId);
      const entry = toFine(raw, new Map([[args.assignmentId, row ? [row] : []]]));
      await refetchAll();
      return { ...entry, periodLabel: row ? row.periodLabel : entry.periodLabel };
    },
    [derivedInvoices, accessToken, refetchAll],
  );

  const updateFine = useCallback(
    async (args: { id: string; amount: number; reason: string }) => {
      const raw = await updateFeeFine(
        args.id,
        { amount: round2(args.amount), reason: args.reason },
        accessToken,
      );
      const assignmentRows = derivedInvoices.filter(
        (r) => r.assignmentId === raw.studentFeeAssignmentId,
      );
      const rowsByAssignmentId = new Map<string, InvoiceRow[]>();
      if (assignmentRows.length) {
        rowsByAssignmentId.set(raw.studentFeeAssignmentId, assignmentRows);
      }
      const entry = toFine(raw, rowsByAssignmentId);
      await refetchAll();
      return entry;
    },
    [derivedInvoices, accessToken, refetchAll],
  );

  const deleteFine = useCallback(
    async (id: string) => {
      await deleteFeeFine(id, accessToken);
      await refetchAll();
    },
    [accessToken, refetchAll],
  );

  const addExpense = useCallback(
    async (exp: { category: string; amount: number; date: string; paidTo?: string }) => {
      await createExpense(
        {
          category: exp.category,
          amount: round2(exp.amount),
          expenseDate: exp.date,
          ...(exp.paidTo && { paidTo: exp.paidTo }),
        },
        accessToken,
      );
      await refetchAll();
    },
    [accessToken, refetchAll],
  );

  const value: FeeModuleContextType = useMemo(
    () => ({
      loading,
      reloading,
      error,
      session,
      sessions,
      classes,
      categories,
      paymentMethods,
      students,
      structures,
      expenses,
      derivedInvoices,
      studentSummaries,
      invoicesForEnrollment,
      paymentsForEnrollment,
      discountsForEnrollment,
      finesForEnrollment,
      addOnsForEnrollment,
      discountsForInvoice,
      finesForInvoice,
      structureForEnrollment,
      studentsInClass,
      dashboardStats,
      defaulters,
      reload,
      updateCategory,
      addCategory,
      deleteCategory,
      saveStructure,
      deleteStructure,
      generateForEnrollment,
      generateForClass,
      collectPayment,
      addDiscount,
      addFine,
      updateFine,
      deleteFine,
      addExpense,
    }),
    [
      loading,
      reloading,
      error,
      session,
      sessions,
      classes,
      categories,
      paymentMethods,
      students,
      structures,
      expenses,
      derivedInvoices,
      studentSummaries,
      invoicesForEnrollment,
      paymentsForEnrollment,
      discountsForEnrollment,
      finesForEnrollment,
      addOnsForEnrollment,
      discountsForInvoice,
      finesForInvoice,
      structureForEnrollment,
      studentsInClass,
      dashboardStats,
      defaulters,
      reload,
      updateCategory,
      addCategory,
      deleteCategory,
      saveStructure,
      deleteStructure,
      generateForEnrollment,
      generateForClass,
      collectPayment,
      addDiscount,
      addFine,
      updateFine,
      deleteFine,
      addExpense,
    ],
  );

  return <FeeModuleContext.Provider value={value}>{children}</FeeModuleContext.Provider>;
}

export function useFees() {
  const context = useContext(FeeModuleContext);
  if (!context) {
    throw new Error("useFees must be used within FeeModuleProvider");
  }
  return context;
}

export function useFeeFiltersState() {
  const [className, setClassName] = useState("");
  const [feeCategoryId, setFeeCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return { className, setClassName, feeCategoryId, setFeeCategoryId, from, setFrom, to, setTo };
}