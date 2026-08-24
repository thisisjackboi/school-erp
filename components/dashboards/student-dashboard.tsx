"use client";

import React from "react";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DUMMY_STUDENT_MARKS, DUMMY_HOMEWORK } from "@/lib/dummy-data";
import { UserCheck, BookOpen, Award, CreditCard, Download } from "lucide-react";
import Link from "next/link";

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-900 to-blue-700 text-white flex items-center justify-between shadow-md">
        <div>
          <h2 className="text-lg font-bold">Welcome Back, Aarav Sharma! 👋</h2>
          <p className="text-xs text-blue-100 mt-0.5">Grade 10 • Section A • Roll No: 101 • Admission No: ADM-2024-001</p>
        </div>
        <Link href="/report-cards">
          <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download Report Card
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Attendance"
          value="96.5%"
          change="Required: 75%"
          trend="up"
          subtitle="Present 110 of 114 days"
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Recent Exam Grade"
          value="A1 (94%)"
          change="Rank #2 in Class"
          trend="up"
          subtitle="Mathematics Unit Test 1"
          icon={Award}
          iconBg="bg-purple-50 text-purple-600"
        />
        <MetricCard
          title="Pending Homework"
          value="2 Tasks"
          change="Physics & Math"
          trend="neutral"
          subtitle="Due in 2 days"
          icon={BookOpen}
          iconBg="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Term 1 Fee Status"
          value="Paid"
          change="₹ 45,000 cleared"
          trend="up"
          subtitle="Receipt: INV-2026-001"
          icon={CreditCard}
          iconBg="bg-teal-50 text-teal-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Unit Test 1 Marks Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {DUMMY_STUDENT_MARKS.filter((m) => m.studentId === "STU-1001").map((m) => (
              <div key={m.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{m.subject}</p>
                  <p className="text-muted-foreground">{m.remarks}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-blue-600">{m.marksObtained} / {m.maxMarks}</span>
                  <p className="text-[10px] text-emerald-600 font-bold">Grade {m.gradeLetter}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Assigned Homework</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {DUMMY_HOMEWORK.slice(0, 2).map((hw) => (
              <div key={hw.id} className="p-3 rounded-lg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{hw.title}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">Pending</span>
                </div>
                <p className="text-muted-foreground">{hw.description}</p>
                <p className="text-[10px] text-slate-500 pt-1">Assigned by {hw.teacherName} • Due {hw.dueDate}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
