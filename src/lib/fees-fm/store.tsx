import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getStudents } from "@/lib/api/students.api";
import { getFeeCategories, toFeeCategory } from "@/lib/api/fees.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";

import type {
  AddOnEntry,
  DashboardStats,
  DefaulterRow,
  DiscountEntry,
  ExpenseEntry,
  FeeCategory,
  FeeStatus,
  FeeStoreState,
  FeeStructure,
  FeeStructureItem,
  FineEntry,
  InvoiceRow,
  Payment,
  PaymentAllocation,
  PaymentMode,
  ReminderChannel,
  ReminderLog,
  StudentAssignment,
  StudentInfo,
  StudentSummaryRow,
  SummaryStatus,
} from "./types";
import { daysInMonth, isoToDate, toISODate, uid } from "./seed";

const STORE_KEY = "school-erp:fees-fm:store:v2";
const STORE_VERSION = 3;

export interface FeeFilters {
  className?: string;
  feeCategoryId?: string;
  from?: string;
  to?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Pure helpers
// ═══════════════════════════════════════════════════════════════════════

function addDays(iso: string, days: number): Date {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return d;
}

function monthKeyOfDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelOf(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function clampDay(year: number, month: number, day: number): string {
  const last = daysInMonth(year, month + 1);
  return toISODate(new Date(year, month, Math.min(day, last)));
}

function dueDateFor(year: number, monthIndex: number, dueDay: number): string {
  return clampDay(year, monthIndex, dueDay);
}

function receiptNumber(year: string, counter: number): string {
  return `RCPT-${year}-${String(counter).padStart(4, "0")}`;
}

function statusOf(balance: number, paid: number, payable: number, dueDate: string, today: Date): FeeStatus {
  if (balance <= 0) return "PAID";
  if (today.getTime() > isoToDate(dueDate).getTime()) return "OVERDUE";
  if (paid > 0) return "PARTIAL";
  return "PENDING";
}

function sumPayable(rows: InvoiceRow[]) {
  return rows.reduce((s, r) => s + r.payableAmount, 0);
}
function sumPaid(rows: InvoiceRow[]) {
  return rows.reduce((s, r) => s + r.paidAmount, 0);
}
function sumBalance(rows: InvoiceRow[]) {
  return rows.reduce((s, r) => s + r.balance, 0);
}

// ── Derive rows: discounts, fines, late fee, payments, status ─────────
function deriveInvoices(
  invoices: InvoiceRow[],
  discounts: DiscountEntry[],
  fines: FineEntry[],
  payments: Payment[],
  today: Date,
): InvoiceRow[] {
  const paidByInvoice = new Map<string, number>();
  for (const p of payments) {
    for (const a of p.allocations) {
      paidByInvoice.set(a.invoiceId, (paidByInvoice.get(a.invoiceId) || 0) + a.amount);
    }
  }
  const fineByInvoice = new Map<string, number>();
  for (const f of fines) {
    fineByInvoice.set(f.invoiceId, (fineByInvoice.get(f.invoiceId) || 0) + f.amount);
  }

  // late fee + fines
  const rows = invoices.map((r) => {
    const principalOutstanding = Math.max(0, r.baseAmount - r.discountAmount + (fineByInvoice.get(r.id) || 0));
    const beyondGrace = today.getTime() > addDays(r.dueDate, r.gracePeriodDays).getTime();
    const late =
      (beyondGrace && principalOutstanding > 0 && (paidByInvoice.get(r.id) || 0) < principalOutstanding
        ? r.lateFeeAmount
        : 0) + (fineByInvoice.get(r.id) || 0);
    return { ...r, lateFee: late };
  });

  // discounts distribution
  const discountMap = new Map<string, number>(rows.map((r) => [r.id, 0]));
  const sortedDiscounts = [...discounts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const d of sortedDiscounts) {
    const targets = rows
      .filter(
        (r) =>
          r.enrollmentId === d.enrollmentId &&
          (d.scope === "ROW"
            ? d.invoiceId
              ? r.id === d.invoiceId
              : true
            : d.scope === "HEAD"
              ? r.feeCategoryId === d.feeCategoryId
              : true),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    let remaining = d.amount;
    for (const t of targets) {
      if (remaining <= 0) break;
      const available = Math.max(0, t.baseAmount + t.lateFee - (discountMap.get(t.id) || 0));
      const applied = Math.min(remaining, available);
      if (applied > 0) {
        discountMap.set(t.id, (discountMap.get(t.id) || 0) + applied);
        remaining -= applied;
      }
    }
  }

  return rows.map((r) => {
    const discountAmount = discountMap.get(r.id) || 0;
    const payableAmount = Math.max(0, r.baseAmount + r.lateFee - discountAmount);
    const paidAmount = Math.min(paidByInvoice.get(r.id) || 0, payableAmount);
    const balance = Math.max(0, payableAmount - paidAmount);
    return {
      ...r,
      discountAmount: round2(discountAmount),
      payableAmount: round2(payableAmount),
      paidAmount: round2(paidAmount),
      balance: round2(balance),
      status: statusOf(balance, paidAmount, payableAmount, r.dueDate, today),
    };
  });
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ── Invoice generation ────────────────────────────────────────────────
function generateRowsForEnrollment(
  en: StudentInfo,
  structure: FeeStructure,
  addOns: AddOnEntry[],
  categories: FeeCategory[],
  sessionStart: Date,
  today: Date,
): InvoiceRow[] {
  const rows: InvoiceRow[] = [];
  const yearA = sessionStart.getFullYear();
  const yearB = String((yearA + 1) % 100).padStart(2, "0");
  const periodLabelAnnual = `Annual · ${yearA}-${yearB}`;
  const enrolled = isoToDate(en.enrolledOn);

  const months: { key: string; date: Date }[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(sessionStart.getFullYear(), sessionStart.getMonth() + i, 1);
    months.push({ key: monthKeyOfDate(d), date: d });
  }
  // months from enrollment onward (pro-rated mid-year support)
  const enrolledMonthIndex = Math.max(
    0,
    (enrolled.getFullYear() - sessionStart.getFullYear()) * 12 +
      (enrolled.getMonth() - sessionStart.getMonth()),
  );
  const applicableMonths = months.slice(Math.min(enrolledMonthIndex, months.length - 1));

  const catById = new Map(categories.map((c) => [c.id, c]));
  const catOf = (id: string) => catById.get(id);

  const push = (
    categoryId: string,
    categoryLabel: string,
    periodLabel: string,
    monthKey: string | undefined,
    baseAmount: number,
    dueDate: string,
    gracePeriodDays: number,
    lateFeeAmount: number,
    source: "STRUCTURE" | "ADDON",
    proratable: boolean,
  ) => {
    rows.push({
      id: uid("inv"),
      enrollmentId: en.enrollmentId,
      feeStructureId: structure.id,
      feeCategoryId: categoryId,
      categoryLabel,
      periodLabel,
      monthKey,
      baseAmount: round2(baseAmount),
      gracePeriodDays,
      lateFeeAmount,
      discountAmount: 0,
      lateFee: 0,
      payableAmount: round2(baseAmount),
      paidAmount: 0,
      balance: round2(baseAmount),
      dueDate,
      status: dueDate <= toISODate(today) ? "PENDING" : "PENDING",
      source,
    });
  };

  for (const item of structure.items) {
    const cat = catOf(item.feeCategoryId);
    if (!cat) continue;
    const base = cat.isRecurring && cat.recurringInterval === "MONTHLY";
    const yearly = cat.recurringInterval === "YEARLY";
    const once = cat.recurringInterval === "ONCE";
    const quarterly = cat.recurringInterval === "QUARTERLY";

    if (base) {
      applicableMonths.forEach((m, idx) => {
        let amount = item.amount;
        if (idx === 0 && item.proratable && item.isAddOn === false) {
          const lastDay = daysInMonth(m.date.getFullYear(), m.date.getMonth() + 1);
          const monthEnd = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0).getTime();
          const start = Math.max(enrolled.getTime(), m.date.getTime());
          const remainingDays = Math.max(1, Math.round((monthEnd - start) / 86400000) + 1);
          amount = round2(item.amount * (remainingDays / lastDay));
        }
        push(
          cat.id,
          cat.name,
          `Monthly · ${monthLabelOf(m.key)}`,
          m.key,
          amount,
          dueDateFor(m.date.getFullYear(), m.date.getMonth(), item.dueDay),
          item.gracePeriodDays,
          item.lateFeeAmount,
          "STRUCTURE",
          item.proratable,
        );
      });
    } else if (yearly) {
      push(cat.id, cat.name, periodLabelAnnual, undefined, item.amount, toISODate(addDays(toISODate(sessionStart), 10)), item.gracePeriodDays, item.lateFeeAmount, "STRUCTURE", item.proratable);
    } else if (once) {
      push(cat.id, cat.name, "One-time", undefined, item.amount, toISODate(new Date(enrolled.getTime() + 7 * 86400000)), item.gracePeriodDays, item.lateFeeAmount, "STRUCTURE", item.proratable);
    } else if (quarterly) {
      for (let t = 1; t <= 2; t += 1) {
        const termDate = new Date(sessionStart.getFullYear(), sessionStart.getMonth() + (t - 1) * 3, item.dueDay);
        push(cat.id, cat.name, `Term ${t} · ${yearA}-${yearB}`, undefined, item.amount, toISODate(termDate), item.gracePeriodDays, item.lateFeeAmount, "STRUCTURE", item.proratable);
      }
    }
  }

  // per-student add-ons
  for (const ao of addOns) {
    if (!ao.active) continue;
    const cat = catOf(ao.feeCategoryId);
    if (!cat) continue;
    if (cat.recurringInterval === "MONTHLY") {
      applicableMonths.forEach((m, idx) => {
        let amount = ao.amount;
        if (idx === 0 && ao.proratable) {
          const lastDay = daysInMonth(m.date.getFullYear(), m.date.getMonth() + 1);
          const monthEnd = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0).getTime();
          const start = Math.max(enrolled.getTime(), m.date.getTime());
          const remainingDays = Math.max(1, Math.round((monthEnd - start) / 86400000) + 1);
          amount = round2(ao.amount * (remainingDays / lastDay));
        }
        push(ao.feeCategoryId, cat.name, `Monthly · ${monthLabelOf(m.key)}`, m.key, amount, dueDateFor(m.date.getFullYear(), m.date.getMonth(), ao.dueDay), ao.gracePeriodDays, ao.lateFeeAmount, "ADDON", ao.proratable);
      });
    } else if (cat.recurringInterval === "YEARLY") {
      push(ao.feeCategoryId, cat.name, periodLabelAnnual, undefined, ao.amount, toISODate(addDays(toISODate(sessionStart), 10)), ao.gracePeriodDays, ao.lateFeeAmount, "ADDON", ao.proratable);
    } else {
      push(ao.feeCategoryId, cat.name, "One-time", undefined, ao.amount, toISODate(new Date(enrolled.getTime() + 7 * 86400000)), ao.gracePeriodDays, ao.lateFeeAmount, "ADDON", ao.proratable);
    }
  }

  return rows;
}

function mergeRows(rows: InvoiceRow[], existing: InvoiceRow[]): InvoiceRow[] {
  const key = (r: InvoiceRow) =>
    `${r.enrollmentId}|${r.feeCategoryId}|${r.periodLabel}|${r.monthKey || ""}`;
  const seen = new Set(existing.map(key));
  const merged = [...existing];
  for (const r of rows) {
    if (!seen.has(key(r))) {
      merged.push(r);
      seen.add(key(r));
    }
  }
  return merged;
}

function emptyUniverseStore(sessionId: string): FeeStoreState {
  return {
    sessionId,
    structures: [],
    assignments: [],
    addOns: [],
    invoices: [],
    discounts: [],
    fines: [],
    payments: [],
    reminders: [],
    receiptCounter: 1,
    expenses: [],
    version: STORE_VERSION,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════════

interface FeeModuleContextType {
  loading: boolean;
  reloading: boolean;
  session?: AcademicSession;
  sessions: AcademicSession[];
  classes: { id: string; name: string; displayOrder: number }[];
  categories: FeeCategory[];
  students: StudentInfo[];
  state: FeeStoreState;
  derivedInvoices: InvoiceRow[];
  studentSummaries: StudentSummaryRow[];
  // helpers
  invoicesForEnrollment: (enrollmentId: string) => InvoiceRow[];
  paymentsForEnrollment: (enrollmentId: string) => Payment[];
  discountsForEnrollment: (enrollmentId: string) => DiscountEntry[];
  finesForEnrollment: (enrollmentId: string) => FineEntry[];
  addOnsForEnrollment: (enrollmentId: string) => AddOnEntry[];
  discountsForInvoice: (invoiceId: string) => DiscountEntry[];
  finesForInvoice: (invoiceId: string) => FineEntry[];
  structureForEnrollment: (enrollmentId: string) => FeeStructure | undefined;
  studentsInClass: (className: string, classId?: string) => StudentInfo[];
  dashboardStats: (filters?: FeeFilters) => DashboardStats;
  defaulters: (filters?: FeeFilters) => DefaulterRow[];
  // mutations
  updateCategory: (cat: FeeCategory) => void;
  addCategory: (cat: FeeCategory) => void;
  saveStructure: (structure: FeeStructure) => void;
  assignStructureToClass: (className: string, structureId: string) => void;
  generateForEnrollment: (enrollmentId: string) => void;
  generateForClass: (className: string, classId?: string) => void;
  attachAddOn: (enrollmentId: string, categoryId: string, amount: number) => void;
  toggleAddOn: (addOnId: string, active: boolean) => void;
  collectPayment: (args: {
    enrollmentId: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string;
    remarks?: string;
    receivedBy?: string;
    invoiceIds?: string[];
  }) => { payment: Payment; rows: { invoiceId: string; label: string; amount: number; balanceAfter: number }[] } | null;
  addDiscount: (args: {
    enrollmentId: string;
    amount: number;
    reason: string;
    scope: "ROW" | "HEAD" | "STUDENT";
    invoiceId?: string;
    feeCategoryId?: string;
    approvedBy?: string;
  }) => DiscountEntry;
  addFine: (args: { enrollmentId: string; invoiceId: string; reason: string; amount: number }) => FineEntry;
  sendReminders: (enrollmentIds: string[], channel: ReminderChannel) => number;
  addExpense: (exp: ExpenseEntry) => void;
}

const FeeModuleContext = createContext<FeeModuleContextType | undefined>(undefined);

export function FeeModuleProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; displayOrder: number }[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [state, setState] = useState<FeeStoreState | null>(null);
  const stateRef = useRef<FeeStoreState | null>(null);
  const stateReady = useRef(false);

  const session = useMemo(
    () => sessions.find((s) => s.isCurrent) || sessions[0],
    [sessions],
  );

  const persist = useCallback((next: FeeStoreState) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
    stateRef.current = next;
  }, []);

  const loadReferences = useCallback(
    async (withRefresh: boolean) => {
      if (withRefresh) setReloading(true);
      let sess = sessions;
      let cls = classes;
      let cats = categories;
      try {
        const [s, c, catRes] = await Promise.all([
          getAcademicSessions(accessToken).catch(() => [] as AcademicSession[]),
          getClasses(accessToken).catch(() => [] as SchoolClass[]),
          getFeeCategories(accessToken).catch(() => []),
        ]);
        if (s.length) sess = s;
        if (c.length) {
          cls = c
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((x) => ({ id: x.id, name: x.name, displayOrder: x.displayOrder }));
        }
        if (catRes.length) {
          cats = catRes.map((x) => toFeeCategory(x) as FeeCategory);
        }
        setSessions(sess);
        setClasses(cls);
        setCategories(cats);

        // Fetch students only after the session is resolved so the backend
        // returns enrollment (class/section) data for that session.
        const activeSession = sess.find((x) => x.isCurrent) || sess[0];
        const stuRes = await getStudents(accessToken, {
          academicSessionId: activeSession?.id,
        }).catch(() => [] as Awaited<ReturnType<typeof getStudents>>);

        const mapped: StudentInfo[] = stuRes.map((s) => ({
          enrollmentId: s.enrollment?.id || s.id,
          studentId: s.id,
          admissionNumber: s.admissionNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender,
          className: (s.enrollment?.class?.name || "").trim(),
          classId: s.enrollment?.class?.id || "",
          sectionName: s.enrollment?.section?.name || "",
          rollNumber: s.enrollment?.rollNumber || null,
          parentName: "",
          parentPhone: "",
          parentEmail: "",
          enrolledOn: s.enrollment?.enrollmentDate || s.admissionDate || toISODate(isoToDate(activeSession?.startDate || "")),
          avatar: s.photoUrl,
        }));
        setStudents(mapped);
      } catch {
        setClasses(cls.length ? cls : []);
      } finally {
        setLoading(false);
        setReloading(false);
      }
    },
    [accessToken],
  );

  // Initial load
  const initialized = useRef(false);
  if (!initialized.current) {
    initialized.current = true;
    void loadReferences(false);
  }

  // Bootstrap store once the active session is known
  if (!state && !loading && session) {
    let storedRaw: string | null = null;
    try {
      storedRaw = localStorage.getItem(STORE_KEY);
    } catch {
      storedRaw = null;
    }
    let next: FeeStoreState | null = null;
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as FeeStoreState;
        if (parsed.version === STORE_VERSION && parsed.sessionId === session.id) next = parsed;
      } catch {
        next = null;
      }
    }
    if (!next) {
      next = emptyUniverseStore(session.id);
    }
    stateRef.current = next;
    stateReady.current = true;
    persist(next);
    setState(next);
  }

