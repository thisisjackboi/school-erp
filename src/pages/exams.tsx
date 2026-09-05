"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Plus, Trash2, Edit2, Loader2, ChevronDown, ChevronRight,
  Calendar, Clock, BookOpen, GraduationCap, Eye, ArrowLeft,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";

import {
  getExamTypes, createExamType, updateExamType, deleteExamType,
  type CreateExamTypePayload,
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
import { getSubjects } from "@/lib/api/subjects.api";
import { getClassSubjects } from "@/lib/api/class-subjects.api";
import { getSections } from "@/lib/api/sections.api";

import type { ExamType, Exam, ExamSchedule, ExamStatus } from "@/lib/types/exam";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Subject } from "@/lib/types/subject";
import type { ClassSubject } from "@/lib/types/class-subject";
import type { Section } from "@/lib/types/section";

import {
  LIMITS,
  firstError,
  onlyDecimal,
  onlyDigits,
  trimMax,
  validateMaxLength,
  validateNumeric,
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Filters ──────────────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedExamStatus, setSelectedExamStatus] = useState("");

  // ── Views ────────────────────────────────────────────────────
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  // ── Modals ───────────────────────────────────────────────────
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ExamType | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; kind: "exam" | "type" | "schedule" } | null>(null);

  // ── Forms ────────────────────────────────────────────────────
  const [examForm, setExamForm] = useState({
    name: "", examTypeId: "", academicSessionId: "", classId: "",
    startDate: "", endDate: "", status: "SCHEDULED" as ExamStatus,
  });
  const [typeForm, setTypeForm] = useState({ name: "", weightagePercent: "" });
  const [scheduleForm, setScheduleForm] = useState({
    examId: "", subjectId: "", examDate: "", startTime: "09:00",
    endTime: "12:00", maxMarks: "100", passingMarks: "33", room: "",
  });

  // ── Helpers ──────────────────────────────────────────────────
  const safeDateStr = (val: unknown): string => {
    if (!val) return "N/A";
    if (typeof val === "string") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    }
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? "N/A" : val.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    }
    return "N/A";
  };

  const safeDateRange = (start: unknown, end: unknown): string => {
    return `${safeDateStr(start)} – ${safeDateStr(end)}`;
  };

  const formatTimeDisplay = (val: unknown): string => {
    if (!val) return "";
    let h = 0, m = 0;
    if (typeof val === "string") {
      const match = val.match(/^(\d{1,2}):(\d{2})/);
      if (match) { h = Number(match[1]); m = Number(match[2]); }
      else return val;
    } else if (val instanceof Date) {
      h = val.getUTCHours();
      m = val.getUTCMinutes();
    } else return String(val);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const formatTimeForInput = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") {
      if (/^\d{2}:\d{2}/.test(val)) return val.substring(0, 5);
      const d = new Date(val);
      return isNaN(d.getTime()) ? "" : d.toISOString().substring(14, 19);
    }
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? "" : val.toISOString().substring(14, 19);
    }
    return "";
  };

  const safeDateInput = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    }
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? "" : val.toISOString().split("T")[0];
    }
    return "";
  };

  const statusLabel: Record<string, string> = {
    SCHEDULED: "Upcoming",
    ONGOING: "Ongoing",
    COMPLETED: "Completed",
    RESULTS_PUBLISHED: "Published",
  };

  const toggleExamExpand = (examId: string) => {
    setExpandedExamId(expandedExamId === examId ? null : examId);
  };

  // ── Data Loading ─────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [typeList, examList, schedList, sessList, clsList, subjList, csList, secList] = await Promise.all([
        getExamTypes(accessToken).catch(() => []),
        getExams({}, accessToken).catch(() => []),
        getExamSchedules({}, accessToken).catch(() => []),
        getAcademicSessions(accessToken).catch(() => []),
        getClasses(accessToken).catch(() => []),
        getSubjects(accessToken).catch(() => []),
        getClassSubjects(accessToken).catch(() => []),
        getSections(accessToken).catch(() => []),
      ]);
      setExamTypes(typeList || []);
      setExams(examList || []);
      setSchedules(schedList || []);
      setSessions(sessList || []);
      setClasses(clsList || []);
      setSubjects(subjList || []);
      setClassSubjects(csList || []);
      setSections(secList || []);
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

  // ── Load All Schedules (global, for counts in the list view) ──
  const loadAllSchedules = async () => {
    try {
      const scheds = await getExamSchedules({}, accessToken);
      setSchedules(scheds || []);
    } catch {
      setSchedules([]);
    }
  };

  // ── Exam Type CRUD ───────────────────────────────────────────
  const openCreateType = () => {
    setEditingType(null);
    setTypeForm({ name: "", weightagePercent: "" });
    setTypeModalOpen(true);
  };

  const openEditType = (type: ExamType) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      weightagePercent: type.weightagePercent ? String(type.weightagePercent) : "",
    });
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return toast("Error", "Exam type name is required", "error");
    const typeNameError = validateMaxLength(
      typeForm.name,
      "Exam type name",
      LIMITS.EXAM_NAME_MAX,
    );
    if (typeNameError) return toast("Error", typeNameError, "error");
    if (typeForm.weightagePercent) {
      const weightageError = validateNumeric(
        typeForm.weightagePercent,
        "Weightage (%)",
        { min: 0, max: 100 },
      );
      if (weightageError) return toast("Error", weightageError, "error");
    }
    setSubmitting(true);
    try {
      const payload: CreateExamTypePayload = {
        name: typeForm.name.trim(),
        weightagePercent: typeForm.weightagePercent ? Number(typeForm.weightagePercent) : undefined,
      };
      if (editingType) {
        await updateExamType(editingType.id, payload, accessToken);
        toast("Updated", `Exam type "${typeForm.name}" updated.`, "success");
      } else {
        await createExamType(payload, accessToken);
        toast("Created", `Exam type "${typeForm.name}" created.`, "success");
      }
      setTypeModalOpen(false);
      setExamTypes(await getExamTypes(accessToken));
    } catch (err: any) {
      toast("Error", err.message || "Failed to save exam type", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
    const examNameError = validateMaxLength(
      examForm.name,
      "Examination name",
      LIMITS.EXAM_NAME_MAX,
    );
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
    } catch (err: any) {
      toast("Error", err.message || "Failed to save exam", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Schedule CRUD ────────────────────────────────────────────
  const openCreateSchedule = (examId: string) => {
    setEditingSchedule(null);
    const exam = exams.find((e) => e.id === examId);
    setScheduleForm({
      examId, subjectId: "", examDate: "", startTime: "09:00",
      endTime: "12:00", maxMarks: "100", passingMarks: "33", room: "",
    });
    setScheduleModalOpen(true);
  };

  const openEditSchedule = (sched: ExamSchedule) => {
    setEditingSchedule(sched);
    setScheduleForm({
      examId: sched.examId,
      subjectId: sched.subjectId,
      examDate: safeDateInput(sched.examDate),
      startTime: formatTimeForInput(sched.startTime),
      endTime: formatTimeForInput(sched.endTime),
      maxMarks: String(Number(sched.maxMarks) || 100),
      passingMarks: String(Number(sched.passingMarks) || 33),
      room: sched.room || "",
    });
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.examId) return toast("Error", "Exam is required", "error");
    if (!scheduleForm.subjectId) return toast("Error", "Subject is required", "error");
    if (!scheduleForm.examDate) return toast("Error", "Exam date is required", "error");
    if (!scheduleForm.startTime || !scheduleForm.endTime) return toast("Error", "Times are required", "error");

    const maxError = firstError(
      validateNumeric(scheduleForm.maxMarks, "Max marks", { min: 1, max: 10000 }),
      validateNumeric(scheduleForm.passingMarks, "Passing marks", { min: 0, max: 10000 }),
    );
    if (maxError) return toast("Error", maxError, "error");
    if (Number(scheduleForm.passingMarks) > Number(scheduleForm.maxMarks)) {
      return toast("Error", "Passing marks cannot exceed maximum marks", "error");
    }
    if (scheduleForm.endTime <= scheduleForm.startTime) {
      return toast("Error", "End time must be after start time", "error");
    }

    setSubmitting(true);
    try {
      const payload: CreateExamSchedulePayload = {
        examId: scheduleForm.examId,
        subjectId: scheduleForm.subjectId,
        examDate: scheduleForm.examDate,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        maxMarks: Number(scheduleForm.maxMarks),
        passingMarks: Number(scheduleForm.passingMarks),
        room: scheduleForm.room.trim() || undefined,
      };
      if (editingSchedule) {
        await updateExamSchedule(editingSchedule.id, payload, accessToken);
        toast("Updated", "Schedule updated.", "success");
      } else {
        await createExamSchedule(payload, accessToken);
        toast("Created", "Schedule added.", "success");
      }
      setScheduleModalOpen(false);
      await loadAllSchedules();
    } catch (err: any) {
      toast("Error", err.message || "Failed to save schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const promptDelete = (kind: "exam" | "type" | "schedule", id: string, name: string) => {
    setItemToDelete({ id, name, kind });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      if (itemToDelete.kind === "exam") {
        await deleteExam(itemToDelete.id, accessToken);
        toast("Deleted", `Exam "${itemToDelete.name}" deleted.`, "success");
        setExams(await getExams({}, accessToken));
        if (selectedExam?.id === itemToDelete.id) setSelectedExam(null);
      } else if (itemToDelete.kind === "type") {
        await deleteExamType(itemToDelete.id, accessToken);
        toast("Deleted", `Exam type "${itemToDelete.name}" deleted.`, "success");
        setExamTypes(await getExamTypes(accessToken));
      } else if (itemToDelete.kind === "schedule") {
        await deleteExamSchedule(itemToDelete.id, accessToken);
        toast("Deleted", "Schedule deleted.", "success");
        await loadAllSchedules();
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reference Lookups ────────────────────────────────────────
  const classesForExam = (exam: Exam) => {
    return classes.find((c) => c.id === exam.classId);
  };

  const schedulesForExam = (examId: string) => {
    return schedules.filter((s) => s.examId === examId);
  };

  const subjectsForExam = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return [];
    const allowedSubjectIds = classSubjects
      .filter((cs) => cs.classId === exam.classId && cs.academicSessionId === exam.academicSessionId)
      .map((cs) => cs.subjectId);
    return subjects.filter((s) => allowedSubjectIds.includes(s.id));
  };

  const sectionsForClassSession = (classId: string, sessionId: string) => {
    return sections.filter((s) => s.classId === classId && s.academicSessionId === sessionId);
  };

  // ── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Examinations</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage examinations and exam schedules</p>
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
    const examSubjects = subjectsForExam(selectedExam.id);
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

        {/* Subjects / Schedules */}
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Subjects & Schedules</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {examSchedules.length} schedule{examSchedules.length !== 1 ? "s" : ""} configured
              </p>
            </div>
            <Button size="sm" onClick={() => openCreateSchedule(selectedExam.id)} className="bg-blue-600 hover:bg-blue-700 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Schedule
            </Button>
          </div>
          <CardContent className="p-0">
            {examSchedules.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No schedules configured for this examination.</p>
                <p className="text-xs text-muted-foreground mt-1">Add a schedule to define subjects, dates, and marks.</p>
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
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditSchedule(sc)} className="h-8 w-8 p-0">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => promptDelete("schedule", sc.id, sc.subject?.name || "Schedule")} className="h-8 w-8 p-0 text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Exam Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => promptDelete("exam", selectedExam.id, selectedExam.name)} className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Exam
          </Button>
          <Button variant="outline" size="sm" onClick={() => openEditExam(selectedExam)} className="text-xs">
            <Edit2 className="h-3 w-3 mr-1" />
            Edit Exam
          </Button>
        </div>

        {/* Schedule Dialog */}
        <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit Schedule" : "Add Exam Schedule"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Subject *</label>
              <select
                value={scheduleForm.subjectId}
                onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Subject</option>
                {subjectsForExam(scheduleForm.examId).map((sb) => (
                  <option key={sb.id} value={sb.id}>{sb.name} {sb.code ? `(${sb.code})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Exam Date *</label>
                <Input type="date" value={scheduleForm.examDate} onChange={(e) => setScheduleForm({ ...scheduleForm, examDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Start Time *</label>
                <Input type="time" value={scheduleForm.startTime} onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">End Time *</label>
                <Input type="time" value={scheduleForm.endTime} onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Max Marks *</label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={scheduleForm.maxMarks} onChange={(e) => setScheduleForm({ ...scheduleForm, maxMarks: onlyDigits(e.target.value, 5) })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Passing Marks *</label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={scheduleForm.passingMarks} onChange={(e) => setScheduleForm({ ...scheduleForm, passingMarks: onlyDigits(e.target.value, 5) })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Room / Venue</label>
                <Input placeholder="e.g. Hall 1" maxLength={LIMITS.TEXT_MAX} value={scheduleForm.room} onChange={(e) => setScheduleForm({ ...scheduleForm, room: trimMax(e.target.value, LIMITS.TEXT_MAX) })} />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)} className="text-xs">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-xs">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingSchedule ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Delete Confirmation */}
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
          <p className="text-xs text-muted-foreground mt-1">Manage examinations and exam schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openCreateType} className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Exam Type
          </Button>
          <Button size="sm" onClick={openCreateExam} className="bg-blue-600 hover:bg-blue-700 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Create Examination
          </Button>
        </div>
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
                        <Button variant="ghost" size="sm" onClick={() => openEditExam(ex)} className="h-8 w-8 p-0">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => promptDelete("exam", ex.id, ex.name)} className="h-8 w-8 p-0 text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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

      {/* ── Dialog: Create/Edit Exam Type ─────────────────────── */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingType ? "Edit Exam Type" : "Create Exam Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveType} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Type Name *</label>
            <Input placeholder="e.g. Unit Test" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: trimMax(e.target.value, LIMITS.EXAM_NAME_MAX) })} maxLength={LIMITS.EXAM_NAME_MAX} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Weightage (%)</label>
            <Input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" placeholder="e.g. 20" maxLength={6} value={typeForm.weightagePercent} onChange={(e) => setTypeForm({ ...typeForm, weightagePercent: onlyDecimal(e.target.value, 3, 2) })} />
          </div>
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setTypeModalOpen(false)} className="text-xs">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingType ? "Update" : "Create"}
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
