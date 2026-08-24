"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Academic Sessions & Terms</h1>
          <p className="text-xs text-muted-foreground">Manage active academic years, term dates & school calendar schedules.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">Configure New Academic Session</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-blue-900 dark:text-blue-300">
                Academic Session 2026 - 2027 (Active)
              </CardTitle>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">CURRENT SESSION</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between p-2 rounded bg-white dark:bg-slate-900 border">
              <span>Start Date: <strong>April 01, 2026</strong></span>
              <span>End Date: <strong>March 31, 2027</strong></span>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200">Term Schedule Breakdown:</p>
              <div className="p-2 border rounded bg-card flex justify-between">
                <span>Term 1 (Apr 2026 - Sep 2026)</span>
                <span className="text-blue-600 font-semibold">In Progress</span>
              </div>
              <div className="p-2 border rounded bg-card flex justify-between opacity-70">
                <span>Term 2 (Oct 2026 - Mar 2027)</span>
                <span className="text-slate-400">Upcoming</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-bold">Past Academic Sessions Archive</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded border flex justify-between items-center">
              <div>
                <p className="font-bold">Session 2025 - 2026</p>
                <p className="text-muted-foreground">Apr 2025 - Mar 2026 • 1,210 Students</p>
              </div>
              <span className="text-slate-500 font-mono">Archived</span>
            </div>
            <div className="p-3 rounded border flex justify-between items-center">
              <div>
                <p className="font-bold">Session 2024 - 2025</p>
                <p className="text-muted-foreground">Apr 2024 - Mar 2025 • 1,150 Students</p>
              </div>
              <span className="text-slate-500 font-mono">Archived</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
