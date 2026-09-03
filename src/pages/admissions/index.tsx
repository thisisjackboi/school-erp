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
  convertAdmission,
} from "@/lib/api/admissions.api";

import { useAuth } from "@/lib/auth/auth-context";
import { getClasses } from "@/lib/api/classes.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getSections } from "@/lib/api/sections.api";

import type { Admission, AdmissionStatus } from "@/lib/types/admission";
import type { SchoolClass } from "@/lib/types/class";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { Section } from "@/lib/types/section";

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { Eye, Pencil, Plus, ShieldCheck, Trash2, UserCheck, X } from "lucide-react";

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

  // Admission Conversion state
  const [convertAdmissionTarget, setConvertAdmissionTarget] = useState<Admission | null>(null);
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    sectionId: "",
    username: "",
    password: "",
  });

  const { toast } = useToast();

  const handleOpenConvert = async (admission: Admission) => {
    setConvertAdmissionTarget(admission);
    const sanitizedUsername = `${admission.applicantFirstName}${admission.applicantLastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    setConvertForm({
      sectionId: "",
      username: sanitizedUsername || admission.applicationNumber.toLowerCase().replace(/[^a-z0-9]/g, ""),
      password: "",
    });

    if (!accessToken) return;
    try {
      setLoadingSections(true);
      const allSections = await getSections(accessToken);

      // Filter sections that belong to BOTH the target class AND the academic session of this admission
      const filtered = allSections.filter(
        (s) =>
          s.classId === admission.applyingForClassId &&
          s.academicSessionId === admission.academicSessionId,
      );

      if (filtered.length > 0) {
        setAvailableSections(filtered);
      } else {
        // No sections match class+session — show all sections for that class as fallback
        const classFallback = allSections.filter(
          (s) => s.classId === admission.applyingForClassId,
        );
        setAvailableSections(classFallback);
        if (classFallback.length === 0) {
          toast(
            "No sections found",
            "No sections are configured for the target class and academic session. Please set up sections first.",
            "error",
          );
        } else {
          toast(
            "Section warning",
            "No sections found for the exact academic session. Showing all sections for the target class.",
            "info",
          );
        }
      }
    } catch {
      toast("Failed to load sections", "Unable to fetch sections for assignment", "error");
    } finally {
      setLoadingSections(false);
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertAdmissionTarget || !accessToken) return;

    if (!convertForm.sectionId) {
      toast("Section required", "Please select a section for student enrollment.", "error");
      return;
    }
    if (!convertForm.username.trim()) {
      toast("Username required", "Please enter a student login username.", "error");
      return;
    }
    if (!convertForm.password || convertForm.password.length < 8) {
      toast("Invalid password", "Password must be at least 8 characters long.", "error");
      return;
    }

    try {
      setConverting(true);
      await convertAdmission(
        convertAdmissionTarget.id,
        {
          sectionId: convertForm.sectionId,
          username: convertForm.username.trim(),
          password: convertForm.password,
        },
        accessToken,
      );

      toast(
        "Student Created",
        `Candidate ${convertAdmissionTarget.applicantFirstName} was successfully converted to an active student!`,
        "success",
      );

      setConvertAdmissionTarget(null);
      setSelectedAdmission(null);
      await loadAdmissions();
    } catch (err) {
      toast(
        "Conversion Failed",
        err instanceof Error ? err.message : "Unable to convert admission to student.",
        "error",
      );
    } finally {
      setConverting(false);
    }
  };

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

                {row.status === "APPROVED" && !row.convertedStudentId && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenConvert(row)}
                    className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                    title="Convert this approved candidate into an active student"
                  >
                    <UserCheck className="mr-1 h-3.5 w-3.5" />
                    Convert
                  </Button>
                )}

                {row.convertedStudentId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                    Enrolled
                  </span>
                )}

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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleOpenConvert(selectedAdmission)}
                  >
                    <UserCheck className="mr-1 h-3.5 w-3.5" />
                    Convert to Student
                  </Button>
                )}

              {selectedAdmission.status !== "APPROVED" &&
                !selectedAdmission.convertedStudentId && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium self-center bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                    💡 Change status to <strong>APPROVED</strong> to enable Convert to Student
                  </span>
                )}

              {selectedAdmission.convertedStudentId && (
                <div className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-medium">
                  <UserCheck className="mr-1.5 h-4 w-4" />
                  Enrolled as Active Student
                </div>
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

      {/* Convert Admission to Student Modal */}
      <Dialog
        open={!!convertAdmissionTarget}
        onOpenChange={(open) => {
          if (!open) setConvertAdmissionTarget(null);
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
            <UserCheck className="h-5 w-5" />
            <span>Convert Admission to Active Student</span>
          </DialogTitle>
          <DialogDescription>
            Assign section and create login credentials for candidate{" "}
            <strong className="text-foreground">
              {convertAdmissionTarget?.applicantFirstName}{" "}
              {convertAdmissionTarget?.applicantLastName}
            </strong>{" "}
            (App No: {convertAdmissionTarget?.applicationNumber}).
          </DialogDescription>
        </DialogHeader>

        {/* Context: Class & Academic Session this admission belongs to */}
        {convertAdmissionTarget && (
          <div className="flex items-center gap-3 text-[11px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2 text-blue-700 dark:text-blue-300">
            <span className="font-medium">
              Class:{" "}
              <strong>
                {classes.find((c) => c.id === convertAdmissionTarget.applyingForClassId)?.name || convertAdmissionTarget.applyingForClassId}
              </strong>
            </span>
            <span className="text-blue-400">|</span>
            <span className="font-medium">
              Session:{" "}
              <strong>
                {academicSessions.find((s) => s.id === convertAdmissionTarget.academicSessionId)?.name || convertAdmissionTarget.academicSessionId}
              </strong>
            </span>
            <span className="ml-auto text-[10px] italic opacity-70">
              Sections are filtered to match class + session
            </span>
          </div>
        )}

        <form onSubmit={handleConvertSubmit} className="space-y-4 text-xs mt-2">
          <div>
            <label className="font-semibold block mb-1">
              Select Section *
            </label>
            <select
              value={convertForm.sectionId}
              onChange={(e) =>
                setConvertForm((prev) => ({ ...prev, sectionId: e.target.value }))
              }
              disabled={loadingSections || converting}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">
                {loadingSections ? "Loading sections..." : "-- Select Section --"}
              </option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} {sec.capacity ? `(Capacity: ${sec.capacity})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">
              Student Username *
            </label>
            <Input
              placeholder="e.g. aaravsharma"
              value={convertForm.username}
              onChange={(e) =>
                setConvertForm((prev) => ({ ...prev, username: e.target.value }))
              }
              disabled={converting}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Unique username for student portal authentication.
            </p>
          </div>

          <div>
            <label className="font-semibold block mb-1">
              Initial Password *
            </label>
            <Input
              type="password"
              placeholder="Minimum 8 characters"
              value={convertForm.password}
              onChange={(e) =>
                setConvertForm((prev) => ({ ...prev, password: e.target.value }))
              }
              disabled={converting}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Must be at least 8 characters long. The student will be prompted to change it on first login.
            </p>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConvertAdmissionTarget(null)}
              disabled={converting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={converting || loadingSections}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              {converting ? "Converting..." : "Complete Conversion"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
