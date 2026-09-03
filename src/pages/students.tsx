"use client";

import React, { useEffect, useState, useCallback } from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { getStudents, deleteStudent } from "@/lib/api/students.api";
import type { StudentRecord } from "@/lib/types/student";
import { AdmissionFormDialog } from "@/components/modules/admission-form-dialog";
import { UserPlus, Eye, Phone, MapPin, Trash2, Calendar, User } from "lucide-react";

export default function StudentsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getStudents(accessToken);
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast(
        "Failed to load students",
        error instanceof Error ? error.message : "Unable to fetch student directory",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDeleteStudent = async (student: StudentRecord) => {
    if (!accessToken) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete student record ${student.admissionNumber} (${student.firstName} ${student.lastName})?`
    );

    if (!confirmed) return;

    try {
      await deleteStudent(student.id, accessToken);
      toast("Student Deleted", "Student record was deleted successfully.", "success");
      setSelectedStudent(null);
      await loadStudents();
    } catch (error) {
      toast(
        "Failed to delete student",
        error instanceof Error ? error.message : "Unable to delete student",
        "error"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Student Directory
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage enrolled student profiles, academic status & student information.
          </p>
        </div>
        <Button
          onClick={() => setIsAdmissionOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> New Student Admission
        </Button>
      </div>

      <EnterpriseTable
        data={students}
        isLoading={loading}
        columns={[
          {
            header: "Admission No",
            accessorKey: "admissionNumber",
            sortable: true,
          },
          {
            header: "Student Name",
            sortable: true,
            accessorKey: "firstName",
            cell: (r) => (
              <div className="flex items-center space-x-3">
                <Avatar
                  src={r.photoUrl || undefined}
                  fallback={`${r.firstName?.[0] || ""}${r.lastName?.[0] || ""}`}
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{r.gender}</p>
                </div>
              </div>
            ),
          },
          {
            header: "Date of Birth",
            cell: (r) => (r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : "—"),
          },
          {
            header: "Admission Date",
            cell: (r) => (r.admissionDate ? new Date(r.admissionDate).toLocaleDateString() : "—"),
          },
          {
            header: "Blood Group",
            cell: (r) => r.bloodGroup || "—",
          },
          {
            header: "Status",
            cell: (r) => <StatusChip status={r.status} />,
          },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudent(r)}
                  className="h-8 px-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Eye className="mr-1 h-3.5 w-3.5" /> View Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteStudent(r)}
                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            ),
          },
        ]}
        searchPlaceholder="Search student by admission no, first or last name..."
        statusFilterField="status"
        statusOptions={["ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED", "TRANSFERRED", "WITHDRAWN"]}
        exportFilename="school_student_directory"
      />

      {/* Student Profile Drawer */}
      <Drawer
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={
          selectedStudent
            ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
            : "Student Details"
        }
        description={`Admission No: ${selectedStudent?.admissionNumber || ""}`}
      >
        {selectedStudent && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border">
              <Avatar
                src={selectedStudent.photoUrl || undefined}
                fallback={`${selectedStudent.firstName?.[0] || ""}${selectedStudent.lastName?.[0] || ""}`}
                size="lg"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-muted-foreground mt-0.5 font-mono">
                  {selectedStudent.admissionNumber}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <StatusChip status={selectedStudent.status} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-card">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Gender</span>
                  <strong className="font-semibold">{selectedStudent.gender}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Date of Birth</span>
                  <strong className="font-semibold">
                    {selectedStudent.dateOfBirth
                      ? new Date(selectedStudent.dateOfBirth).toLocaleDateString()
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Blood Group</span>
                  <strong className="font-semibold">{selectedStudent.bloodGroup || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Admission Date</span>
                  <strong className="font-semibold">
                    {selectedStudent.admissionDate
                      ? new Date(selectedStudent.admissionDate).toLocaleDateString()
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            {selectedStudent.address && (
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Address Information
                </h4>
                <div className="p-3 border rounded-lg bg-card">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>{selectedStudent.address}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <AdmissionFormDialog
        open={isAdmissionOpen}
        onOpenChange={setIsAdmissionOpen}
        onSuccess={loadStudents}
      />
    </div>
  );
}
