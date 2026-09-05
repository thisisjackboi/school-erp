"use client";

import React from "react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Award, GraduationCap } from "lucide-react";
import { DUMMY_STUDENT_MARKS } from "@/lib/dummy-data";

interface PrintableReportCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName?: string;
  grade?: string;
  section?: string;
}

export function PrintableReportCard({
  open,
  onOpenChange,
  studentName = "Aarav Sharma",
  grade = "Grade 10",
  section = "A",
}: PrintableReportCardProps) {
  const marks = DUMMY_STUDENT_MARKS.filter((m) => m.studentName === studentName);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="no-print">
        <DialogTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-600" />
            <span>Academic Performance Report Card Preview</span>
          </span>
          <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Marksheet
          </Button>
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
            ACADEMIC PERFORMANCE REPORT CARD (SESSION 2026-2027)
          </p>
        </div>

        {/* Student Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <p><span className="font-semibold text-slate-600 dark:text-slate-400">Student Name:</span> <strong className="text-slate-900 dark:text-white">{studentName}</strong></p>
            <p><span className="font-semibold text-slate-600 dark:text-slate-400">Roll No:</span> 101</p>
            <p><span className="font-semibold text-slate-600 dark:text-slate-400">Admission No:</span> ADM-2024-001</p>
          </div>
          <div>
            <p><span className="font-semibold text-slate-600 dark:text-slate-400">Class & Section:</span> {grade} - {section}</p>
            <p><span className="font-semibold text-slate-600 dark:text-slate-400">Father's Name:</span> Rajesh Sharma</p>
            <p><span className="font-semibold text-slate-600 dark:text-slate-400">Attendance:</span> 96.5% (110/114 Days)</p>
          </div>
        </div>

        {/* Marks Table */}
        <div className="border rounded-lg overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white font-semibold">
                <th className="p-2.5 border">Subject Code</th>
                <th className="p-2.5 border">Subject Title</th>
                <th className="p-2.5 border">Max Marks</th>
                <th className="p-2.5 border">Marks Obtained</th>
                <th className="p-2.5 border">Grade</th>
                <th className="p-2.5 border">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m, i) => (
                <tr key={i} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="p-2.5 border font-mono">SUB-10{i + 1}</td>
                  <td className="p-2.5 border font-semibold">{m.subject}</td>
                  <td className="p-2.5 border">{m.maxMarks}</td>
                  <td className="p-2.5 border font-bold text-blue-600">{m.marksObtained}</td>
                  <td className="p-2.5 border font-bold text-emerald-600">{m.gradeLetter}</td>
                  <td className="p-2.5 border text-slate-600 dark:text-slate-300">{m.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grade Summary & Signatures */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs border-t">
          <div>
            <div className="h-10 border-b border-dashed mb-2" />
            <p className="font-semibold">Class Teacher Signature</p>
            <p className="text-[10px] text-muted-foreground">Sunita Deshmukh</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed mb-2 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">PASSED - GRADE A1</span>
            </div>
            <p className="font-semibold">Academic Seal</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed mb-2" />
            <p className="font-semibold">Principal Signature</p>
            <p className="text-[10px] text-muted-foreground">Dr. S.K. Malhotra</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
