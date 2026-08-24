"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/enterprise/status-chip";
import { useToast } from "@/components/ui/toast";
import { CalendarCheck, Plus, Check, X } from "lucide-react";

export default function LeavePage() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState([
    { id: "LV-101", applicantName: "Sunita Deshmukh", role: "Mathematics Faculty", leaveType: "Casual Leave", startDate: "2026-08-12", endDate: "2026-08-13", days: 2, reason: "Family Function", status: "Pending" },
    { id: "LV-102", applicantName: "Amitabh Banerjee", role: "English Faculty", leaveType: "Sick Leave", startDate: "2026-08-10", endDate: "2026-08-10", days: 1, reason: "Dental Appointment", status: "Approved" },
  ]);

  const handleAction = (id: string, newStatus: "Approved" | "Rejected") => {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    toast(`Leave Request ${newStatus}`, `Leave application updated.`, newStatus === "Approved" ? "success" : "error");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Leave Management Portal</h1>
          <p className="text-xs text-muted-foreground">Manage staff leave applications, leave balances & approval workflows.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Apply Leave
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">Leave Applications Register</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold border-b">
                <tr>
                  <th className="p-3">Applicant Name</th>
                  <th className="p-3">Role / Dept</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{l.applicantName}</td>
                    <td className="p-3">{l.role}</td>
                    <td className="p-3 font-semibold">{l.leaveType}</td>
                    <td className="p-3">{l.startDate} to {l.endDate}</td>
                    <td className="p-3 font-bold">{l.days}</td>
                    <td className="p-3 text-muted-foreground">{l.reason}</td>
                    <td className="p-3"><StatusChip status={l.status} /></td>
                    <td className="p-3 text-right space-x-1">
                      {l.status === "Pending" && (
                        <>
                          <Button size="sm" onClick={() => handleAction(l.id, "Approved")} className="h-7 text-[11px] bg-emerald-600">
                            <Check className="mr-0.5 h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAction(l.id, "Rejected")} className="h-7 text-[11px]">
                            <X className="mr-0.5 h-3 w-3" /> Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
