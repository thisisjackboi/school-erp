"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Edit2, Loader2, ChevronDown, ChevronRight, Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";

import { getExams } from "@/lib/api/exams.api";
import { getExamSchedules } from "@/lib/api/exam-schedules.api";
import { getClasses } from "@/lib/api/classes.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getStudents } from "@/lib/api/students.api";
import { getClassSubjects } from "@/lib/api/class-subjects.api";
import {
  getMarks,
  bulkCreateMarks,
  deleteMark,
  BulkCreateMarkPayload,
} from "@/lib/api/marks.api";
import {
  getExamResults,
  createExamResult,
  deleteExamResult,
} from "@/lib/api/exam-results.api";
import {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  CreateGradePayload,
} from "@/lib/api/grades.api";

import type { Mark, ExamResult, Grade } from "@/lib/types/marks";
import type { Exam, ExamSchedule } from "@/lib/types/exam";
import type { SchoolClass } from "@/lib/types/class";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { ClassSubject } from "@/lib/types/class-subject";

import {
  firstError,
  onlyDecimal,
  onlyDigits,
  trimMax,
  validateMaxLength,
  validateNumeric,
} from "@/lib/input-restrictions";

interface StudentWithEnrollment {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  enrollment?: {
    id: string;
    rollNumber?: string | null;
    class?: { id: string; name: string };
    section?: { id: string; name: string };
    academicSession?: { id: string; name: string };
  };
}

function safeDateStr(val: unknown): string {
  if (!val) return "N/A";
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "N/A" : val.toLocaleDateString();
  }
  return "N/A";
}

function safeDateInput(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "" : val.toISOString().split("T")[0];
  }
  return "";
}

