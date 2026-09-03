"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { EnterpriseTable } from "@/components/enterprise/enterprise-table";
import { StatusChip } from "@/components/enterprise/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { getStudents, deleteStudent } from "@/lib/api/students.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import type { StudentRecord } from "@/lib/types/student";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import { AdmissionFormDialog } from "@/components/modules/admission-form-dialog";
import { UserPlus, Eye, MapPin, Trash2, ChevronDown } from "lucide-react";

export default function StudentsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  // Reference data
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [allClasses, setAllClasses] = useState<SchoolClass[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);

  // Filter state
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Students
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);

  // Loading states
  const [loadingRef, setLoadingRef] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load reference data once
  useEffect(() => {
    if (!accessToken) return;

    const loadRef = async () => {
      try {
        setLoadingRef(true);
        const [sessionsData, classesData, sectionsData] = await Promise.all([
          getAcademicSessions(accessToken),
          getClasses(accessToken),
          getSections(accessToken),
        ]);
        setSessions(sessionsData);
        setAllClasses(classesData);
        setAllSections(sectionsData);

        // Default to current session if any
        const currentSession = sessionsData.find((s) => s.isCurrent);
        if (currentSession) {
          setSelectedSessionId(currentSession.id);
        }
      } catch (err) {
        toast(
          "Failed to load filters",
          err instanceof Error ? err.message : "Could not load academic sessions, classes, or sections",
          "error",
        );
      } finally {
        setLoadingRef(false);
      }
    };

    loadRef();
  }, [accessToken, toast]);

  // Derived filter lists from reference data
  const availableClasses = useMemo<SchoolClass[]>(() => {
    if (!selectedSessionId) return allClasses;
    // Only show classes that have sections in the selected session
    const classIdsInSession = new Set(
      allSections
        .filter((s) => s.academicSessionId === selectedSessionId)
        .map((s) => s.classId),
    );
    return allClasses
      .filter((c) => classIdsInSession.has(c.id))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [selectedSessionId, allClasses, allSections]);

  const availableSections = useMemo<Section[]>(() => {
    return allSections.filter(
      (s) =>
        (!selectedSessionId || s.academicSessionId === selectedSessionId) &&
        (!selectedClassId || s.classId === selectedClassId),
    );
  }, [selectedSessionId, selectedClassId, allSections]);

  // Load students whenever filters change
  const loadStudents = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const filters = {
        ...(selectedSessionId ? { academicSessionId: selectedSessionId } : {}),
        ...(selectedClassId ? { classId: selectedClassId } : {}),
        ...(selectedSectionId ? { sectionId: selectedSectionId } : {}),
      };
      const data = await getStudents(accessToken, filters);
      setStudents(data);
    } catch (error) {
      toast(
        "Failed to load students",
        error instanceof Error ? error.message : "Unable to fetch student directory",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedSessionId, selectedClassId, selectedSectionId, toast]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Reset cascade when parent filter changes
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedClassId("");
    setSelectedSectionId("");
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId("");
  };

  const handleDeleteStudent = async (student: StudentRecord) => {
    if (!accessToken) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete student record ${student.admissionNumber} (${student.firstName} ${student.lastName})?`,
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
        "error",
      );
    }
  };

  const selectClass = (
    <select
      value={selectedClassId}
      onChange={(e) => handleClassChange(e.target.value)}
      disabled={loadingRef || availableClasses.length === 0}
      className="h-8 rounded-md border border-input bg-background px-2 pr-7 text-xs appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundImage: "none" }}
    >
      <option value="">All Classes</option>
      {availableClasses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Student Directory
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage enrolled student profiles, academic records &amp; parent contact details.
          </p>
        </div>
        <Button
          onClick={() => setIsAdmissionOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> New Student Admission
        </Button>
      </div>

      {/* Cascading Filters Bar */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Filter Directory
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Session */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Academic Session
            </label>
            <div className="relative">
              <select
                value={selectedSessionId}
                onChange={(e) => handleSessionChange(e.target.value)}
                disabled={loadingRef}
                className="h-8 rounded-md border border-input bg-background pl-2 pr-8 text-xs appearance-none cursor-pointer disabled:opacity-50 min-w-[160px]"
                style={{ backgroundImage: "none" }}
              >
                <option value="">All Sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? "★" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Class */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Class
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={loadingRef || availableClasses.length === 0}
                className="h-8 rounded-md border border-input bg-background pl-2 pr-8 text-xs appearance-none cursor-pointer disabled:opacity-50 min-w-[130px]"
                style={{ backgroundImage: "none" }}
              >
                <option value="">All Classes</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Section */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Section
            </label>
            <div className="relative">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={loadingRef || availableSections.length === 0}
                className="h-8 rounded-md border border-input bg-background pl-2 pr-8 text-xs appearance-none cursor-pointer disabled:opacity-50 min-w-[120px]"
                style={{ backgroundImage: "none" }}
              >
                <option value="">All Sections</option>
                {availableSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Active filter badges */}
          {(selectedSessionId || selectedClassId || selectedSectionId) && (
            <div className="flex items-center gap-2 ml-auto">
              {selectedSessionId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {sessions.find((s) => s.id === selectedSessionId)?.name}
                </span>
              )}
              {selectedClassId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {allClasses.find((c) => c.id === selectedClassId)?.name}
                </span>
              )}
              {selectedSectionId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Section {allSections.find((s) => s.id === selectedSectionId)?.name}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedSessionId("");
                  setSelectedClassId("");
                  setSelectedSectionId("");
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* No classes/sections hint */}
        {!loadingRef && selectedSessionId && availableClasses.length === 0 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            No classes have sections configured for this academic session.
          </p>
        )}
        {!loadingRef && selectedClassId && availableSections.length === 0 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            No sections configured for this class and session.
          </p>
        )}
      </div>

      {/* Student Table */}
      <EnterpriseTable
        data={students}
        isLoading={loading || loadingRef}
        columns={[
          {
            header: "Student",
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
            header: "Admission No.",
            accessorKey: "admissionNumber",
            sortable: true,
          },
          {
            header: "Roll No.",
            cell: (r) => r.enrollment?.rollNumber || "—",
          },
          {
            header: "Class",
            cell: (r) => r.enrollment?.class?.name || "—",
          },
          {
            header: "Section",
            cell: (r) => r.enrollment?.section?.name || "—",
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
        searchPlaceholder="Search student by name or admission no..."
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
            {/* Header card */}
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
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <StatusChip status={selectedStudent.status} />
                  {selectedStudent.enrollment && (
                    <span className="inline-flex items-center text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">
                      {selectedStudent.enrollment.class?.name} — Section {selectedStudent.enrollment.section?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Enrollment info */}
            {selectedStudent.enrollment && (
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Current Enrollment
                </h4>
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-card">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Session</span>
                    <strong className="font-semibold">{selectedStudent.enrollment.academicSession?.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Class</span>
                    <strong className="font-semibold">{selectedStudent.enrollment.class?.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Section</span>
                    <strong className="font-semibold">{selectedStudent.enrollment.section?.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Roll No.</span>
                    <strong className="font-semibold">{selectedStudent.enrollment.rollNumber || "—"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Personal info */}
            <div className="space-y-2">
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
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Address
                </h4>
                <div className="p-3 border rounded-lg bg-card">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
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
