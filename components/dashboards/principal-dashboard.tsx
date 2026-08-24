"use client";

import React from "react";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DUMMY_CLASSES, DUMMY_TEACHERS } from "@/lib/dummy-data";
import { GraduationCap, Award, BookOpen, Users, CheckCircle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const classStrengthData = [
  { name: "Primary (1-5)", value: 420 },
  { name: "Middle (6-8)", value: 380 },
  { name: "Secondary (9-10)", value: 260 },
  { name: "Sr. Secondary (11-12)", value: 188 },
];

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];

export function PrincipalDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Academic Performance Index"
          value="88.4%"
          change="+2.1% vs last year"
          trend="up"
          subtitle="Class 10 & 12 Board Average"
          icon={Award}
          iconBg="bg-purple-50 text-purple-600"
        />
        <MetricCard
          title="Faculty Strength"
          value="78 Teachers"
          change="98% Attendance today"
          trend="up"
          subtitle="2 teachers on approved leave"
          icon={GraduationCap}
          iconBg="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Syllabus Progress Rate"
          value="72%"
          change="On track for Term 1"
          trend="up"
          subtitle="184 of 250 topics completed"
          icon={BookOpen}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Total Student Enrolment"
          value="1,248"
          change="Capacity: 1,350"
          trend="neutral"
          subtitle="92.4% seat utilization"
          icon={Users}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">School Grade Strength Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={classStrengthData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {classStrengthData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Students`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Key Class Section Heads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {DUMMY_CLASSES.map((cls) => (
              <div key={cls.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{cls.grade} - Section {cls.section}</p>
                  <p className="text-muted-foreground">Class Teacher: {cls.classTeacherName}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-600">{cls.studentCount} Students</span>
                  <p className="text-[10px] text-slate-400">{cls.roomNo}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
