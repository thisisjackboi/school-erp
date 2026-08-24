"use client";

import React from "react";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_TEACHERS } from "@/lib/dummy-data";
import { formatCurrency } from "@/lib/utils";
import { Users, CalendarCheck, Receipt, UserPlus } from "lucide-react";

export function HRDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Staff Members"
          value="112 Staff"
          change="78 Teachers, 34 Support"
          trend="up"
          subtitle="98% Active strength"
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Pending Leave Requests"
          value="4 Requests"
          change="Requires Approval"
          trend="neutral"
          subtitle="Casual & Sick leaves"
          icon={CalendarCheck}
          iconBg="bg-amber-50 text-amber-600"
        />
        <MetricCard
          title="Monthly Payroll Outflow"
          value="₹ 48.5 L"
          change="July Payroll Cleared"
          trend="up"
          subtitle="112 Payslips generated"
          icon={Receipt}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="New Onboardings"
          value="3 This Month"
          change="+2 Mathematics Faculty"
          trend="up"
          subtitle="Background checks done"
          icon={UserPlus}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Faculty & Staff Workload Register</CardTitle>
        </CardHeader>
        <CardContent>
          <EnterpriseTable
            data={DUMMY_TEACHERS}
            columns={[
              { header: "Emp Code", accessorKey: "employeeCode" },
              { header: "Staff Name", accessorKey: "name" },
              { header: "Designation", accessorKey: "designation" },
              { header: "Department", accessorKey: "department" },
              { header: "Monthly Salary", cell: (r) => formatCurrency(r.salary) },
              { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