  // Derived
  const today = useMemo(() => new Date(), []);
  const derivedInvoices = useMemo(() => {
    if (!state) return [];
    return deriveInvoices(state.invoices, state.discounts, state.fines, state.payments, today);
  }, [state, today]);

  const studentSummaries = useMemo<StudentSummaryRow[]>(() => {
    const map = new Map<string, InvoiceRow[]>();
    for (const r of derivedInvoices) {
      const arr = map.get(r.enrollmentId) || [];
      arr.push(r);
      map.set(r.enrollmentId, arr);
    }
    const byStudent = new Map<string, StudentInfo>(students.map((s) => [s.enrollmentId, s]));
    const byEnrollmentPayments = new Map<string, string>();
    for (const p of state?.payments || []) {
      const prev = byEnrollmentPayments.get(p.enrollmentId);
      if (!prev || p.paymentDate > prev) byEnrollmentPayments.set(p.enrollmentId, p.paymentDate);
    }
    const out: StudentSummaryRow[] = [];
    for (const [enrollmentId, rows] of map) {
      const stu = byStudent.get(enrollmentId);
      const overdue = rows.filter((r) => r.status === "OVERDUE");
      const hasOverdue = overdue.length > 0;
      const balance = sumBalance(rows);
      const paid = sumPaid(rows);
      let status: SummaryStatus;
      if (balance <= 0) status = "PAID";
      else if (hasOverdue) status = "OVERDUE";
      else if (paid > 0) status = "PARTIAL";
      else status = "NONE";
      out.push({
        enrollmentId,
        studentName: stu ? `${stu.firstName} ${stu.lastName}` : "Unknown Student",
        admissionNumber: stu?.admissionNumber || "-",
        className: stu?.className || "-",
        sectionName: stu?.sectionName || "-",
        rollNumber: stu?.rollNumber || null,
        parentName: stu?.parentName || "",
        parentPhone: stu?.parentPhone || "",
        parentEmail: stu?.parentEmail || "",
        totalDue: round2(sumPayable(rows)),
        paid: round2(paid),
        balance: round2(balance),
        discountTotal: round2(rows.reduce((s, r) => s + r.discountAmount, 0)),
        fineTotal: round2(rows.reduce((s, r) => s + (state?.fines || []).filter((f) => f.invoiceId === r.id).reduce((x, f) => x + f.amount, 0), 0)),
        status,
        overdueCount: overdue.length,
        overdueAmount: round2(overdue.reduce((s, r) => s + r.balance, 0)),
        lastPaymentDate: byEnrollmentPayments.get(enrollmentId),
      });
    }
    return out.sort((a, b) => a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName));
  }, [derivedInvoices, students, state]);

  const studentInfoMap = useMemo(
    () => new Map(students.map((s) => [s.enrollmentId, s])),
    [students],
  );

  // ── selectors ───────────────────────────────────────────────────────
  const invoicesForEnrollment = useCallback(
    (enrollmentId: string) =>
      derivedInvoices.filter((r) => r.enrollmentId === enrollmentId).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [derivedInvoices],
  );
  const paymentsForEnrollment = useCallback(
    (enrollmentId: string) =>
      (state?.payments || [])
        .filter((p) => p.enrollmentId === enrollmentId)
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [state],
  );
  const discountsForEnrollment = useCallback(
    (enrollmentId: string) =>
      (state?.discounts || []).filter((d) => d.enrollmentId === enrollmentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state],
  );
  const finesForEnrollment = useCallback(
    (enrollmentId: string) =>
      (state?.fines || []).filter((f) => f.enrollmentId === enrollmentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state],
  );
  const discountsForInvoice = useCallback(
    (invoiceId: string) => (state?.discounts || []).filter((d) => d.invoiceId === invoiceId),
    [state],
  );
  const finesForInvoice = useCallback(
    (invoiceId: string) => (state?.fines || []).filter((f) => f.invoiceId === invoiceId),
    [state],
  );
  const addOnsForEnrollment = useCallback(
    (enrollmentId: string) => (state?.addOns || []).filter((a) => a.enrollmentId === enrollmentId),
    [state],
  );
  const structureForEnrollment = useCallback(
    (enrollmentId: string) => {
      const asg = state?.assignments.find((a) => a.enrollmentId === enrollmentId);
      return state?.structures.find((s) => s.id === asg?.structureId);
    },
    [state],
  );
  const studentsInClass = useCallback(
    (className: string, classId?: string) =>
      students.filter(
        (s) => s.className === className || (!!classId && !!s.classId && s.classId === classId),
      ),
    [students],
  );

  // ── dashboard stats ─────────────────────────────────────────────────
  const dashboardStats = useCallback(
    (filters?: FeeFilters): DashboardStats => {
      const rows = derivedInvoices.filter((r) => {
        if (filters?.className && r.enrollmentId && !studentInfoMap.get(r.enrollmentId)?.className.includes(filters.className) && studentInfoMap.get(r.enrollmentId)?.className !== filters.className) {
          const s = studentInfoMap.get(r.enrollmentId);
          if (s?.className !== filters.className) return false;
        }
        if (filters?.feeCategoryId && r.feeCategoryId !== filters.feeCategoryId) return false;
        return true;
      });
      const classOf = (enrollmentId: string) => studentInfoMap.get(enrollmentId)?.className || "-";
      const collected = round2(sumPaid(rows));
      const totalDue = round2(sumPayable(rows));
      const pending = round2(sumBalance(rows));
      const overdueRows = rows.filter((r) => r.status === "OVERDUE");
      const totalOverdue = round2(overdueRows.reduce((s, r) => s + r.balance, 0));
      const collectionRate = totalDue > 0 ? (collected / totalDue) * 100 : 0;

      const summaries = studentSummaries.filter((s) => {
        if (filters?.className && s.className !== filters.className) return false;
        return true;
      });
      const paidStudents = summaries.filter((s) => s.status === "PAID").length;
      const partialStudents = summaries.filter((s) => s.status === "PARTIAL").length;
      const overdueStudents = summaries.filter((s) => s.status === "OVERDUE").length;
      const pendingStudents = summaries.filter((s) => s.status === "NONE").length;

      // monthly collected over last 6 months
      const monthBuckets: { key: string; collected: number; pending: number }[] = [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = monthKeyOfDate(d);
        monthBuckets.push({ key, collected: 0, pending: 0 });
      }
      for (const p of state?.payments || []) {
        const pdate = isoToDate(p.paymentDate);
        const key = monthKeyOfDate(pdate);
        const bucket = monthBuckets.find((b) => b.key === key && (filters?.from ? pdate >= isoToDate(filters.from) : true) && (filters?.to ? pdate <= isoToDate(filters.to) : true));
        if (bucket) bucket.collected = round2(bucket.collected + p.amount);
      }
      for (const r of rows) {
        const key = r.monthKey || r.dueDate.slice(0, 7);
        const bucket = monthBuckets.find((b) => b.key === key);
        if (bucket) bucket.pending = round2(bucket.pending + r.balance);
      }

      // class-wise
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

      // category-wise
      const catMap = new Map<string, { name: string; code: string; collected: number; total: number }>();
      for (const r of rows) {
        const cur = catMap.get(r.feeCategoryId) || { name: r.categoryLabel, code: r.feeCategoryId, collected: 0, total: 0 };
        cur.name = r.categoryLabel;
        cur.total = round2(cur.total + r.payableAmount);
        cur.collected = round2(cur.collected + r.paidAmount);
        catMap.set(r.feeCategoryId, cur);
      }
      const collectedByCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

      const recentPayments = (state?.payments || [])
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
          return { ...p, studentName: s ? `${s.firstName} ${s.lastName}` : "Student", className: classOf(p.enrollmentId) };
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
        collectedByMonth: monthBuckets.map((b) => ({ ...b, month: monthLabelOf(b.key), monthKey: b.key })),
        collectedByClass,
        collectedByCategory,
        recentPayments,
      };
    },
    [derivedInvoices, state, today, studentInfoMap, studentSummaries],
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
  const updateState = useCallback(
    (updater: (prev: FeeStoreState) => FeeStoreState) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateCategory = useCallback((cat: FeeCategory) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
  }, []);

  const addCategory = useCallback((cat: FeeCategory) => {
    setCategories((prev) => [...prev, cat]);
  }, []);

  const regenerateFor =
    (enrollmentId: string) =>
    (prev: FeeStoreState): FeeStoreState => {
      const en = studentInfoMap.get(enrollmentId);
      if (!en || !session) return prev;
      const asg = prev.assignments.find((a) => a.enrollmentId === enrollmentId);
      const st = prev.structures.find((s) => s.id === asg?.structureId);
      if (!st) return prev;
      const addOns = prev.addOns.filter((a) => a.enrollmentId === enrollmentId);
      const newRows = generateRowsForEnrollment(en, st, addOns, categories, isoToDate(session.startDate), today);
      return { ...prev, invoices: mergeRows(newRows, prev.invoices) };
    };

  const saveStructure = useCallback(
    (structure: FeeStructure) => {
      updateState((prev) => {
        const exists = prev.structures.some((s) => s.id === structure.id);
        const structures = exists
          ? prev.structures.map((s) => (s.id === structure.id ? structure : s))
          : [...prev.structures, structure];
        let next: FeeStoreState = { ...prev, structures };
        // regenerate every enrollment that uses this structure
        for (const asg of prev.assignments) {
          if (asg.structureId === structure.id) next = regenerateFor(asg.enrollmentId)(next);
        }
        return next;
      });
    },
    [updateState, regenerateFor],
  );

  const assignStructureToClass = useCallback(
    (className: string, structureId: string) => {
      updateState((prev) => {
        const structure = prev.structures.find((s) => s.id === structureId);
        if (!structure) return prev;
        const targetStudents = students.filter(
          (s) =>
            s.className === className ||
            (structure.classId && s.classId && s.classId === structure.classId),
        );
        if (!targetStudents.length) return prev;
        const assignments = [...prev.assignments];
        let invoices = [...prev.invoices];
        for (const s of targetStudents) {
          const existing = assignments.find((a) => a.enrollmentId === s.enrollmentId);
          if (existing && existing.structureId === structureId) continue;
          if (existing) {
            assignments[assignments.indexOf(existing)] = {
              ...existing,
              structureId,
              assignedAt: toISODate(today),
            };
          } else {
            assignments.push({
              id: `assign_${s.enrollmentId}_${structureId}`,
              enrollmentId: s.enrollmentId,
              structureId,
              assignedAt: toISODate(today),
            });
          }
          const addOns = prev.addOns.filter((a) => a.enrollmentId === s.enrollmentId);
          const newRows = generateRowsForEnrollment(s, structure, addOns, categories, isoToDate(session!.startDate), today);
          invoices = mergeRows(newRows, invoices);
        }
        return { ...prev, assignments, invoices };
      });
    },
    [updateState, students, categories, session],
  );

  const generateForEnrollment = useCallback(
    (enrollmentId: string) => updateState(regenerateFor(enrollmentId)),
    [updateState, regenerateFor],
  );

  const generateForClass = useCallback(
    (className: string, classId?: string) => {
      updateState((prev) => {
        let next: FeeStoreState = prev;
        for (const s of students.filter(
          (x) => x.className === className || (classId && x.classId === classId),
        )) {
          next = regenerateFor(s.enrollmentId)(next);
        }
        return next;
      });
    },
    [updateState, students, regenerateFor],
  );

  const attachAddOn = useCallback(
    (enrollmentId: string, categoryId: string, amount: number) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return;
      updateState((prev) => {
        const existing = prev.addOns.find(
          (a) => a.enrollmentId === enrollmentId && a.feeCategoryId === categoryId && a.active,
        );
        let addOns = prev.addOns;
        if (existing) return prev;
        const entry: AddOnEntry = {
          id: uid("addon"),
          enrollmentId,
          feeCategoryId: categoryId,
          amount,
          dueDay: 10,
          gracePeriodDays: 5,
          lateFeeAmount: cat.recurringInterval === "ONCE" ? 0 : 100,
          proratable: cat.recurringInterval === "MONTHLY",
          active: true,
          attachedAt: toISODate(today),
        };
        addOns = [...prev.addOns, entry];
        let next: FeeStoreState = { ...prev, addOns };
        next = regenerateFor(enrollmentId)(next);
        return next;
      });
    },
    [updateState, categories, today, regenerateFor],
  );

  const toggleAddOn = useCallback(
    (addOnId: string, active: boolean) => {
      updateState((prev) => {
        const addOns = prev.addOns.map((a) => (a.id === addOnId ? { ...a, active } : a));
        let next: FeeStoreState = { ...prev, addOns };
        const entry = prev.addOns.find((a) => a.id === addOnId);
        if (entry) next = regenerateFor(entry.enrollmentId)(next);
        return next;
      });
    },
    [updateState, regenerateFor],
  );

  const collectPayment = useCallback(
    (args: {
      enrollmentId: string;
      amount: number;
      paymentMode: PaymentMode;
      referenceNumber?: string;
      remarks?: string;
      receivedBy?: string;
      invoiceIds?: string[];
    }) => {
      const amount = round2(Math.min(args.amount, 0) ? 0 : args.amount);
      if (amount <= 0) return null;
      let candidates = derivedInvoices
        .filter((r) => r.enrollmentId === args.enrollmentId && r.balance > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      if (args.invoiceIds?.length) {
        candidates = candidates.filter((r) => args.invoiceIds!.includes(r.id)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      }
      const allocations: PaymentAllocation[] = [];
      let remaining = amount;
      for (const r of candidates) {
        if (remaining <= 0) break;
        const applied = Math.min(remaining, r.balance);
        if (applied > 0) allocations.push({ invoiceId: r.id, amount: round2(applied) });
        remaining = round2(remaining - applied);
      }
      if (!allocations.length) return null;

      const totalAllocated = round2(allocations.reduce((s2, a) => s2 + a.amount, 0));
      const counter = (stateRef.current?.receiptCounter || 0) + 1;
      const yearStart = isoToDate(session!.startDate).getFullYear();
      const payment: Payment = {
        id: uid("pay"),
        receiptNumber: receiptNumber(String(yearStart), counter),
        enrollmentId: args.enrollmentId,
        amount: totalAllocated,
        paymentMode: args.paymentMode,
        referenceNumber: args.referenceNumber,
        remarks: args.remarks,
        receivedBy: args.receivedBy || "Accountant",
        paymentDate: toISODate(today),
        allocations,
      };
      updateState((prev) => ({
        ...prev,
        payments: [...prev.payments, payment],
        receiptCounter: counter,
      }));
      const rows = allocations.map((a) => {
        const inv = derivedInvoices.find((r) => r.id === a.invoiceId);
        return {
          invoiceId: a.invoiceId,
          label: inv ? `${inv.categoryLabel} · ${inv.periodLabel}` : a.invoiceId,
          amount: a.amount,
          balanceAfter: round2(Math.max(0, (inv?.balance || 0) - a.amount)),
        };
      });
      return { payment, rows };
    },
    [derivedInvoices, updateState, session, today],
  );

  const addDiscount = useCallback(
    (args: {
      enrollmentId: string;
      amount: number;
      reason: string;
      scope: "ROW" | "HEAD" | "STUDENT";
      invoiceId?: string;
      feeCategoryId?: string;
      approvedBy?: string;
    }) => {
      const entry: DiscountEntry = {
        id: uid("disc"),
        enrollmentId: args.enrollmentId,
        invoiceId: args.invoiceId,
        feeCategoryId: args.feeCategoryId,
        amount: round2(args.amount),
        reason: args.reason,
        scope: args.scope,
        approvedBy: args.approvedBy || "Accountant",
        createdAt: new Date().toISOString(),
      };
      updateState((prev) => ({ ...prev, discounts: [...prev.discounts, entry] }));
      return entry;
    },
    [updateState],
  );

  const addFine = useCallback(
    (args: { enrollmentId: string; invoiceId: string; reason: string; amount: number }) => {
      const entry: FineEntry = {
        id: uid("fine"),
        enrollmentId: args.enrollmentId,
        invoiceId: args.invoiceId,
        reason: args.reason,
        amount: round2(args.amount),
        createdAt: new Date().toISOString(),
      };
      updateState((prev) => ({ ...prev, fines: [...prev.fines, entry] }));
      return entry;
    },
    [updateState],
  );

  const sendReminders = useCallback(
    (enrollmentIds: string[], channel: ReminderChannel): number => {
      let count = 0;
      updateState((prev) => {
        const logs: ReminderLog[] = [];
        for (const id of enrollmentIds) {
          const s = studentInfoMap.get(id);
          if (!s) continue;
          const rows = derivedInvoices.filter((r) => r.enrollmentId === id && r.balance > 0);
          if (!rows.length) continue;
          const hasOverdue = rows.some((r) => r.status === "OVERDUE");
          const hasPreDue = rows.some((r) => r.status === "PENDING" && isoToDate(r.dueDate).getTime() - today.getTime() <= 7 * 86400000);
          const type = hasOverdue ? "DEFAULTER" : hasPreDue ? "PRE_DUE" : "POST_DUE";
          logs.push({
            id: uid("rem"),
            enrollmentId: id,
            channel,
            type,
            sentAt: today.toISOString(),
            to: s.parentPhone || s.parentEmail,
          });
        }
        count = logs.length;
        return { ...prev, reminders: [...prev.reminders, ...logs] };
      });
      return count;
    },
    [updateState, derivedInvoices, studentInfoMap, today],
  );

  const addExpense = useCallback(
    (exp: ExpenseEntry) => {
      updateState((prev) => ({ ...prev, expenses: [exp, ...prev.expenses] }));
    },
    [updateState],
  );


  const value: FeeModuleContextType = useMemo(() => {
    return {
      loading,
      reloading,
      session,
      sessions,
      classes,
      categories,
      students,
      state: state || emptyUniverseStore(session?.id || "none"),
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
      updateCategory,
      addCategory,
      saveStructure,
      assignStructureToClass,
      generateForEnrollment,
      generateForClass,
      attachAddOn,
      toggleAddOn,
      collectPayment,
      addDiscount,
      addFine,
      sendReminders,
      addExpense,
    };
  }, [
    loading,
    reloading,
    session,
    sessions,
    classes,
    categories,
    students,
    state,
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
    updateCategory,
    addCategory,
    saveStructure,
    assignStructureToClass,
    generateForEnrollment,
    generateForClass,
    attachAddOn,
    toggleAddOn,
    collectPayment,
    addDiscount,
    addFine,
    sendReminders,
    addExpense,
  ]);

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
