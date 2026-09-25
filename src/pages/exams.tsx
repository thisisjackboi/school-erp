"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Plus, Trash2, Edit2, Loader2, ArrowLeft, Eye,
  Calendar, BookOpen, GraduationCap,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionGate } from "@/components/auth/permission-gate";
import {
  formatDisplayDate,
  formatTimeOfDay,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/dates";

import {
  getExamTypes,
} from "@/lib/api/exam-types.api";
import {
  getExams, createExam, updateExam, deleteExam,
  type CreateExamPayload,
} from "@/lib/api/exams.api";
import {
  getExamSchedules, createExamSchedule, updateExamSchedule, deleteExamSchedule,
  type CreateExamSchedulePayload,
} from "@/lib/api/exam-schedules.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import { getSubjects } from "@/lib/api/subjects.api";
import { getClassSubjects } from "@/lib/api/class-subjects.api";
import { getMarks, deleteMarks } from "@/lib/api/marks.api";
import { getExamResults, deleteExamResults } from "@/lib/api/exam-results.api";

import type { ExamType, Exam, ExamSchedule, ExamStatus } from "@/lib/types/exam";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { Subject } from "@/lib/types/subject";
import type { ClassSubject } from "@/lib/types/class-subject";

import {
  LIMITS,
  trimMax,
  validateMaxLength,
  onlyDigits,
  validateNumeric,
  firstError,
} from "@/lib/input-restrictions";

export default function ExamsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  // ── Data ─────────────────────────────────────────────────────
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allClassSubjects, setAllClassSubjects] = useState<ClassSubject[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  // ── Filters ──────────────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedExamStatus, setSelectedExamStatus] = useState("");

  // ── Views ────────────────────────────────────────────────────
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // ── Modals ───────────────────────────────────────────────────
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [scheduleDeleteOpen, setScheduleDeleteOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<ExamSchedule | null>(null);

  // ── Forms ────────────────────────────────────────────────────
  const [examForm, setExamForm] = useState({
    name: "", examTypeId: "", academicSessionId: "", classId: "",
    startDate: "", endDate: "", status: "SCHEDULED" as ExamStatus,
  });

  interface SubjectScheduleRow {
    subjectId: string;
    maxMarks: string;
    passingMarks: string;
    examDate: string;
    startTime: string;
    endTime: string;
    room: string;
    skipped: boolean;
  }
  const [subjectSchedules, setSubjectSchedules] = useState<SubjectScheduleRow[]>([]);

  // ── Helpers ──────────────────────────────────────────────────
  const safeDateStr = (val: unknown): string => formatDisplayDate(val);

  const safeDateRange = (start: unknown, end: unknown): string => {
    return `${safeDateStr(start)} – ${safeDateStr(end)}`;
  };

  const formatTimeDisplay = (val: unknown): string => formatTimeOfDay(val);

  const formatTimeForInput = (val: unknown): string => toTimeInputValue(val);

  const safeDateInput = (val: unknown): string => toDateInputValue(val);

  const statusLabel: Record<string, string> = {
    SCHEDULED: "Upcoming",
    ONGOING: "Ongoing",
    COMPLETED: "Completed",
    RESULTS_PUBLISHED: "Published",
  };

  // ── Data Loading ─────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [typeList, examList, schedList, sessList, clsList, secList, subjList, csList] = await Promise.all([
        getExamTypes(accessToken).catch(() => []),
        getExams({}, accessToken).catch(() => []),
        getExamSchedules({}, accessToken).catch(() => []),
        getAcademicSessions(accessToken).catch(() => []),
        getClasses(accessToken).catch(() => []),
        getSections(accessToken).catch(() => []),
        getSubjects(accessToken).catch(() => []),
        getClassSubjects(accessToken).catch(() => []),
      ]);
      setExamTypes(typeList || []);
      setExams(examList || []);
      setSchedules(schedList || []);
      setSessions(sessList || []);
      setClasses(clsList || []);
      setSections(secList || []);
      setAllSubjects(subjList || []);
      setAllClassSubjects(csList || []);
      const currentSession = (sessList || []).find((s: AcademicSession) => s.isCurrent);
      if (currentSession) setSelectedSession(currentSession.id);
    } catch (err: any) {
      toast("Error", err.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, [accessToken]);

  // ── Filtered Exams ───────────────────────────────────────────
  const filteredExams = useMemo(() => {
    let result = exams;
    if (selectedSession) result = result.filter((e) => e.academicSessionId === selectedSession);
    if (selectedExamStatus) result = result.filter((e) => e.status === selectedExamStatus);
    return result;
  }, [exams, selectedSession, selectedExamStatus]);

  // ── Exam CRUD ────────────────────────────────────────────────
  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm({
      name: "", examTypeId: "", academicSessionId: selectedSession || "",
      classId: "", startDate: "", endDate: "", status: "SCHEDULED",
    });
    setExamModalOpen(true);
  };

  const openEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name,
      examTypeId: exam.examTypeId,
      academicSessionId: exam.academicSessionId,
      classId: exam.classId,
      startDate: safeDateInput(exam.startDate),
      endDate: safeDateInput(exam.endDate),
      status: exam.status,
    });
    setExamModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) return toast("Error", "Exam name is required", "error");
    if (!examForm.examTypeId) return toast("Error", "Exam type is required", "error");
    if (!examForm.academicSessionId) return toast("Error", "Academic session is required", "error");
    if (!examForm.classId) return toast("Error", "Class is required", "error");
    if (!examForm.startDate) return toast("Error", "Start date is required", "error");
    if (!examForm.endDate) return toast("Error", "End date is required", "error");
    const examNameError = validateMaxLength(examForm.name, "Examination name", LIMITS.EXAM_NAME_MAX);
    if (examNameError) return toast("Error", examNameError, "error");
    if (examForm.endDate < examForm.startDate) {
      return toast("Error", "End date cannot be before the start date", "error");
    }

    setSubmitting(true);
    try {
      const payload: CreateExamPayload = {
        name: examForm.name.trim(),
        examTypeId: examForm.examTypeId,
        academicSessionId: examForm.academicSessionId,
        classId: examForm.classId,
        startDate: examForm.startDate,
        endDate: examForm.endDate,
        status: examForm.status,
      };
      if (editingExam) {
        await updateExam(editingExam.id, payload, accessToken);
        toast("Updated", `Exam "${examForm.name}" updated.`, "success");
      } else {
        await createExam(payload, accessToken);
        toast("Created", `Exam "${examForm.name}" created.`, "success");
      }
      setExamModalOpen(false);
      const examList = await getExams({}, accessToken);
      setExams(examList || []);
      if (editingExam && selectedExam?.id === editingExam.id) {
        const refreshed = (examList || []).find((x: Exam) => x.id === editingExam.id);
        if (refreshed) setSelectedExam(refreshed);
      }
    } catch (err: any) {
      toast("Error", err.message || "Failed to save exam", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const promptDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  // Deletes all dependent records (results, marks, schedules) before the exam itself.
  const deleteExamWithDependencies = async (examId: string, token?: string | null) => {
    const [results, scheds] = await Promise.all([
      getExamResults({ examId }, token).catch(() => []),
      getExamSchedules({ examId }, token).catch(() => []),
    ]);

    if (results && results.length > 0) {
      await deleteExamResults(results, token);
    }

    if (scheds && scheds.length > 0) {
      const schedIds = scheds.map((s: ExamSchedule) => s.id);
      const markArrays = await Promise.all(
        schedIds.map((id: string) => getMarks({ examScheduleId: id }, token).catch(() => []))
      );
      const marks = markArrays.flat();
      if (marks.length > 0) {
        await deleteMarks(marks, token);
      }
    }

    await deleteExam(examId, token);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      await deleteExamWithDependencies(itemToDelete.id, accessToken);
      toast("Deleted", `Exam "${itemToDelete.name}" deleted.`, "success");
      setExams(await getExams({}, accessToken));
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      if (selectedExam?.id === itemToDelete.id) setSelectedExam(null);
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const promptScheduleDelete = (sched: ExamSchedule) => {
    setScheduleToDelete(sched);
    setScheduleDeleteOpen(true);
  };

  const confirmScheduleDelete = async () => {
    if (!scheduleToDelete) return;
    setSubmitting(true);
    try {
      await deleteExamSchedule(scheduleToDelete.id, accessToken);
      toast("Deleted", `Schedule for "${scheduleToDelete.subject?.name || "the subject"}" deleted.`, "success");
      const schedList = await getExamSchedules({}, accessToken);
      setSchedules(schedList || []);
      setScheduleDeleteOpen(false);
      setScheduleToDelete(null);
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reference Lookups ────────────────────────────────────────
  const schedulesForExam = (examId: string) => {
    return schedules.filter((s) => s.examId === examId);
  };

  const classesForExam = (exam: Exam) => {
    return classes.find((c) => c.id === exam.classId);
  };

  const sectionsForClassSession = (classId: string, sessionId: string) => {
    return sections.filter((s) => s.classId === classId && s.academicSessionId === sessionId);
  };

  // ── Exam Subject Schedules ───────────────────────────────────
  const subjectsForExam = useMemo(() => {
    if (!selectedExam) return [];
    const allowedSubjectIds = allClassSubjects
      .filter((cs) => cs.classId === selectedExam.classId && cs.academicSessionId === selectedExam.academicSessionId)
      .map((cs) => cs.subjectId);
    return allSubjects.filter((s) => allowedSubjectIds.includes(s.id));
  }, [selectedExam, allClassSubjects, allSubjects]);

  const existingSubjectIds = useMemo(() => {
    if (!selectedExam) return new Set<string>();
    return new Set(schedules.filter((s) => s.examId === selectedExam.id).map((s) => s.subjectId));
  }, [selectedExam, schedules]);

  const initSubjectSchedules = () => {
    if (!selectedExam) return;
    const existingScheds = schedules.filter((s) => s.examId === selectedExam.id);
    setSubjectSchedules(
      subjectsForExam.map((s) => {
        const existing = existingScheds.find((sc) => sc.subjectId === s.id);
        return {
          subjectId: s.id,
          maxMarks: existing ? String(Number(existing.maxMarks) || 100) : "100",
          passingMarks: existing ? String(Number(existing.passingMarks) || 33) : "33",
          examDate: existing ? safeDateInput(existing.examDate) : "",
          startTime: existing ? formatTimeForInput(existing.startTime) : "09:00",
          endTime: existing ? formatTimeForInput(existing.endTime) : "12:00",
          room: existing && existing.room ? existing.room : "",
          skipped: false,
        };
      })
    );
  };

  useEffect(() => {
    if (selectedExam) initSubjectSchedules();
  }, [selectedExam?.id]);

  const updateSubjectSchedule = (subjectId: string, field: keyof SubjectScheduleRow, value: string) => {
    setSubjectSchedules((prev) => prev.map((row) => {
      if (row.subjectId !== subjectId) return row;
      let next = { ...row, [field]: value };
      const max = Number(next.maxMarks);
      if (field === "maxMarks" && max > 0 && Number(next.passingMarks) > max) {
        next = { ...next, passingMarks: String(max) };
      }
      if (field === "passingMarks" && max > 0 && Number(next.passingMarks) > max) {
        next = { ...next, passingMarks: String(max) };
      }
      return next;
    }));
  };

  const toggleSubjectSkipped = (subjectId: string) => {
    setSubjectSchedules((prev) => prev.map((row) => (row.subjectId === subjectId ? { ...row, skipped: !row.skipped } : row)));
  };

  const validateScheduleRow = (row: SubjectScheduleRow): string | null => {
    if (row.skipped) return null;
    const { maxMarks, passingMarks, examDate, startTime, endTime } = row;
    if (!examDate) return "exam date is required";
    if (!maxMarks) return "total marks is required";
    if (!passingMarks) return "passing marks is required";
    if (maxMarks === "0") return "total marks must be greater than 0";
    if (Number(passingMarks) > Number(maxMarks)) return "passing marks cannot exceed total marks";
    if (!startTime || !endTime) return "exam start and end times are required";
    if (endTime <= startTime) return "end time must be after start time";
    return null;
  };

  const scheduleErrorField = (row: SubjectScheduleRow): keyof SubjectScheduleRow | null => {
    if (row.skipped) return null;
    const { maxMarks, passingMarks, examDate, startTime, endTime } = row;
    if (!examDate) return "examDate";
    if (!maxMarks || maxMarks === "0") return "maxMarks";
    if (!passingMarks || Number(passingMarks) > Number(maxMarks)) return "passingMarks";
    if (!startTime || !endTime || endTime <= startTime) return startTime ? "endTime" : "startTime";
    return null;
  };

  const errorInputClass = "h-8 text-xs border-red-500 focus:border-red-500 focus:ring-red-500/30";

  const handleSubmitSchedules = async () => {
    if (!selectedExam) return;
    const subjects = subjectsForExam;
    if (subjects.length === 0) {
      return toast("Error", "No subjects found for this class. Assign subjects to the class first.", "error");
    }

    const invalidRow = subjectSchedules.find((row) => validateScheduleRow(row) !== null);

    if (invalidRow) {
      const subjectName = subjects.find((s) => s.id === invalidRow.subjectId)?.name || "a subject";
      const reason = validateScheduleRow(invalidRow);
      return toast("Error", `Invalid details for ${subjectName}: ${reason}.`, "error");
    }

    setScheduleSubmitting(true);
    let created = 0;
    let updated = 0;
    try {
      const freshScheds = await getExamSchedules({}, accessToken);
      setSchedules(freshScheds || []);
      const existingScheds = (freshScheds || []).filter((s) => s.examId === selectedExam.id);
      for (const row of subjectSchedules) {
        if (row.skipped) continue;
        const subjectName = subjects.find((s) => s.id === row.subjectId)?.name || "this subject";
        const payload: CreateExamSchedulePayload = {
          examId: selectedExam.id,
          subjectId: row.subjectId,
          examDate: row.examDate,
          startTime: row.startTime,
          endTime: row.endTime,
          maxMarks: Number(row.maxMarks),
          passingMarks: Number(row.passingMarks),
          room: row.room.trim() || undefined,
        };
        const existing = existingScheds.find((sc) => sc.subjectId === row.subjectId);
        try {
          if (existing) {
            await updateExamSchedule(existing.id, payload, accessToken);
            updated++;
          } else {
            await createExamSchedule(payload, accessToken);
            created++;
          }
        } catch (err: any) {
          toast("Error", `Failed for ${subjectName}: ${err.message || "unknown error"}`, "error");
          const parts: string[] = [];
          if (created) parts.push(`${created} saved`);
          if (updated) parts.push(`${updated} updated`);
          if (parts.length) toast("Info", `Earlier schedules saved: ${parts.join(", ")}.`, "info");
          return;
        }
      }
      const parts: string[] = [];
      if (created) parts.push(`${created} created`);
      if (updated) parts.push(`${updated} updated`);
      toast("Success", parts.length ? `${parts.join(", ")}.` : "No changes made.", "success");
      const schedList = await getExamSchedules({}, accessToken);
      setSchedules(schedList || []);
    } catch (err: any) {
      toast("Error", err.message || "Failed to save schedules", "error");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  // ── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Examinations</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage examinations for each class</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading examinations...</span>
        </div>
      </div>
    );
  }

  // ── Detail View ──────────────────────────────────────────────
  if (selectedExam) {
    const examSchedules = schedulesForExam(selectedExam.id);
    const examClass = classesForExam(selectedExam);
    const examSections = sectionsForClassSession(selectedExam.classId, selectedExam.academicSessionId);
    const examSession = sessions.find((s) => s.id === selectedExam.academicSessionId);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedExam(null)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedExam.name}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {examClass?.name || "N/A"} • {examSession?.name || "N/A"}
              </p>
            </div>
          </div>
          <StatusChip status={selectedExam.status.toLowerCase()} />
        </div>

        {/* Exam Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Exam Type</span>
                <p className="font-semibold mt-0.5">{selectedExam.examType?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration</span>
                <p className="font-semibold mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {safeDateRange(selectedExam.startDate, selectedExam.endDate)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Class</span>
                <p className="font-semibold mt-0.5">{examClass?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sections</span>
                <p className="font-semibold mt-0.5">
                  {examSections.length > 0
                    ? examSections.map((s) => s.name).join(", ")
                    : "No sections"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedules Overview */}
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Exam Schedules</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {examSchedules.length} schedule{examSchedules.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
          <CardContent className="p-0">
            {examSchedules.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No schedules configured for this examination.</p>
                <p className="text-xs text-muted-foreground mt-1">Set up schedules below.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Marks (Pass / Max)</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSchedules.map((sc) => (
                    <TableRow key={sc.id}>
                      <TableCell className="font-semibold">
                        {sc.subject?.name || "N/A"} {sc.subject?.code ? <span className="text-muted-foreground font-normal">({sc.subject.code})</span> : ""}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{safeDateStr(sc.examDate)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatTimeDisplay(sc.startTime)} – {formatTimeDisplay(sc.endTime)}
                      </TableCell>
                      <TableCell className="font-semibold">{Number(sc.passingMarks)} / {Number(sc.maxMarks)}</TableCell>
                      <TableCell>{sc.room || "-"}</TableCell>
                      <TableCell className="text-right">
                        <PermissionGate permission="exam-schedules.delete">
                        <Button variant="ghost" size="sm" onClick={() => promptScheduleDelete(sc)} className="h-8 w-8 p-0 text-rose-600" title={`Delete schedule for ${sc.subject?.name || "this subject"}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </PermissionGate>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Subject Schedules Setup */}
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Subject Schedules Setup</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set marks, exam date & time for each subject of {examClass?.name || "the class"} ({examSections.length > 0 ? examSections.map((s) => s.name).join(", ") : ""})
              </p>
            </div>
            <PermissionGate permission="exam-schedules.create" anyPermission={["exam-schedules.create", "exam-schedules.update"]}>
              <Button size="sm" onClick={handleSubmitSchedules} disabled={scheduleSubmitting || subjectSchedules.length === 0} className="bg-blue-600 hover:bg-blue-700 text-xs">
                {scheduleSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                {scheduleSubmitting ? "Saving..." : "Submit All"}
              </Button>
            </PermissionGate>
          </div>
          <CardContent className="p-0">
            {subjectsForExam.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No subjects assigned to this class and session.</p>
                <p className="text-xs text-muted-foreground mt-1">Assign subjects to the class first, then configure schedules.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-24">Total Marks</TableHead>
                    <TableHead className="w-24">Passing Marks</TableHead>
                    <TableHead className="w-36">Exam Date</TableHead>
                    <TableHead className="w-32">Start Time</TableHead>
                    <TableHead className="w-32">End Time</TableHead>
                    <TableHead className="w-32">Room</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-20 text-center" title="Tick if this subject is not taken in this exam">Skip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsForExam.map((sb) => {
                    const row = subjectSchedules.find((r) => r.subjectId === sb.id);
                    const hasSchedule = existingSubjectIds.has(sb.id);
                    const disabled = !!row?.skipped;
                    const errField = row ? scheduleErrorField(row) : null;
                    return (
                      <TableRow key={sb.id} className={disabled ? "opacity-60" : ""}>
                        <TableCell className="font-semibold">
                          <span className={disabled ? "line-through" : ""}>
                            {sb.name}
                            {sb.code ? <span className="text-muted-foreground font-normal ml-1">({sb.code})</span> : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={5}
                            disabled={disabled}
                            value={row?.maxMarks ?? ""}
                            onChange={(e) => updateSubjectSchedule(sb.id, "maxMarks", onlyDigits(e.target.value, 5))}
                            className={errField === "maxMarks" ? errorInputClass : "h-8 text-xs"}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={5}
                            disabled={disabled}
                            value={row?.passingMarks ?? ""}
                            onChange={(e) => updateSubjectSchedule(sb.id, "passingMarks", onlyDigits(e.target.value, 5))}
                            className={errField === "passingMarks" ? errorInputClass : "h-8 text-xs"}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            disabled={disabled}
                            value={row?.examDate ?? ""}
                            onChange={(e) => updateSubjectSchedule(sb.id, "examDate", e.target.value)}
                            className={errField === "examDate" ? errorInputClass : "h-8 text-xs"}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            disabled={disabled}
                            value={row?.startTime ?? ""}
                            onChange={(e) => updateSubjectSchedule(sb.id, "startTime", e.target.value)}
                            className={errField === "startTime" ? errorInputClass : "h-8 text-xs"}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            disabled={disabled}
                            value={row?.endTime ?? ""}
                            onChange={(e) => updateSubjectSchedule(sb.id, "endTime", e.target.value)}
                            className={errField === "endTime" ? errorInputClass : "h-8 text-xs"}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            disabled={disabled}
                            maxLength={LIMITS.TEXT_MAX}
                            placeholder="e.g. Hall 1"
                            value={row?.room ?? ""}
                            onChange={(e) => updateSubjectSchedule(sb.id, "room", trimMax(e.target.value, LIMITS.TEXT_MAX))}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {row?.skipped ? (
                            <span className="text-[11px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">Skipped</span>
                          ) : hasSchedule ? (
                            <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Configured</span>
                          ) : row?.examDate ? (
                            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">Ready</span>
                          ) : (
                            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={!!row?.skipped}
                            onChange={() => toggleSubjectSkipped(sb.id)}
                            className="h-4 w-4 accent-blue-600 cursor-pointer"
                            title="Skip this subject for this exam"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Exam Actions */}
        <div className="flex items-center justify-between">
          <PermissionGate permission="exams.delete">
            <Button variant="outline" size="sm" onClick={() => promptDelete(selectedExam.id, selectedExam.name)} className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Exam
            </Button>
          </PermissionGate>
          <PermissionGate permission="exams.update">
            <Button variant="outline" size="sm" onClick={() => openEditExam(selectedExam)} className="text-xs">
              <Edit2 className="h-3 w-3 mr-1" />
              Edit Exam
            </Button>
          </PermissionGate>
        </div>

        {/* Schedule Delete Confirmation */}
        <Dialog open={scheduleDeleteOpen} onOpenChange={setScheduleDeleteOpen}>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 text-xs text-muted-foreground">
            <p>Are you sure you want to delete the schedule for <strong className="text-foreground">{scheduleToDelete?.subject?.name || "this subject"}</strong>?</p>
            <p>This action cannot be undone.</p>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setScheduleDeleteOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={confirmScheduleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </Button>
          </div>
        </Dialog>

        {/* Exam Delete Confirmation */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 text-xs text-muted-foreground">
            <p>Are you sure you want to delete <strong className="text-foreground">{itemToDelete?.name}</strong>?</p>
            <p>This action cannot be undone.</p>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={confirmDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </Button>
          </div>
        </Dialog>
      </div>
    );
  }

  // ── Main List View ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Examinations</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage examinations for each class</p>
        </div>
        <PermissionGate permission="exams.create">
          <Button size="sm" onClick={openCreateExam} className="bg-blue-600 hover:bg-blue-700 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Create Examination
          </Button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-56">
          <label className="text-xs font-semibold block mb-1">Academic Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? "(Current)" : ""}</option>
            ))}
          </select>
        </div>
        <div className="w-44">
          <label className="text-xs font-semibold block mb-1">Status</label>
          <select
            value={selectedExamStatus}
            onChange={(e) => setSelectedExamStatus(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="RESULTS_PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      {/* Exam List */}
      <Card>
        <CardContent className="p-0">
          {filteredExams.length === 0 ? (
            <div className="py-16 text-center">
              <GraduationCap className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No examinations found.</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedSession ? "Try changing the session filter or " : ""}Create a new examination to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Examination</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date / Duration</TableHead>
                  <TableHead>Schedules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((ex) => {
                  const schedCount = schedules.filter((s) => s.examId === ex.id).length;
                  return (
                    <TableRow key={ex.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setSelectedExam(ex)}>
                      <TableCell className="font-semibold">{ex.name}</TableCell>
                      <TableCell>{ex.class?.name || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{ex.examType?.name || "N/A"}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{safeDateRange(ex.startDate, ex.endDate)}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {schedCount} subject{schedCount !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell><StatusChip status={ex.status.toLowerCase()} /></TableCell>
                      <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedExam(ex)} className="h-8 w-8 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <PermissionGate permission="exams.update">
                          <Button variant="ghost" size="sm" onClick={() => openEditExam(ex)} className="h-8 w-8 p-0">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="exams.delete">
                          <Button variant="ghost" size="sm" onClick={() => promptDelete(ex.id, ex.name)} className="h-8 w-8 p-0 text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGate>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog: Create/Edit Exam ──────────────────────────── */}
      <Dialog open={examModalOpen} onOpenChange={setExamModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingExam ? "Edit Examination" : "Create Examination"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveExam} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Examination Name *</label>
            <Input placeholder="e.g. Half Yearly Examination" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: trimMax(e.target.value, LIMITS.EXAM_NAME_MAX) })} maxLength={LIMITS.EXAM_NAME_MAX} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Exam Type *</label>
              <select value={examForm.examTypeId} onChange={(e) => setExamForm({ ...examForm, examTypeId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="">Select Type</option>
                {examTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Academic Session *</label>
              <select value={examForm.academicSessionId} onChange={(e) => setExamForm({ ...examForm, academicSessionId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="">Select Session</option>
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Class *</label>
              <select value={examForm.classId} onChange={(e) => setExamForm({ ...examForm, classId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Start Date *</label>
              <Input type="date" value={examForm.startDate} onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">End Date *</label>
              <Input type="date" value={examForm.endDate} onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Status</label>
            <select value={examForm.status} onChange={(e) => setExamForm({ ...examForm, status: e.target.value as ExamStatus })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="SCHEDULED">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESULTS_PUBLISHED">Published</option>
            </select>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setExamModalOpen(false)} className="text-xs">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingExam ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ──────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2 text-xs text-muted-foreground">
          <p>Are you sure you want to delete <strong className="text-foreground">{itemToDelete?.name}</strong>?</p>
          <p>This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={confirmDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-xs">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
