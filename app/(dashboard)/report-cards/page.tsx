"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintableReportCard } from "@/components/modules/printable-report-card";
import { DUMMY_STUDENTS } from "@/lib/dummy-data";
import { Award, Printer, Download, Eye } from "lucide-react";

export default function ReportCardsPage() {
  const [selectedStudentName, setSelectedStudentName] = useState<string>("Aarav Sharma");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleOpenPreview = (name: string) => {
    setSelectedStudentName(name);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Report Cards & Marksheets</h1>
          <p className="text-xs text-muted-foreground">Generate, preview & print official school academic report cards for Term 1 & 2.</p>
        </div>
        <Button onClick={() => handleOpenPreview("Aarav Sharma")} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Award className="mr-1.5 h-3.5 w-3.5" /> Batch Generate Term 1 Cards
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Class 10-A Student Report Cards List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold border-b">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class & Sec</th>
                  <th className="p-3">Result Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {DUMMY_STUDENTS.slice(0, 5).map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-3 font-semibold">{stu.rollNo}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{stu.name}</td>
                    <td className="p-3">{stu.grade} - {stu.section}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">PASSED (GRADE A1)</span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPreview(stu.name)}
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
        </CardContent>
      </Card>

      <PrintableReportCard open={isPreviewOpen} onOpenChange={setIsPreviewOpen} studentName={selectedStudentName} />
    </div>
  );
}
