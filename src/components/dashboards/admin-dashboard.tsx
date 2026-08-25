"use client";

import React from "react";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { DUMMY_AUDIT_LOGS, DUMMY_FEE_INVOICES, DUMMY_STUDENTS } from "@/lib/dummy-data";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserCheck,
  CreditCard,
  Building,
  Activity,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const feeCollectionData = [
  { month: "Apr", amount: 4500000 },
  { month: "May", amount: 5200000 },
  { month: "Jun", amount: 3800000 },
  { month: "Jul", amount: 6100000 },
  { month: "Aug", amount: 4900000 },
];

const attendanceTrendData = [
  { day: "Mon", attendance: 96.2 },
  { day: "Tue", attendance: 95.8 },
  { day: "Wed", attendance: 97.1 },
  { day: "Thu", attendance: 96.5 },
  { day: "Fri", attendance: 94.9 },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Enrolled Students"
          value="1,248"
          change="+4.2% vs last term"
          trend="up"
          subtitle="Active in 32 class sections"
          icon={Users}
          iconBg="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <MetricCard
          title="Today's Attendance Rate"
          value="96.5%"
          change="+0.8%"
          trend="up"
          subtitle="1,204 present out of 1,248"
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <MetricCard
          title="Term 1 Fee Collections"
          value="₹ 2.45 Cr"
          change="84% collected"
          trend="up"
          subtitle="₹ 42.5 L pending invoices"
          icon={CreditCard}
          iconBg="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        />
        <MetricCard
          title="Teaching & Staff Count"
          value="112"
          change="100% active"
          trend="neutral"
          subtitle="78 Teachers, 34 Staff"
          icon={Building}
          iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Monthly Fee Collections (INR)</span>
              <span className="text-xs text-muted-foreground font-normal">Academic Year 2026-27</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeCollectionData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), "Collected"]} />
                <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Weekly Attendance Trend (%)</span>
              <span className="text-xs text-muted-foreground font-normal">School-wide Average</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis domain={[90, 100]} fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(val: any) => [`${val}%`, "Attendance Rate"]} />
                <Area type="monotone" dataKey="attendance" stroke="#10b981" fill="#ecfdf5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log & Pending Invoices Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Recent System Audit Activity</span>
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnterpriseTable
                data={DUMMY_AUDIT_LOGS}
                columns={[
                  { header: "Timestamp", accessorKey: "timestamp" },
                  { header: "User", accessorKey: "user" },
                  { header: "Role", accessorKey: "role" },
                  { header: "Action Executed", accessorKey: "action" },
                  { header: "IP Address", accessorKey: "ipAddress" },
                ]}
                searchPlaceholder="Search audit logs..."
                exportFilename="system_audit_logs"
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Critical Alerts & Pending Fees</span>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {DUMMY_FEE_INVOICES.filter((f) => f.status !== "Paid").map((inv) => (
              <div key={inv.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{inv.studentName}</p>
                  <p className="text-muted-foreground">{inv.grade} • {inv.invoiceNo}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(inv.totalAmount - inv.paidAmount)}</p>
                  <StatusChip status={inv.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
