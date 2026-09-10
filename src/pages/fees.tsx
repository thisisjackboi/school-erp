"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  LayoutDashboard,
  Users,
  FileBarChart,
  CreditCard,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  Wallet,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  Printer,
  BadgeIndianRupee,
  CalendarDays,
  Percent,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, exportToCSV } from "@/lib/utils";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Bar, BarChart, Legend,
} from "recharts";

import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import { getStudents } from "@/lib/api/students.api";
import {
  getFeeHeads,
  getFeeStructures,
  getStudentFees,
  createPayment,
  generateInvoicesForClass,
  generateMonthlyInvoices,
  getFeeDashboard,
  getDefaulters,
  createDiscount,
} from "@/lib/api/fees.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { FeeHead, FeeStructure, StudentFee, FeePayment, DefaulterRow } from "@/lib/types/fee";

type TabKey = "dashboard" | "students" | "reports";

interface StudentSummary {
  studentEnrollmentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  totalDue: number;
  paid: number;
  balance: number;
  status: "PAID" | "PARTIAL" | "OVERDUE" | "NONE";
  fees: StudentFee[];
}

const PAYMENT_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE"] as const;

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "paid":
    case "PAID":
      return "success";
    case "partial":
    case "PARTIAL":
    case "pending":
    case "PENDING":
      return "warning";
    case "overdue":
    case "OVERDUE":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FeesPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>("dashboard");

  // ── Reference Data ────────────────────────────────────
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  // ── Filters ───────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // ── Data ──────────────────────────────────────────────
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [defaulters, setDefaulters] = useState<DefaulterRow[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // ── Views ─────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [collectStudent, setCollectStudent] = useState<StudentSummary | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMode, setCollectMode] = useState<string>("CASH");
  const [collectRef, setCollectRef] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [feeFilter, setFeeFilter] = useState<string>("all");

  // ── Discount Dialog ─────────────────────────────────────
  const [discountFee, setDiscountFee] = useState<{ feeId: string; student: StudentSummary } | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  // ── Load Reference Data ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingRef(true);
      try {
        const [sessList, clsList, secList, heads] = await Promise.all([
          getAcademicSessions(accessToken).catch(() => []),
          getClasses(accessToken).catch(() => []),
          getSections(accessToken).catch(() => []),
          getFeeHeads(accessToken).catch(() => []),
        ]);
        setSessions(sessList || []);
        setClasses(clsList || []);
        setSections(secList || []);
        setFeeHeads(heads || []);
        const current = (sessList || []).find((s: AcademicSession) => s.isCurrent);
        if (current) setSelectedSession(current.id);
      } catch {
        toast("Error", "Failed to load reference data", "error");
      } finally {
        setLoadingRef(false);
      }
    };
    load();
  }, [accessToken]);

  useEffect(() => {
    if (!selectedSession) return;
    getFeeStructures({ academicSessionId: selectedSession }, accessToken)
      .then((list) => setFeeStructures(list || []))
      .catch(() => setFeeStructures([]));
  }, [selectedSession, accessToken]);

  // ── Load Data on filter change ───────────────────────
  const loadData = async () => {
    if (!selectedSession) return;
    setLoadingData(true);
    const sessionId = selectedSession;
    const feesPromise = getStudentFees(
      { academicSessionId: sessionId, classId: selectedClass || undefined, sectionId: selectedSection || undefined },
      accessToken,
    ).catch(() => []);
    const dashPromise = getFeeDashboard({ academicSessionId: sessionId, classId: selectedClass || undefined }, accessToken).catch(() => null);
    const defPromise = getDefaulters({ academicSessionId: sessionId, classId: selectedClass || undefined }, accessToken).catch(() => []);
    const [fees, dash, defs] = await Promise.all([feesPromise, dashPromise, defPromise]);
    setStudentFees(fees || []);
    setDashboard(dash);
    setDefaulters(defs || []);
    setLoadingData(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedSession, selectedClass, selectedSection]);

  // ── Derived: student summaries ───────────────────────
  const studentSummaries = useMemo<StudentSummary[]>(() => {
    const map = new Map<string, StudentSummary>();
    for (const fee of studentFees) {
      const enrId = fee.studentEnrollmentId;
      const stu = fee.studentEnrollment?.student;
      const cls = fee.studentEnrollment?.class;
      const sec = fee.studentEnrollment?.section;
      if (!map.has(enrId)) {
        map.set(enrId, {
          studentEnrollmentId: enrId,
          studentName: stu ? `${stu.firstName} ${stu.lastName}` : "Unknown",
          admissionNumber: stu?.admissionNumber || "-",
          className: cls?.name || "-",
          sectionName: sec?.name || "-",
          rollNumber: fee.studentEnrollment?.rollNumber || null,
          totalDue: 0,
          paid: 0,
          balance: 0,
          status: "NONE",
          fees: [],
        });
      }
      const rec = map.get(enrId)!;
      rec.fees.push(fee);
      rec.totalDue += fee.payableAmount;
      rec.paid += fee.paidAmount;
      rec.balance += fee.balance;
    }
    const now = Date.now();
    for (const rec of map.values()) {
      const hasOverdue = rec.fees.some((f) => f.balance > 0 && new Date(f.dueDate).getTime() < now);
      if (rec.balance <= 0) rec.status = "PAID";
      else if (hasOverdue) rec.status = "OVERDUE";
      else if (rec.paid > 0) rec.status = "PARTIAL";
      else rec.status = "PARTIAL";
    }
    return Array.from(map.values());
  }, [studentFees]);

  // ── Filtered students (search + status filter) ───────
  const filteredStudents = useMemo(() => {
    let list = studentSummaries;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          (s.rollNumber || "").toLowerCase().includes(q),
      );
    }
    if (feeFilter !== "all") {
      list = list.filter((s) => {
        if (feeFilter === "paid") return s.status === "PAID";
        if (feeFilter === "partial") return s.status === "PARTIAL";
        if (feeFilter === "overdue") return s.status === "OVERDUE";
        if (feeFilter === "none") return s.status === "NONE";
        return true;
      });
    }
    return list.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [studentSummaries, search, feeFilter]);

  // ── Dashboard chart data ─────────────────────────────
  const collectionChart = useMemo<{ month: string; collected: number; pending: number }[]>(() => {
    if (dashboard?.collectedByMonth?.length) return dashboard.collectedByMonth as { month: string; collected: number; pending: number }[];
    const now = new Date();
    const months: { month: string; collected: number; pending: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleDateString("en-IN", { month: "short" }), collected: 0, pending: 0 });
    }
    // aggregate from actual fees by dueDate month as fallback
    for (const f of studentFees) {
      try {
        const md = new Date(f.dueDate);
        const key = md.toLocaleDateString("en-IN", { month: "short" });
        const bucket = months.find((m) => m.month === key);
        if (bucket) {
          bucket.collected += f.paidAmount;
          bucket.pending += f.balance;
        }
      } catch {}
    }
    return months;
  }, [dashboard, studentFees]);
  const classWiseChart = useMemo<{ name: string; collected: number; total: number }[]>(() => {
    if (dashboard?.collectedByClass?.length) return dashboard.collectedByClass as { name: string; collected: number; total: number }[];
    const map = new Map<string, { name: string; collected: number; total: number }>();
    for (const s of studentSummaries) {
      if (!map.has(s.className)) map.set(s.className, { name: s.className, collected: 0, total: 0 });
      const rec = map.get(s.className)!;
      rec.total += s.totalDue;
      rec.collected += s.paid;
    }
    return Array.from(map.values());
  }, [dashboard, studentSummaries]);

  const selectedStats = useMemo(() => {
    if (dashboard) return dashboard;
    const totalDue = studentFees.reduce((s, f) => s + f.payableAmount, 0);
    const totalPaid = studentFees.reduce((s, f) => s + f.paidAmount, 0);
    const overdue = studentFees.filter((f) => f.balance > 0 && new Date(f.dueDate).getTime() < Date.now()).reduce((s, f) => s + f.balance, 0);
    return {
      totalCollected: totalPaid,
      totalPending: totalDue - totalPaid,
      totalOverdue: overdue,
      totalDue,
      collectionRate: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
    };
  }, [dashboard, studentFees]);

  // ── Generate Invoices ────────────────────────────────
  const handleGenerateClass = async () => {
    if (!selectedSession || !selectedClass) return toast("Error", "Select a session and class first", "error");
    try {
      const n = await generateInvoicesForClass({ academicSessionId: selectedSession, classId: selectedClass, sectionId: selectedSection || undefined }, accessToken);
      toast("Invoices", `Generated ${n} invoice(s) for this class.`, "success");
      loadData();
    } catch (err: any) {
      toast("Error", err.message || "Failed to generate invoices", "error");
    }
  };

  const handleGenerateMonthly = async () => {
    if (!selectedSession) return toast("Error", "Select a session first", "error");
    try {
      const n = await generateMonthlyInvoices(selectedSession, undefined, accessToken);
      toast("Invoices", `Generated ${n} monthly invoice(s).`, "success");
      loadData();
    } catch (err: any) {
      toast("Error", err.message || "Failed to generate monthly invoices", "error");
    }
  };

  // ── Collect Fee ──────────────────────────────────────
  const openCollect = (stu: StudentSummary) => {
    setCollectStudent(stu);
    setCollectAmount(stu.balance > 0 ? String(stu.balance) : "");
    setCollectMode("CASH");
    setCollectRef("");
    setReceipt(null);
  };

  const handleCollect = async () => {
    if (!collectStudent) return;
    const amount = Number(collectAmount);
    if (!amount || amount <= 0) return toast("Error", "Enter a valid amount", "error");
    const pendingFees = collectStudent.fees.filter((f) => f.balance > 0);
    if (pendingFees.length === 0) return toast("Info", "Student has no outstanding balance", "info");
    if (amount > collectStudent.balance) return toast("Error", `Amount exceeds outstanding ${formatCurrency(collectStudent.balance)}`, "error");

    setCollecting(true);
    try {
      const result = await createPayment(
        {
          studentFeeIds: pendingFees.map((f) => f.id),
          amount,
          paymentMode: collectMode as any,
          referenceNumber: collectRef || undefined,
          receivedByEmployeeId: undefined,
        },
        accessToken,
      );
      setReceipt(result);
      await loadData();
      // refresh the selected student summary from updated fees
      const updated = studentSummaries.find((s) => s.studentEnrollmentId === collectStudent.studentEnrollmentId);
      if (updated) setCollectStudent(updated);
      toast("Payment", `Payment of ${formatCurrency(amount)} recorded.`, "success");
    } catch (err: any) {
      toast("Error", err.message || "Failed to record payment", "error");
    } finally {
      setCollecting(false);
    }
  };

  const handleAddDiscount = async (fee: StudentFee, amount: number, reason: string) => {
    if (!amount || amount <= 0) return toast("Error", "Enter a valid discount amount", "error");
    try {
      await createDiscount({ studentFeeId: fee.id, amount, reason }, accessToken);
      toast("Discount", "Discount applied.", "success");
      setDiscountFee(null);
      setDiscountAmount("");
      setDiscountReason("");
      await loadData();
      const updated = studentSummaries.find((s) => s.studentEnrollmentId === fee.studentEnrollmentId);
      if (updated) setSelectedStudent(updated);
    } catch (err: any) {
      toast("Error", err.message || "Failed to add discount", "error");
    }
  };

  // ── Export helpers ───────────────────────────────────
  const exportStudents = () => {
    exportToCSV("fee_students", filteredStudents.map((s) => ({
      "Student Name": s.studentName,
      "Admission No": s.admissionNumber,
      "Class": s.className,
      "Section": s.sectionName,
      "Total Due": s.totalDue,
      "Paid": s.paid,
      "Balance": s.balance,
      "Status": s.status,
    })));
  };

  const exportDefaulters = () => {
    exportToCSV("fee_defaulters", defaulters.map((d) => ({
      "Student Name": d.studentName,
      "Admission No": d.admissionNumber,
      "Class": d.className,
      "Section": d.sectionName,
      "Total Due": d.totalDue,
      "Paid": d.totalPaid,
      "Balance": d.balance,
      "Overdue Count": d.overdueCount,
      "Overdue Amount": d.overdueAmount,
      "Last Payment": d.lastPaymentDate ? formatDate(d.lastPaymentDate) : "-",
    })));
  };

  if (loadingRef) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fee & Financial Management</h1>
          <p className="text-xs text-muted-foreground mt-1">Dashboard, collections, invoices & reports</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // STUDENT PROFILE VIEW
  // ═══════════════════════════════════════════════════════
  if (selectedStudent) {
    const stu = selectedStudent;
    const discounted = stu.fees.reduce((s, f) => s + f.discountAmount, 0);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Fee Profile</h1>
              <p className="text-xs text-muted-foreground mt-1">{stu.studentName} • {stu.admissionNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(stu.status)} className="capitalize">{stu.status}</Badge>
            <Button size="sm" onClick={() => openCollect(stu)} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
              <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Collect Fee
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-xl font-bold">{formatCurrency(stu.totalDue)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(stu.paid)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(stu.balance)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Discounts Applied</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(discounted)}</p>
          </CardContent></Card>
        </div>

        {/* Itemized breakdown by fee head */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold">Itemized Fee Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Head</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Late Fee</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stu.fees.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-6">No fee invoices found</TableCell></TableRow>
                ) : (
                  stu.fees.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs font-medium">
                        {f.feeHead?.name || "Fee"}
                        {f.periodLabel && <span className="text-muted-foreground"> • {f.periodLabel}</span>}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(f.totalAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-blue-600">
                        {f.discountAmount ? formatCurrency(f.discountAmount) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-amber-600">
                        {f.lateFee ? formatCurrency(f.lateFee) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-semibold">{formatCurrency(f.payableAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-emerald-600">{formatCurrency(f.paidAmount)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-semibold">{formatCurrency(f.balance)}</TableCell>
                      <TableCell className="text-xs text-center">{formatDate(f.dueDate)}</TableCell>
                      <TableCell className="text-center"><Badge variant={statusVariant(f.status)} className="capitalize">{f.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {f.balance > 0 && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                            onClick={() => { setDiscountFee({ feeId: f.id, student: stu }); setDiscountAmount(""); setDiscountReason(""); }}>
                            <Percent size={13} /> Discount
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment history */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold">Payment History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stu.fees.flatMap((f) => f.payments || []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No payments recorded yet</TableCell></TableRow>
                ) : (
                  stu.fees.flatMap((f) => (f.payments || []).map((p) => ({ ...p, headName: f.feeHead?.name || "Fee", feeId: f.id })))
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-mono">{p.receiptNumber}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="text-xs"><Badge variant="outline">{p.paymentMode}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.referenceNumber || "-"}</TableCell>
                        <TableCell className="text-xs">{formatDate(p.paymentDate)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.remarks || "-"}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Discounts */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold">Discounts / Scholarships</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Head</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stu.fees.flatMap((f) => (f.discounts || []).map((d) => ({ ...d, headName: f.feeHead?.name || "Fee" }))).length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No discounts applied</TableCell></TableRow>
                ) : (
                  stu.fees.flatMap((f) => (f.discounts || []).map((d) => ({ ...d, headName: f.feeHead?.name || "Fee" })))
                    .map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-xs">{d.headName}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-blue-600 tabular-nums">{formatCurrency(d.amount)}</TableCell>
                        <TableCell className="text-xs">{d.reason}</TableCell>
                        <TableCell className="text-xs">{formatDate(d.createdAt)}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Collect Fee Dialog */}
        <Dialog open={!!collectStudent} onOpenChange={(o) => { if (!o) setCollectStudent(null); }}>
          {collectStudent && (
            <>
              <DialogHeader><DialogTitle>Collect Fee</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="text-xs bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 space-y-1">
                  <p className="font-semibold">{collectStudent.studentName} • {collectStudent.className}-{collectStudent.sectionName}</p>
                  <p className="text-muted-foreground">Outstanding balance: <strong className="text-amber-600">{formatCurrency(collectStudent.balance)}</strong></p>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Amount *</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Enter amount"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Enter lower amount for partial payment.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Payment Mode *</label>
                    <select
                      value={collectMode}
                      onChange={(e) => setCollectMode(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Reference No.</label>
                    <Input placeholder="Optional" value={collectRef} onChange={(e) => setCollectRef(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setCollectStudent(null)} className="text-xs">Cancel</Button>
                  <Button
                    onClick={handleCollect}
                    disabled={collecting || !collectAmount || Number(collectAmount) <= 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                  >
                    {collecting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    Confirm Payment
                  </Button>
                </div>
              </div>
            </>
          )}
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={!!receipt} onOpenChange={(o) => { if (!o) setReceipt(null); }}>
          {receipt && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Payment Successful
                  </DialogTitle>
                  <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Receipt
                  </Button>
                </div>
              </DialogHeader>
              <div id="printable-area" className="p-4 bg-white dark:bg-slate-900 border rounded-lg space-y-4">
                <div className="text-center border-b pb-3">
                  <h2 className="text-base font-bold text-blue-900 dark:text-blue-300">PrismaEd+ School</h2>
                  <p className="text-xs text-muted-foreground">Official Payment Receipt</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Student</p>
                    <p className="font-semibold">{collectStudent?.studentName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Receipt No</p>
                    <p className="font-mono">{receipt.payment?.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount Paid</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(receipt.payment?.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mode</p>
                    <p className="font-semibold">{receipt.payment?.paymentMode?.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="border rounded overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                      <tr><th className="p-2">Applied To</th><th className="p-2 text-right">Amount</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {(receipt.receipts || []).map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2">{r.studentFeeId}</td>
                          <td className="p-2 text-right">{formatCurrency(r.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Dialog>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // MAIN MODULE VIEW (Dashboard / Students / Reports)
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fee & Financial Management</h1>
          <p className="text-xs text-muted-foreground mt-1">Assign fees by class, layer add-ons, auto-generate invoices, and collect payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateMonthly} className="text-xs">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Generate Monthly Invoices
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateClass} className="text-xs">
            <BadgeIndianRupee className="mr-1.5 h-3.5 w-3.5" /> Generate Class Invoices
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Academic Session *</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Session</option>
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? "(Current)" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
                disabled={!selectedSession}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs disabled:opacity-50"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs disabled:opacity-50"
              >
                <option value="">All Sections</option>
                {selectedClass ? sections.filter((s) => s.classId === selectedClass && s.academicSessionId === selectedSession).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                )) : null}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={() => { setSelectedClass(""); setSelectedSection(""); }} className="text-xs w-full">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab navigation */}
      <div className="inline-flex h-9 items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
        <button
          onClick={() => setTab("dashboard")}
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "dashboard" ? "bg-background text-foreground shadow-sm font-bold" : "text-slate-500 dark:text-slate-400 hover:text-foreground"}`}
        >
          <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" /> Dashboard
        </button>
        <button
          onClick={() => setTab("students")}
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "students" ? "bg-background text-foreground shadow-sm font-bold" : "text-slate-500 dark:text-slate-400 hover:text-foreground"}`}
        >
          <Users className="h-3.5 w-3.5 mr-1.5" /> Students
        </button>
        <button
          onClick={() => setTab("reports")}
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "reports" ? "bg-background text-foreground shadow-sm font-bold" : "text-slate-500 dark:text-slate-400 hover:text-foreground"}`}
        >
          <FileBarChart className="h-3.5 w-3.5 mr-1.5" /> Reports
        </button>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading data...</span>
        </div>
      ) : (
        <>
          {/* ═══════════════ DASHBOARD ═══════════════ */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Collected</span>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><Wallet className="h-4 w-4" /></div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(selectedStats.totalCollected)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pending</span>
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"><TrendingUp className="h-4 w-4" /></div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(selectedStats.totalPending)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overdue</span>
                    <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"><ShieldAlert className="h-4 w-4" /></div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedStats.totalOverdue)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{defaulters.filter((d) => d.overdueAmount > 0).length} defaulters</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collection Rate</span>
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"><CheckCircle2 className="h-4 w-4" /></div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedStats.collectionRate ? selectedStats.collectionRate.toFixed(1) : "0.0"}%</p>
                  <p className="text-[11px] text-muted-foreground mt-1">of total due {formatCurrency(selectedStats.totalDue)}</p>
                </CardContent></Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle className="text-sm font-bold">Collections Over Time</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={collectionChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="pending" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                        <Legend />
                        <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#collected)" strokeWidth={2} />
                        <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#pending)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm font-bold">Collection by Class</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classWiseChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                        <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="total" name="Total Due" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm font-bold">Fee Heads (Reference)</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead>Optional</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeHeads.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No fee heads configured</TableCell></TableRow>
                      ) : (
                        feeHeads.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-xs font-medium">{h.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{h.code}</TableCell>
                            <TableCell className="text-xs">{h.isRecurring ? h.recurringInterval : "—"}</TableCell>
                            <TableCell className="text-xs">{h.isOptional ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-xs"><Badge variant={h.isActive ? "success" : "secondary"}>{h.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════ STUDENTS ═══════════════ */}
          {tab === "students" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-8 text-xs"
                        placeholder="Search by name, admission no, roll no"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={feeFilter}
                        onChange={(e) => setFeeFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="overdue">Overdue</option>
                        <option value="none">No Fees</option>
                      </select>
                      <Button variant="outline" size="sm" onClick={exportStudents} className="text-xs">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {studentFees.length === 0 ? "No fee invoices yet. Generate invoices to populate this list." : "No students match your filters."}
                        </TableCell></TableRow>
                      ) : (
                        filteredStudents.map((s) => (
                          <TableRow key={s.studentEnrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setSelectedStudent(s)}>
                            <TableCell className="text-xs">
                              <span className="font-semibold">{s.studentName}</span>
                              <span className="text-muted-foreground block">{s.admissionNumber} {s.rollNumber ? `• Roll ${s.rollNumber}` : ""}</span>
                            </TableCell>
                            <TableCell className="text-xs">{s.className}-{s.sectionName}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">{formatCurrency(s.totalDue)}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums text-emerald-600">{formatCurrency(s.paid)}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums font-semibold">{formatCurrency(s.balance)}</TableCell>
                            <TableCell className="text-center"><Badge variant={statusVariant(s.status)} className="capitalize">{s.status}</Badge></TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" onClick={() => openCollect(s)} className="h-8 text-xs text-emerald-600 hover:text-emerald-800">
                                <CreditCard className="mr-1 h-3.5 w-3.5" /> Collect
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════ REPORTS ═══════════════ */}
          {tab === "reports" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">Defaulters List</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Students with overdue balances</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportDefaulters} className="text-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export Defaulters
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-center">Overdue Items</TableHead>
                        <TableHead className="text-right">Overdue Amount</TableHead>
                        <TableHead className="text-center">Last Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defaulters.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No defaulters. All is well!</TableCell></TableRow>
                      ) : (
                        defaulters.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs"><span className="font-semibold">{d.studentName}</span><span className="text-muted-foreground block">{d.admissionNumber}</span></TableCell>
                            <TableCell className="text-xs">{d.className}-{d.sectionName}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">{formatCurrency(d.totalDue)}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums text-emerald-600">{formatCurrency(d.totalPaid)}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums font-semibold text-red-600">{formatCurrency(d.balance)}</TableCell>
                            <TableCell className="text-center"><Badge variant="destructive">{d.overdueCount}</Badge></TableCell>
                            <TableCell className="text-xs text-right tabular-nums font-semibold text-red-600">{formatCurrency(d.overdueAmount)}</TableCell>
                            <TableCell className="text-xs text-center">{d.lastPaymentDate ? formatDate(d.lastPaymentDate) : "Never"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Class-wise collection summary */}
              <Card>
                <CardHeader><CardTitle className="text-sm font-bold">Class-wise Collection Summary</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead className="text-right">Collected</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Collection %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classWiseChart.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>
                      ) : (
                        classWiseChart.map((c, i) => {
                          const pct = c.total > 0 ? (c.collected / c.total) * 100 : 0;
                          return (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-medium">{c.name}</TableCell>
                              <TableCell className="text-xs text-right tabular-nums">{formatCurrency(c.total)}</TableCell>
                              <TableCell className="text-xs text-right tabular-nums text-emerald-600">{formatCurrency(c.collected)}</TableCell>
                              <TableCell className="text-xs text-right tabular-nums text-amber-600">{formatCurrency(c.total - c.collected)}</TableCell>
                              <TableCell className="text-xs text-right">
                                <div className="inline-flex items-center gap-2">
                                  <div className="h-1.5 w-20 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-1.5 rounded bg-emerald-500" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="font-semibold">{pct.toFixed(1)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Global Collect Fee Dialog (from list view) */}
      <Dialog open={!!collectStudent && !selectedStudent} onOpenChange={(o) => { if (!o) setCollectStudent(null); }}>
        {collectStudent && !selectedStudent && (
          <>
            <DialogHeader><DialogTitle>Collect Fee</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="text-xs bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 space-y-1">
                <p className="font-semibold">{collectStudent.studentName} • {collectStudent.className}-{collectStudent.sectionName}</p>
                <p className="text-muted-foreground">Outstanding balance: <strong className="text-amber-600">{formatCurrency(collectStudent.balance)}</strong></p>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Amount *</label>
                <Input type="number" inputMode="numeric" placeholder="Enter amount" value={collectAmount} onChange={(e) => setCollectAmount(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-1">Enter lower amount for partial payment.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Payment Mode *</label>
                  <select value={collectMode} onChange={(e) => setCollectMode(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                    {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Reference No.</label>
                  <Input placeholder="Optional" value={collectRef} onChange={(e) => setCollectRef(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setCollectStudent(null)} className="text-xs">Cancel</Button>
                <Button onClick={handleCollect} disabled={collecting || !collectAmount || Number(collectAmount) <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                  {collecting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  <CreditCard className="h-3.5 w-3.5 mr-1" /> Confirm Payment
                </Button>
              </div>
            </div>
          </>
        )}
      </Dialog>

      {/* Global Receipt Dialog */}
      <Dialog open={!!receipt && !selectedStudent} onOpenChange={(o) => { if (!o) setReceipt(null); }}>
        {receipt && !selectedStudent && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Payment Successful
                </DialogTitle>
                <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Receipt
                </Button>
              </div>
            </DialogHeader>
            <div id="printable-area" className="p-4 bg-white dark:bg-slate-900 border rounded-lg space-y-4">
              <div className="text-center border-b pb-3">
                <h2 className="text-base font-bold text-blue-900 dark:text-blue-300">PrismaEd+ School</h2>
                <p className="text-xs text-muted-foreground">Official Payment Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><p className="text-muted-foreground">Student</p><p className="font-semibold">{collectStudent?.studentName}</p></div>
                <div><p className="text-muted-foreground">Receipt No</p><p className="font-mono">{receipt.payment?.receiptNumber}</p></div>
                <div><p className="text-muted-foreground">Amount Paid</p><p className="font-bold text-emerald-600">{formatCurrency(receipt.payment?.amount)}</p></div>
                <div><p className="text-muted-foreground">Mode</p><p className="font-semibold">{receipt.payment?.paymentMode?.replace("_", " ")}</p></div>
              </div>
              <div className="border rounded overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                    <tr><th className="p-2">Applied To</th><th className="p-2 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {(receipt.receipts || []).map((r: any, i: number) => (
                      <tr key={i}><td className="p-2">{r.studentFeeId}</td><td className="p-2 text-right">{formatCurrency(r.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Dialog>

      {/* Add Discount Dialog */}
      <Dialog open={!!discountFee} onOpenChange={(o) => { if (!o) setDiscountFee(null); }}>
        {discountFee && (
          <>
            <DialogHeader>
              <DialogTitle>Add Discount</DialogTitle>
              <DialogDescription>
                Apply a discount or scholarship to a fee invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="text-xs bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 space-y-1">
                <p className="font-semibold">{discountFee.student.studentName} • {discountFee.student.className}-{discountFee.student.sectionName}</p>
                {(() => {
                  const f = discountFee.student.fees.find((x) => x.id === discountFee.feeId);
                  if (!f) return null;
                  return (
                    <p className="text-muted-foreground">
                      {f.feeHead?.name || "Fee"}{f.periodLabel ? ` • ${f.periodLabel}` : ""} —
                      Payable <strong>{formatCurrency(f.payableAmount)}</strong>, Balance <strong className="text-amber-600">{formatCurrency(f.balance)}</strong>
                    </p>
                  );
                })()}
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Discount Amount *</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter amount"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Reason</label>
                <Input
                  placeholder="e.g. Merit scholarship, sibling discount"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setDiscountFee(null)} className="text-xs">Cancel</Button>
                <Button
                  onClick={() => handleAddDiscount(discountFee.student.fees.find((x) => x.id === discountFee.feeId)!, Number(discountAmount), discountReason)}
                  disabled={!discountAmount || Number(discountAmount) <= 0}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  <Percent className="h-3.5 w-3.5 mr-1" /> Apply Discount
                </Button>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
