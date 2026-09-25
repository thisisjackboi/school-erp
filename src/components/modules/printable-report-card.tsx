"use client";

import React from "react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Award, GraduationCap } from "lucide-react";
import type { StudentResultRow } from "@/lib/exam-results-utils";

interface PrintableReportCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: StudentResultRow;
  examName?: string;
  sessionName?: string;
  className?: string;
  sectionName?: string;
  guardianName?: string;
  attendanceSummary?: string;
}

export function PrintableReportCard({
  open,
  onOpenChange,
  result,
  examName = "",
  sessionName = "",
  className = "",
  sectionName = "",
  guardianName = "",
  attendanceSummary = "",
}: PrintableReportCardProps) {
  const { student, subjectMarks, totalObtained, totalMax, percentage, grade, rank, status } =
    result;

  const handlePrint = () => {
    window.print();
  };

  const overallResult = !result.hasMarks
    ? "PENDING"
    : status === "PASS"
      ? "PASSED"
      : status === "FAIL"
        ? "FAILED"
        : "PENDING";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="no-print">
        <DialogTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-600" />
            <span>Academic Performance Report Card</span>
          </span>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Save PDF
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Marksheet
            </Button>
          </div>
        </DialogTitle>
      </DialogHeader>

      <div id="printable-area" className="p-6 bg-white dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-slate-100 font-sans space-y-6">
        {/* Header Branding */}
        <div className="text-center border-b pb-4 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold uppercase tracking-wide text-blue-900 dark:text-blue-200">
              PrismaEd+ Senior Secondary School
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Affiliated to CBSE • School Code: 54109 • Vasant Vihar, New Delhi
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 mt-2">
            ACADEMIC PERFORMANCE REPORT CARD
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {examName}
            {sessionName ? `  •  Session ${sessionName}` : ""}
          </p>
        </div>

        {/* Student Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Student Name:</span>{" "}
              <strong className="text-slate-900 dark:text-white">
                {student.firstName} {student.lastName}
              </strong>
            </p>
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Roll No:</span>{" "}
              {student.rollNumber || "—"}
            </p>
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Admission No:</span>{" "}
              {student.admissionNumber}
            </p>
          </div>
          <div>
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Class & Section:</span>{" "}
              {className || "—"}
              {sectionName ? ` - ${sectionName}` : ""}
            </p>
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Guardian:</span>{" "}
              {guardianName || "—"}
            </p>
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-400">Attendance:</span>{" "}
              {attendanceSummary || "—"}
            </p>
          </div>
        </div>

        {/* Marks Table */}
        {result.hasMarks ? (
          <div className="border rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white font-semibold">
                  <th className="p-2.5 border">Subject</th>
                  <th className="p-2.5 border text-right">Max Marks</th>
                  <th className="p-2.5 border text-right">Pass Marks</th>
                  <th className="p-2.5 border text-right">Marks Obtained</th>
                  <th className="p-2.5 border text-right">Percentage</th>
                  <th className="p-2.5 border">Result</th>
                </tr>
              </thead>
              <tbody>
                {subjectMarks.map((m, i) => {
                  const subjectPct =
                    m.maxMarks > 0 ? Math.round((m.marks / m.maxMarks) * 100) : 0;
                  const subjectResult = m.isAbsent
                    ? "ABSENT"
                    : m.marks >= m.passingMarks
                      ? "PASS"
                      : "FAIL";
                  return (
                    <tr
                      key={i}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <td className="p-2.5 border font-semibold">{m.subject}</td>
                      <td className="p-2.5 border text-right">{m.maxMarks}</td>
                      <td className="p-2.5 border text-right">{m.passingMarks}</td>
                      <td className="p-2.5 border text-right font-bold text-blue-600">
                        {m.isAbsent ? "—" : m.marks}
                      </td>
                      <td className="p-2.5 border text-right">
                        {m.isAbsent ? "—" : `${subjectPct}%`}
                      </td>
                      <td className="p-2.5 border font-bold">
                        <span
                          className={
                            subjectResult === "PASS"
                              ? "text-emerald-600"
                              : subjectResult === "ABSENT"
                                ? "text-amber-600"
                                : "text-red-600"
                          }
                        >
                          {subjectResult}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {totalMax > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                    <td className="p-2.5 border">Total</td>
                    <td className="p-2.5 border text-right">{totalMax}</td>
                    <td className="p-2.5 border text-right">—</td>
                    <td className="p-2.5 border text-right text-blue-600">{totalObtained}</td>
                    <td className="p-2.5 border text-right">
                      {percentage.toFixed(2)}%
                    </td>
                    <td className="p-2.5 border">—</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          <div className="border rounded-lg p-6 text-center text-xs text-muted-foreground">
            No marks have been recorded for this exam yet.
          </div>
        )}

        {/* Grade Summary */}
        <div className="grid grid-cols-4 gap-4 text-center text-xs">
          <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Percentage</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {totalMax > 0 ? `${percentage.toFixed(2)}%` : "—"}
            </p>
          </div>
          <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Grade</p>
            <p className="text-lg font-bold text-emerald-600">
              {grade?.gradeName || "—"}
            </p>
          </div>
          <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Rank</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {rank ? `${rank}` : "—"}
            </p>
          </div>
          <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Result</p>
            <p
              className={`text-lg font-bold ${
                overallResult === "PASSED"
                  ? "text-emerald-600"
                  : overallResult === "FAILED"
                    ? "text-red-600"
                    : "text-amber-600"
              }`}
            >
              {overallResult}
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs border-t">
          <div>
            <div className="h-10 border-b border-dashed mb-2" />
            <p className="font-semibold">Class Teacher Signature</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed mb-2" />
            <p className="font-semibold">Academic Seal</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed mb-2" />
            <p className="font-semibold">Principal Signature</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}