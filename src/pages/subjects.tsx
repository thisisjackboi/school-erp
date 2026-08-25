"use client";

import React from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { DUMMY_SUBJECTS } from "@/lib/dummy-data";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Subjects & Curriculum</h1>
          <p className="text-xs text-muted-foreground">Manage core, elective & practical subjects, syllabus hours & faculty allocations.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Subject
        </Button>
      </div>

      <EnterpriseTable
        data={DUMMY_SUBJECTS}
        columns={[
          { header: "Subject Code", accessorKey: "code", sortable: true },
          { header: "Subject Title", accessorKey: "name", sortable: true },
          { header: "Grade Level", accessorKey: "grade" },
          { header: "Type", cell: (r) => <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{r.type}</span> },
          { header: "Weekly Hours", accessorKey: "weeklyHours" },
          { header: "Teachers Assigned", cell: (r) => r.teachersAssigned.join(", ") },
        ]}
      />
    </div>
  );
}
