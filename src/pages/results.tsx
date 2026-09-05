"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2, ChevronDown, ChevronRight, Award, Users, TrendingUp,
  AlertCircle, X, Printer, BarChart3, CheckCircle2, Lock,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";

import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getExams } from "@/lib/api/exams.api";
import { getExamSchedules } from "@/lib/api/exam-schedules.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import { getStudents } from "@/lib/api/students.api";
import { getMarks } from "@/lib/api/marks.api";
import { getExamResults, createExamResult, type CreateExamResultPayload } from "@/lib/api/exam-results.api";
import { getGrades, createGrade, updateGrade, deleteGrade, type CreateGradePayload } from "@/lib/api/grades.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { Exam, ExamSchedule } from "@/lib/types/exam";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { Mark, ExamResult, Grade } from "@/lib/types/marks";
import {
  buildStudentResults,
  isAbsentOnly,
  type StudentWithEnrollment,
  type StudentResultRow,
} from "@/lib/exam-results-utils";
import { loadExamWorkflowContext, saveExamWorkflowContext } from "@/lib/exam-context";

import {
  firstError,
  onlyDecimal,
  onlyDigits,
  trimMax,
  validateMaxLength,
  validateNumeric,
} from "@/lib/input-restrictions";

export default function ResultsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  // ── Reference Data ───────────────────────────────────────────
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [allMarks, setAllMarks] = useState<Mark[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // ── Cascade Selection ────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  // ── Students ─────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentWithEnrollment[]>([]);

  // ── Loading States ───────────────────────────────────────────
  const [loadingRef, setLoadingRef] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── Views ────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<StudentResultRow | null>(null);
  const [showGrades, setShowGrades] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [gradeForm, setGradeForm] = useState({ gradeName: "", minPercent: "", maxPercent: "", gradePoint: "" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);

  // ── Derived Data ─────────────────────────────────────────────
  const selectedExam = useMemo(() => exams.find((e) => e.id === selectedExamId), [exams, selectedExamId]);

  const filteredExams = useMemo(() => {
    if (!selectedSession) return [];
    return exams.filter((e) => e.academicSessionId === selectedSession);
  }, [exams, selectedSession]);

  const filteredSections = useMemo(() => {
    if (!selectedClassId || !selectedSession) return [];
    return sections.filter((s) => s.classId === selectedClassId && s.academicSessionId === selectedSession);
  }, [sections, selectedClassId, selectedSession]);

  // ── Student Results Calculation ──────────────────────────────
  const studentResults = useMemo(() => {
    if (!selectedExamId || students.length === 0) return [];
    return buildStudentResults({
      students,
      examResults,
      allMarks,
      examSchedules,
      selectedExamId,
      grades,
    });
  }, [students, examResults, allMarks, examSchedules, selectedExamId, grades]);

  // ── Overview Stats ───────────────────────────────────────────
  const stats = useMemo(() => {
    const total = studentResults.length;
    const generated = studentResults.filter((r) => r.result).length;
    const pending = total - generated;
    const avg = total > 0
      ? studentResults.filter((r) => r.result).reduce((sum, r) => sum + r.percentage, 0) / (generated || 1)
      : 0;
    const passCount = studentResults.filter((r) => r.result?.resultStatus === "PASS").length;
    return { total, generated, pending, avg, passCount };
  }, [studentResults]);

  // ── Load Reference Data ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingRef(true);
      try {
        const [sessList, clsList, secList, gradeList] = await Promise.all([
          getAcademicSessions(accessToken).catch(() => []),
          getClasses(accessToken).catch(() => []),
          getSections(accessToken).catch(() => []),
          getGrades(accessToken).catch(() => []),
        ]);
        setSessions(sessList || []);
        setClasses(clsList || []);
        setSections(secList || []);
        setGrades(gradeList || []);
        const savedCtx = loadExamWorkflowContext();
        const current = (sessList || []).find((s: AcademicSession) => s.isCurrent);
        if (savedCtx?.sessionId && (sessList || []).some((s: AcademicSession) => s.id === savedCtx.sessionId)) {
          setSelectedSession(savedCtx.sessionId);
        } else if (current) {
          setSelectedSession(current.id);
        }
      } catch {
        toast("Error", "Failed to load data", "error");
      } finally {
        setLoadingRef(false);
      }
    };
    load();
  }, [accessToken]);

  // ── Load Exams on Session Change ─────────────────────────────
  useEffect(() => {
    if (!selectedSession) { setExams([]); return; }
    getExams({ academicSessionId: selectedSession }, accessToken)
      .then((list) => setExams(list || []))
      .catch(() => setExams([]));
  }, [selectedSession, accessToken]);

  // ── Cascade Resets ───────────────────────────────────────────
  useEffect(() => { setSelectedExamId(""); setSelectedClassId(""); setSelectedSectionId(""); }, [selectedSession]);
  useEffect(() => { setSelectedClassId(""); setSelectedSectionId(""); }, [selectedExamId]);
  useEffect(() => { setSelectedSectionId(""); }, [selectedClassId]);

  // ── Restore persisted context (Session → Exam → Class → Section) ─
  useEffect(() => {
    if (selectedSession && !selectedExamId && exams.length) {
      const ctx = loadExamWorkflowContext();
      if (ctx && ctx.sessionId === selectedSession && ctx.examId && exams.some((e) => e.id === ctx.examId)) {
        setSelectedExamId(ctx.examId);
      }
    }
  }, [selectedSession, selectedExamId, exams]);

  useEffect(() => {
    if (selectedExamId && !selectedClassId && classes.length) {
      const ctx = loadExamWorkflowContext();
      if (ctx && ctx.classId && classes.some((c) => c.id === ctx.classId)) {
        setSelectedClassId(ctx.classId);
      }
    }
  }, [selectedExamId, selectedClassId, classes]);

  useEffect(() => {
    if (selectedClassId && !selectedSectionId && sections.length) {
      const ctx = loadExamWorkflowContext();
      if (ctx && ctx.sectionId && sections.some((s) => s.id === ctx.sectionId && s.classId === selectedClassId)) {
        setSelectedSectionId(ctx.sectionId);
      }
    }
  }, [selectedClassId, selectedSectionId, sections]);

  // ── Persist context so Marks → Results stays uninterrupted ───
  useEffect(() => {
    if (selectedSession && selectedExamId && selectedClassId && selectedSectionId) {
      saveExamWorkflowContext({
        sessionId: selectedSession,
        examId: selectedExamId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
    }
  }, [selectedSession, selectedExamId, selectedClassId, selectedSectionId]);

  // ── Load Exam Schedules + Results on Exam Change ─────────────
  useEffect(() => {
    if (!selectedExamId) { setExamSchedules([]); setExamResults([]); setAllMarks([]); return; }
    Promise.all([
      getExamSchedules({ examId: selectedExamId }, accessToken).catch(() => []),
      getExamResults({ examId: selectedExamId }, accessToken).catch(() => []),
    ]).then(([scheds, results]) => {
      setExamSchedules(scheds || []);
      setExamResults(results || []);
      const schedIds = (scheds || []).map((s: ExamSchedule) => s.id);
      if (schedIds.length > 0) {
        Promise.all(schedIds.map((id: string) => getMarks({ examScheduleId: id }, accessToken).catch(() => [])))
          .then((markArrays) => setAllMarks(markArrays.flat()))
          .catch(() => setAllMarks([]));
      }
    });
  }, [selectedExamId, accessToken]);

  // ── Load Students ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClassId || !selectedSession || !selectedSectionId) { setStudents([]); return; }
    setLoadingStudents(true);
    getStudents(accessToken, {
      academicSessionId: selectedSession,
      classId: selectedClassId,
      sectionId: selectedSectionId,
    })
      .then((list: any[]) => {
        const mapped: StudentWithEnrollment[] = (list || []).map((s: any) => ({
          enrollmentId: s.enrollment?.id || "",
          studentId: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          rollNumber: s.enrollment?.rollNumber || null,
          admissionNumber: s.admissionNumber,
        })).filter((s: StudentWithEnrollment) => s.enrollmentId);
        setStudents(mapped);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId, selectedSession, selectedSectionId, accessToken]);

  // ── Generate Results ─────────────────────────────────────────
  const handleGenerateAll = async () => {
    if (!selectedExamId) return;
    setGenerateConfirmOpen(false);
    const pendingRows = studentResults.filter((r) => !r.result && r.subjectMarks.length > 0);
    if (pendingRows.length === 0) return toast("Info", "All students already have results.", "info");

    setGenerating(true);
    let successCount = 0;
    const failed: string[] = [];
    for (const row of pendingRows) {
      try {
        await createExamResult({ examId: selectedExamId, studentEnrollmentId: row.student.enrollmentId } as CreateExamResultPayload, accessToken);
        successCount++;
      } catch (err) {
        failed.push(`${row.student.firstName} ${row.student.lastName}${err instanceof Error ? ` — ${err.message}` : ""}`);
      }
    }
    let message = `Generated ${successCount} result${successCount !== 1 ? "s" : ""}.`;
    if (failed.length > 0) message += ` ${failed.length} failed: ${failed.join("; ")}.`;
    toast("Results", message, failed.length === 0 || successCount > 0 ? "success" : "error");
    const results = await getExamResults({ examId: selectedExamId }, accessToken).catch(() => []);
    setExamResults(results || []);
    setGenerating(false);
  };

  // ── Grade CRUD ───────────────────────────────────────────────
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
      gradePoint: g.gradePoint ? String(g.gradePoint) : "",
    });
    setGradeModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm.gradeName.trim()) return toast("Error", "Grade name is required", "error");
    if (!gradeForm.minPercent || !gradeForm.maxPercent) return toast("Error", "Min and Max % are required", "error");

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
    }
  };

  const confirmDeleteGrade = async () => {
    if (!itemToDelete) return;
    try {
      await deleteGrade(itemToDelete.id, accessToken);
      toast("Deleted", `Grade "${itemToDelete.name}" deleted.`, "success");
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      setGrades(await getGrades(accessToken));
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete grade", "error");
    }
  };

  // ── Loading State ────────────────────────────────────────────
  if (loadingRef) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Results</h1>
          <p className="text-xs text-muted-foreground mt-1">View and manage student examination results</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name;
  const selectedSectionName = filteredSections.find((s) => s.id === selectedSectionId)?.name;

  // ── Grades Tab ───────────────────────────────────────────────
  if (showGrades) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowGrades(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Grading Scale</h1>
              <p className="text-xs text-muted-foreground mt-1">Define grade boundaries for percentage-based grading</p>
            </div>
          </div>
          <Button size="sm" onClick={openCreateGrade} className="bg-blue-600 hover:bg-blue-700 text-xs">
            + Add Grade
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {grades.length === 0 ? (
              <div className="py-12 text-center">
                <Award className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No grades configured.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Min %</TableHead>
                    <TableHead>Max %</TableHead>
                    <TableHead>Grade Point</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.sort((a, b) => Number(b.minPercent) - Number(a.minPercent)).map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-semibold">{g.gradeName}</TableCell>
                      <TableCell>{Number(g.minPercent)}%</TableCell>
                      <TableCell>{Number(g.maxPercent)}%</TableCell>
                      <TableCell>{g.gradePoint ? Number(g.gradePoint) : "-"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditGrade(g)} className="h-8 w-8 p-0">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ id: g.id, name: g.gradeName }); setDeleteConfirmOpen(true); }} className="h-8 w-8 p-0 text-rose-600">Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
          <DialogHeader>
            <DialogTitle>{editingGrade ? "Edit Grade" : "Add Grade"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Grade Name *</label>
              <Input placeholder="e.g. A+" maxLength={30} value={gradeForm.gradeName} onChange={(e) => setGradeForm({ ...gradeForm, gradeName: trimMax(e.target.value, 30) })} />
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
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-xs">{editingGrade ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogHeader><DialogTitle>Delete Grade</DialogTitle></DialogHeader>
          <div className="py-4 text-xs text-muted-foreground">
            <p>Are you sure you want to delete <strong className="text-foreground">{itemToDelete?.name}</strong>?</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={confirmDeleteGrade} className="bg-red-600 hover:bg-red-700 text-xs">Delete</Button>
          </div>
        </Dialog>
      </div>
    );
  }

  // ── Main Results View ────────────────────────────────────────
  const hasResults = selectedExamId && selectedClassId && selectedSectionId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Results</h1>
          <p className="text-xs text-muted-foreground mt-1">View and manage student examination results</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowGrades(true)} className="text-xs">
          <Award className="h-3 w-3 mr-1" />
          Grading Scale
        </Button>
      </div>

      {/* ── Cascade Filters ────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Session *</label>
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
              <label className="text-xs font-semibold block mb-1">Examination *</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                disabled={!selectedSession}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs disabled:opacity-50"
              >
                <option value="">{selectedSession ? "Select Exam" : "Select session first"}</option>
                {filteredExams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Class *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={!selectedExamId}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs disabled:opacity-50"
              >
                <option value="">{selectedExamId ? "Select Class" : "Select exam first"}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Section *</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs disabled:opacity-50"
              >
                <option value="">{selectedClassId ? "Select Section" : "Select class first"}</option>
                {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Context Banner ─────────────────────────────────── */}
      {hasResults && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedExam?.name}</span>
            <span className="text-blue-400">•</span>
            <span className="font-medium">{selectedClassName} • {selectedSectionName}</span>
          </div>
          {stats.pending > 0 ? (
            <Button
              size="sm"
              onClick={() => setGenerateConfirmOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              <Award className="h-3.5 w-3.5 mr-1" />
              Generate Results ({stats.pending})
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">All results generated</span>
            </div>
          )}
        </div>
      )}

      {/* ── Pending Results Notice ─────────────────────────── */}
      {hasResults && stats.pending > 0 && (
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
          <strong>{stats.pending} student{stats.pending !== 1 ? "s" : ""}</strong> have marks entered but results not yet generated.
          Click <strong>"Generate Results"</strong> to aggregate all subject marks into finalized results with totals, percentages, grades, and ranks.
          Marks can still be edited until results are generated.
        </div>
      )}

      {/* ── Overview Cards ─────────────────────────────────── */}
      {hasResults && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Results Generated</p>
                  <p className="text-xl font-bold">{stats.generated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class Average</p>
                  <p className="text-xl font-bold">{stats.avg.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Student Results Table ──────────────────────────── */}
      {hasResults && (
        <Card>
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Student Results</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {studentResults.length} student{studentResults.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CardContent className="p-0">
            {loadingStudents || loadingResults ? (
              <div className="py-12 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Loading results...</p>
              </div>
            ) : studentResults.length === 0 ? (
              <div className="py-12 text-center">
                <BarChart3 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No students found for this section.</p>
                <p className="text-xs text-muted-foreground mt-1">Make sure students are enrolled and marks have been entered.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-16">Roll No.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentResults.map((row, idx) => (
                    <TableRow
                      key={row.student.enrollmentId}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => setSelectedStudent(row)}
                    >
                      <TableCell className="text-xs text-muted-foreground">{row.rank || idx + 1}</TableCell>
                      <TableCell className="text-xs font-semibold">
                        {row.student.firstName} {row.student.lastName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.student.rollNumber || "-"}</TableCell>
                      <TableCell className="text-xs text-right font-medium tabular-nums">
                        {row.totalMax > 0 ? `${row.totalObtained}/${row.totalMax}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold tabular-nums">
                        {row.result ? `${row.percentage.toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        {row.grade ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800">
                            {row.grade.gradeName}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <StatusChip status={row.result?.resultStatus?.toLowerCase() || (isAbsentOnly(row) ? "absent" : "pending")} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(row)} className="h-8 text-xs">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Empty State ────────────────────────────────────── */}
      {!hasResults && (
        <div className="py-16 text-center">
          <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select an examination, class, and section to view results.</p>
          <p className="text-xs text-muted-foreground mt-1">Use the filters above to narrow down the context.</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── Student Detail / Report Card Dialog ─────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
        {selectedStudent && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Report Card</DialogTitle>
                <Button variant="ghost" size="sm" onClick={() => window.print()} className="h-8 text-xs">
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Print
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
              {/* Report Card Header */}
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-lg font-bold">School Name</h2>
                <p className="text-sm font-semibold mt-1">{selectedExam?.name || "Examination"}</p>
                <p className="text-xs text-muted-foreground">Academic Session: {sessions.find((s) => s.id === selectedSession)?.name}</p>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                <div>
                  <span className="text-muted-foreground">Student</span>
                  <p className="font-semibold">{selectedStudent.student.firstName} {selectedStudent.student.lastName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Roll No.</span>
                  <p className="font-semibold">{selectedStudent.student.rollNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Class</span>
                  <p className="font-semibold">{selectedClassName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Section</span>
                  <p className="font-semibold">{selectedSectionName}</p>
                </div>
              </div>

              {/* Subject-wise Marks */}
              <div>
                <h3 className="text-xs font-semibold mb-2">Subject-wise Marks</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Max Marks</TableHead>
                      <TableHead className="text-right">Obtained</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStudent.subjectMarks.map((sm, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{sm.subject}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{sm.maxMarks}</TableCell>
                        <TableCell className="text-xs text-right font-semibold tabular-nums">
                          {sm.isAbsent ? "AB" : sm.marks}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {sm.isAbsent ? (
                            <StatusChip status="absent" />
                          ) : sm.marks >= sm.passingMarks ? (
                            <StatusChip status="pass" />
                          ) : (
                            <StatusChip status="fail" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="border-t border-border pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Marks</p>
                    <p className="text-xl font-bold mt-1">{selectedStudent.totalObtained} / {selectedStudent.totalMax}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 text-center">
                    <p className="text-xs text-muted-foreground">Percentage</p>
                    <p className="text-xl font-bold mt-1">{selectedStudent.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 text-center">
                    <p className="text-xs text-muted-foreground">Overall Grade</p>
                    <p className="text-xl font-bold mt-1">
                      {selectedStudent.grade ? selectedStudent.grade.gradeName : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rank */}
              {selectedStudent.rank && (
                <div className="text-center text-xs text-muted-foreground">
                  Section Rank: <strong className="text-foreground">#{selectedStudent.rank}</strong>
                </div>
              )}
            </div>
          </>
        )}
      </Dialog>

      {/* ── Confirm Generate Results ─────────────────────── */}
      <Dialog open={generateConfirmOpen} onOpenChange={setGenerateConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Generate Results</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-xs text-muted-foreground space-y-2">
          <p>
            This will finalize results for <strong className="text-foreground">{stats.pending}</strong> student{stats.pending !== 1 ? "s" : ""} in{" "}
            <strong className="text-foreground">{selectedExam?.name}</strong> ({selectedClassName} • {selectedSectionName}).
          </p>
          <p>Totals, percentages, grades, and ranks will be aggregated from the entered marks.</p>
          <p className="text-amber-600 dark:text-amber-400">
            Once generated, these students' marks can no longer be edited. Delete the result first to make changes.
          </p>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setGenerateConfirmOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={handleGenerateAll} disabled={generating} className="bg-blue-600 hover:bg-blue-700 text-xs">
            {generating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Confirm Generate
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
