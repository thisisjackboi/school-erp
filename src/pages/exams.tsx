"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";

import {
  getExamTypes,
  createExamType,
  updateExamType,
  deleteExamType,
  CreateExamTypePayload,
} from "@/lib/api/exam-types.api";
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  CreateExamPayload,
} from "@/lib/api/exams.api";
import {
  getExamSchedules,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
  CreateExamSchedulePayload,
} from "@/lib/api/exam-schedules.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSubjects } from "@/lib/api/subjects.api";

import type { ExamType, Exam, ExamSchedule, ExamStatus } from "@/lib/types/exam";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Subject } from "@/lib/types/subject";

export default function ExamsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("exam-types");

  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);

  const [examFilterSession, setExamFilterSession] = useState("");
  const [examFilterClass, setExamFilterClass] = useState("");
  const [examFilterType, setExamFilterType] = useState("");
  const [examFilterStatus, setExamFilterStatus] = useState("");
  const [scheduleFilterExam, setScheduleFilterExam] = useState("");

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [editingType, setEditingType] = useState<ExamType | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; kind: "type" | "exam" | "schedule" } | null>(null);

  const [typeForm, setTypeForm] = useState({ name: "", weightagePercent: "" });
  const [examForm, setExamForm] = useState({
    name: "",
    examTypeId: "",
    academicSessionId: "",
    classId: "",
    startDate: "",
    endDate: "",
    status: "SCHEDULED" as ExamStatus,
  });
  const [scheduleForm, setScheduleForm] = useState({
    examId: "",
    subjectId: "",
    examDate: "",
    startTime: "09:00 AM",
    endTime: "12:00 PM",
    maxMarks: "100",
    passingMarks: "33",
    room: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [typeList, examList, schedList, sessList, clsList, subjList] = await Promise.all([
        getExamTypes(accessToken).catch(() => []),
        getExams({}, accessToken).catch(() => []),
        getExamSchedules({}, accessToken).catch(() => []),
        getAcademicSessions(accessToken).catch(() => []),
        getClasses(accessToken).catch(() => []),
        getSubjects(accessToken).catch(() => []),
      ]);
      setExamTypes(typeList || []);
      setExams(examList || []);
      setSchedules(schedList || []);
      setSessions(sessList || []);
      setClasses(clsList || []);
      setSubjects(subjList || []);
    } catch (err: any) {
      toast("Error", err.message || "Failed to load examination data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [accessToken]);

  // ── Filter Effects ────────────────────────────────────────────
  const applyExamFilters = async () => {
    try {
      const filtered = await getExams(
        {
          academicSessionId: examFilterSession || undefined,
          classId: examFilterClass || undefined,
          examTypeId: examFilterType || undefined,
          status: (examFilterStatus as ExamStatus) || undefined,
        },
        accessToken
      );
      setExams(filtered);
    } catch (err: any) {
      toast("Error", err.message || "Failed to filter exams", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "exams") applyExamFilters();
  }, [examFilterSession, examFilterClass, examFilterType, examFilterStatus]);

  const applyScheduleFilters = async () => {
    try {
      const filtered = await getExamSchedules({ examId: scheduleFilterExam || undefined }, accessToken);
      setSchedules(filtered);
    } catch (err: any) {
      toast("Error", err.message || "Failed to filter schedules", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "exam-schedules") applyScheduleFilters();
  }, [scheduleFilterExam]);

  // ── Exam Type Handlers ────────────────────────────────────────
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

  // ── Exam Handlers ─────────────────────────────────────────────
  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm({
      name: "",
      examTypeId: examTypes[0]?.id || "",
      academicSessionId: sessions[0]?.id || "",
      classId: classes[0]?.id || "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      status: "SCHEDULED",
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
      startDate: exam.startDate ? exam.startDate.split("T")[0] : "",
      endDate: exam.endDate ? exam.endDate.split("T")[0] : "",
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
    if (!examForm.startDate || !examForm.endDate) return toast("Error", "Start and end dates are required", "error");

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
      await applyExamFilters();
    } catch (err: any) {
      toast("Error", err.message || "Failed to save exam", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Schedule Handlers ─────────────────────────────────────────
  const openCreateSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      examId: exams[0]?.id || "",
      subjectId: subjects[0]?.id || "",
      examDate: new Date().toISOString().split("T")[0],
      startTime: "09:00 AM",
      endTime: "12:00 PM",
      maxMarks: "100",
      passingMarks: "33",
      room: "Hall A",
    });
    setScheduleModalOpen(true);
  };

  const openEditSchedule = (sched: ExamSchedule) => {
    setEditingSchedule(sched);
    setScheduleForm({
      examId: sched.examId,
      subjectId: sched.subjectId,
      examDate: sched.examDate ? sched.examDate.split("T")[0] : "",
      startTime: sched.startTime || "",
      endTime: sched.endTime || "",
      maxMarks: String(sched.maxMarks || 100),
      passingMarks: String(sched.passingMarks || 33),
      room: sched.room || "",
    });
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.examId) return toast("Error", "Exam is required", "error");
    if (!scheduleForm.subjectId) return toast("Error", "Subject is required", "error");
    if (!scheduleForm.examDate) return toast("Error", "Exam date is required", "error");
    if (!scheduleForm.startTime || !scheduleForm.endTime) return toast("Error", "Start and end times are required", "error");
    if (!scheduleForm.maxMarks || !scheduleForm.passingMarks) return toast("Error", "Marks are required", "error");

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
        toast("Updated", "Exam schedule updated.", "success");
      } else {
        await createExamSchedule(payload, accessToken);
        toast("Created", "Exam schedule added.", "success");
      }
      setScheduleModalOpen(false);
      await applyScheduleFilters();
    } catch (err: any) {
      toast("Error", err.message || "Failed to save schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const promptDelete = (kind: "type" | "exam" | "schedule", id: string, name: string) => {
    setItemToDelete({ id, name, kind });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      if (itemToDelete.kind === "type") {
        await deleteExamType(itemToDelete.id, accessToken);
        toast("Deleted", `Exam type "${itemToDelete.name}" deleted.`, "success");
        setExamTypes(await getExamTypes(accessToken));
      } else if (itemToDelete.kind === "exam") {
        await deleteExam(itemToDelete.id, accessToken);
        toast("Deleted", `Exam "${itemToDelete.name}" deleted.`, "success");
        await applyExamFilters();
      } else {
        await deleteExamSchedule(itemToDelete.id, accessToken);
        toast("Deleted", "Schedule deleted.", "success");
        await applyScheduleFilters();
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete item", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "N/A");

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Examinations</h1>
          <p className="text-xs text-muted-foreground">Manage exam types, create exams, and schedule subject-wise timetables.</p>
        </div>
        <Button
          onClick={() => (activeTab === "exam-types" ? openCreateType() : activeTab === "exams" ? openCreateExam() : openCreateSchedule())}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add {activeTab === "exam-types" ? "Exam Type" : activeTab === "exams" ? "Exam" : "Schedule"}
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading examination records...</p>
        </Card>
      ) : (
        <Tabs defaultValue="exam-types" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="exam-types">Exam Types</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="exam-schedules">Schedules</TabsTrigger>
          </TabsList>

          {/* ── Exam Types Tab ─────────────────────────────── */}
          <TabsContent value="exam-types">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-bold">Exam Types & Weightages</CardTitle>
                <Button onClick={openCreateType} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Type
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {examTypes.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No exam types created yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Type Name</TableHead>
                        <TableHead>Weightage (%)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examTypes.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-semibold">{t.name}</TableCell>
                          <TableCell>
                            {t.weightagePercent != null ? (
                              <span className="text-sm font-semibold text-blue-600">{t.weightagePercent}%</span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditType(t)} className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => promptDelete("type", t.id, t.name)} className="h-8 w-8 p-0 text-rose-600">
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

          {/* ── Exams Tab ──────────────────────────────────── */}
          <TabsContent value="exams">
            <Card>
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Examinations List</CardTitle>
                  <Button onClick={openCreateExam} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Create Exam
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <select value={examFilterSession} onChange={(e) => setExamFilterSession(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Sessions</option>
                    {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={examFilterClass} onChange={(e) => setExamFilterClass(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={examFilterType} onChange={(e) => setExamFilterType(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Types</option>
                    {examTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select value={examFilterStatus} onChange={(e) => setExamFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {exams.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No exams found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((ex) => (
                        <TableRow key={ex.id}>
                          <TableCell className="font-semibold">{ex.name}</TableCell>
                          <TableCell>{ex.examType?.name || "N/A"}</TableCell>
                          <TableCell>{ex.class?.name || "N/A"}</TableCell>
                          <TableCell className="text-muted-foreground">{ex.academicSession?.name || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(ex.startDate)} - {formatDate(ex.endDate)}</TableCell>
                          <TableCell><StatusChip status={ex.status.toLowerCase()} /></TableCell>
                          <TableCell className="text-right space-x-1 whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => openEditExam(ex)} className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => promptDelete("exam", ex.id, ex.name)} className="h-8 w-8 p-0 text-rose-600">
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

          {/* ── Schedules Tab ──────────────────────────────── */}
          <TabsContent value="exam-schedules">
            <Card>
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Exam Timetable Schedules</CardTitle>
                  <Button onClick={openCreateSchedule} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Schedule
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <select value={scheduleFilterExam} onChange={(e) => setScheduleFilterExam(e.target.value)} className="h-9 w-full sm:w-72 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="">All Examinations</option>
                    {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.class?.name || "Class"})</option>)}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {schedules.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No exam schedules found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Marks (Pass / Max)</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((sc) => (
                        <TableRow key={sc.id}>
                          <TableCell className="font-semibold">{sc.exam?.name || "N/A"}</TableCell>
                          <TableCell>{sc.subject?.name || "N/A"} {sc.subject?.code ? `(${sc.subject.code})` : ""}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(sc.examDate)}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{sc.startTime} - {sc.endTime}</TableCell>
                          <TableCell className="font-semibold">{sc.passingMarks} / {sc.maxMarks}</TableCell>
                          <TableCell>{sc.room || "-"}</TableCell>
                          <TableCell className="text-right space-x-1 whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => openEditSchedule(sc)} className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => promptDelete("schedule", sc.id, sc.subject?.name || "Schedule")} className="h-8 w-8 p-0 text-rose-600">
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

      {/* ── Dialog: Exam Type ─────────────────────────────── */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingType ? "Edit Exam Type" : "Add Exam Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveType} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Exam Type Name *</label>
            <Input placeholder="e.g. Mid-Term Examination" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Weightage Percentage (%)</label>
            <Input type="number" min="0" max="100" placeholder="e.g. 30" value={typeForm.weightagePercent} onChange={(e) => setTypeForm({ ...typeForm, weightagePercent: e.target.value })} />
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

      {/* ── Dialog: Exam ──────────────────────────────────── */}
      <Dialog open={examModalOpen} onOpenChange={setExamModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingExam ? "Edit Exam" : "Create Exam"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveExam} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Exam Title *</label>
            <Input placeholder="e.g. Grade 10 Mid-Term 2026" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Exam Type *</label>
              <select value={examForm.examTypeId} onChange={(e) => setExamForm({ ...examForm, examTypeId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="">Select Exam Type</option>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Class *</label>
              <select value={examForm.classId} onChange={(e) => setExamForm({ ...examForm, classId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Status</label>
              <select value={examForm.status} onChange={(e) => setExamForm({ ...examForm, status: e.target.value as ExamStatus })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="SCHEDULED">Scheduled</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Start Date *</label>
              <Input type="date" value={examForm.startDate} onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">End Date *</label>
              <Input type="date" value={examForm.endDate} onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })} />
            </div>
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

      {/* ── Dialog: Schedule ──────────────────────────────── */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingSchedule ? "Edit Schedule" : "Add Exam Schedule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Exam *</label>
              <select value={scheduleForm.examId} onChange={(e) => setScheduleForm({ ...scheduleForm, examId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="">Select Exam</option>
                {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.class?.name || "Class"})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Subject *</label>
              <select value={scheduleForm.subjectId} onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                <option value="">Select Subject</option>
                {subjects.map((sb) => <option key={sb.id} value={sb.id}>{sb.name} {sb.code ? `(${sb.code})` : ""}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Exam Date *</label>
              <Input type="date" value={scheduleForm.examDate} onChange={(e) => setScheduleForm({ ...scheduleForm, examDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Start Time *</label>
              <Input placeholder="09:00 AM" value={scheduleForm.startTime} onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">End Time *</label>
              <Input placeholder="12:00 PM" value={scheduleForm.endTime} onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Max Marks *</label>
              <Input type="number" min="1" value={scheduleForm.maxMarks} onChange={(e) => setScheduleForm({ ...scheduleForm, maxMarks: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Passing Marks *</label>
              <Input type="number" min="0" value={scheduleForm.passingMarks} onChange={(e) => setScheduleForm({ ...scheduleForm, passingMarks: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Room / Venue</label>
              <Input placeholder="e.g. Hall 1" value={scheduleForm.room} onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })} />
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

      {/* ── Dialog: Delete Confirmation ───────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2 text-xs text-muted-foreground">
          <p>Are you sure you want to delete <strong className="text-foreground">{itemToDelete?.name}</strong>?</p>
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
