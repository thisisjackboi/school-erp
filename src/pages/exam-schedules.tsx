"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Edit2, Loader2, Calendar, Clock, BookOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import {
  formatDisplayDate,
  formatTimeOfDay,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/dates";

import {
  getExamSchedules, createExamSchedule, updateExamSchedule, deleteExamSchedule,
  type CreateExamSchedulePayload,
} from "@/lib/api/exam-schedules.api";
import { getExams } from "@/lib/api/exams.api";
import { getSubjects } from "@/lib/api/subjects.api";
import { getClassSubjects } from "@/lib/api/class-subjects.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";

import type { ExamSchedule } from "@/lib/types/exam";
import type { Exam } from "@/lib/types/exam";
import type { Subject } from "@/lib/types/subject";
import type { ClassSubject } from "@/lib/types/class-subject";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";

import {
  LIMITS,
  firstError,
  onlyDigits,
  trimMax,
  validateNumeric,
} from "@/lib/input-restrictions";

export default function ExamSchedulesPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamSchedule | null>(null);
  const [form, setForm] = useState({
    examId: "", subjectId: "", examDate: "", startTime: "09:00",
    endTime: "12:00", maxMarks: "100", passingMarks: "33", room: "",
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExamSchedule | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedList, examList, subjList, csList, sessList, clsList] = await Promise.all([
        getExamSchedules({}, accessToken).catch(() => []),
        getExams({}, accessToken).catch(() => []),
        getSubjects(accessToken).catch(() => []),
        getClassSubjects(accessToken).catch(() => []),
        getAcademicSessions(accessToken).catch(() => []),
        getClasses(accessToken).catch(() => []),
      ]);
      setSchedules(schedList || []);
      setExams(examList || []);
      setSubjects(subjList || []);
      setClassSubjects(csList || []);
      setSessions(sessList || []);
      setClasses(clsList || []);
      const currentSession = (sessList || []).find((s: AcademicSession) => s.isCurrent);
      if (currentSession) setSelectedSession(currentSession.id);
    } catch (err: any) {
      toast("Error", err.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [accessToken]);

  const filteredExams = useMemo(() => {
    if (!selectedSession) return exams;
    return exams.filter((e) => e.academicSessionId === selectedSession);
  }, [exams, selectedSession]);

  const filteredSchedules = useMemo(() => {
    if (!selectedExamId) return schedules;
    return schedules.filter((s) => s.examId === selectedExamId);
  }, [schedules, selectedExamId]);

  const subjectsForExam = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return [];
    const allowedSubjectIds = classSubjects
      .filter((cs) => cs.classId === exam.classId && cs.academicSessionId === exam.academicSessionId)
      .map((cs) => cs.subjectId);
    return subjects.filter((s) => allowedSubjectIds.includes(s.id));
  };

  const examLabel = (sched: ExamSchedule) => {
    if (sched.exam) return sched.exam.name;
    const ex = exams.find((e) => e.id === sched.examId);
    return ex?.name || "N/A";
  };

  const formatTimeDisplay = (val: unknown): string => formatTimeOfDay(val);

  const formatTimeForInput = (val: unknown): string => toTimeInputValue(val);

  const safeDateInput = (val: unknown): string => toDateInputValue(val);

  const safeDateStr = (val: unknown): string => formatDisplayDate(val);

  const openCreate = (examId?: string) => {
    setEditing(null);
    setForm({
      examId: examId || selectedExamId || "",
      subjectId: "", examDate: "", startTime: "09:00",
      endTime: "12:00", maxMarks: "100", passingMarks: "33", room: "",
    });
    setModalOpen(true);
  };

  const openEdit = (sched: ExamSchedule) => {
    setEditing(sched);
    setForm({
      examId: sched.examId,
      subjectId: sched.subjectId,
      examDate: safeDateInput(sched.examDate),
      startTime: formatTimeForInput(sched.startTime),
      endTime: formatTimeForInput(sched.endTime),
      maxMarks: String(Number(sched.maxMarks) || 100),
      passingMarks: String(Number(sched.passingMarks) || 33),
      room: sched.room || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examId) return toast("Error", "Exam is required", "error");
    if (!form.subjectId) return toast("Error", "Subject is required", "error");
    if (!form.examDate) return toast("Error", "Exam date is required", "error");
    if (!form.startTime || !form.endTime) return toast("Error", "Times are required", "error");

    const maxError = firstError(
      validateNumeric(form.maxMarks, "Max marks", { min: 1, max: 10000 }),
      validateNumeric(form.passingMarks, "Passing marks", { min: 0, max: 10000 }),
    );
    if (maxError) return toast("Error", maxError, "error");
    if (Number(form.passingMarks) > Number(form.maxMarks)) {
      return toast("Error", "Passing marks cannot exceed maximum marks", "error");
    }
    if (form.endTime <= form.startTime) {
      return toast("Error", "End time must be after start time", "error");
    }

    setSubmitting(true);
    try {
      const payload: CreateExamSchedulePayload = {
        examId: form.examId,
        subjectId: form.subjectId,
        examDate: form.examDate,
        startTime: form.startTime,
        endTime: form.endTime,
        maxMarks: Number(form.maxMarks),
        passingMarks: Number(form.passingMarks),
        room: form.room.trim() || undefined,
      };
      if (editing) {
        await updateExamSchedule(editing.id, payload, accessToken);
        toast("Updated", "Schedule updated.", "success");
      } else {
        await createExamSchedule(payload, accessToken);
        toast("Created", "Schedule added.", "success");
      }
      setModalOpen(false);
      const scheds = await getExamSchedules({}, accessToken);
      setSchedules(scheds || []);
    } catch (err: any) {
      toast("Error", err.message || "Failed to save schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (sched: ExamSchedule) => {
    setItemToDelete(sched);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      await deleteExamSchedule(itemToDelete.id, accessToken);
      toast("Deleted", "Schedule deleted.", "success");
      const scheds = await getExamSchedules({}, accessToken);
      setSchedules(scheds || []);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Exam Schedules</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage subject-wise exam schedules</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading schedules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Exam Schedules</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage subject-wise exam schedules with dates, times, and marks</p>
        </div>
        <Button size="sm" onClick={() => openCreate()} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add Schedule
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-56">
          <label className="text-xs font-semibold block mb-1">Academic Session</label>
          <select
            value={selectedSession}
            onChange={(e) => { setSelectedSession(e.target.value); setSelectedExamId(""); }}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? "(Current)" : ""}</option>
            ))}
          </select>
        </div>
        <div className="w-56">
          <label className="text-xs font-semibold block mb-1">Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">All Examinations</option>
            {filteredExams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSchedules.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No schedules found.</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedExamId ? "No schedules for the selected examination." : "Create a schedule to get started."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Examination</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Marks (Pass / Max)</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((sc) => (
                  <TableRow key={sc.id}>
                    <TableCell className="font-semibold text-xs">{examLabel(sc)}</TableCell>
                    <TableCell className="font-semibold">
                      {sc.subject?.name || "N/A"}
                      {sc.subject?.code ? <span className="text-muted-foreground font-normal ml-1">({sc.subject.code})</span> : ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{safeDateStr(sc.examDate)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeDisplay(sc.startTime)} – {formatTimeDisplay(sc.endTime)}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{Number(sc.passingMarks)} / {Number(sc.maxMarks)}</TableCell>
                    <TableCell>{sc.room || "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(sc)} className="h-8 w-8 p-0">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => promptDelete(sc)} className="h-8 w-8 p-0 text-rose-600">
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

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Schedule" : "Add Exam Schedule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Examination *</label>
            <select
              value={form.examId}
              onChange={(e) => setForm({ ...form, examId: e.target.value, subjectId: "" })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Examination</option>
              {filteredExams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Subject *</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Subject</option>
              {subjectsForExam(form.examId).map((sb) => (
                <option key={sb.id} value={sb.id}>{sb.name} {sb.code ? `(${sb.code})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Exam Date *</label>
              <Input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Start Time *</label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">End Time *</label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Max Marks *</label>
              <Input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: onlyDigits(e.target.value, 5) })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Passing Marks *</label>
              <Input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: onlyDigits(e.target.value, 5) })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Room / Venue</label>
              <Input placeholder="e.g. Hall 1" maxLength={LIMITS.TEXT_MAX} value={form.room} onChange={(e) => setForm({ ...form, room: trimMax(e.target.value, LIMITS.TEXT_MAX) })} />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="text-xs">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editing ? "Update" : "Create"}
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
          <p>Are you sure you want to delete this schedule for <strong className="text-foreground">{itemToDelete?.subject?.name || "the selected subject"}</strong>?</p>
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
