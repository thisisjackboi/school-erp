"use client";

import React, { useState } from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { DUMMY_STUDENTS } from "@/lib/dummy-data";
import { Student } from "@/lib/types";
import { AdmissionFormDialog } from "@/components/modules/admission-form-dialog";
import { UserPlus, Eye, Mail, Phone, MapPin, Calendar, BookOpen } from "lucide-react";

export default function StudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Directory</h1>
          <p className="text-xs text-muted-foreground">Manage enrolled student profiles, academic records & parent contact details.</p>
        </div>
        <Button onClick={() => setIsAdmissionOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> New Student Admission
        </Button>
      </div>

      <EnterpriseTable
        data={DUMMY_STUDENTS}
        columns={[
          {
            header: "Student Name",
            cell: (r) => (
              <div className="flex items-center space-x-3">
                <Avatar src={r.avatar} fallback={r.name.substring(0, 2)} size="sm" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.admissionNo}</p>
                </div>
              </div>
            ),
            sortable: true,
            accessorKey: "name",
          },
          { header: "Roll No", accessorKey: "rollNo", sortable: true },
          { header: "Class & Sec", cell: (r) => `${r.grade} - ${r.section}` },
          { header: "Parent Name", accessorKey: "parentName" },
          { header: "Contact Phone", accessorKey: "parentPhone" },
          { header: "Attendance", cell: (r) => <span className="font-bold text-emerald-600">{r.attendancePercentage}%</span> },
          { header: "Fee Status", cell: (r) => <StatusChip status={r.feeStatus} /> },
          { header: "Status", cell: (r) => <StatusChip status={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudent(r)}
                className="h-8 px-2 text-xs text-blue-600 hover:text-blue-800"
              >
                <Eye className="mr-1 h-3.5 w-3.5" /> View Profile
              </Button>
            ),
          },
        ]}
        searchPlaceholder="Search student by name, roll no or parent..."
        statusFilterField="feeStatus"
        statusOptions={["Paid", "Pending", "Overdue", "Partial"]}
        exportFilename="school_student_directory"
      />

      {/* Student Profile Drawer */}
      <Drawer
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent ? selectedStudent.name : "Student Details"}
        description={`Admission No: ${selectedStudent?.admissionNo || ""}`}
      >
        {selectedStudent && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border">
              <Avatar src={selectedStudent.avatar} fallback={selectedStudent.name.substring(0, 2)} size="lg" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedStudent.name}</h3>
                <p className="text-muted-foreground">{selectedStudent.grade} • Section {selectedStudent.section}</p>
                <div className="mt-1 flex items-center space-x-2">
                  <StatusChip status={selectedStudent.status} />
                  <StatusChip status={selectedStudent.feeStatus} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Personal Information</h4>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-card">
                <div><span className="text-slate-500">Gender:</span> <strong>{selectedStudent.gender}</strong></div>
                <div><span className="text-slate-500">DOB:</span> <strong>{selectedStudent.dob}</strong></div>
                <div><span className="text-slate-500">Blood Group:</span> <strong>{selectedStudent.bloodGroup}</strong></div>
                <div><span className="text-slate-500">Admission Date:</span> <strong>{selectedStudent.admissionDate}</strong></div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Parent & Contact Info</h4>
              <div className="space-y-2 p-3 border rounded-lg bg-card">
                <div className="flex items-center space-x-2"><BookOpen className="h-4 w-4 text-blue-600" /> <span>Father: <strong>{selectedStudent.parentName}</strong></span></div>
                <div className="flex items-center space-x-2"><Phone className="h-4 w-4 text-emerald-600" /> <span>{selectedStudent.parentPhone}</span></div>
                <div className="flex items-center space-x-2"><Mail className="h-4 w-4 text-purple-600" /> <span>{selectedStudent.parentEmail}</span></div>
                <div className="flex items-center space-x-2"><MapPin className="h-4 w-4 text-amber-600" /> <span>{selectedStudent.address}</span></div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <AdmissionFormDialog open={isAdmissionOpen} onOpenChange={setIsAdmissionOpen} />
    </div>
  );
}
