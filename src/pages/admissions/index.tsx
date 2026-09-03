"use client";

import React, { useEffect, useState } from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { AdmissionFormDialog } from "@/components/modules/admission-form-dialog";

import {
  getAdmissions,
  deleteAdmission,
  updateAdmissionStatus,
} from "@/lib/api/admissions.api";

import { useAuth } from "@/lib/auth/auth-context";
import { getClasses } from "@/lib/api/classes.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";

import type { Admission, AdmissionStatus } from "@/lib/types/admission";
import type { SchoolClass } from "@/lib/types/class";
import type { AcademicSession } from "@/lib/types/academic-session";

import { Eye, Pencil, Plus, Trash2, UserCheck, X } from "lucide-react";

const ADMISSION_STATUSES = [
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEWED",
  "APPROVED",
  "REJECTED",
  "ENROLLED",
];

export default function AdmissionsPage() {
  const { accessToken } = useAuth();

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);

  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(
    null,
  );

  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(
    null,
  );

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const loadAdmissions = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [data, classData, sessionData] = await Promise.all([
        getAdmissions(accessToken),
        getClasses(accessToken).catch(() => []),
        getAcademicSessions(accessToken).catch(() => []),
      ]);

      setAdmissions(data);
      setClasses(classData);
      setAcademicSessions(sessionData);
    } catch (error) {
      toast(
        "Failed to load admissions",
        error instanceof Error ? error.message : "Unable to fetch admissions",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  function handleCreate() {
    setEditingAdmission(null);
    setIsFormOpen(true);
  }

  function handleEdit(admission: Admission) {
    setSelectedAdmission(null);
    setEditingAdmission(admission);
    setIsFormOpen(true);
  }

  async function handleDelete(admission: Admission) {
    if (!accessToken) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete admission ${admission.applicationNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdmission(admission.id, accessToken);

      toast(
        "Admission deleted",
        "Admission application was deleted successfully.",
        "success",
      );

      setSelectedAdmission(null);

      await loadAdmissions();
    } catch (error) {
      toast(
        "Failed to delete admission",
        error instanceof Error ? error.message : "Unable to delete admission",
        "error",
      );
    }
  }

  async function handleStatusChange(admission: Admission, status: string) {
    if (!accessToken || status === admission.status) {
      return;
    }

    try {
      await updateAdmissionStatus(
        admission.id,
        status as AdmissionStatus,
        accessToken,
      );

      toast(
        "Status updated",
        `Admission status changed to ${status}.`,
        "success",
      );

      await loadAdmissions();

      if (selectedAdmission?.id === admission.id) {
        setSelectedAdmission((current) =>
          current
            ? {
                ...current,
                status: status as Admission["status"],
              }
            : null,
        );
      }
    } catch (error) {
      toast(
        "Failed to update status",
        error instanceof Error
          ? error.message
          : "Unable to update admission status",
        "error",
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Admissions
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage student admission applications, review candidates and track
            admission status.
          </p>
        </div>

        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Admission
        </Button>
      </div>

      {/* Admissions Table */}
      <EnterpriseTable
        data={admissions}
        isLoading={loading}
        columns={[
          {
            header: "Application No",
            accessorKey: "applicationNumber",
            sortable: true,
          },

          {
            header: "Applicant Name",
            sortable: true,
            accessorKey: "applicantFirstName",
            cell: (row) => (
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {row.applicantFirstName} {row.applicantLastName}
                </p>

                <p className="text-[10px] text-muted-foreground">
                  {row.gender}
                </p>
              </div>
            ),
          },

          {
            header: "Date of Birth",
            cell: (row) => new Date(row.dateOfBirth).toLocaleDateString(),
          },

          {
            header: "Class",
            cell: (row) =>
              classes.find((item) => item.id === row.applyingForClassId)?.name ||
              row.applyingForClassId,
          },

          {
            header: "Academic Session",
            cell: (row) =>
              academicSessions.find((item) => item.id === row.academicSessionId)?.name ||
              row.academicSessionId,
          },

          {
            header: "Guardian",
            accessorKey: "guardianName",
          },

          {
            header: "Phone",
            accessorKey: "guardianPhone",
          },

          {
            header: "Status",
            cell: (row) => <StatusChip status={row.status} />,
          },

          {
            header: "Actions",
            cell: (row) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAdmission(row)}
                  className="h-8 px-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  View
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(row)}
                  className="h-8 px-2 text-xs"
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(row)}
                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        searchPlaceholder="Search by application number, applicant or guardian..."
        statusFilterField="status"
        statusOptions={ADMISSION_STATUSES}
        exportFilename="school_admissions"
      />

      {/* Admission Details Drawer */}
      <Drawer
        open={!!selectedAdmission}
        onClose={() => setSelectedAdmission(null)}
        title={
          selectedAdmission
            ? `${selectedAdmission.applicantFirstName} ${selectedAdmission.applicantLastName}`
            : "Admission Details"
        }
        description={
          selectedAdmission
            ? `Application No: ${selectedAdmission.applicationNumber}`
            : ""
        }
      >
        {selectedAdmission && (
          <div className="space-y-6 text-xs">
            {/* Applicant */}
            <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedAdmission.applicantFirstName}{" "}
                    {selectedAdmission.applicantLastName}
                  </h3>

                  <p className="text-muted-foreground mt-1">
                    {selectedAdmission.applicationNumber}
                  </p>
                </div>

                <StatusChip status={selectedAdmission.status} />
              </div>
            </div>

            {/* Student Information */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Student Information
              </h4>

              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-card">
                <div>
                  <span className="text-muted-foreground">First Name</span>
                  <p className="font-semibold">
                    {selectedAdmission.applicantFirstName}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Last Name</span>
                  <p className="font-semibold">
                    {selectedAdmission.applicantLastName}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Date of Birth</span>
                  <p className="font-semibold">
                    {new Date(
                      selectedAdmission.dateOfBirth,
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Gender</span>
                  <p className="font-semibold">{selectedAdmission.gender}</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Academic Information
              </h4>

              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-card">
                <div>
                  <span className="text-muted-foreground">
                    Applying For
                  </span>
                  <p className="font-semibold">
                    {classes.find(
                      (item) => item.id === selectedAdmission.applyingForClassId,
                    )?.name || selectedAdmission.applyingForClassId}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">
                    Academic Session
                  </span>
                  <p className="font-semibold">
                    {academicSessions.find(
                      (item) => item.id === selectedAdmission.academicSessionId,
                    )?.name || selectedAdmission.academicSessionId}
                  </p>
                </div>
              </div>
            </div>

            {/* Guardian */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Guardian Information
              </h4>

              <div className="space-y-2 rounded-lg border p-3 bg-card">
                <div>
                  <span className="text-muted-foreground">Guardian Name</span>

                  <p className="font-semibold">
                    {selectedAdmission.guardianName}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Phone</span>

                  <p className="font-semibold">
                    {selectedAdmission.guardianPhone}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Admission Status
              </h4>

              <select
                value={selectedAdmission.status}
                onChange={(event) =>
                  handleStatusChange(selectedAdmission, event.target.value)
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {ADMISSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleEdit(selectedAdmission)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit Admission
              </Button>

              {selectedAdmission.status === "APPROVED" &&
                !selectedAdmission.convertedStudentId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast(
                        "Conversion",
                        "Admission conversion will be handled from the conversion workflow.",
                        "info",
                      );
                    }}
                  >
                    <UserCheck className="mr-1 h-3.5 w-3.5" />
                    Convert to Student
                  </Button>
                )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedAdmission(null)}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create / Edit Admission */}
      <AdmissionFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);

          if (!open) {
            setEditingAdmission(null);
          }
        }}
        admission={editingAdmission}
        onSuccess={loadAdmissions}
      />
    </div>
  );
}
