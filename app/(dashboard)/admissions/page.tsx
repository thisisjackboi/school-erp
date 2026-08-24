"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdmissionFormDialog } from "@/components/modules/admission-form-dialog";
import { UserPlus, Clock, CheckCircle2, FileText, ArrowRight } from "lucide-react";

export default function AdmissionsPage() {
  const [isOpen, setIsOpen] = useState(false);

  const applications = [
    { id: "APP-901", applicantName: "Devansh Mehta", grade: "Grade 11 Science", parentPhone: "+91 98112 33441", appliedDate: "2026-08-05", status: "Under Review" },
    { id: "APP-902", applicantName: "Kavya Sharma", grade: "Grade 6", parentPhone: "+91 98112 33442", appliedDate: "2026-08-06", status: "Entrance Test Scheduled" },
    { id: "APP-903", applicantName: "Tushar Singhania", grade: "Grade 9", parentPhone: "+91 98112 33443", appliedDate: "2026-08-07", status: "Documents Verified" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admissions & Pipeline</h1>
          <p className="text-xs text-muted-foreground">Manage student application pipeline, entrance screening & registrations.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Start New Application
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Stage 1: New Inquiries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">14 Inquiries</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Stage 2: Entrance Evaluation</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">8 Scheduled</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Stage 3: Approved & Enrolled</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">24 Admitted</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">Recent Admission Applications</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-xs">
          {applications.map((app) => (
            <div key={app.id} className="p-3 rounded-lg border flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{app.applicantName}</p>
                <p className="text-muted-foreground">{app.grade} • Applied on {app.appliedDate}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{app.status}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs">Process <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AdmissionFormDialog open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
