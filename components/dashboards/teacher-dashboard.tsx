"use client";

import React from "react";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DUMMY_HOMEWORK, DUMMY_TIMETABLE } from "@/lib/dummy-data";
import { BookOpen, Calendar, Clock, CheckCircle2, FileText, UserCheck } from "lucide-react";
import Link from "next/link";

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Assigned Classes Today"
          value="4 Periods"
          change="Grade 10-A, 12-Sci"
          trend="neutral"
          subtitle="Next period at 10:15 AM"
          icon={Clock}
          iconBg="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Attendance Status"
          value="Marked"
          change="Grade 10-A"
          trend="up"
          subtitle="36 Present, 2 Absent"
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Active Homework Posted"
          value="3 Tasks"
          change="28 submissions pending review"
          trend="neutral"
          subtitle="Physics Worksheet Ch 3"
          icon={FileText}
          iconBg="bg-purple-50 text-purple-600"
        />
        <MetricCard
          title="Upcoming Test"
          value="Aug 12"
          change="Physics Unit Test 2"
          trend="neutral"
          subtitle="Grade 10-A"
          icon={Calendar}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>My Teaching Schedule Today</span>
              <Link href="/timetable">
                <Button variant="outline" size="sm" className="h-7 text-xs">View Full Timetable</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {DUMMY_TIMETABLE.slice(0, 4).map((slot) => (
              <div key={slot.id} className="p-3 rounded-lg border border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-blue-600 text-sm">P{slot.period}</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{slot.subject} • {slot.grade} ({slot.section})</p>
                    <p className="text-muted-foreground">{slot.startTime} - {slot.endTime} • {slot.roomNo}</p>
                  </div>
                </div>
                <Link href="/attendance">
                  <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">Mark Attendance</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Active Homework Submissions</span>
              <Link href="/homework">
                <Button variant="outline" size="sm" className="h-7 text-xs">Manage Homework</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {DUMMY_HOMEWORK.map((hw) => (
              <div key={hw.id} className="p-3 rounded-lg border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{hw.title}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">{hw.subject}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">{hw.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Due: {hw.dueDate}</span>
                  <span className="font-bold text-emerald-600">{hw.totalSubmissions} / {hw.totalStudents} Submitted</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
