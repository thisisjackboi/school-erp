import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  UserRound,
  BookOpen,
  School,
  CalendarDays,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth/auth-context";

import {
  createTeacherSubjectAssignment,
  getTeacherSubjectAssignments,
  updateTeacherSubjectAssignment,
} from "@/lib/api/teacher-subject-assignments.api";

import { getEmployees } from "@/lib/api/employees.api";
import { getSubjects } from "@/lib/api/subjects.api";
import { getSections, createSection } from "@/lib/api/sections.api";
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

  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherSubjectAssignment | null>(null);

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formSectionId, setFormSectionId] = useState("");
  const [formAcademicSessionId, setFormAcademicSessionId] = useState("");

  // Table Filter State
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

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

      const currentSession = sessionData.find((session) => session.isCurrent);
      if (currentSession) {
        setSelectedSessionId(currentSession.id);
      } else if (sessionData.length > 0) {
        setSelectedSessionId(sessionData[0].id);
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

  // Main table filtering
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (selectedSessionId && assignment.academicSessionId !== selectedSessionId) {
        return false;
      }
      if (selectedEmployeeId && assignment.employeeId !== selectedEmployeeId) {
        return false;
      }
      const sec = sections.find((s) => s.id === assignment.sectionId);
      if (selectedClassId && sec?.classId !== selectedClassId) {
        return false;
      }
      if (selectedSectionId && assignment.sectionId !== selectedSectionId) {
        return false;
      }
      return true;
    });
  }, [assignments, selectedSessionId, selectedEmployeeId, selectedClassId, selectedSectionId, sections]);

  const availableTeachers = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.status === "ACTIVE" &&
        employee.designation?.category === "TEACHING",
    );
  }, [employees]);

  const availableFilterSections = useMemo(() => {
    return sections.filter((s) => {
      const matchSession = !selectedSessionId || s.academicSessionId === selectedSessionId;
      const matchClass = !selectedClassId || s.classId === selectedClassId;
      return matchSession && matchClass;
    });
  }, [sections, selectedSessionId, selectedClassId]);

  const availableSectionsForForm = useMemo(() => {
    if (!formClassId) return [];
    return sections.filter((section) => {
      const matchClass = section.classId === formClassId;
      const matchSession = !formAcademicSessionId || section.academicSessionId === formAcademicSessionId;
      return matchClass && matchSession;
    });
  }, [sections, formClassId, formAcademicSessionId]);

  const availableSubjectsForForm = useMemo(() => {
    if (!formClassId) return [];

    const matchingClassSubjects = classSubjects.filter(
      (cs) =>
        cs.classId === formClassId &&
        (!formAcademicSessionId || cs.academicSessionId === formAcademicSessionId),
    );

    if (matchingClassSubjects.length === 0) {
      return subjects;
    }

    const allowedSubjectIds = new Set(matchingClassSubjects.map((cs) => cs.subjectId));
    return subjects.filter((subject) => allowedSubjectIds.has(subject.id));
  }, [formClassId, formAcademicSessionId, classSubjects, subjects]);

  const getTeacherName = (employeeId: string) => {
    const employee = employees.find((item) => item.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Teacher";
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((subject) => subject.id === subjectId)?.name || "Unknown Subject";
  };

  const getClassName = (classId: string) => {
    return classes.find((item) => item.id === classId)?.name || "Unknown Class";
  };

  const getSectionName = (sectionId: string) => {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      return { className: "Unknown Class", sectionName: "Unknown Section" };
    }
    return {
      className: (section as any).class?.name || getClassName(section.classId),
      sectionName: section.name,
    };
  };

  const getSessionName = (sessionId: string) => {
    return academicSessions.find((session) => session.id === sessionId)?.name || "Unknown Session";
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormEmployeeId("");
    setFormClassId("");
    setFormSubjectId("");
    setFormSectionId("");
    setFormAcademicSessionId(selectedSessionId || "");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (assignment: TeacherSubjectAssignment) => {
    setEditingAssignment(assignment);
    setFormEmployeeId(assignment.employeeId);
    setFormSubjectId(assignment.subjectId);
    setFormSectionId(assignment.sectionId);
    setFormAcademicSessionId(assignment.academicSessionId);

    const sectionObj = sections.find((s) => s.id === assignment.sectionId);
    setFormClassId(sectionObj?.classId || "");

    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingAssignment(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setError("Unauthorized");
      return;
    }

    if (!formEmployeeId || !formSubjectId || !formClassId || !formAcademicSessionId) {
      setError("Please select teacher, class, subject, and academic session.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let targetSectionId = formSectionId;

      // If no section was explicitly selected, check if a section exists for this class & session
      if (!targetSectionId) {
        const existingSec = sections.find(
          (s) =>
            s.classId === formClassId &&
            (!formAcademicSessionId || s.academicSessionId === formAcademicSessionId),
        );

        if (existingSec) {
          targetSectionId = existingSec.id;
        } else {
          // Auto-create Section 'A' for this class & academic session
          try {
            const newSec = await createSection(
              {
                classId: formClassId,
                academicSessionId: formAcademicSessionId,
                name: "A",
              },
              accessToken,
            );
            targetSectionId = newSec.id;
          } catch (err) {
            console.error("Failed to auto-create section for class", err);
          }
        }
      }

      if (!targetSectionId) {
        setError("Unable to resolve section for this class. Please ensure a section exists.");
        setIsSaving(false);
        return;
      }

      const payload = {
        employeeId: formEmployeeId,
        subjectId: formSubjectId,
        sectionId: targetSectionId,
        academicSessionId: formAcademicSessionId,
      };

      if (editingAssignment) {
        await updateTeacherSubjectAssignment(editingAssignment.id, payload, accessToken);
      } else {
        await createTeacherSubjectAssignment(payload, accessToken);
      }

      closeModal();
      await loadData();
    } catch (err) {
      console.error("Failed to save teacher subject assignment", err);
      setError(err instanceof Error ? err.message : "Failed to save teacher subject assignment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Teacher Subject Assignments</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign teaching employees to subjects and sections.
              </p>
            </div>
            <Button type="button" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Subject
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && !isModalOpen && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Table Filters */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Academic Session</label>
              <select
                value={selectedSessionId}
                onChange={(event) => {
                  setSelectedSessionId(event.target.value);
                  setSelectedSectionId("");
                }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All Academic Sessions</option>
                {academicSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Class</label>
              <select
                value={selectedClassId}
                onChange={(event) => {
                  setSelectedClassId(event.target.value);
                  setSelectedSectionId("");
                }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Section</label>
              <select
                value={selectedSectionId}
                onChange={(event) => setSelectedSectionId(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All Sections</option>
                {availableFilterSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {getClassName(sec.classId)} - Section {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Teacher</label>
              <select
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All Teachers</option>
                {availableTeachers.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Teacher</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Class / Section</th>
                  <th className="px-4 py-3 text-left">Academic Session</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading assignments...
                    </td>
                  </tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No teacher subject assignments found.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((assignment) => {
                    const section = getSectionName(assignment.sectionId);
                    return (
                      <tr key={assignment.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                            <span>{getTeacherName(assignment.employeeId)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{getSubjectName(assignment.subjectId)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{section.className}</span>
                            </div>
                            <p className="ml-6 mt-1 text-xs text-muted-foreground">
                              Section {section.sectionName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span>{getSessionName(assignment.academicSessionId)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(assignment)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingAssignment ? "Edit Teacher Subject Assignment" : "Assign Teacher Subject"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the academic session, teacher, class, section, and subject.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* 1. Academic Session */}
              <div>
                <label className="mb-1 block text-sm font-medium">Academic Session *</label>
                <select
                  value={formAcademicSessionId}
                  onChange={(event) => {
                    setFormAcademicSessionId(event.target.value);
                    setFormClassId("");
                    setFormSectionId("");
                    setFormSubjectId("");
                  }}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select Academic Session</option>
                  {academicSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Teacher */}
              <div>
                <label className="mb-1 block text-sm font-medium">Teacher *</label>
                <select
                  value={formEmployeeId}
                  onChange={(event) => setFormEmployeeId(event.target.value)}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select Teacher</option>
                  {availableTeachers.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Class */}
              <div>
                <label className="mb-1 block text-sm font-medium">Class *</label>
                <select
                  value={formClassId}
                  onChange={(event) => {
                    setFormClassId(event.target.value);
                    setFormSectionId("");
                    setFormSubjectId("");
                  }}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Section (Optional) */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Section <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </label>
                <select
                  value={formSectionId}
                  onChange={(event) => setFormSectionId(event.target.value)}
                  disabled={!formClassId}
                  className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted"
                >
                  <option value="">
                    {!formClassId
                      ? "Select Class First"
                      : availableSectionsForForm.length === 0
                      ? "All / Default Section (Section A)"
                      : "All / Specific Section"}
                  </option>
                  {availableSectionsForForm.map((section) => (
                    <option key={section.id} value={section.id}>
                      Section {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Subject */}
              <div>
                <label className="mb-1 block text-sm font-medium">Subject *</label>
                <select
                  value={formSubjectId}
                  onChange={(event) => setFormSubjectId(event.target.value)}
                  required
                  disabled={!formClassId}
                  className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted"
                >
                  <option value="">
                    {!formClassId
                      ? "Select Class First"
                      : availableSubjectsForForm.length === 0
                      ? "No Subjects Configured for this Class"
                      : "Select Subject"}
                  </option>
                  {availableSubjectsForForm.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : editingAssignment
                    ? "Update Assignment"
                    : "Create Assignment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
