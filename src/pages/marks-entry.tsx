"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Loader2, Save, ArrowRight, Eraser, ClipboardCheck, AlertCircle, CheckCircle2,
  Check, Lock, BarChart3, Users, TrendingUp, Printer,
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
import { getSubjects } from "@/lib/api/subjects.api";
import { getClassSubjects } from "@/lib/api/class-subjects.api";
import { getStudents } from "@/lib/api/students.api";
import { getMarks, bulkCreateMarks } from "@/lib/api/marks.api";
import { getExamResults, createExamResult } from "@/lib/api/exam-results.api";
import { getGrades } from "@/lib/api/grades.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { Exam, ExamSchedule } from "@/lib/types/exam";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { Subject } from "@/lib/types/subject";
import type { ClassSubject } from "@/lib/types/class-subject";
import type { Mark, ExamResult, Grade } from "@/lib/types/marks";
import {
  buildStudentResults,
  isAbsentOnly,
  type StudentWithEnrollment,
  type StudentResultRow,
} from "@/lib/exam-results-utils";
import { loadExamWorkflowContext, saveExamWorkflowContext } from "@/lib/exam-context";

import { onlyDigits } from "@/lib/input-restrictions";

interface BulkMark {
  studentEnrollmentId: string;
  studentName: string;
  rollNumber: string | null;
  marksObtained: string;
  isAbsent: boolean;
}

