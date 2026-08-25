"use client";

import React from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployeesPage() {
  const staff = [
    { id: "EMP-301", code: "STAFF-01", name: "Rajinder Prasad", designation: "Hostel Warden", department: "Hostel Administration", phone: "+91 98110 00111", status: "Active" },
    { id: "EMP-302", code: "STAFF-02", name: "Mahesh Singh", designation: "Senior Bus Driver", department: "Transport", phone: "+91 98110 00112", status: "Active" },
    { id: "EMP-303", code: "STAFF-03", name: "Deepak Malhotra", designation: "Head Receptionist", department: "Front Office", phone: "+91 98110 00113", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Non-Teaching Staff Directory</h1>
          <p className="text-xs text-muted-foreground">Manage administrative staff, hostel wardens, transport drivers & maintenance crew.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Staff Member
        </Button>
      </div>

      <EnterpriseTable
        data={staff}
        columns={[
          { header: "Staff Code", accessorKey: "code" },
          { header: "Staff Name", accessorKey: "name" },
          { header: "Designation", accessorKey: "designation" },
          { header: "Department", accessorKey: "department" },
          { header: "Phone Number", accessorKey: "phone" },
          { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
        ]}
      />
    </div>
  );
}
