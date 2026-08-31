import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Pencil,
  Plus,
  School,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth/auth-context";

import {
  createClassSubject,
  getClassSubjects,
  updateClassSubject,
} from "@/lib/api/class-subjects.api";

import { getClasses } from "@/lib/api/classes.api";
import { getSubjects } from "@/lib/api/subjects.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";

import type { ClassSubject } from "@/lib/types/class-subject";
import type { SchoolClass } from "@/lib/types/class";
import type { Subject } from "@/lib/types/subject";
import type { AcademicSession } from "@/lib/types/academic-session";

export default function ClassSubjectsPage() {
  const { accessToken } = useAuth();

  const [classSubjects, setClassSubjects] = useState<
    ClassSubject[]
  >([]);

  const [classes, setClasses] = useState<
    SchoolClass[]
  >([]);

  const [subjects, setSubjects] = useState<
    Subject[]
  >([]);

  const [academicSessions, setAcademicSessions] =
    useState<AcademicSession[]>([]);

  const [selectedSessionId, setSelectedSessionId] =
    useState("");

  const [selectedClassId, setSelectedClassId] =
    useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingAssignment, setEditingAssignment] =
    useState<ClassSubject | null>(null);

  const [formClassId, setFormClassId] =
    useState("");

  const [
    formAcademicSessionId,
    setFormAcademicSessionId,
  ] = useState("");

  const [formSubjectId, setFormSubjectId] =
    useState("");

  const [formIsOptional, setFormIsOptional] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        classSubjectsData,
        classesData,
        subjectsData,
        sessionsData,
      ] = await Promise.all([
        getClassSubjects(accessToken),
        getClasses(accessToken),
        getSubjects(accessToken),
        getAcademicSessions(accessToken),
      ]);

      setClassSubjects(classSubjectsData);
      setClasses(classesData);
      setSubjects(subjectsData);
      setAcademicSessions(sessionsData);

      /*
       * Select the current academic session by default.
       */
      const currentSession = sessionsData.find(
        (session) => session.isCurrent,
      );

      if (currentSession) {
        setSelectedSessionId(
          currentSession.id,
        );
      } else if (sessionsData.length > 0) {
        setSelectedSessionId(
          sessionsData[0].id,
        );
      }
    } catch (error) {
      console.error(
        "Failed to load class-subject data",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load class-subject data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accessToken]);

  /*
   * Only classes with assignments for the
   * selected academic session are displayed.
   *
   * Classes without assignments are also included
   * so the administrator can add their first subject.
   */
  const visibleClasses = useMemo(() => {
    if (!selectedSessionId) {
      return classes;
    }

    return classes;
  }, [classes, selectedSessionId]);

  const filteredClassSubjects = useMemo(() => {
    return classSubjects.filter((assignment) => {
      if (
        selectedSessionId &&
        assignment.academicSessionId !==
          selectedSessionId
      ) {
        return false;
      }

      if (
        selectedClassId &&
        assignment.classId !== selectedClassId
      ) {
        return false;
      }

      return true;
    });
  }, [
    classSubjects,
    selectedSessionId,
    selectedClassId,
  ]);

  /*
   * Group assignments by class.
   */
  const assignmentsByClass = useMemo(() => {
    const groups = new Map<
      string,
      ClassSubject[]
    >();

    for (const assignment of filteredClassSubjects) {
      const existing = groups.get(
        assignment.classId,
      );

      if (existing) {
        existing.push(assignment);
      } else {
        groups.set(assignment.classId, [
          assignment,
        ]);
      }
    }

    return groups;
  }, [filteredClassSubjects]);

  const getClassName = (classId: string) => {
    return (
      classes.find(
        (schoolClass) =>
          schoolClass.id === classId,
      )?.name || "Unknown Class"
    );
  };

  const getSubject = (subjectId: string) => {
    return subjects.find(
      (subject) => subject.id === subjectId,
    );
  };

  const openCreateModal = (
    classId?: string,
  ) => {
    setEditingAssignment(null);

    setFormClassId(
      classId || selectedClassId || "",
    );

    setFormAcademicSessionId(
      selectedSessionId || "",
    );

    setFormSubjectId("");
    setFormIsOptional(false);

    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (
    assignment: ClassSubject,
  ) => {
    setEditingAssignment(assignment);

    setFormClassId(assignment.classId);
    setFormAcademicSessionId(
      assignment.academicSessionId,
    );
    setFormSubjectId(assignment.subjectId);
    setFormIsOptional(
      assignment.isOptional,
    );

    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingAssignment(null);

    setFormClassId("");
    setFormAcademicSessionId("");
    setFormSubjectId("");
    setFormIsOptional(false);
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    if (!formClassId) {
      setError("Please select a class.");
      return;
    }

    if (!formSubjectId) {
      setError("Please select a subject.");
      return;
    }

    if (!formAcademicSessionId) {
      setError(
        "Please select an academic session.",
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingAssignment) {
        await updateClassSubject(
          editingAssignment.id,
          {
            classId: formClassId,
            subjectId: formSubjectId,
            academicSessionId:
              formAcademicSessionId,
            isOptional: formIsOptional,
          },
          accessToken,
        );
      } else {
        await createClassSubject(
          {
            classId: formClassId,
            subjectId: formSubjectId,
            academicSessionId:
              formAcademicSessionId,
            isOptional: formIsOptional,
          },
          accessToken,
        );
      }

      closeModal();

      await loadData();
    } catch (error) {
      console.error(
        "Failed to save class-subject assignment",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save class-subject assignment",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * Subjects already assigned to the selected
   * class/session should not appear as options
   * when creating a new assignment.
   */
  const availableSubjects = useMemo(() => {
    if (
      !formClassId ||
      !formAcademicSessionId
    ) {
      return subjects;
    }

    const assignedSubjectIds =
      classSubjects
        .filter(
          (assignment) =>
            assignment.classId ===
              formClassId &&
            assignment.academicSessionId ===
              formAcademicSessionId &&
            assignment.id !==
              editingAssignment?.id,
        )
        .map(
          (assignment) =>
            assignment.subjectId,
        );

    return subjects.filter(
      (subject) =>
        !assignedSubjectIds.includes(
          subject.id,
        ),
    );
  }, [
    subjects,
    classSubjects,
    formClassId,
    formAcademicSessionId,
    editingAssignment,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Class–Subject Mapping
          </h1>

          <p className="text-xs text-muted-foreground">
            Assign subjects to classes for each
            academic session.
          </p>
        </div>

        <Button
          onClick={() => openCreateModal()}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Assign Subject
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">
                Academic Session
              </label>

              <select
                value={selectedSessionId}
                onChange={(event) => {
                  setSelectedSessionId(
                    event.target.value,
                  );
                  setSelectedClassId("");
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  All Academic Sessions
                </option>

                {academicSessions.map(
                  (session) => (
                    <option
                      key={session.id}
                      value={session.id}
                    >
                      {session.name}
                      {session.isCurrent
                        ? " (Current)"
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">
                Class
              </label>

              <select
                value={selectedClassId}
                onChange={(event) =>
                  setSelectedClassId(
                    event.target.value,
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  All Classes
                </option>

                {visibleClasses.map(
                  (schoolClass) => (
                    <option
                      key={schoolClass.id}
                      value={schoolClass.id}
                    >
                      {schoolClass.name}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading class-subject mappings...
        </div>
      ) : (
        <>
          {/* Class Cards */}
          {selectedClassId ? (
            <div className="grid grid-cols-1 gap-5">
              {(() => {
                const assignments =
                  assignmentsByClass.get(
                    selectedClassId,
                  ) || [];

                const schoolClass =
                  classes.find(
                    (item) =>
                      item.id ===
                      selectedClassId,
                  );

                if (!schoolClass) {
                  return null;
                }

                return (
                  <ClassMappingCard
                    key={schoolClass.id}
                    classId={schoolClass.id}
                    className={
                      schoolClass.name
                    }
                    assignments={
                      assignments
                    }
                    getSubject={
                      getSubject
                    }
                    onAdd={() =>
                      openCreateModal(
                        schoolClass.id,
                      )
                    }
                    onEdit={
                      openEditModal
                    }
                  />
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleClasses.map(
                (schoolClass) => {
                  const assignments =
                    assignmentsByClass.get(
                      schoolClass.id,
                    ) || [];

                  /*
                   * When a session is selected,
                   * show every class, including classes
                   * that currently have no subjects.
                   */
                  return (
                    <ClassMappingCard
                      key={schoolClass.id}
                      classId={
                        schoolClass.id
                      }
                      className={
                        schoolClass.name
                      }
                      assignments={
                        assignments
                      }
                      getSubject={
                        getSubject
                      }
                      onAdd={() =>
                        openCreateModal(
                          schoolClass.id,
                        )
                      }
                      onEdit={
                        openEditModal
                      }
                    />
                  );
                },
              )}
            </div>
          )}

          {visibleClasses.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No classes found.
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingAssignment
                      ? "Edit Subject Assignment"
                      : "Assign Subject"}
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Assign a subject to a class for an
                    academic session.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Class */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Class
                  </label>

                  <select
                    value={formClassId}
                    onChange={(event) =>
                      setFormClassId(
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map(
                      (schoolClass) => (
                        <option
                          key={schoolClass.id}
                          value={
                            schoolClass.id
                          }
                        >
                          {schoolClass.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Academic Session */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Academic Session
                  </label>

                  <select
                    value={
                      formAcademicSessionId
                    }
                    onChange={(event) =>
                      setFormAcademicSessionId(
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select academic session
                    </option>

                    {academicSessions.map(
                      (session) => (
                        <option
                          key={session.id}
                          value={
                            session.id
                          }
                        >
                          {session.name}
                          {session.isCurrent
                            ? " (Current)"
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Subject
                  </label>

                  <select
                    value={formSubjectId}
                    onChange={(event) =>
                      setFormSubjectId(
                        event.target.value,
                      )
                    }
                    disabled={
                      isSaving ||
                      !formClassId ||
                      !formAcademicSessionId
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select subject
                    </option>

                    {availableSubjects.map(
                      (subject) => (
                        <option
                          key={subject.id}
                          value={
                            subject.id
                          }
                        >
                          {subject.name} (
                          {subject.code})
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Optional */}
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-xs font-medium">
                      Optional Subject
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Mark this subject as optional
                      for the class.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={formIsOptional}
                    onChange={(event) =>
                      setFormIsOptional(
                        event.target.checked,
                      )
                    }
                    disabled={isSaving}
                    className="h-4 w-4"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : editingAssignment
                        ? "Update Assignment"
                        : "Assign Subject"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface ClassMappingCardProps {
  classId: string;
  className: string;
  assignments: ClassSubject[];
  getSubject: (
    subjectId: string,
  ) => Subject | undefined;
  onAdd: () => void;
  onEdit: (
    assignment: ClassSubject,
  ) => void;
}

function ClassMappingCard({
  className,
  assignments,
  getSubject,
  onAdd,
  onEdit,
}: ClassMappingCardProps) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40">
              <School className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {className}
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                {assignments.length} subject
                {assignments.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="shrink-0 text-xs"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {assignments.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <BookOpen className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />

            <p className="text-xs font-medium">
              No subjects assigned
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              Add subjects for this class.
            </p>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {assignments.map(
              (assignment) => {
                const subject = getSubject(
                  assignment.subjectId,
                );

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-md border bg-slate-50 p-3 dark:bg-slate-900"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-md bg-white p-2 dark:bg-slate-800">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {subject?.name ||
                            "Unknown Subject"}
                        </p>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {subject?.code ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      {assignment.isOptional && (
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          Optional
                        </span>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onEdit(
                            assignment,
                          )
                        }
                        className="h-8 w-8 text-slate-500 hover:text-blue-600"
                        title="Edit assignment"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}