"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DUMMY_TIMETABLE } from "@/lib/dummy-data";
import { Clock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("Grade 10-A");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Interactive School Timetable</h1>
          <p className="text-xs text-muted-foreground">Class weekly period schedules & teacher room allocation matrix.</p>
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
          <Button onClick={() => window.print()} variant="outline" size="sm" className="h-9 text-xs">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Schedule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Weekly Schedule Grid for {selectedClass}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b">
                <th className="p-3 border font-bold">Day / Period</th>
                {periods.map((p) => (
                  <th key={p} className="p-2.5 border text-center font-bold">
                    Period {p}
                    <div className="text-[10px] text-muted-foreground font-normal">
                      {p === 1 ? "08:30-09:15" : p === 2 ? "09:15-10:00" : p === 3 ? "10:15-11:00" : "11:00-11:45"}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day} className="border-b">
                  <td className="p-3 border font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {day}
                  </td>
                  {periods.map((p) => {
                    const slot = DUMMY_TIMETABLE.find((t) => t.day === day && t.period === p);
                    return (
                      <td key={p} className="p-2 border text-center">
                        {slot ? (
                          <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                            <p className="font-bold text-blue-900 dark:text-blue-200">{slot.subject}</p>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400">{slot.teacherName}</p>
                            <span className="text-[9px] text-blue-600 font-semibold">{slot.roomNo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Free Period</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
