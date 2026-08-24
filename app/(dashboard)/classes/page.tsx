"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DUMMY_CLASSES } from "@/lib/dummy-data";
import { School, Users, DoorOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Classes & Sections</h1>
          <p className="text-xs text-muted-foreground">Manage school grade structures, class teacher assignments & section capacities.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Class Section
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DUMMY_CLASSES.map((cls) => (
          <Card key={cls.id} className="hover:border-blue-500 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-blue-900 dark:text-blue-300">
                  {cls.grade} - Section {cls.section}
                </CardTitle>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {cls.roomNo}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                <span className="text-muted-foreground">Class Teacher:</span>
                <strong className="text-slate-900 dark:text-slate-100">{cls.classTeacherName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted-foreground">
                  <Users className="mr-1 h-3.5 w-3.5 text-blue-600" /> Student Count:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {cls.studentCount} / {cls.capacity} Seats
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(cls.studentCount / cls.capacity) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
