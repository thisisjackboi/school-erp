"use client";

import React from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { DUMMY_TEACHERS } from "@/lib/dummy-data";
import { UserSquare2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Faculty Directory</h1>
          <p className="text-xs text-muted-foreground">Manage teaching faculty, qualifications, subjects handled & contact profiles.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Faculty Member
        </Button>
      </div>

      <EnterpriseTable
        data={DUMMY_TEACHERS}
        columns={[
          {
            header: "Faculty Name",
            cell: (r) => (
              <div className="flex items-center space-x-3">
                <Avatar src={r.avatar} fallback={r.name.substring(0, 2)} size="sm" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.employeeCode}</p>
                </div>
              </div>
            ),
          },
          { header: "Designation", accessorKey: "designation" },
          { header: "Department", accessorKey: "department" },
          { header: "Subjects Handled", cell: (r) => r.subjectsHandled.join(", ") },
          { header: "Class Teacher", cell: (r) => r.primaryClassTeacherOf || "—" },
          { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
        ]}
      />
    </div>
  );
}
