"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Loader2,
  FileText,
  Shield,
  CalendarDays,
  Receipt as ReceiptIcon,
  HeartPulse,
  Home as HomeIcon,
  BookOpen,
  GraduationCap,
  Users,
  CreditCard,
  Settings2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { PrintableReportCard } from "@/components/modules/printable-report-card";
import { useAuth } from "@/lib/auth/auth-context";

import { getStudent } from "@/lib/api/students.api";
import { getExams } from "@/lib/api/exams.api";
import { getExamSchedules } from "@/lib/api/exam-schedules.api";
import { getExamResults } from "@/lib/api/exam-results.api";
import { getMarks } from "@/lib/api/marks.api";
import { getGrades } from "@/lib/api/grades.api";
import {
  getEnrollmentAccount,
  listFeeCollections,
  listFeeDiscounts,
  listFeeFines,
  createFeeCollection,
  type EnrollmentAccount,
  type InvoiceRowRaw,
  type FeeCollectionRaw,
  type DiscountRaw,
  type FineRaw,
} from "@/lib/api/fees.api";
import { getStudentAttendance } from "@/lib/api/student-attendance.api";
import { ManageFeeHeadsDialog } from "@/components/fees/manage-fee-heads-dialog";

import type { StudentProfile } from "@/lib/types/student";
import type { Exam } from "@/lib/types/exam";
import type { Mark, ExamResult, Grade } from "@/lib/types/marks";
import type { StudentAttendance } from "@/lib/types/student-attendance";
import {
  buildStudentResults,
  type StudentResultRow,
  type StudentWithEnrollment,
} from "@/lib/exam-results-utils";
import { formatCurrency } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/dates";
import { PAYMENT_MODES } from "@/lib/fees-fm/helpers";

