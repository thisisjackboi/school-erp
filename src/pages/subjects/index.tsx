import React, { useEffect, useState } from "react";
import {
  Plus,
  BookOpen,
  Pencil,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/lib/auth/auth-context";

import {
  createSubject,
  getSubjects,
  updateSubject,
} from "@/lib/api/subjects.api";

import type { Subject } from "@/lib/types/subject";

import { onlyCode, trimMax } from "@/lib/input-restrictions";

export default function SubjectsPage() {
  const { accessToken } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] =
    useState<Subject | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isElective, setIsElective] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const loadSubjects = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSubjects(accessToken);
      setSubjects(data);
    } catch (error) {
      console.error(
        "Failed to load subjects",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load subjects",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubjects();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setName("");
    setCode("");
    setIsElective(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setCode(subject.code);
    setIsElective(subject.isElective);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingSubject(null);
    setName("");
    setCode("");
    setIsElective(false);
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    if (!name.trim()) {
      setError("Subject name is required.");
      return;
    }

    if (!code.trim()) {
      setError("Subject code is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingSubject) {
        const updatedSubject =
          await updateSubject(
            editingSubject.id,
            {
              name: name.trim(),
              code: code.trim(),
              isElective,
            },
            accessToken,
          );

        setSubjects((currentSubjects) =>
          currentSubjects.map((subject) =>
            subject.id === updatedSubject.id
              ? updatedSubject
              : subject,
          ),
        );
      } else {
        const newSubject =
          await createSubject(
            {
              name: name.trim(),
              code: code.trim(),
              isElective,
            },
            accessToken,
          );

        setSubjects((currentSubjects) =>
          [...currentSubjects, newSubject].sort(
            (a, b) =>
              a.name.localeCompare(b.name),
          ),
        );
      }

      closeModal();
    } catch (error) {
      console.error(
        "Failed to save subject",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save subject",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Subjects
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage subjects available in the school.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Subject
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading subjects...
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-3 h-8 w-8 text-muted-foreground" />

            <h3 className="text-sm font-semibold">
              No subjects found
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Create your first subject to begin.
            </p>

            <Button
              onClick={openCreateModal}
              className="mt-4 bg-blue-600 text-xs hover:bg-blue-700"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create First Subject
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="flex min-h-0 flex-col"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {subject.name}
                      </CardTitle>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Code: {subject.code}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      openEditModal(subject)
                    }
                    className="h-8 w-8 shrink-0 text-slate-500 hover:text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between rounded-md border bg-slate-50 p-3 dark:bg-slate-900">
                  <span className="text-xs text-muted-foreground">
                    Type
                  </span>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                      subject.isElective
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {subject.isElective
                      ? "Elective"
                      : "Regular"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingSubject
                      ? "Edit Subject"
                      : "Create Subject"}
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure subject information.
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
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Subject Name
                  </label>

                  <Input
                    value={name}
                    onChange={(event) =>
                      setName(trimMax(event.target.value, 100))
                    }
                    placeholder="Example: Mathematics"
                    maxLength={100}
                    disabled={isSaving}
                  />
                </div>

                {/* Code */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Subject Code
                  </label>

                  <Input
                    value={code}
                    onChange={(event) =>
                      setCode(onlyCode(event.target.value, 20))
                    }
                    placeholder="Example: MATH"
                    maxLength={20}
                    disabled={isSaving}
                  />
                </div>

                {/* Elective */}
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-xs font-medium">
                      Elective Subject
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Mark this subject as elective.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={isElective}
                    onChange={(event) =>
                      setIsElective(
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
                      : editingSubject
                        ? "Update Subject"
                        : "Create Subject"}
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