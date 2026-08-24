"use client";

import React from "react";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_FEE_INVOICES } from "@/lib/dummy-data";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, DollarSign, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountantDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Fee Collected"
          value="₹ 2.45 Cr"
          change="+12.4% vs last year"
          trend="up"
          subtitle="Term 1 (2026-27)"
          icon={CreditCard}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Outstanding Fees"
          value="₹ 42.5 L"
          change="34 Invoices overdue"
          trend="down"
          subtitle="Follow-up reminders sent"
          icon={AlertCircle}
          iconBg="bg-red-50 text-red-600"
        />
        <MetricCard
          title="Monthly Operating Expense"
          value="₹ 68.2 L"
          change="Payroll & Infrastructure"
          trend="neutral"
          subtitle="Approved by Principal"
          icon={DollarSign}
          iconBg="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Net Cash Position"
          value="₹ 1.76 Cr"
          change="HDFC Operating Account"
          trend="up"
          subtitle="Reconciled today"
          icon={TrendingUp}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Recent Student Fee Invoices</span>
            <Button size="sm" className="h-8 text-xs bg-blue-600">
              <Plus className="mr-1 h-3.5 w-3.5" /> Collect Fee / Receipt
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnterpriseTable
            data={DUMMY_FEE_INVOICES}
            columns={[
              { header: "Invoice No", accessorKey: "invoiceNo" },
              { header: "Student Name", accessorKey: "studentName" },
              { header: "Class & Sec", cell: (r) => `${r.grade}-${r.section}` },
              { header: "Total Fee", cell: (r) => formatCurrency(r.totalAmount) },
              { header: "Paid Amount", cell: (r) => formatCurrency(r.paidAmount) },
              { header: "Due Date", accessorKey: "dueDate" },
              { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
            ]}
            statusFilterField="status"
            statusOptions={["Paid", "Pending", "Overdue", "Partial"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
