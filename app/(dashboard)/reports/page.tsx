"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/utils";
import { DUMMY_STUDENTS, DUMMY_FEE_INVOICES } from "@/lib/dummy-data";
import { BarChart3, Download, FileText } from "lucide-react";

export default function ReportsPage() {
  const handleExportStudents = () => {
    exportToCSV("student_enrollment_report", DUMMY_STUDENTS);
  };

  const handleExportFees = () => {
    exportToCSV("fee_collection_report", DUMMY_FEE_INVOICES);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reports & Data Analytics</h1>
          <p className="text-xs text-muted-foreground">Export custom school datasets, fee ledgers & attendance analytics reports in CSV format.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Student Enrolment Ledger</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground">Comprehensive student list with parent contact, grade, section & attendance stats.</p>
            <Button size="sm" onClick={handleExportStudents} className="w-full bg-blue-600 hover:bg-blue-700">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download Student CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span>Fee Collection Ledger</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground">Detailed fee invoices with paid amounts, overdue status & payment modes.</p>
            <Button size="sm" onClick={handleExportFees} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download Fee CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span>Faculty Workload Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground">Teaching hours distribution per department, class teacher allocations & salary reports.</p>
            <Button size="sm" onClick={handleExportStudents} variant="outline" className="w-full">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download Faculty CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