function formatDate(d?: string): string {
  if (!d) return "-";
  const dt = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  if (isNaN(dt.getTime())) return String(d).slice(0, 10);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function humanMode(mode: string) {
  return mode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function periodLabel(periodKey: string): string {
  if (!periodKey || periodKey === "ANNUAL") return "Annual";
  const [y, m] = periodKey.split("-").map(Number);
  if (!y || !m) return periodKey;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export default function StudentProfilePage() {
  const { studentId = "" } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeEnrollmentId, setActiveEnrollmentId] = useState("");

  const [exams, setExams] = useState<Exam[]>([]);
  const [allResults, setAllResults] = useState<ExamResult[]>([]);
  const [allMarks, setAllMarks] = useState<Mark[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingAcademics, setLoadingAcademics] = useState(false);
  const [examFilter, setExamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openingReport, setOpeningReport] = useState(false);
  const [builtReport, setBuiltReport] = useState<{ row: StudentResultRow; exam: Exam } | null>(null);

  const [account, setAccount] = useState<EnrollmentAccount | null>(null);
  const [collections, setCollections] = useState<FeeCollectionRaw[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRaw[]>([]);
  const [fines, setFines] = useState<FineRaw[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesRefreshKey, setFeesRefreshKey] = useState(0);

  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectInvoiceIds, setCollectInvoiceIds] = useState<string[] | null>(null);
  const [manageHeadsOpen, setManageHeadsOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!accessToken || !studentId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getStudent(studentId, accessToken)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setActiveEnrollmentId((prev) => {
          if (prev && p.enrollments.some((e) => e.id === prev)) return prev;
          return p.enrollments[0]?.id || "";
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Could not load student profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, accessToken]);

  const selectedEnrollment = useMemo(() => {
    if (!profile) return undefined;
    return (
      profile.enrollments.find((e) => e.id === activeEnrollmentId) ||
      profile.enrollments[0]
    );
  }, [profile, activeEnrollmentId]);

  useEffect(() => {
    if (!profile || !selectedEnrollment) {
      setExams([]);
      setAllResults([]);
      setAllMarks([]);
      setGrades([]);
      setExamFilter("");
      setStatusFilter("");
      return;
    }
    let cancelled = false;
    setLoadingAcademics(true);
    Promise.all([
      getExams(
        {
          academicSessionId: selectedEnrollment.academicSession.id,
          classId: selectedEnrollment.class.id,
        },
        accessToken,
      ).catch(() => []),
      getExamResults(
        {
          academicSessionId: selectedEnrollment.academicSession.id,
          studentEnrollmentId: selectedEnrollment.id,
        },
        accessToken,
      ).catch(() => []),
      getMarks(
        { studentEnrollmentId: selectedEnrollment.id },
        accessToken,
      ).catch(() => []),
      getGrades(accessToken).catch(() => []),
    ])
      .then(([ex, res, mk, gd]) => {
        if (cancelled) return;
        setExams(ex || []);
        setAllResults(res || []);
        setAllMarks(mk || []);
        setGrades(gd || []);
      })
      .finally(() => {
        if (!cancelled) setLoadingAcademics(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, selectedEnrollment, accessToken]);

  const resultByExam = useMemo(() => {
    const map = new Map<string, ExamResult>();
    for (const r of allResults) {
      map.set(r.examId, r);
    }
    return map;
  }, [allResults]);

  const generatedCards = useMemo(() => {
    const examIds = new Set(allResults.map((r) => r.examId));
    return exams.filter((e) => examIds.has(e.id));
  }, [exams, allResults]);

  const filteredCards = useMemo(
    () =>
      generatedCards.filter((e) => {
        if (examFilter && e.id !== examFilter) return false;
        if (statusFilter) {
          const result = resultByExam.get(e.id);
          if (!result || result.resultStatus !== statusFilter) return false;
        }
        return true;
      }),
    [generatedCards, examFilter, statusFilter, resultByExam],
  );

  const openReport = async (exam: Exam) => {
    if (!profile || !selectedEnrollment) return;
    setOpeningReport(true);
    try {
      const scheds =
        (await getExamSchedules({ examId: exam.id }, accessToken).catch(() => [])) ||
        [];
      const student: StudentWithEnrollment = {
        enrollmentId: selectedEnrollment.id,
        studentId: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        rollNumber: selectedEnrollment.rollNumber,
        admissionNumber: profile.admissionNumber,
      };
      const result = resultByExam.get(exam.id) || null;
      const examMarks = allMarks.filter(
        (m) =>
          m.studentEnrollmentId === selectedEnrollment.id &&
          m.examSchedule?.examId === exam.id,
      );
      const rows = buildStudentResults({
        students: [student],
        examResults: result ? [result] : [],
        allMarks: examMarks,
        examSchedules: scheds,
        selectedExamId: exam.id,
        grades,
      });
      const row = rows[0] || null;
      if (row) {
        setBuiltReport({ row, exam });
        setReportOpen(true);
      } else {
        toast(
          "Report card unavailable",
          "No report card could be generated for this exam.",
          "error",
        );
      }
    } catch {
      toast("Report card unavailable", "Could not load report card details.", "error");
    } finally {
      setOpeningReport(false);
    }
  };

  useEffect(() => {
    if (!activeEnrollmentId) {
      setAccount(null);
      setCollections([]);
      setDiscounts([]);
      setFines([]);
      return;
    }
    let cancelled = false;
    setLoadingFees(true);
    Promise.all([
      getEnrollmentAccount(activeEnrollmentId, accessToken).catch(() => null),
      listFeeCollections({ studentEnrollmentId: activeEnrollmentId }, accessToken).catch(() => []),
      listFeeDiscounts({ studentEnrollmentId: activeEnrollmentId }, accessToken).catch(() => []),
      listFeeFines({ studentEnrollmentId: activeEnrollmentId }, accessToken).catch(() => []),
    ]).then(([acct, cols, discs, fns]) => {
      if (cancelled) return;
      setAccount(acct);
      setCollections(cols || []);
      setDiscounts(discs || []);
      setFines(fns || []);
      setLoadingFees(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeEnrollmentId, feesRefreshKey, accessToken]);

  useEffect(() => {
    if (!activeEnrollmentId) {
      setAttendance([]);
      return;
    }
    let cancelled = false;
    setLoadingAttendance(true);
    getStudentAttendance(accessToken, { studentEnrollmentId: activeEnrollmentId })
      .then((rows) => {
        if (!cancelled) setAttendance(rows || []);
      })
      .catch(() => {
        if (!cancelled) setAttendance([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAttendance(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeEnrollmentId, accessToken]);

  const invoices: InvoiceRowRaw[] = account?.invoices || [];
  const invoiceTotals = useMemo(() => {
    let payable = 0;
    let paid = 0;
    let balance = 0;
    let discount = 0;
    let lateFine = 0;
    let overdue = 0;
    for (const r of invoices) {
      payable += Number(r.payableAmount || 0);
      paid += Number(r.paidAmount || 0);
      balance += Number(r.balance || 0);
      discount += Number(r.discountAmount || 0);
      lateFine += Number(r.lateFee || 0);
      if (r.status === "OVERDUE") overdue += 1;
    }
    return { payable, paid, balance, discount, lateFine, overdue };
  }, [invoices]);

  const overdueRows = useMemo(
    () =>
      invoices
        .filter((r) => r.status === "OVERDUE")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices],
  );

  const pendingRows = useMemo(
    () =>
      invoices
        .filter((r) => r.status === "PENDING")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices],
  );

  const paidRows = useMemo(
    () =>
      invoices
        .filter((r) => r.status === "PAID")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices],
  );

  const attendanceSummary = useMemo(() => {
    const daily = attendance.filter((a) => a.attendanceType === "DAILY");
    const byDate = new Map<string, StudentAttendance>();
    for (const a of daily) {
      const key = String(a.attendanceDate).slice(0, 10);
      if (!byDate.has(key)) byDate.set(key, a);
    }
    const days = Array.from(byDate.values());
    const present = days.filter((d) => d.status === "PRESENT" || d.status === "LATE").length;
    const absent = days.filter((d) => d.status === "ABSENT").length;
    const halfDay = days.filter((d) => d.status === "HALF_DAY").length;
    const excused = days.filter((d) => d.status === "EXCUSED").length;
    const total = days.length;
    const pct = total > 0 ? (present / total) * 100 : 0;
    return { total, present, absent, halfDay, excused, pct };
  }, [attendance]);

  const sortedAttendance = useMemo(
    () =>
      [...attendance]
        .filter((a) => a.attendanceType === "DAILY")
        .sort((a, b) => String(b.attendanceDate).localeCompare(String(a.attendanceDate)))
        .slice(0, 30),
    [attendance],
  );

  const [calendarCursor, setCalendarCursor] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const dailyByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of attendance) {
      if (a.attendanceType !== "DAILY") continue;
      const key = String(a.attendanceDate).slice(0, 10);
      if (!map.has(key)) map.set(key, a.status);
    }
    return map;
  }, [attendance]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading student profile…</span>
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-2">
          <Shield className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm text-muted-foreground">{loadError || "Student not found."}</p>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/students")}>
            Back to Student Directory
          </Button>
        </CardContent>
      </Card>
    );
  }

  const primaryGuardian =
    profile.guardians.find((g) => g.isPrimaryContact) || profile.guardians[0];
  const attendanceSummaryText =
    attendanceSummary.total > 0
      ? `${attendanceSummary.pct.toFixed(1)}% (${attendanceSummary.present}/${attendanceSummary.total} days)`
      : "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap p-4 rounded-xl border bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <button
            onClick={() => navigate("/students")}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Avatar
            src={profile.photoUrl || undefined}
            fallback={`${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`}
            size="lg"
          />
          <div>
            <h2 className="font-bold text-base leading-tight">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-xs text-muted-foreground font-mono">{profile.admissionNumber}</p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <StatusChip status={profile.status} />
              {selectedEnrollment && (
                <span className="inline-flex items-center text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">
                  {selectedEnrollment.class.name} — Section {selectedEnrollment.section.name}
                </span>
              )}
            </div>
          </div>
        </div>
        {profile.enrollments.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Enrollment
            </label>
            <select
              value={activeEnrollmentId}
              onChange={(e) => {
                setActiveEnrollmentId(e.target.value);
                setExamFilter("");
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {profile.enrollments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.academicSession.name} · {e.class.name}{e.section.name ? ` · Section ${e.section.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="overview">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="academics">
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Academics &amp; Report Cards
          </TabsTrigger>
          <TabsTrigger value="fees">
            <ReceiptIcon className="h-3.5 w-3.5 mr-1.5" /> Fees &amp; Financials
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Attendance
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {selectedEnrollment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Current Enrollment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Session</span>
                      <strong className="font-semibold">{selectedEnrollment.academicSession.name}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Class</span>
                      <strong className="font-semibold">{selectedEnrollment.class.name}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Section</span>
                      <strong className="font-semibold">{selectedEnrollment.section.name}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Roll No.</span>
                      <strong className="font-semibold">{selectedEnrollment.rollNumber || "—"}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Gender</span>
                    <strong className="font-semibold">{profile.gender}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Date of Birth</span>
                    <strong className="font-semibold">{formatDisplayDate(profile.dateOfBirth, "—")}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Blood Group</span>
                    <strong className="font-semibold">{profile.bloodGroup || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Admission Date</span>
                    <strong className="font-semibold">{formatDisplayDate(profile.admissionDate, "—")}</strong>
                  </div>
                </div>
                {profile.address && (
                  <div className="flex items-center space-x-2 text-xs mt-4 border-t border-border pt-3">
                    <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{profile.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  Guardians / Parents ({profile.guardians.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.guardians.length === 0 && (
                  <p className="text-xs text-muted-foreground">No guardians linked.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.guardians.map((g) => (
                    <div key={g.id} className="border rounded-lg p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="font-semibold">
                          {g.guardian.firstName} {g.guardian.lastName}
                        </strong>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {g.guardian.relation}
                        </span>
                        {g.isPrimaryContact && (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full font-medium">
                            Primary
                          </span>
                        )}
                        {g.isEmergencyContact && (
                          <span className="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded-full font-medium">
                            Emergency
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {g.guardian.phone}
                      </p>
                      {g.guardian.email && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /> {g.guardian.email}
                        </p>
                      )}
                      {g.guardian.occupation && (
                        <p className="text-muted-foreground">Occupation: {g.guardian.occupation}</p>
                      )}
                      {g.guardian.address && (
                        <p className="text-muted-foreground flex items-start gap-1">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> {g.guardian.address}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <HeartPulse className="h-4 w-4" /> Medical Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {!profile.medicalRecord && (
                    <p className="text-muted-foreground">No medical record on file.</p>
                  )}
                  {profile.medicalRecord && (
                    <>
                      {profile.medicalRecord.allergies && (
                        <p><span className="text-muted-foreground">Allergies:</span> <strong className="font-semibold">{profile.medicalRecord.allergies}</strong></p>
                      )}
                      {profile.medicalRecord.chronicConditions && (
                        <p><span className="text-muted-foreground">Chronic conditions:</span> <strong className="font-semibold">{profile.medicalRecord.chronicConditions}</strong></p>
                      )}
                      {profile.medicalRecord.medications && (
                        <p><span className="text-muted-foreground">Medications:</span> <strong className="font-semibold">{profile.medicalRecord.medications}</strong></p>
                      )}
                      {profile.medicalRecord.emergencyDoctorName && (
                        <p>
                          <span className="text-muted-foreground">Emergency doctor:</span>{" "}
                          <strong className="font-semibold">{profile.medicalRecord.emergencyDoctorName}</strong>
                          {profile.medicalRecord.emergencyDoctorPhone && (
                            <span className="text-muted-foreground"> · {profile.medicalRecord.emergencyDoctorPhone}</span>
                          )}
                        </p>
                      )}
                      {profile.medicalRecord.notes && (
                        <p><span className="text-muted-foreground">Notes:</span> {profile.medicalRecord.notes}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <HomeIcon className="h-4 w-4 text-blue-600" /> House
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  {!profile.houseAllocation && (
                    <p className="text-muted-foreground">Not allocated to a house.</p>
                  )}
                  {profile.houseAllocation && (
                    <>
                      <p>
                        <span className="text-muted-foreground">House:</span>{" "}
                        <strong className="font-semibold">{profile.houseAllocation.house.name}</strong>
                        {profile.houseAllocation.house.houseColor && (
                          <span className="text-muted-foreground"> · {profile.houseAllocation.house.houseColor}</span>
                        )}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Allocated:</span>{" "}
                        <strong className="font-semibold">{formatDisplayDate(profile.houseAllocation.allocatedAt, "—")}</strong>
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-600" /> Documents ({profile.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.documents.length === 0 && (
                  <p className="text-xs text-muted-foreground">No documents uploaded.</p>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded On</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-xs font-medium">{d.documentType.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDisplayDate(d.createdAt, "—")}
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Open
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">
                    Leaving Certificates ({profile.leavingCertificates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {profile.leavingCertificates.length === 0 && (
                    <p className="text-muted-foreground">No leaving certificates issued.</p>
                  )}
                  {profile.leavingCertificates.map((lc) => (
                    <div key={lc.id} className="border rounded-md px-3 py-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{lc.certificateNumber}</p>
                        <p className="text-muted-foreground text-[10px]">
                          {lc.reason.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDisplayDate(lc.issueDate, "—")}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">
                    Disciplinary Records ({profile.disciplinaryRecords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {profile.disciplinaryRecords.length === 0 && (
                    <p className="text-muted-foreground">No disciplinary records.</p>
                  )}
                  {profile.disciplinaryRecords.map((d) => (
                    <div key={d.id} className="border rounded-md px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{d.description}</p>
                        <StatusChip status={d.severity} />
                      </div>
                      <p className="text-muted-foreground text-[10px]">
                        {formatDisplayDate(d.incidentDate, "—")}
                        {d.guardianNotified && " · Guardian notified"}
                      </p>
                      {d.actionTaken && (
                        <p className="text-muted-foreground">Action: {d.actionTaken}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Academics & Report Cards ──────────────────────── */}
        <TabsContent value="academics">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold block mb-1">Filter by Examination</label>
                    <select
                      value={examFilter}
                      onChange={(e) => setExamFilter(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="">All generated exams</option>
                      {exams.map((ex) => (
                        <option
                          key={ex.id}
                          value={ex.id}
                          disabled={!generatedCards.some((g) => g.id === ex.id)}
                        >
                          {ex.name}
                          {ex.examType?.name ? ` (${ex.examType.name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Result</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-40 h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="">All</option>
                      <option value="PASS">Passed</option>
                      <option value="FAIL">Failed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loadingAcademics ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-xs text-muted-foreground">Loading report cards…</span>
              </div>
            ) : generatedCards.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No generated report cards for this class and session yet. Generate results to
                    create report cards.
                  </p>
                </CardContent>
              </Card>
            ) : filteredCards.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No report cards match the selected filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredCards.map((exam) => {
                  const result = resultByExam.get(exam.id);
                  return (
                    <Card key={exam.id} className="overflow-hidden">
                      <button
                        type="button"
                        onClick={() => openReport(exam)}
                        disabled={openingReport}
                        className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <CardContent className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold leading-tight">{exam.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {exam.examType?.name || "Examination"}
                              </p>
                            </div>
                            <StatusChip
                              status={result?.resultStatus?.toLowerCase() || "pending"}
                            />
                          </div>

                          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-2.5 text-center">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Total Marks
                            </p>
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                              {result?.totalMarksObtained ?? 0}
                              <span className="text-xs font-semibold text-muted-foreground">
                                {" "}
                                / {result?.totalMaxMarks ?? 0}
                              </span>
                            </p>
                            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              {result && result.totalMaxMarks > 0
                                ? `${Number(result.percentage).toFixed(2)}%`
                                : "—"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Grade</span>
                            <span className="font-bold text-emerald-600">
                              {result?.grade?.gradeName || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Rank</span>
                            <span className="font-bold">
                              {result?.rankInSection ? `#${result.rankInSection}` : "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-1.5 border-t border-border pt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            <Eye className="h-3 w-3" />
                            {openingReport ? "Loading…" : "View Report Card"}
                          </div>
                        </CardContent>
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Fees & Financials ────────────────────────────── */}
        <TabsContent value="fees">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold">Fees &amp; Financials</h3>
                <p className="text-[11px] text-muted-foreground">
                  Overdue, pending and paid dues for this enrollment
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setManageHeadsOpen(true)}
                >
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Manage Fee Heads
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                  disabled={!account || !account.invoices.some((r) => r.balance > 0)}
                  onClick={() => {
                    setCollectInvoiceIds(null);
                    setCollectOpen(true);
                  }}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Collect Fee
                </Button>
              </div>
            </div>
            {loadingFees ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-xs text-muted-foreground">Loading fee ledger…</span>
              </div>
            ) : invoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ReceiptIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No fees have been assigned for this enrollment yet. Use Manage Fee Heads to add
                    the fee heads this student is entitled to, then generate fees.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Due</p>
                      <p className="text-lg font-bold">{formatCurrency(invoiceTotals.payable)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Paid</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(invoiceTotals.paid)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p>
                      <p className="text-lg font-bold text-amber-600">{formatCurrency(invoiceTotals.balance)}</p>
                      <p className="text-[10px] text-muted-foreground">{invoiceTotals.overdue} overdue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Discounts</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(invoiceTotals.discount)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Late / Fines</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(invoiceTotals.lateFine)}</p>
                    </CardContent>
                  </Card>
                </div>

                <FeeStatusTable
                  title="Overdue"
                  rows={overdueRows}
                  accent="red"
                  collectable={overdueRows.length > 0}
                  onCollect={(r) => {
                    setCollectInvoiceIds([r.id]);
                    setCollectOpen(true);
                  }}
                />

                <FeeStatusTable
                  title="Pending"
                  rows={pendingRows}
                  accent="amber"
                  collectable={pendingRows.length > 0}
                  onCollect={(r) => {
                    setCollectInvoiceIds([r.id]);
                    setCollectOpen(true);
                  }}
                />

                <FeeStatusTable
                  title="Paid"
                  rows={paidRows}
                  accent="emerald"
                  collectable={false}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Payment History ({collections.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt No</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Applied To</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collections.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No payments recorded.
                            </TableCell>
                          </TableRow>
                        ) : (
                          [...collections]
                            .sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)))
                            .map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="text-xs font-mono font-semibold">{c.receiptNumber}</TableCell>
                                <TableCell className="text-xs text-right font-semibold text-emerald-600 tabular-nums">
                                  {formatCurrency(c.totalAmount)}
                                </TableCell>
                                <TableCell className="text-xs">{humanMode(c.paymentMethod.name)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {c.feeCollectionItems.map((item, i) => (
                                    <span key={i} className="block">
                                      {item.feeStructureItem?.feeCategory?.name ?? "Fee"} ·{" "}
                                      {periodLabel(item.studentFeeAssignment.periodKey)}{" "}
                                      ({formatCurrency(item.amountPaid)})
                                    </span>
                                  ))}
                                  {c.remarks && <span className="block text-[10px]">{c.remarks}</span>}
                                </TableCell>
                                <TableCell className="text-xs">{formatDate(c.paymentDate)}</TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        Discounts ({discounts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {discounts.length === 0 && (
                        <p className="text-xs text-muted-foreground">No discounts applied.</p>
                      )}
                      {discounts.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-xs border rounded-md px-3 py-2">
                          <div>
                            <p className="font-semibold">{d.reason}</p>
                            <p className="text-muted-foreground text-[10px]">
                              {d.studentFeeAssignment.periodKey} · {formatDate(d.createdAt.slice(0, 10))}
                            </p>
                          </div>
                          <span className="font-bold text-blue-600">-{formatCurrency(d.value)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-red-700 dark:text-red-300">
                        Fines ({fines.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fines.length === 0 && (
                        <p className="text-xs text-muted-foreground">No fines recorded.</p>
                      )}
                      {fines.map((f) => (
                        <div key={f.id} className="flex items-center justify-between text-xs border rounded-md px-3 py-2">
                          <div>
                            <p className="font-semibold">{f.reason}</p>
                            <p className="text-muted-foreground text-[10px]">{f.studentFeeAssignment.periodKey}</p>
                          </div>
                          <span className="font-bold text-red-600">+{formatCurrency(f.amount)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Attendance ───────────────────────────────────── */}
        <TabsContent value="attendance">
          <div className="space-y-4">
            {loadingAttendance ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-xs text-muted-foreground">Loading attendance…</span>
              </div>
            ) : attendance.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarDays className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Days Recorded</p>
                      <p className="text-xl font-bold">{attendanceSummary.total}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Present</p>
                      <p className="text-xl font-bold text-emerald-600">{attendanceSummary.present}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Absent</p>
                      <p className="text-xl font-bold text-red-600">{attendanceSummary.absent}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Half Day / Excused</p>
                      <p className="text-xl font-bold">
                        {attendanceSummary.halfDay} / {attendanceSummary.excused}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Attendance %</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {attendanceSummary.pct.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-bold">
                      Calendar View
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCalendarCursor(
                            (c) => new Date(c.getFullYear(), c.getMonth() - 1, 1),
                          )
                        }
                        className="h-7 w-7 p-0 text-xs"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCalendarCursor(
                            () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                          )
                        }
                        className="h-7 px-2 text-[11px]"
                      >
                        Today
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCalendarCursor(
                            (c) => new Date(c.getFullYear(), c.getMonth() + 1, 1),
                          )
                        }
                        className="h-7 w-7 p-0 text-xs"
                        aria-label="Next month"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground">
                      {calendarCursor.toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {(() => {
                      const y = calendarCursor.getFullYear();
                      const m = calendarCursor.getMonth();
                      const daysInMonth = new Date(y, m + 1, 0).getDate();
                      const firstDow = new Date(y, m, 1).getDay();
                      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      return (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-7 gap-1.5">
                            {weekdays.map((wd) => (
                              <div
                                key={wd}
                                className={`text-center text-[10px] font-bold uppercase tracking-wide ${
                                  wd === "Sun"
                                    ? "text-slate-400 dark:text-slate-500"
                                    : "text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {wd}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1.5">
                            {Array.from({ length: firstDow }).map((_, i) => (
                              <div key={`blank-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const d = i + 1;
                              const isSunday = new Date(y, m, d).getDay() === 0;
                              const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                              const st = dailyByDate.get(key);
                              let cls =
                                "bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400";
                              if (isSunday) {
                                cls =
                                  "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
                              } else if (st === "PRESENT" || st === "LATE") {
                                cls = "bg-green-600 text-white";
                              } else if (st === "ABSENT") {
                                cls = "bg-red-600 text-white";
                              } else if (st === "HALF_DAY") {
                                cls = "bg-amber-500 text-white";
                              } else if (st === "EXCUSED") {
                                cls = "bg-blue-600 text-white";
                              }
                              return (
                                <div
                                  key={key}
                                  title={st ? `${key} — ${st.replace("_", " ")}` : key}
                                  className={`flex h-9 items-center justify-center rounded-md text-xs font-bold ${cls}`}
                                >
                                  {d}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-600" />
                        Present
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-600" />
                        Absent
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
                        Half Day
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" />
                        Excused
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200 dark:bg-slate-700" />
                        Sunday / Off
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Recent Attendance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Subject / Period</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedAttendance.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs font-medium">
                              {formatDisplayDate(a.attendanceDate, String(a.attendanceDate).slice(0, 10))}
                            </TableCell>
                            <TableCell>
                              <StatusChip status={a.status.toLowerCase()} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {a.subject?.name || (a.period ? `${a.period.name} (${a.period.startTime}–${a.period.endTime})` : "—")}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{a.remarks || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {builtReport && (
        <PrintableReportCard
          open={reportOpen}
          onOpenChange={setReportOpen}
          result={builtReport.row}
          examName={builtReport.exam.name}
          sessionName={selectedEnrollment?.academicSession.name}
          className={selectedEnrollment?.class.name}
          sectionName={selectedEnrollment?.section.name}
          guardianName={primaryGuardian ? `${primaryGuardian.guardian.firstName} ${primaryGuardian.guardian.lastName}` : ""}
          attendanceSummary={attendanceSummaryText}
        />
      )}

      {account && invoices.length > 0 && (
        <CollectProfileFeeDialog
          enrollmentId={activeEnrollmentId}
          invoices={invoices}
          open={collectOpen}
          onOpenChange={setCollectOpen}
          preselectIds={collectInvoiceIds}
          onSuccess={() => setFeesRefreshKey((k) => k + 1)}
        />
      )}

      {activeEnrollmentId && (
        <ManageFeeHeadsDialog
          enrollmentId={activeEnrollmentId}
          open={manageHeadsOpen}
          onOpenChange={setManageHeadsOpen}
          onSuccess={() => setFeesRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function FeeStatusTable({
  title,
  rows,
  accent,
  collectable,
  onCollect,
}: {
  title: string;
  rows: InvoiceRowRaw[];
  accent: "red" | "amber" | "emerald";
  collectable: boolean;
  onCollect?: (row: InvoiceRowRaw) => void;
}) {
  const dot = accent === "red" ? "bg-red-500" : accent === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const totalBalance = rows.reduce((s, r) => s + Number(r.balance || 0), 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          {title}
          <span className="text-[11px] font-medium text-muted-foreground">({rows.length})</span>
          {rows.length > 0 && totalBalance > 0 && (
            <span className="ml-auto text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {formatCurrency(totalBalance)} due
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fee Head</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Payable</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              {collectable && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={collectable ? 6 : 5}
                  className="text-center text-muted-foreground py-6 text-xs"
                >
                  No {title.toLowerCase()} dues for this enrollment.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    <span className="font-semibold block">{r.categoryName}</span>
                    <span className="text-muted-foreground text-[10px] block">
                      {r.periodLabel}
                      {r.source === "ADDON" && (
                        <span className="ml-1 text-blue-600 font-semibold">Add-on</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(r.dueDate)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{formatCurrency(r.payableAmount)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-emerald-600">
                    {formatCurrency(r.paidAmount)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-semibold">
                    {formatCurrency(r.balance)}
                  </TableCell>
                  {collectable && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 px-2.5"
                        onClick={() => onCollect?.(r)}
                      >
                        <CreditCard className="mr-1.5 h-3 w-3" /> Collect
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CollectProfileFeeDialog({
  enrollmentId,
  invoices,
  open,
  onOpenChange,
  preselectIds,
  onSuccess,
}: {
  enrollmentId: string;
  invoices: InvoiceRowRaw[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preselectIds: string[] | null;
  onSuccess: () => void;
}) {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const outstanding = useMemo(
    () =>
      invoices
        .filter((r) => Number(r.balance || 0) > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("CASH");
  const [ref, setRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [openedKey, setOpenedKey] = useState<string>("");

  const resetKey = `${preselectIds === null ? "ALL" : preselectIds.slice().sort().join("|")}`;
  const isPreset = open && openedKey !== resetKey;
  const presetSelected = useMemo(() => {
    if (!isPreset) return new Set<string>();
    if (preselectIds === null) return new Set(outstanding.map((r) => r.id));
    return new Set(outstanding.filter((r) => preselectIds.includes(r.id)).map((r) => r.id));
  }, [isPreset, preselectIds, outstanding]);

  if (isPreset) {
    setOpenedKey(resetKey);
    setSelected(presetSelected);
    const total = outstanding
      .filter((r) => presetSelected.has(r.id))
      .reduce((s, r) => s + Number(r.balance || 0), 0);
    setAmount(total ? String(total) : "");
    setMode("CASH");
    setRef("");
    setRemarks("");
  }

  const selectedRows = outstanding.filter((r) => selected.has(r.id));
  const selectedTotal = selectedRows.reduce((s, r) => s + Number(r.balance || 0), 0);
  const amountNum = Number(amount) || 0;
  const canConfirm = selected.size > 0 && amountNum > 0 && amountNum <= selectedTotal + 0.001 && !busy;

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const newTotal = outstanding
        .filter((r) => next.has(r.id))
        .reduce((s, r) => s + Number(r.balance || 0), 0);
      if ((Number(amount) || 0) > newTotal) setAmount(String(newTotal));
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!accessToken || busy) return;
    setBusy(true);
    try {
      const items: {
        studentFeeAssignmentId: string;
        feeStructureItemId: string;
        amount: number;
      }[] = [];
      let remaining = amountNum;
      for (const r of selectedRows) {
        if (remaining <= 0) break;
        const capacity = Number(r.balance || 0);
        if (capacity <= 0) continue;
        const applied = Math.round(Math.min(remaining, capacity) * 100) / 100;
        if (applied > 0) {
          items.push({
            studentFeeAssignmentId: r.assignmentId,
            feeStructureItemId: r.feeStructureItemId,
            amount: applied,
          });
        }
        remaining = Math.round((remaining - applied) * 100) / 100;
      }
      if (remaining > 0.001) {
        throw new Error("Amount exceeds the outstanding balance of the selected rows.");
      }
      const collection = await createFeeCollection(
        {
          studentEnrollmentId: enrollmentId,
          items,
          paymentMode: mode,
          ...(ref ? { referenceNumber: ref } : {}),
          ...(remarks ? { remarks } : {}),
        },
        accessToken,
      );
      toast("Payment recorded", `Receipt ${collection.receiptNumber} generated.`, "success");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast("Payment failed", e instanceof Error ? e.message : "Could not record payment.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Collect Fee</DialogTitle>
          <DialogDescription>
            Apply payment against this enrollment&apos;s outstanding dues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {outstanding.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No outstanding dues to collect.
            </p>
          ) : (
            <div className="space-y-1.5">
              {outstanding.map((r) => {
                const checked = selected.has(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer ${
                      checked
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRow(r.id)}
                      className="accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{r.categoryName}</span>
                      <span className="text-muted-foreground text-[10px] block">
                        {r.periodLabel} · due {formatDate(r.dueDate)}
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums">{formatCurrency(r.balance)}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1">Amount</label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => setAmount(String(selectedTotal))}
                >
                  Full
                </Button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1">Payment Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1">Reference Number (optional)</label>
              <Input value={ref} onChange={(e) => setRef(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1">Remarks (optional)</label>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Selected: {selectedRows.length} row(s) · {formatCurrency(selectedTotal)} outstanding.
          </p>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs bg-emerald-600 hover:bg-emerald-700"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CreditCard className="mr-1.5 h-3.5 w-3.5" />}
            Record Payment
          </Button>
        </DialogFooter>
      </Dialog>
  );
}