export default function MarksEntryPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const markInputRefs = useRef<Map<number, HTMLInputElement | null>>(new Map());

  // ── Reference Data ───────────────────────────────────────────
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [examMarks, setExamMarks] = useState<Mark[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // ── Workflow Mode ────────────────────────────────────────────
  const [mode, setMode] = useState<"marks" | "results">("marks");

  // ── Cascade Selection ────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // ── Students & Marks ─────────────────────────────────────────
  const [students, setStudents] = useState<StudentWithEnrollment[]>([]);
  const [existingMarks, setExistingMarks] = useState<Mark[]>([]);
  const [bulkMarks, setBulkMarks] = useState<BulkMark[]>([]);

  // ── Views ────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<StudentResultRow | null>(null);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── Loading States ───────────────────────────────────────────
  const [loadingRef, setLoadingRef] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Derived Data ─────────────────────────────────────────────
  const selectedExam = useMemo(() => exams.find((e) => e.id === selectedExamId), [exams, selectedExamId]);
  const selectedSchedule = useMemo(() => {
    if (!selectedExamId || !selectedSubjectId) return null;
    return examSchedules.find((s) => s.examId === selectedExamId && s.subjectId === selectedSubjectId) || null;
  }, [examSchedules, selectedExamId, selectedSubjectId]);

  const filteredExams = useMemo(() => {
    if (!selectedSession) return [];
    return exams.filter((e) => e.academicSessionId === selectedSession);
  }, [exams, selectedSession]);

  const filteredSections = useMemo(() => {
    if (!selectedClassId || !selectedSession) return [];
    return sections.filter((s) => s.classId === selectedClassId && s.academicSessionId === selectedSession);
  }, [sections, selectedClassId, selectedSession]);

  const filteredSubjects = useMemo(() => {
    if (!selectedClassId || !selectedSession) return [];
    const allowedIds = classSubjects
      .filter((cs) => cs.classId === selectedClassId && cs.academicSessionId === selectedSession)
      .map((cs) => cs.subjectId);
    return subjects.filter((s) => allowedIds.includes(s.id));
  }, [classSubjects, selectedClassId, selectedSession, subjects]);

  const subjectsWithStatus = useMemo(() => {
    return filteredSubjects.map((subj) => {
      const sched = examSchedules.find((s) => s.examId === selectedExamId && s.subjectId === subj.id) || null;
      return { ...subj, hasSchedule: !!sched, scheduleId: sched?.id || null };
    });
  }, [filteredSubjects, examSchedules, selectedExamId]);

  const scheduledSubjects = useMemo(() => subjectsWithStatus.filter((s) => s.hasSchedule), [subjectsWithStatus]);

  const currentSubjectIndex = useMemo(() => {
    return scheduledSubjects.findIndex((s) => s.id === selectedSubjectId);
  }, [scheduledSubjects, selectedSubjectId]);

  // A subject is "completed" when every student in the section has a saved mark.
  const completedSubjectIds = useMemo(() => {
    const completed = new Set<string>();
    if (!selectedSectionId || students.length === 0 || scheduledSubjects.length === 0) return completed;
    const studentIds = new Set(students.map((s) => s.enrollmentId));
    for (const subj of scheduledSubjects) {
      const scheduleId = subj.scheduleId as string;
      const count = examMarks.filter(
        (m) => m.examScheduleId === scheduleId && studentIds.has(m.studentEnrollmentId)
      ).length;
      if (count >= students.length) completed.add(subj.id);
    }
    return completed;
  }, [scheduledSubjects, examMarks, students, selectedSectionId]);

  const completedCount = completedSubjectIds.size;
  const totalSubjects = scheduledSubjects.length;
  const allCompleted = totalSubjects > 0 && completedCount === totalSubjects;

  // A student's marks are locked once a result has been generated for them.
  const lockedStudentIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of examResults) {
      if (r.examId === selectedExamId) set.add(r.studentEnrollmentId);
    }
    return set;
  }, [examResults, selectedExamId]);

  // ── Results Computation (shared with the Results page) ──────
  const resultRows = useMemo(() => {
    if (!selectedExamId || students.length === 0) return [];
    return buildStudentResults({
      students,
      examResults,
      allMarks: examMarks,
      examSchedules,
      selectedExamId,
      grades,
    });
  }, [students, examResults, examMarks, examSchedules, selectedExamId, grades]);

  const resultsStats = useMemo(() => {
    const total = resultRows.length;
    const generated = resultRows.filter((r) => r.result).length;
    const pending = total - generated;
    const absentPending = resultRows.filter((r) => !r.result && isAbsentOnly(r)).length;
    const avg = total > 0
      ? resultRows.filter((r) => r.result).reduce((sum, r) => sum + r.percentage, 0) / (generated || 1)
      : 0;
    return { total, generated, pending, absentPending, avg };
  }, [resultRows]);

  // ── Load Reference Data ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingRef(true);
      try {
        const [sessList, clsList, secList, subjList, csList, gradeList] = await Promise.all([
          getAcademicSessions(accessToken).catch(() => []),
          getClasses(accessToken).catch(() => []),
          getSections(accessToken).catch(() => []),
          getSubjects(accessToken).catch(() => []),
          getClassSubjects(accessToken).catch(() => []),
          getGrades(accessToken).catch(() => []),
        ]);
        setSessions(sessList || []);
        setClasses(clsList || []);
        setSections(secList || []);
        setSubjects(subjList || []);
        setClassSubjects(csList || []);
        setGrades(gradeList || []);
        const savedCtx = loadExamWorkflowContext();
        const current = (sessList || []).find((s: AcademicSession) => s.isCurrent);
        if (savedCtx?.sessionId && (sessList || []).some((s: AcademicSession) => s.id === savedCtx.sessionId)) {
          setSelectedSession(savedCtx.sessionId);
        } else if (current) {
          setSelectedSession(current.id);
        }
      } catch {
        toast("Error", "Failed to load reference data", "error");
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
  useEffect(() => { setSelectedExamId(""); setSelectedClassId(""); setSelectedSectionId(""); setSelectedSubjectId(""); }, [selectedSession]);
  useEffect(() => { setSelectedClassId(""); setSelectedSectionId(""); setSelectedSubjectId(""); }, [selectedExamId]);
  useEffect(() => { setSelectedSectionId(""); setSelectedSubjectId(""); }, [selectedClassId]);
  useEffect(() => { setSelectedSubjectId(""); }, [selectedSectionId]);

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

  // ── Load Exam Schedules + Results + Marks on Exam Change ─────
  useEffect(() => {
    if (!selectedExamId) { setExamSchedules([]); setExamResults([]); setExamMarks([]); return; }
    Promise.all([
      getExamSchedules({ examId: selectedExamId }, accessToken).catch(() => []),
      getExamResults({ examId: selectedExamId }, accessToken).catch(() => []),
    ]).then(([scheds, results]) => {
      setExamSchedules(scheds || []);
      setExamResults(results || []);
      const schedIds = (scheds || []).map((s: ExamSchedule) => s.id);
      if (schedIds.length > 0) {
        Promise.all(schedIds.map((id: string) => getMarks({ examScheduleId: id }, accessToken).catch(() => [])))
          .then((markArrays) => setExamMarks(markArrays.flat()))
          .catch(() => setExamMarks([]));
      } else {
        setExamMarks([]);
      }
    });
  }, [selectedExamId, accessToken]);

  // ── Load Students when Class + Section Selected ──────────────
  useEffect(() => {
    if (!selectedClassId || !selectedSession || !selectedSectionId) {
      setStudents([]);
      return;
    }
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

  // ── Auto-select the first scheduled subject for the section ──
  useEffect(() => {
    if (mode === "marks" && selectedSectionId && !selectedSubjectId && scheduledSubjects.length > 0) {
      setSelectedSubjectId(scheduledSubjects[0].id);
    }
  }, [mode, selectedSectionId, selectedSubjectId, scheduledSubjects]);

  // ── Load Existing Marks when Subject Selected ────────────────
  useEffect(() => {
    if (!selectedSchedule) {
      setExistingMarks([]);
      setBulkMarks([]);
      return;
    }
    setLoadingMarks(true);
    getMarks({ examScheduleId: selectedSchedule.id }, accessToken)
      .then((list: Mark[]) => {
        setExistingMarks(list || []);
        const marksMap = new Map((list || []).map((m) => [m.studentEnrollmentId, m]));
        const bulk: BulkMark[] = students.map((stu) => {
          const existing = marksMap.get(stu.enrollmentId);
          return {
            studentEnrollmentId: stu.enrollmentId,
            studentName: `${stu.firstName} ${stu.lastName}`,
            rollNumber: stu.rollNumber,
            marksObtained: existing ? String(Number(existing.marksObtained)) : "",
            isAbsent: existing?.isAbsent || false,
          };
        });
        setBulkMarks(bulk);
      })
      .catch(() => {
        setExistingMarks([]);
        const bulk: BulkMark[] = students.map((stu) => ({
          studentEnrollmentId: stu.enrollmentId,
          studentName: `${stu.firstName} ${stu.lastName}`,
          rollNumber: stu.rollNumber,
          marksObtained: "",
          isAbsent: false,
        }));
        setBulkMarks(bulk);
      })
      .finally(() => setLoadingMarks(false));
  }, [selectedSchedule, students, accessToken]);

  // ── Bulk Actions ─────────────────────────────────────────────
  const handleFillAll = () => {
    if (!selectedSchedule) return;
    const max = Number(selectedSchedule.maxMarks);
    setBulkMarks((prev) => prev.map((m) => m.isAbsent || lockedStudentIds.has(m.studentEnrollmentId) ? m : { ...m, marksObtained: String(max) }));
  };

  const handleClearAll = () => {
    setBulkMarks((prev) => prev.map((m) => lockedStudentIds.has(m.studentEnrollmentId) ? m : { ...m, marksObtained: "", isAbsent: false }));
  };

  const updateMark = (index: number, field: "marksObtained" | "isAbsent", value: string | boolean) => {
    setBulkMarks((prev) => {
      const next = [...prev];
      if (lockedStudentIds.has(next[index].studentEnrollmentId)) return prev;
      if (field === "marksObtained") {
        let numVal = value === "" ? "" : String(Number(value));
        if (numVal !== "" && selectedSchedule) {
          const max = Number(selectedSchedule.maxMarks);
          const num = Number(numVal);
          if (num < 0) numVal = "0";
          if (num > max) numVal = String(max);
        }
        next[index] = { ...next[index], marksObtained: numVal };
      } else {
        next[index] = { ...next[index], isAbsent: value as boolean, marksObtained: value ? "" : next[index].marksObtained };
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const nextInput = markInputRefs.current.get(index + 1);
      if (nextInput) nextInput.focus();
    }
  };

  // ── Save ─────────────────────────────────────────────────────
  const refreshExamMarks = async (scheduleId: string) => {
    const list = await getMarks({ examScheduleId: scheduleId }, accessToken).catch(() => []);
    setExamMarks((prev) => [...prev.filter((m) => m.examScheduleId !== scheduleId), ...(list || [])]);
  };

  const handleSave = async () => {
    if (!selectedSchedule) return toast("Error", "No schedule selected", "error");
    const anyEntered = bulkMarks.some((m) => m.marksObtained !== "" || m.isAbsent);
    if (!anyEntered) return toast("Error", "Enter marks for at least one student", "error");
    const editable = bulkMarks.filter((m) => !lockedStudentIds.has(m.studentEnrollmentId));
    if (editable.filter((m) => m.marksObtained !== "" || m.isAbsent).length === 0) {
      return toast("Error", "Results already generated for these students — delete the result to edit their marks", "error");
    }
    const records = editable
      .filter((m) => m.marksObtained !== "" || m.isAbsent)
      .map((m) => ({
        studentEnrollmentId: m.studentEnrollmentId,
        marksObtained: m.isAbsent ? 0 : Number(m.marksObtained),
        isAbsent: m.isAbsent,
      }));

    setSaving(true);
    try {
      await bulkCreateMarks({ examScheduleId: selectedSchedule.id, records }, accessToken);
      toast("Saved", `Marks saved for ${records.length} student${records.length > 1 ? "s" : ""}.`, "success");
      const list = await getMarks({ examScheduleId: selectedSchedule.id }, accessToken);
      setExistingMarks(list || []);
      await refreshExamMarks(selectedSchedule.id);
    } catch (err: any) {
      toast("Error", err.message || "Failed to save marks", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    if (currentSubjectIndex < scheduledSubjects.length - 1) {
      setSelectedSubjectId(scheduledSubjects[currentSubjectIndex + 1].id);
    }
  };

  // ── Generate Results ─────────────────────────────────────────
  const handleGenerateAll = async () => {
    setGenerateConfirmOpen(false);
    if (!selectedExamId) return;
    if (!allCompleted) return toast("Info", "Complete all subjects before generating results.", "info");
    const pendingRows = resultRows.filter((r) => !r.result && r.subjectMarks.length > 0);
    if (pendingRows.length === 0) {
      if (resultRows.every((r) => r.result)) return toast("Info", "All students already have results.", "info");
      return toast("Info", "Enter marks for all subjects before generating results.", "info");
    }

    setGenerating(true);
    let successCount = 0;
    const failed: string[] = [];
    for (const row of pendingRows) {
      try {
        await createExamResult({ examId: selectedExamId, studentEnrollmentId: row.student.enrollmentId }, accessToken);
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

  // ── Mark Statistics ──────────────────────────────────────────
  const marksEntered = bulkMarks.filter((m) => m.marksObtained !== "" || m.isAbsent).length;
  const totalStudents = bulkMarks.length;

  // ── Loading States ───────────────────────────────────────────
  if (loadingRef) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Marks & Results</h1>
          <p className="text-xs text-muted-foreground mt-1">Enter marks, move through subjects, and generate results</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // ── Context Banner ───────────────────────────────────────────
  const hasSelection = selectedExam && selectedClassId && selectedSectionId && selectedSubjectId && selectedSchedule;
  const hasResultsContext = selectedExamId && selectedClassId && selectedSectionId;
  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name;
  const selectedSectionName = filteredSections.find((s) => s.id === selectedSectionId)?.name;
  const selectedSubjectName = filteredSubjects.find((s) => s.id === selectedSubjectId)?.name;
  const selectedSessionName = sessions.find((s) => s.id === selectedSession)?.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Marks & Results</h1>
          <p className="text-xs text-muted-foreground mt-1">Select the examination context once, then enter marks and generate results.</p>
        </div>
        <div className="inline-flex h-9 items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMode("marks")}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "marks" ? "bg-background text-foreground shadow-sm font-bold" : "text-slate-500 dark:text-slate-400 hover:text-foreground"
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
            Marks
          </button>
          <button
            type="button"
            onClick={() => setMode("results")}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "results" ? "bg-background text-foreground shadow-sm font-bold" : "text-slate-500 dark:text-slate-400 hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Results
          </button>
        </div>
      </div>

      {/* ── Cascade Filters (session / exam / class / section) ── */}
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
      {hasResultsContext && (
        <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
          <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedExam?.name}</span>
          <span className="text-blue-400">•</span>
          <span className="font-medium">{selectedClassName} • {selectedSectionName}</span>
          <span className="text-blue-400">•</span>
          <span className="text-muted-foreground">{selectedSessionName}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── MARKS MODE ────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {mode === "marks" && (
        <>
          {/* ── Subject Navigation with completion status ──── */}
          {selectedSectionId && filteredSubjects.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Subjects</span>
                  {totalSubjects > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-1 rounded bg-green-500" style={{ width: `${(completedCount / totalSubjects) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {completedCount}/{totalSubjects} completed
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600">No subjects scheduled for this exam</span>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {subjectsWithStatus.map((subj) => {
                    const isActive = subj.id === selectedSubjectId;
                    const isCompleted = subj.hasSchedule && completedSubjectIds.has(subj.id);
                    let tabClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
                    if (isActive) tabClass = "bg-blue-600 text-white";
                    else if (isCompleted) tabClass = "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
                    else if (!subj.hasSchedule) tabClass = "bg-slate-50 dark:bg-slate-900 text-slate-400";
                    return (
                      <button
                        key={subj.id}
                        onClick={() => setSelectedSubjectId(subj.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${tabClass}`}
                      >
                        {isCompleted && <Check className="inline h-3 w-3 mr-1" />}
                        {subj.code ? `${subj.name} (${subj.code})` : subj.name}
                        {!subj.hasSchedule && " ✗"}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── All-subjects-completed CTA ─────────────────── */}
          {allCompleted && (
            <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-medium">All subjects completed</span>
              </div>
              <Button size="sm" onClick={() => setMode("results")} className="bg-green-600 hover:bg-green-700 text-xs">
                View Results <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* ── Marks Entry Table ──────────────────────────── */}
          {hasSelection && (
            <Card>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold">Student Marks</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalStudents} student{totalStudents !== 1 ? "s" : ""} • {marksEntered} entered
                    {selectedSchedule && ` • Max: ${Number(selectedSchedule.maxMarks)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleFillAll} className="text-xs h-7">
                    Fill All (Max)
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll} className="text-xs h-7">
                    <Eraser className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                {loadingStudents ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading students...</p>
                  </div>
                ) : loadingMarks ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading marks...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No students found for this section.</p>
                    <p className="text-xs text-muted-foreground mt-1">Make sure students are enrolled in this class and section.</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="w-20">Roll No.</TableHead>
                          <TableHead className="w-32">Marks</TableHead>
                          <TableHead className="w-20">Absent</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkMarks.map((bm, idx) => {
                          const isLocked = lockedStudentIds.has(bm.studentEnrollmentId);
                          const entered = bm.marksObtained !== "" || bm.isAbsent;
                          const maxMarks = selectedSchedule ? Number(selectedSchedule.maxMarks) : 100;
                          const passingMarks = selectedSchedule ? Number(selectedSchedule.passingMarks) : 33;
                          const markVal = Number(bm.marksObtained);
                          const isPass = !bm.isAbsent && entered && markVal >= passingMarks;
                          const isFail = !bm.isAbsent && entered && markVal < passingMarks;

                          return (
                            <TableRow key={bm.studentEnrollmentId} className={bm.isAbsent ? "opacity-60" : ""}>
                              <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="text-xs font-medium">
                                <span className="inline-flex items-center gap-1.5">
                                  {bm.studentName}
                                  {isLocked && <Lock className="h-3 w-3 text-emerald-600" />}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{bm.rollNumber || "-"}</TableCell>
                              <TableCell>
                                <input
                                  ref={(el) => { markInputRefs.current.set(idx, el); }}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min="0"
                                  max={maxMarks}
                                  value={bm.marksObtained}
                                  onChange={(e) => updateMark(idx, "marksObtained", onlyDigits(e.target.value, 5))}
                                  onKeyDown={(e) => handleKeyDown(e, idx)}
                                  disabled={bm.isAbsent || isLocked}
                                  placeholder={bm.isAbsent ? "Absent" : `0-${maxMarks}`}
                                  maxLength={5}
                                  title={isLocked ? "Result already generated — delete the result to edit this mark" : undefined}
                                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs tabular-nums disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </TableCell>
                              <TableCell>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={bm.isAbsent}
                                    onChange={(e) => updateMark(idx, "isAbsent", e.target.checked)}
                                    disabled={isLocked}
                                    className="h-3.5 w-3.5 rounded border-slate-300"
                                  />
                                  <span className="text-xs text-muted-foreground">Absent</span>
                                </label>
                              </TableCell>
                              <TableCell>
                                {bm.isAbsent ? (
                                  <StatusChip status="absent" />
                                ) : isPass ? (
                                  <StatusChip status="pass" />
                                ) : isFail ? (
                                  <StatusChip status="fail" />
                                ) : entered ? (
                                  <StatusChip status="pending" />
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Save Bar */}
                    <div className="flex items-center justify-between p-4 border-t border-border bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-xs text-muted-foreground">
                        {marksEntered}/{totalStudents} marks entered
                        {selectedSchedule && ` • Passing: ${Number(selectedSchedule.passingMarks)}`}
                        {lockedStudentIds.size > 0 && ` • ${lockedStudentIds.size} locked by result`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={handleSave} disabled={saving || marksEntered === 0} className="bg-blue-600 hover:bg-blue-700 text-xs">
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                          Save Marks
                        </Button>
                        {currentSubjectIndex < scheduledSubjects.length - 1 && (
                          <Button onClick={handleSaveAndNext} disabled={saving || marksEntered === 0} className="bg-green-600 hover:bg-green-700 text-xs">
                            Save & Next Subject
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Empty State: No Selection ──────────────────── */}
          {!hasSelection && selectedSession && (
            <div className="py-16 text-center">
              <ClipboardCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select an examination, class, section, and a subject to enter marks.</p>
              <p className="text-xs text-muted-foreground mt-1">Click a subject tab above to start entering marks.</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── RESULTS MODE ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {mode === "results" && (
        <>
          {hasResultsContext && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedExam?.name}</span>
                <span className="text-blue-400">•</span>
                <span className="font-medium">{selectedClassName} • {selectedSectionName}</span>
              </div>
              {resultsStats.pending > 0 ? (
                <div className="flex items-center gap-3">
                  {!allCompleted && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">Complete all subjects to generate results</span>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setGenerateConfirmOpen(true)}
                    disabled={generating || !allCompleted}
                    className="bg-blue-600 hover:bg-blue-700 text-xs disabled:opacity-50"
                  >
                    {generating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    Generate Results ({resultsStats.pending})
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-300">All results generated</span>
                </div>
              )}
            </div>
          )}

          {hasResultsContext && (
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Students</p>
                    <p className="text-lg font-bold">{resultsStats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Generated</p>
                    <p className="text-lg font-bold">{resultsStats.generated}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold">{resultsStats.pending}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Average</p>
                    <p className="text-lg font-bold">{resultsStats.avg.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasResultsContext ? (
            <Card>
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold">Student Results</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {resultsStats.total} student{resultsStats.total !== 1 ? "s" : ""} • {resultsStats.generated} generated • {resultsStats.pending} pending
                  {resultsStats.absentPending > 0 ? ` • ${resultsStats.absentPending} absent-only` : ""}
                </p>
              </div>
              <CardContent className="p-0">
                {students.length === 0 ? (
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
                      {resultRows.map((row, idx) => (
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
          ) : (
            <div className="py-16 text-center">
              <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select an examination, class, and section to view results.</p>
              <p className="text-xs text-muted-foreground mt-1">The selected context in the Marks step is used here automatically.</p>
            </div>
          )}
        </>
      )}

      {/* ── Confirm Generate Results ──────────────────────── */}
      <Dialog open={generateConfirmOpen} onOpenChange={setGenerateConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Generate Results</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-xs text-muted-foreground space-y-2">
          <p>
            This will finalize results for <strong className="text-foreground">{resultsStats.pending}</strong> student{resultsStats.pending !== 1 ? "s" : ""} in{" "}
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

      {/* ── Report Card Dialog ────────────────────────────── */}
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
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-lg font-bold">School Name</h2>
                <p className="text-sm font-semibold mt-1">{selectedExam?.name || "Examination"}</p>
                <p className="text-xs text-muted-foreground">Academic Session: {selectedSessionName}</p>
              </div>

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

              {selectedStudent.rank && (
                <div className="text-center text-xs text-muted-foreground">
                  Section Rank: <strong className="text-foreground">#{selectedStudent.rank}</strong>
                </div>
              )}
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}