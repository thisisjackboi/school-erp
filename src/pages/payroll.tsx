"use client";

import React from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_TEACHERS } from "@/lib/dummy-data";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PayrollPage() {
  const payrollData = DUMMY_TEACHERS.map((t) => ({
    id: t.id,
    employeeCode: t.employeeCode,
    name: t.name,
    designation: t.designation,
    basicSalary: t.salary,
    allowances: Math.round(t.salary * 0.2),
    deductions: Math.round(t.salary * 0.08),
    netSalary: Math.round(t.salary * 1.12),
    status: "Paid",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payroll & Payslips</h1>
          <p className="text-xs text-muted-foreground">Manage employee salary structures, statutory deductions & monthly payslip generation.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs">
          <Receipt className="mr-1.5 h-3.5 w-3.5" /> Process Monthly Payroll
        </Button>
      </div>

      <EnterpriseTable
        data={payrollData}
        columns={[
          { header: "Emp Code", accessorKey: "employeeCode" },
          { header: "Employee Name", accessorKey: "name" },
          { header: "Designation", accessorKey: "designation" },
          { header: "Basic Salary", cell: (r) => formatCurrency(r.basicSalary) },
          { header: "Allowances", cell: (r) => formatCurrency(r.allowances) },
          { header: "Deductions", cell: (r) => formatCurrency(r.deductions) },
          { header: "Net Salary", cell: (r) => <span className="font-bold text-emerald-600">{formatCurrency(r.netSalary)}</span> },
          { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
          {
            header: "Payslip",
            cell: (r) => (
              <Button variant="ghost" size="sm" onClick={() => window.print()} className="h-8 text-xs text-blue-600">
                <Download className="mr-1 h-3.5 w-3.5" /> Download
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
