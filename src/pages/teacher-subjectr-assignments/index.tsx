import { useEffect, useMemo, useState } from "react";
import {
  UserRound,
  BookOpen,
  School,
  CalendarDays,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

import {
  createTeacherSubjectAssignment,
  getTeacherSubjectAssignments,
  deleteTeacherSubjectAssignment,
} from "@/lib/api/teacher-subject-assignments.api";

import { getEmployees } from "@/lib/api/employees.api";
import { getSubjects } from "@/lib/api/subjects.api";
import { getSections } from "@/lib/api/sections.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getClassSubjects } from "@/lib/api/class-subjects.api";

import type { TeacherSubjectAssignment } from "@/lib/types/teacher-subject-assignment";
import type { Employee } from "@/lib/types/employee";
import type { Subject } from "@/lib/types/subject";
import type { Section } from "@/lib/types/section";
import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { ClassSubject } from "@/lib/types/class-subject";

export default function TeacherSubjectAssignmentsPage() {
  const { accessToken } = useAuth();

  // Data state
  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);

  // Status state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Navigation & Selection state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Filter & Search in Teacher List
  const [teacherSearch, setTeacherSearch] = useState("");

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSubjectId, setAssignSubjectId] = useState("");

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [sourceSectionId, setSourceSectionId] = useState("");

  const [deleteConfirmAssignment, setDeleteConfirmAssignment] =
    useState<TeacherSubjectAssignment | null>(null);

  // Load baseline data
  const loadData = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const [
        assignmentData,
        employeeData,
        subjectData,
        sectionData,
        sessionData,
        classData,
        classSubjectData,
      ] = await Promise.all([
        getTeacherSubjectAssignments(accessToken),
        getEmployees(accessToken),
        getSubjects(accessToken),
        getSections(accessToken),
        getAcademicSessions(accessToken),
        getClasses(accessToken),
        getClassSubjects(accessToken).catch(() => []),
      ]);

      setAssignments(assignmentData);
      setEmployees(employeeData);
      setSubjects(subjectData);
      setSections(sectionData);
      setAcademicSessions(sessionData);
      setClasses(classData);
      setClassSubjects(classSubjectData);

      // Set default current academic session if not selected
      if (!selectedSessionId) {
        const currentSession = sessionData.find((session) => session.isCurrent);
        if (currentSession) {
          setSelectedSessionId(currentSession.id);
        } else if (sessionData.length > 0) {
          setSelectedSessionId(sessionData[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load teacher subject assignment data", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load teacher subject assignment data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accessToken]);

  // Derived list of teaching faculty
  const teachingFaculty = useMemo(() => {
    return employees.filter((employee) => {
      const isTeaching =
        employee.designation?.category === "TEACHING" ||
        employee.status === "ACTIVE";
      const name = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const code = (employee.employeeCode || "").toLowerCase();
      const search = teacherSearch.toLowerCase().trim();
      const matchSearch = !search || name.includes(search) || code.includes(search);
      return isTeaching && matchSearch;
    });
  }, [employees, teacherSearch]);

  // Selected Employee Details
  const activeTeacher = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employees.find((emp) => emp.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  // Filtered sections for current session & current class
  const activeSession = useMemo(() => {
    return academicSessions.find((s) => s.id === selectedSessionId) || null;
  }, [academicSessions, selectedSessionId]);

  // Available classes for selected session
  const sessionClasses = useMemo(() => {
    if (!selectedSessionId) return classes;
    // Get class IDs present in sections for this academic session, or default to all classes
    const classIdsInSession = new Set(
      sections
        .filter((s) => s.academicSessionId === selectedSessionId)
        .map((s) => s.classId),
    );
    if (classIdsInSession.size === 0) return classes;
    return classes.filter((c) => classIdsInSession.has(c.id));
  }, [classes, sections, selectedSessionId]);

  // Map of Class -> Sections for selected session
  const classSectionsMap = useMemo(() => {
    const map = new Map<string, Section[]>();
    sections.forEach((sec) => {
      if (selectedSessionId && sec.academicSessionId !== selectedSessionId) {
        return;
      }
      const existing = map.get(sec.classId) || [];
      existing.push(sec);
      map.set(sec.classId, existing);
    });
    return map;
  }, [sections, selectedSessionId]);

  // Currently assigned subjects for the selected teacher, class, and section
  const assignedSubjectsForActiveSection = useMemo(() => {
    if (!selectedEmployeeId || !selectedSectionId || !selectedSessionId) return [];
    return assignments.filter(
      (a) =>
        a.employeeId === selectedEmployeeId &&
        a.sectionId === selectedSectionId &&
        a.academicSessionId === selectedSessionId,
    );
  }, [assignments, selectedEmployeeId, selectedSectionId, selectedSessionId]);

  // Available subjects for assignment in modal
  const availableSubjectsForModal = useMemo(() => {
    if (!selectedClassId) return subjects;

    // Filter by class-subjects mapping if exists
    const matchingClassSubjects = classSubjects.filter(
      (cs) =>
        cs.classId === selectedClassId &&
        (!selectedSessionId || cs.academicSessionId === selectedSessionId),
    );

    let filtered = subjects;
    if (matchingClassSubjects.length > 0) {
      const allowedSubjectIds = new Set(matchingClassSubjects.map((cs) => cs.subjectId));
      filtered = subjects.filter((subject) => allowedSubjectIds.has(subject.id));
    }

    // Exclude subjects already assigned to this teacher for this section
    const alreadyAssignedSubjectIds = new Set(
      assignedSubjectsForActiveSection.map((a) => a.subjectId),
    );

    return filtered.filter((sub) => !alreadyAssignedSubjectIds.has(sub.id));
  }, [selectedClassId, selectedSessionId, classSubjects, subjects, assignedSubjectsForActiveSection]);

  // Sections eligible as source for "Copy Assignments" (same class, same session, different section)
  const availableCopySourceSections = useMemo(() => {
    if (!selectedClassId || !selectedSectionId || !selectedSessionId) return [];
    return (classSectionsMap.get(selectedClassId) || []).filter(
      (sec) => sec.id !== selectedSectionId,
    );
  }, [selectedClassId, selectedSectionId, selectedSessionId, classSectionsMap]);

  // Subjects assigned to active teacher in source section for Copy Preview
  const sourceSectionSubjectsToCopy = useMemo(() => {
    if (!selectedEmployeeId || !sourceSectionId || !selectedSessionId) return [];
    const sourceAssignments = assignments.filter(
      (a) =>
        a.employeeId === selectedEmployeeId &&
        a.sectionId === sourceSectionId &&
        a.academicSessionId === selectedSessionId,
    );

    const activeAssignedSubjectIds = new Set(
      assignedSubjectsForActiveSection.map((a) => a.subjectId),
    );

    return sourceAssignments
      .map((a) => subjects.find((s) => s.id === a.subjectId))
      .filter((s): s is Subject => s !== undefined)
      .map((s) => ({
        subject: s,
        alreadyAssigned: activeAssignedSubjectIds.has(s.id),
      }));
  }, [assignments, selectedEmployeeId, sourceSectionId, selectedSessionId, subjects, assignedSubjectsForActiveSection]);

  // Helpers to get entity names
  const getSubjectObj = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId);

  const getClassObj = (classId: string) =>
    classes.find((c) => c.id === classId);

  const getSectionObj = (sectionId: string) =>
    sections.find((s) => s.id === sectionId);

  // Count total assignments for a teacher in current session
  const getTeacherAssignmentCount = (employeeId: string) => {
    return assignments.filter(
      (a) =>
        a.employeeId === employeeId &&
        (!selectedSessionId || a.academicSessionId === selectedSessionId),
    ).length;
  };

  // Select teacher and automatically pick first class/section if available
  const handleSelectTeacher = (teacherId: string) => {
    setSelectedEmployeeId(teacherId);
    setError(null);
    setSuccessMessage(null);

    // Default select first class & section if available
    if (sessionClasses.length > 0) {
      const firstClass = sessionClasses[0];
      setSelectedClassId(firstClass.id);
      const firstSections = classSectionsMap.get(firstClass.id) || [];
      if (firstSections.length > 0) {
        setSelectedSectionId(firstSections[0].id);
      } else {
        setSelectedSectionId(null);
      }
    } else {
      setSelectedClassId(null);
      setSelectedSectionId(null);
    }
  };

  // Handle Assign Subject Submit
  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedEmployeeId || !selectedSectionId || !selectedSessionId || !assignSubjectId) {
      setError("Please select a valid subject to assign.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createTeacherSubjectAssignment(
        {
          employeeId: selectedEmployeeId,
          subjectId: assignSubjectId,
          sectionId: selectedSectionId,
          academicSessionId: selectedSessionId,
        },
        accessToken,
      );

      setSuccessMessage("Subject assigned successfully.");
      setIsAssignModalOpen(false);
      setAssignSubjectId("");
      await loadData();
    } catch (err) {
      console.error("Failed to assign subject", err);
      setError(err instanceof Error ? err.message : "Failed to assign subject");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = async () => {
    if (!accessToken || !deleteConfirmAssignment) return;

    setIsSaving(true);
    setError(null);

    try {
      await deleteTeacherSubjectAssignment(deleteConfirmAssignment.id, accessToken);
      setSuccessMessage("Subject assignment removed successfully.");
      setDeleteConfirmAssignment(null);
      await loadData();
    } catch (err) {
      console.error("Failed to remove subject assignment", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove subject assignment",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Copy Assignments Submit
  const handleCopyAssignments = async () => {
    if (
      !accessToken ||
      !selectedEmployeeId ||
      !selectedSectionId ||
      !selectedSessionId ||
      !sourceSectionId
    ) {
      setError("Please select a source section to copy assignments from.");
      return;
    }

    const unassignedSubjectsToCopy = sourceSectionSubjectsToCopy
      .filter((item) => !item.alreadyAssigned)
      .map((item) => item.subject);

    if (unassignedSubjectsToCopy.length === 0) {
      setError("All subjects from the selected source section are already assigned.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      for (const sub of unassignedSubjectsToCopy) {
        await createTeacherSubjectAssignment(
          {
            employeeId: selectedEmployeeId,
            subjectId: sub.id,
            sectionId: selectedSectionId,
            academicSessionId: selectedSessionId,
          },
          accessToken,
        );
      }

      setSuccessMessage(
        `Successfully copied ${unassignedSubjectsToCopy.length} subject assignment(s).`,
      );
      setIsCopyModalOpen(false);
      setSourceSectionId("");
      await loadData();
    } catch (err) {
      console.error("Failed to copy section assignments", err);
      setError(
        err instanceof Error ? err.message : "Failed to copy section assignments",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW MODE 1: FACULTY DIRECTORY (MAIN PAGE) */}
      {!selectedEmployeeId ? (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b bg-slate-50/50 pb-5 dark:bg-slate-900/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-blue-600" />
                  Teacher Subject Assignments
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  View and manage subject workloads for teaching faculty across academic sessions, classes, and sections.
                </p>
              </div>

              {/* Academic Session Filter */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                  Academic Session:
                </span>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {academicSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name} {session.isCurrent ? " (Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teacher Search */}
            <div className="mt-4 relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teacher by name or employee code..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                Loading faculty directory...
              </div>
            ) : teachingFaculty.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No teaching faculty found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-100/70 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Teacher</th>
                      <th className="px-6 py-3.5 font-semibold">Designation</th>
                      <th className="px-6 py-3.5 font-semibold text-center">Assigned Workload</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {teachingFaculty.map((teacher) => {
                      const count = getTeacherAssignmentCount(teacher.id);
                      return (
                        <tr
                          key={teacher.id}
                          className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {teacher.firstName.charAt(0)}
                                {teacher.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">
                                  {teacher.firstName} {teacher.lastName}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {teacher.employeeCode || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            {teacher.designation?.title || "Teacher"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                count > 0
                                  ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              <BookOpen className="mr-1 h-3 w-3" />
                              {count} {count === 1 ? "Subject" : "Subjects"} Assigned
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectTeacher(teacher.id)}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                            >
                              View Assignments
                              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* VIEW MODE 2: TEACHER ASSIGNMENT MANAGEMENT (HIERARCHY VIEW) */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedEmployeeId(null);
                  setSelectedClassId(null);
                  setSelectedSectionId(null);
                }}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Teachers
              </Button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>
                    {activeTeacher?.firstName} {activeTeacher?.lastName}
                  </span>
                  <span className="text-xs font-normal px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    {activeTeacher?.designation?.title || "Teacher"}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage assigned subjects for each class and section
                </p>
              </div>
            </div>

            {/* Academic Session Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Academic Session:
              </span>
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  setSelectedClassId(null);
                  setSelectedSectionId(null);
                }}
                className="rounded border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {academicSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} {session.isCurrent ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Grid: Left = Classes & Sections Hierarchy, Right = Subject Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Classes & Sections (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <School className="h-4 w-4 text-blue-600" />
                    Classes & Sections
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Select a class and section for {activeTeacher?.firstName} ({activeSession?.name || "Session"})
                  </p>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {sessionClasses.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No classes configured for this academic session.
                    </div>
                  ) : (
                    sessionClasses.map((cls) => {
                      const classSecs = classSectionsMap.get(cls.id) || [];
                      const isClassSelected = selectedClassId === cls.id;

                      return (
                        <div
                          key={cls.id}
                          className={`rounded-lg border transition-all ${
                            isClassSelected
                              ? "border-blue-400 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-950/20"
                              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                          }`}
                        >
                          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {cls.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-800">
                              {classSecs.length} {classSecs.length === 1 ? "Section" : "Sections"}
                            </span>
                          </div>

                          <div className="p-3">
                            {classSecs.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic">
                                No sections found in this class.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {classSecs.map((sec) => {
                                  const isSecSelected =
                                    selectedClassId === cls.id && selectedSectionId === sec.id;
                                  const secAssignmentCount = assignments.filter(
                                    (a) =>
                                      a.employeeId === selectedEmployeeId &&
                                      a.sectionId === sec.id &&
                                      a.academicSessionId === selectedSessionId,
                                  ).length;

                                  return (
                                    <button
                                      key={sec.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassId(cls.id);
                                        setSelectedSectionId(sec.id);
                                        setError(null);
                                        setSuccessMessage(null);
                                      }}
                                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                                        isSecSelected
                                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                                      }`}
                                    >
                                      <span>Section {sec.name}</span>
                                      {secAssignmentCount > 0 && (
                                        <span
                                          className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                                            isSecSelected
                                              ? "bg-white/30 text-white"
                                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                                          }`}
                                        >
                                          {secAssignmentCount}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Assigned Subjects List for Selected Section (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedClassId && selectedSectionId ? (
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-1">
                          <span>{getClassObj(selectedClassId)?.name}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>Section {getSectionObj(selectedSectionId)?.name}</span>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                          Assigned Subjects
                        </CardTitle>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {availableCopySourceSections.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSourceSectionId(availableCopySourceSections[0]?.id || "");
                              setIsCopyModalOpen(true);
                              setError(null);
                            }}
                            className="text-xs border-slate-300 dark:border-slate-700"
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                            Copy Assignments
                          </Button>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setAssignSubjectId("");
                            setIsAssignModalOpen(true);
                            setError(null);
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Assign Subject
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    {assignedSubjectsForActiveSection.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            No subjects assigned yet
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Assign subjects for {activeTeacher?.firstName} in{" "}
                            {getClassObj(selectedClassId)?.name} - Section{" "}
                            {getSectionObj(selectedSectionId)?.name}.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssignSubjectId("");
                            setIsAssignModalOpen(true);
                          }}
                          className="mt-2 text-xs"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Assign First Subject
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assignedSubjectsForActiveSection.map((assignment) => {
                          const subjectObj = getSubjectObj(assignment.subjectId);

                          return (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold dark:bg-blue-950 dark:text-blue-300">
                                  <BookOpen className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                    {subjectObj?.name || assignment.subject?.name || "Subject"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    Code: {subjectObj?.code || assignment.subject?.code || "N/A"}
                                  </p>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmAssignment(assignment)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 text-xs"
                              >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    <School className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                    Please select a Class and Section on the left to view assigned subjects.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN SUBJECT MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Assign Subject
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeTeacher?.firstName} {activeTeacher?.lastName} —{" "}
                  {getClassObj(selectedClassId || "")?.name} (Section{" "}
                  {getSectionObj(selectedSectionId || "")?.name})
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Select a Subject</option>
                  {availableSubjectsForModal.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {availableSubjectsForModal.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    All available subjects for this class are already assigned.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={isSaving}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving || !assignSubjectId}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? "Assigning..." : "Assign Subject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COPY ASSIGNMENTS ("SAME AS SECTION") MODAL */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Copy className="h-4 w-4 text-blue-600" />
                  Copy Assignments from Another Section
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Copy subject workload for {activeTeacher?.firstName} into Section{" "}
                  {getSectionObj(selectedSectionId || "")?.name}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Select Source Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Copy assignments from:
                </label>
                <select
                  value={sourceSectionId}
                  onChange={(e) => setSourceSectionId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {availableCopySourceSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirmation Preview */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Copy assignments from Section {getSectionObj(sourceSectionId)?.name}?
                </p>

                {sourceSectionSubjectsToCopy.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    No subjects are currently assigned to {activeTeacher?.firstName} in Section{" "}
                    {getSectionObj(sourceSectionId)?.name}.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">
                      The following subjects will be assigned to Section{" "}
                      {getSectionObj(selectedSectionId || "")?.name}:
                    </p>
                    {sourceSectionSubjectsToCopy.map((item) => (
                      <div
                        key={item.subject.id}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          {item.subject.name} ({item.subject.code})
                        </span>
                        {item.alreadyAssigned ? (
                          <span className="text-[10px] text-slate-400 italic">
                            Already assigned
                          </span>
                        ) : (
                          <span className="text-[10px] text-green-600 font-semibold">
                            Will be copied
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCopyModalOpen(false)}
                  disabled={isSaving}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyAssignments}
                  disabled={
                    isSaving ||
                    !sourceSectionId ||
                    sourceSectionSubjectsToCopy.filter((item) => !item.alreadyAssigned)
                      .length === 0
                  }
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? "Copying..." : "Copy Assignments"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE ASSIGNMENT MODAL */}
      {deleteConfirmAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl border border-slate-200 p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Remove Subject Assignment
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to remove this subject?
                </p>
              </div>
            </div>

            <div className="rounded-md bg-slate-50 p-3 border border-slate-200 text-xs dark:bg-slate-800 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {getSubjectObj(deleteConfirmAssignment.subjectId)?.name || "Subject"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activeTeacher?.firstName} {activeTeacher?.lastName} —{" "}
                {getClassObj(selectedClassId || "")?.name} (Section{" "}
                {getSectionObj(selectedSectionId || "")?.name})
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmAssignment(null)}
                disabled={isSaving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDeleteAssignment}
                disabled={isSaving}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {isSaving ? "Removing..." : "Remove Assignment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
