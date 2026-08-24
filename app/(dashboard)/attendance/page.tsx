"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_ATTENDANCE } from "@/lib/dummy-data";
import { useToast } from "@/components/ui/toast";
import { UserCheck, Calendar, Check, X, Clock } from "lucide-react";

export default function AttendancePage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("Grade 10-A");
  const [attendanceData, setAttendanceData] = useState(DUMMY_ATTENDANCE);

  const toggleStatus = (id: string, newStatus: "Present" | "Absent" | "Late") => {
    setAttendanceData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleSave = () => {
    toast("Attendance Register Saved!", `Successfully marked daily attendance for ${selectedClass}.`, "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Daily Attendance Register</h1>
          <p className="text-xs text-muted-foreground">Mark and audit daily student attendance by class and section.</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 rounded border border-input bg-card px-3 text-xs font-semibold"
          >
            <option value="Grade 10-A">Grade 10 - Section A</option>
            <option value="Grade 10-B">Grade 10 - Section B</option>
            <option value="Grade 12-Science">Grade 12 - Science</option>
          </select>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
            <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Save Register
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Attendance Sheet for {selectedClass} — August 07, 2026</span>
            <span className="text-xs text-emerald-600 font-bold">96.5% Attendance Rate Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Attendance Status</th>
                  <th className="p-3">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendanceData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{row.rollNo}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{row.studentName}</td>
                    <td className="p-3">{row.grade} ({row.section})</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => toggleStatus(row.id, "Present")}
                          className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                            row.status === "Present"
                              ? "bg-emerald-500 text-white border-emerald-600"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => toggleStatus(row.id, "Absent")}
                          className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                            row.status === "Absent"
                              ? "bg-red-500 text-white border-red-600"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => toggleStatus(row.id, "Late")}
                          className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                            row.status === "Late"
                              ? "bg-amber-500 text-white border-amber-600"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          Late
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
