"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { DUMMY_EXAM_SCHEDULES, DUMMY_STUDENT_MARKS } from "@/lib/dummy-data";
import { GraduationCap, Calendar, Plus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<"schedules" | "marks">("schedules");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Examinations & Mark Entry Sheet</h1>
          <p className="text-xs text-muted-foreground">Manage exam schedules, seating plans, subject max marks & student scorecards.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-md border p-1 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setActiveTab("schedules")}
              className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === "schedules" ? "bg-card shadow" : "text-muted-foreground"}`}
            >
              Exam Schedules
            </button>
            <button
              onClick={() => setActiveTab("marks")}
              className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === "marks" ? "bg-card shadow" : "text-muted-foreground"}`}
            >
              Mark Entry Grid
            </button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Schedule New Exam
          </Button>
        </div>
      </div>

      {activeTab === "schedules" ? (
        <EnterpriseTable
          data={DUMMY_EXAM_SCHEDULES}
          columns={[
            { header: "Exam Name", accessorKey: "examName" },
            { header: "Grade", accessorKey: "grade" },
            { header: "Subject", accessorKey: "subject" },
            { header: "Exam Date", accessorKey: "examDate" },
            { header: "Time & Duration", cell: (r) => `${r.startTime} (${r.duration})` },
            { header: "Max Marks", accessorKey: "maxMarks" },
            { header: "Venue / Room", accessorKey: "roomNo" },
          ]}
        />
      ) : (
        <EnterpriseTable
          data={DUMMY_STUDENT_MARKS}
          columns={[
            { header: "Roll No", accessorKey: "rollNo" },
            { header: "Student Name", accessorKey: "studentName" },
            { header: "Exam Name", accessorKey: "examName" },
            { header: "Subject", accessorKey: "subject" },
            { header: "Score Obtained", cell: (r) => <span className="font-bold text-blue-600">{r.marksObtained} / {r.maxMarks}</span> },
            { header: "Grade Letter", cell: (r) => <span className="font-bold text-emerald-600">{r.gradeLetter}</span> },
            { header: "Teacher Remarks", accessorKey: "remarks" },
          ]}
        />
      )}
    </div>
  );
}
