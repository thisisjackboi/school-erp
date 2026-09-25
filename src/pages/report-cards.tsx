"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, Eye, BarChart3 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/toast";

import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import { getExams } from "@/lib/api/exams.api";
import { getExamSchedules } from "@/lib/api/exam-schedules.api";
import { getExamResults } from "@/lib/api/exam-results.api";
import { getMarks } from "@/lib/api/marks.api";
import { getGrades } from "@/lib/api/grades.api";
import { getStudents } from "@/lib/api/students.api";

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

export default function ReportCardsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [allMarks, setAllMarks] = useState<Mark[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [students, setStudents] = useState<StudentWithEnrollment[]>([]);

  const [loadingRef, setLoadingRef] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [previewRow, setPreviewRow] = useState<StudentResultRow | null>(null);

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId),
    [exams, selectedExamId],
  );

  const filteredExams = useMemo(() => {
    if (!selectedSession) return [];
    return exams.filter((e) => e.academicSessionId === selectedSession);
  }, [exams, selectedSession]);

  const filteredSections = useMemo(() => {
    if (!selectedClassId || !selectedSession) return [];
    return sections.filter(
      (s) => s.classId === selectedClassId && s.academicSessionId === selectedSession,
    );
  }, [sections, selectedClassId, selectedSession]);

  const allStudentResults = useMemo(() => {
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

  const studentResults = useMemo(
    () => allStudentResults.filter((r) => r.hasMarks || r.result),
    [allStudentResults],
  );

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
        if (
          savedCtx?.sessionId &&
          (sessList || []).some((s: AcademicSession) => s.id === savedCtx.sessionId)
        ) {
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
  }, [accessToken, toast]);

  useEffect(() => {
    if (!selectedSession) {
      setExams([]);
      return;
    }
    getExams({ academicSessionId: selectedSession }, accessToken)
      .then((list) => setExams(list || []))
      .catch(() => setExams([]));
  }, [selectedSession, accessToken]);

  useEffect(() => {
    setSelectedExamId("");
    setSelectedClassId("");
    setSelectedSectionId("");
  }, [selectedSession]);

  useEffect(() => {
    setSelectedClassId("");
    setSelectedSectionId("");
  }, [selectedExamId]);

  useEffect(() => {
    setSelectedSectionId("");
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedSession && !selectedExamId && exams.length) {
      const ctx = loadExamWorkflowContext();
      if (
        ctx &&
        ctx.sessionId === selectedSession &&
        ctx.examId &&
        exams.some((e) => e.id === ctx.examId)
      ) {
        setSelectedExamId(ctx.examId);
      }
    }
  }, [selectedSession, selectedExamId, exams]);

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

  useEffect(() => {
    if (!selectedExamId) {
      setExamSchedules([]);
      setExamResults([]);
      setAllMarks([]);
      return;
    }
    Promise.all([
      getExamSchedules({ examId: selectedExamId }, accessToken).catch(() => []),
      getExamResults({ examId: selectedExamId }, accessToken).catch(() => []),
      getMarks({ examId: selectedExamId }, accessToken).catch(() => []),
    ]).then(([scheds, results, stuMarks]) => {
      setExamSchedules(scheds || []);
      setExamResults(results || []);
      setAllMarks(stuMarks || []);
    });
  }, [selectedExamId, accessToken]);

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
        const mapped: StudentWithEnrollment[] = (list || [])
          .map((s: any) => ({
            enrollmentId: s.enrollment?.id || "",
            studentId: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            rollNumber: s.enrollment?.rollNumber || null,
            admissionNumber: s.admissionNumber,
          }))
          .filter((s: StudentWithEnrollment) => s.enrollmentId);
        setStudents(mapped);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId, selectedSession, selectedSectionId, accessToken]);

  if (loadingRef) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Report Cards & Marksheets
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Generate, preview & print official academic report cards from live marks.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name;
  const selectedSectionName = filteredSections.find(
    (s) => s.id === selectedSectionId,
  )?.name;
  const hasResults = selectedExamId && selectedClassId && selectedSectionId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Report Cards & Marksheets
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Generate, preview & print official academic report cards from live marks.
          </p>
        </div>
      </div>

      {/* ── Cascade Filters ─────────────────────────────── */}
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
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? "(Current)" : ""}
                  </option>
                ))}
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
                <option value="">
                  {selectedSession ? "Select Exam" : "Select session first"}
                </option>
                {filteredExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
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
                <option value="">
                  {selectedExamId ? "Select Class" : "Select exam first"}
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
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
                <option value="">
                  {selectedClassId ? "Select Section" : "Select class first"}
                </option>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Context Banner ──────────────────────────────── */}
      {hasResults && (
        <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            {selectedExam?.name}
          </span>
          <span className="text-blue-400">•</span>
          <span className="font-medium">
            {selectedClassName} • {selectedSectionName}
          </span>
          <span className="text-blue-400">•</span>
          <span className="font-medium">{studentResults.length} student(s)</span>
        </div>
      )}

      {/* ── Student Report Cards Table ──────────────────── */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Student Report Cards List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loadingStudents ? (
              <div className="py-12 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Loading students...</p>
              </div>
            ) : studentResults.length === 0 ? (
              <div className="py-12 text-center">
                <BarChart3 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No report cards available for this context yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter marks and generate results before previewing report cards.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-100/70 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold w-12">#</th>
                      <th className="px-6 py-3.5 font-semibold">Roll No</th>
                      <th className="px-6 py-3.5 font-semibold">Student Name</th>
                      <th className="px-6 py-3.5 font-semibold">Class & Sec</th>
                      <th className="px-6 py-3.5 text-right font-semibold">Percentage</th>
                      <th className="px-6 py-3.5 text-center font-semibold">Grade</th>
                      <th className="px-6 py-3.5 text-center font-semibold">Result Status</th>
                      <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {studentResults.map((row) => (
                      <tr
                        key={row.student.enrollmentId}
                        className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4 text-muted-foreground">{row.rank || "-"}</td>
                        <td className="px-6 py-4 font-semibold font-mono text-slate-700 dark:text-slate-300">{row.student.rollNumber || "-"}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                          {row.student.firstName} {row.student.lastName}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {selectedClassName} - {selectedSectionName}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                          {row.totalMax > 0 ? `${row.percentage.toFixed(2)}%` : "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.grade ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {row.grade.gradeName}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusChip
                            status={
                              row.result?.resultStatus?.toLowerCase() ||
                              (isAbsentOnly(row) ? "absent" : "pending")
                            }
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewRow(row)}
                            className="h-8 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> Preview Report Card
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Empty State ─────────────────────────────────── */}
      {!hasResults && (
        <div className="py-16 text-center">
          <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Select a session, examination, class, and section to view report cards.
          </p>
        </div>
      )}

      {previewRow && (
        <PrintableReportCard
          open={!!previewRow}
          onOpenChange={(open) => {
            if (!open) setPreviewRow(null);
          }}
          result={previewRow}
          examName={selectedExam?.name}
          sessionName={sessions.find((s) => s.id === selectedSession)?.name}
          className={selectedClassName}
          sectionName={selectedSectionName}
        />
      )}
    </div>
  );
}