export default function MarksPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("marks");

  const [marks, setMarks] = useState<Mark[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

  const [loading, setLoading] = useState(true);

  // Filters
  const [marksFilterExam, setMarksFilterExam] = useState("");
  const [marksFilterClass, setMarksFilterClass] = useState("");
  const [resultsFilterExam, setResultsFilterExam] = useState("");
  const [resultsFilterSession, setResultsFilterSession] = useState("");

  // Modals
  const [bulkEntryOpen, setBulkEntryOpen] = useState(false);
  const [generateResultOpen, setGenerateResultOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Bulk entry state
  const [bulkScheduleId, setBulkScheduleId] = useState("");
  const [bulkStudentMarks, setBulkStudentMarks] = useState<
    { studentEnrollmentId: string; studentName: string; rollNumber: string; marksObtained: string; isAbsent: boolean }[]
  >([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Generate result state
  const [resultExamId, setResultExamId] = useState("");
  const [resultEnrollmentId, setResultEnrollmentId] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState<StudentWithEnrollment[]>([]);

  // Grade form
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [gradeForm, setGradeForm] = useState({ gradeName: "", minPercent: "", maxPercent: "", gradePoint: "" });

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; kind: "mark" | "result" | "grade" } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Collapsible class groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // ── Data Loading ──────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [marksList, resultsList, gradesList, examList, scheduleList, sessList, clsList, csList] = await Promise.all([
        getMarks({}, accessToken).catch(() => []),
        getExamResults({}, accessToken).catch(() => []),
        getGrades(accessToken).catch(() => []),
        getExams({}, accessToken).catch(() => []),
        getExamSchedules({}, accessToken).catch(() => []),
        getAcademicSessions(accessToken).catch(() => []),
        getClasses(accessToken).catch(() => []),
        getClassSubjects(accessToken).catch(() => []),
      ]);
      setMarks(marksList || []);
      setExamResults(resultsList || []);
      setGrades(gradesList || []);
      setExams(examList || []);
      setExamSchedules(scheduleList || []);
      setSessions(sessList || []);
      setClasses(clsList || []);
      setClassSubjects(csList || []);
    } catch (err: any) {
      toast("Error", err.message || "Failed to load marks data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [accessToken]);

  // ── Derived: schedules filtered by class-subject mapping ──────
  const selectedSchedule = examSchedules.find((sc) => sc.id === bulkScheduleId);
  const selectedExam = selectedSchedule ? exams.find((e) => e.id === selectedSchedule.examId) : null;

  const subjectsForClass = useMemo(() => {
    if (!selectedExam) return [];
    const subjectIds = classSubjects
      .filter((cs) => cs.classId === selectedExam.classId && cs.academicSessionId === selectedExam.academicSessionId)
      .map((cs) => cs.subjectId);
    return subjectIds;
  }, [classSubjects, selectedExam]);

  const filteredSchedules = useMemo(() => {
    if (subjectsForClass.length === 0 && !bulkScheduleId) return examSchedules;
    if (subjectsForClass.length === 0) return examSchedules;
    return examSchedules.filter(
      (sc) => sc.examId === selectedExam?.id && subjectsForClass.includes(sc.subjectId)
    );
  }, [examSchedules, subjectsForClass, selectedExam]);

  // ── Derived: marks grouped by class+section ───────────────────
  const groupedMarks = useMemo(() => {
    const filtered = marks.filter((m) => {
      if (marksFilterExam && m.examSchedule?.examId !== marksFilterExam) return false;
      if (marksFilterClass && m.studentEnrollment?.class?.id !== marksFilterClass) return false;
      return true;
    });

    const groups: Record<string, { className: string; sectionName: string; items: Mark[] }> = {};
    for (const m of filtered) {
      const classId = m.studentEnrollment?.class?.id || "unknown";
      const sectionName = m.studentEnrollment?.section?.name || "-";
      const className = m.studentEnrollment?.class?.name || "Unknown Class";
      const key = `${classId}::${sectionName}`;
      if (!groups[key]) {
        groups[key] = { className, sectionName, items: [] };
      }
      groups[key].items.push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [marks, marksFilterExam, marksFilterClass]);

  // ── Filter Effects ────────────────────────────────────────────
  const applyResultsFilters = async () => {
    try {
      const filters: { examId?: string; academicSessionId?: string } = {};
      if (resultsFilterExam) filters.examId = resultsFilterExam;
      if (resultsFilterSession) filters.academicSessionId = resultsFilterSession;
      const filtered = await getExamResults(filters, accessToken);
      setExamResults(filtered);
    } catch (err: any) {
      toast("Error", err.message || "Failed to filter results", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "results") applyResultsFilters();
  }, [resultsFilterExam, resultsFilterSession]);

  // ── Bulk Mark Entry ───────────────────────────────────────────
  const openBulkEntry = () => {
    setBulkScheduleId("");
    setBulkStudentMarks([]);
    setBulkEntryOpen(true);
  };

  const loadStudentsForSchedule = async (scheduleId: string) => {
    if (!scheduleId) {
      setBulkStudentMarks([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const schedule = examSchedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

      const exam = exams.find((e) => e.id === schedule.examId);
      if (!exam) return;

      const students = await getStudents(accessToken, {
        academicSessionId: exam.academicSessionId,
        classId: exam.classId,
      });

      const mapped = students.map((s: StudentWithEnrollment) => {
        const enrollment = s.enrollment;
        return {
          studentEnrollmentId: enrollment?.id || "",
          studentName: `${s.firstName} ${s.lastName}`,
          rollNumber: enrollment?.rollNumber || "-",
          marksObtained: "",
          isAbsent: false,
        };
      }).filter((m) => m.studentEnrollmentId);

      setBulkStudentMarks(mapped);
    } catch (err: any) {
      toast("Error", err.message || "Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  };

  const updateBulkMark = (idx: number, field: "marksObtained" | "isAbsent", value: string | boolean) => {
    const updated = [...bulkStudentMarks];
    const maxMarks = getSelectedScheduleMaxMarks();

    if (field === "marksObtained") {
      let num = value === "" ? "" : String(Math.min(Math.max(0, Number(value)), maxMarks));
      updated[idx].marksObtained = num;
    } else {
      updated[idx].isAbsent = value as boolean;
      if (value) updated[idx].marksObtained = "0";
    }
    setBulkStudentMarks(updated);
  };

  const handleBulkSubmit = async () => {
    if (!bulkScheduleId) return toast("Error", "Select an exam schedule", "error");
    const maxMarks = getSelectedScheduleMaxMarks();
    const validRecords = bulkStudentMarks.filter((s) => s.studentEnrollmentId && !s.isAbsent && s.marksObtained !== "");
    if (validRecords.length === 0) return toast("Error", "Enter at least one mark", "error");

    const schedule = examSchedules.find((sc) => sc.id === bulkScheduleId);
    const lockedStudents = validRecords.filter((s) =>
      examResults.some((r) => r.examId === schedule?.examId && r.studentEnrollmentId === s.studentEnrollmentId)
    );
    if (lockedStudents.length > 0) {
      return toast(
        "Error",
        `Results already generated for: ${lockedStudents.map((s) => s.studentName).join(", ")}. Delete the result to edit these marks.`,
        "error"
      );
    }

    for (const r of validRecords) {
      const num = Number(r.marksObtained);
      if (isNaN(num) || num < 0 || num > maxMarks) {
        return toast("Error", `Marks for ${r.studentName} must be between 0 and ${maxMarks}`, "error");
      }
    }

    setSubmitting(true);
    try {
      const payload: BulkCreateMarkPayload = {
        examScheduleId: bulkScheduleId,
        records: validRecords.map((r) => ({
          studentEnrollmentId: r.studentEnrollmentId,
          marksObtained: Number(r.marksObtained),
          isAbsent: r.isAbsent,
        })),
      };
      await bulkCreateMarks(payload, accessToken);
      toast("Success", `Marks saved for ${validRecords.length} students.`, "success");
      setBulkEntryOpen(false);
      const updated = await getMarks({}, accessToken);
      setMarks(updated || []);
    } catch (err: any) {
      toast("Error", err.message || "Failed to save marks", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Generate Exam Result ──────────────────────────────────────
  const openGenerateResult = () => {
    setResultExamId("");
    setResultEnrollmentId("");
    setEnrolledStudents([]);
    setGenerateResultOpen(true);
  };

  const loadEnrolledForExam = async (examId: string) => {
    if (!examId) {
      setEnrolledStudents([]);
      return;
    }
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const students = await getStudents(accessToken, {
        academicSessionId: exam.academicSessionId,
        classId: exam.classId,
      });
      setEnrolledStudents(students as StudentWithEnrollment[]);
    } catch (err: any) {
      toast("Error", err.message || "Failed to load students", "error");
    }
  };

  const handleGenerateResult = async () => {
    if (!resultExamId) return toast("Error", "Select an exam", "error");
    if (!resultEnrollmentId) return toast("Error", "Select a student", "error");

    setSubmitting(true);
    try {
      await createExamResult({ examId: resultExamId, studentEnrollmentId: resultEnrollmentId }, accessToken);
      toast("Success", "Exam result generated.", "success");
      setGenerateResultOpen(false);
      await applyResultsFilters();
    } catch (err: any) {
      toast("Error", err.message || "Failed to generate result", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Grade Handlers ────────────────────────────────────────────
  const openCreateGrade = () => {
    setEditingGrade(null);
    setGradeForm({ gradeName: "", minPercent: "", maxPercent: "", gradePoint: "" });
    setGradeModalOpen(true);
  };

  const openEditGrade = (g: Grade) => {
    setEditingGrade(g);
    setGradeForm({
      gradeName: g.gradeName,
      minPercent: String(g.minPercent),
      maxPercent: String(g.maxPercent),
      gradePoint: g.gradePoint != null ? String(g.gradePoint) : "",
    });
    setGradeModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm.gradeName.trim()) return toast("Error", "Grade name is required", "error");
    if (!gradeForm.minPercent || !gradeForm.maxPercent) return toast("Error", "Min and max percent are required", "error");

    const gradeError = firstError(
      validateMaxLength(gradeForm.gradeName, "Grade name", 30),
      validateNumeric(gradeForm.minPercent, "Min %", { min: 0, max: 100 }),
      validateNumeric(gradeForm.maxPercent, "Max %", { min: 0, max: 100 }),
      ...(gradeForm.gradePoint
        ? [validateNumeric(gradeForm.gradePoint, "Grade point", { min: 0, max: 10 })]
        : []),
    );
    if (gradeError) return toast("Error", gradeError, "error");
    if (Number(gradeForm.maxPercent) < Number(gradeForm.minPercent)) {
      return toast("Error", "Max % cannot be less than Min %", "error");
    }

    setSubmitting(true);
    try {
      const payload: CreateGradePayload = {
        gradeName: gradeForm.gradeName.trim(),
        minPercent: Number(gradeForm.minPercent),
        maxPercent: Number(gradeForm.maxPercent),
        gradePoint: gradeForm.gradePoint ? Number(gradeForm.gradePoint) : undefined,
      };
      if (editingGrade) {
        await updateGrade(editingGrade.id, payload, accessToken);
        toast("Updated", `Grade "${gradeForm.gradeName}" updated.`, "success");
      } else {
        await createGrade(payload, accessToken);
        toast("Created", `Grade "${gradeForm.gradeName}" created.`, "success");
      }
      setGradeModalOpen(false);
      setGrades(await getGrades(accessToken));
    } catch (err: any) {
      toast("Error", err.message || "Failed to save grade", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Handlers ───────────────────────────────────────────
  const promptDelete = (kind: "mark" | "result" | "grade", id: string, name: string) => {
    setDeleteTarget({ id, name, kind });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.kind === "mark") {
        await deleteMark(deleteTarget.id, accessToken);
        toast("Deleted", "Mark deleted.", "success");
        const updated = await getMarks({}, accessToken);
        setMarks(updated || []);
      } else if (deleteTarget.kind === "result") {
        await deleteExamResult(deleteTarget.id, accessToken);
        toast("Deleted", "Exam result deleted.", "success");
        await applyResultsFilters();
      } else {
        await deleteGrade(deleteTarget.id, accessToken);
        toast("Deleted", `Grade "${deleteTarget.name}" deleted.`, "success");
        setGrades(await getGrades(accessToken));
      }
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const getSelectedScheduleMaxMarks = () => {
    const s = examSchedules.find((sc) => sc.id === bulkScheduleId);
    return Number(s?.maxMarks ?? 100);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Marks & Results</h1>
          <p className="text-xs text-muted-foreground">Enter student marks, generate exam results, and manage grading scale.</p>
        </div>
        <Button
          onClick={() => (activeTab === "marks" ? openBulkEntry() : activeTab === "results" ? openGenerateResult() : openCreateGrade())}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {activeTab === "marks" ? "Enter Marks" : activeTab === "results" ? "Generate Result" : "Add Grade"}
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading marks data...</p>
        </Card>
      ) : (
        <Tabs defaultValue="marks" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="marks">Marks</TabsTrigger>
            <TabsTrigger value="results">Exam Results</TabsTrigger>
            <TabsTrigger value="grades">Grading Scale</TabsTrigger>
          </TabsList>

          {/* ── Marks Tab (grouped by class+section) ─────── */}
          <TabsContent value="marks">
            <Card>
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Student Marks</CardTitle>
                  <Button onClick={openBulkEntry} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Enter Marks
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={marksFilterExam} onChange={(e) => setMarksFilterExam(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Exams</option>
                    {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                  <select value={marksFilterClass} onChange={(e) => setMarksFilterClass(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {groupedMarks.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No marks recorded yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {groupedMarks.map(([key, group]) => {
                      const isExpanded = expandedGroups[key] !== false;
                      return (
                        <div key={key}>
                          <button
                            onClick={() => toggleGroup(key)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors text-left"
                          >
                            <div className="flex items-center space-x-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{group.className}</span>
                              <span className="text-xs text-muted-foreground">— Section {group.sectionName}</span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {group.items.length} marks
                            </span>
                          </button>
                          {isExpanded && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student</TableHead>
                                  <TableHead>Roll</TableHead>
                                  <TableHead>Subject</TableHead>
                                  <TableHead>Marks</TableHead>
                                  <TableHead>Max</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.items.map((m) => (
                                  <TableRow key={m.id}>
                                    <TableCell className="font-semibold">
                                      {m.studentEnrollment?.student?.firstName} {m.studentEnrollment?.student?.lastName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{m.studentEnrollment?.rollNumber || "-"}</TableCell>
                                    <TableCell>{m.examSchedule?.subject?.name || "N/A"}</TableCell>
                                    <TableCell className="font-semibold">
                                      {m.isAbsent ? <span className="text-rose-500">Absent</span> : m.marksObtained}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{m.examSchedule?.maxMarks}</TableCell>
                                    <TableCell className="text-muted-foreground">{safeDateStr(m.examSchedule?.examDate)}</TableCell>
                                    <TableCell>
                                      {m.isAbsent ? (
                                        <StatusChip status="absent" />
                                      ) : m.examSchedule && m.marksObtained != null && Number(m.marksObtained) >= Number(m.examSchedule.passingMarks) ? (
                                        <StatusChip status="pass" />
                                      ) : (
                                        <StatusChip status="fail" />
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {examResults.some((r) => r.examId === m.examSchedule?.examId && r.studentEnrollmentId === m.studentEnrollmentId) ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled
                                          title="Result already generated — delete the result to edit this mark"
                                          className="h-8 w-8 p-0 text-muted-foreground/40 cursor-not-allowed"
                                        >
                                          <Lock className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <Button variant="ghost" size="sm" onClick={() => promptDelete("mark", m.id, "mark")} className="h-8 w-8 p-0 text-rose-600">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Exam Results Tab ───────────────────────────── */}
          <TabsContent value="results">
            <Card>
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Exam Results</CardTitle>
                  <Button onClick={openGenerateResult} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Generate Result
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={resultsFilterExam} onChange={(e) => setResultsFilterExam(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Exams</option>
                    {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                  <select value={resultsFilterSession} onChange={(e) => setResultsFilterSession(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Sessions</option>
                    {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {examResults.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No exam results generated yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-semibold">
                            {r.studentEnrollment?.student?.firstName} {r.studentEnrollment?.student?.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{r.studentEnrollment?.rollNumber || "-"}</TableCell>
                          <TableCell>{r.exam?.name || "N/A"}</TableCell>
                          <TableCell>{r.studentEnrollment?.class?.name || "N/A"}</TableCell>
                          <TableCell className="font-semibold">
                            {r.totalMarksObtained} / {r.totalMaxMarks}
                          </TableCell>
                          <TableCell className="font-semibold">{Number(r.percentage).toFixed(1)}%</TableCell>
                          <TableCell>{r.grade?.gradeName || "-"}</TableCell>
                          <TableCell>{r.rankInSection || "-"}</TableCell>
                          <TableCell><StatusChip status={r.resultStatus.toLowerCase()} /></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => promptDelete("result", r.id, "result")} className="h-8 w-8 p-0 text-rose-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Grades Tab ─────────────────────────────────── */}
          <TabsContent value="grades">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-bold">Grading Scale</CardTitle>
                <Button onClick={openCreateGrade} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Grade
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {grades.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No grades defined yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade Name</TableHead>
                        <TableHead>Min %</TableHead>
                        <TableHead>Max %</TableHead>
                        <TableHead>Grade Point</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-semibold">{g.gradeName}</TableCell>
                          <TableCell>{g.minPercent}%</TableCell>
                          <TableCell>{g.maxPercent}%</TableCell>
                          <TableCell className="text-muted-foreground">{g.gradePoint != null ? g.gradePoint : "-"}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditGrade(g)} className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => promptDelete("grade", g.id, g.gradeName)} className="h-8 w-8 p-0 text-rose-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ── Dialog: Bulk Mark Entry ──────────────────────── */}
      <Dialog open={bulkEntryOpen} onOpenChange={setBulkEntryOpen}>
        <DialogHeader>
          <DialogTitle>Enter Marks (Bulk)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Select Exam Schedule *</label>
            <select
              value={bulkScheduleId}
              onChange={(e) => {
                setBulkScheduleId(e.target.value);
                loadStudentsForSchedule(e.target.value);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select a schedule</option>
              {filteredSchedules.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.exam?.name} — {sc.subject?.name} (Max: {Number(sc.maxMarks)})
                </option>
              ))}
            </select>
            {bulkScheduleId && selectedExam && subjectsForClass.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">No subjects mapped to this class. Add class-subject mappings first.</p>
            )}
          </div>

          {bulkScheduleId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Max Marks: <strong>{getSelectedScheduleMaxMarks()}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Students: <strong>{bulkStudentMarks.length}</strong>
                </p>
              </div>

              {loadingStudents ? (
                <div className="p-6 flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading students...</span>
                </div>
              ) : bulkStudentMarks.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No students enrolled in this class.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead className="w-28">Marks (0-{getSelectedScheduleMaxMarks()})</TableHead>
                        <TableHead className="w-16">Absent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkStudentMarks.map((sm, idx) => {
                        const isLocked = examResults.some(
                          (r) => r.examId === selectedSchedule?.examId && r.studentEnrollmentId === sm.studentEnrollmentId
                        );
                        return (
                          <TableRow key={sm.studentEnrollmentId}>
                            <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="text-xs font-semibold">
                              <span className="inline-flex items-center gap-1">
                                {sm.studentName}
                                {isLocked && <Lock className="h-3 w-3 text-emerald-600" />}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{sm.rollNumber}</TableCell>
                            <TableCell>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min="0"
                                max={getSelectedScheduleMaxMarks()}
                                disabled={sm.isAbsent || isLocked}
                                value={sm.marksObtained}
                                onChange={(e) => updateBulkMark(idx, "marksObtained", onlyDigits(e.target.value, 5))}
                                maxLength={5}
                                className="w-full h-8 rounded border border-input bg-background px-2 text-xs disabled:opacity-40"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                checked={sm.isAbsent}
                                disabled={isLocked}
                                onChange={(e) => updateBulkMark(idx, "isAbsent", e.target.checked)}
                                className="h-4 w-4"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setBulkEntryOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleBulkSubmit} disabled={submitting || !bulkScheduleId} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save Marks
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Dialog: Generate Result ──────────────────────── */}
      <Dialog open={generateResultOpen} onOpenChange={setGenerateResultOpen}>
        <DialogHeader>
          <DialogTitle>Generate Exam Result</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Select Exam *</label>
            <select
              value={resultExamId}
              onChange={(e) => {
                setResultExamId(e.target.value);
                setResultEnrollmentId("");
                loadEnrolledForExam(e.target.value);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select an exam</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {resultExamId && (
            <div>
              <label className="text-xs font-semibold block mb-1">Select Student *</label>
              <select
                value={resultEnrollmentId}
                onChange={(e) => setResultEnrollmentId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select a student</option>
                {enrolledStudents.map((s) => {
                  const enrollment = s.enrollment;
                  return enrollment ? (
                    <option key={enrollment.id} value={enrollment.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </option>
                  ) : null;
                })}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setGenerateResultOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleGenerateResult} disabled={submitting || !resultExamId || !resultEnrollmentId} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Generate
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Dialog: Grade Form ───────────────────────────── */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingGrade ? "Edit Grade" : "Add Grade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Grade Name *</label>
            <Input placeholder="e.g. A+, A, B" maxLength={30} value={gradeForm.gradeName} onChange={(e) => setGradeForm({ ...gradeForm, gradeName: trimMax(e.target.value, 30) })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Min % *</label>
              <Input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={gradeForm.minPercent} onChange={(e) => setGradeForm({ ...gradeForm, minPercent: onlyDigits(e.target.value, 3) })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Max % *</label>
              <Input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={gradeForm.maxPercent} onChange={(e) => setGradeForm({ ...gradeForm, maxPercent: onlyDigits(e.target.value, 3) })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Grade Point</label>
              <Input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" maxLength={4} value={gradeForm.gradePoint} onChange={(e) => setGradeForm({ ...gradeForm, gradePoint: onlyDecimal(e.target.value, 2, 2) })} />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setGradeModalOpen(false)} className="text-xs">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingGrade ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ──────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2 text-xs text-muted-foreground">
          <p>Are you sure you want to delete this {deleteTarget?.kind}?</p>
          <p className="text-rose-500">This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={confirmDelete} disabled={submitting} className="bg-rose-600 hover:bg-rose-500 text-white text-xs">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
