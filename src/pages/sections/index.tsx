import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  School,
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
  createSection,
  getSections,
  updateSection,
} from "@/lib/api/sections.api";

import { getClasses } from "@/lib/api/classes.api";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";

import type { Section } from "@/lib/types/section";
import type { SchoolClass } from "@/lib/types/class";
import type { AcademicSession } from "@/lib/types/academic-session";

export default function SectionsPage() {
  const { accessToken } = useAuth();

  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicSessions, setAcademicSessions] =
    useState<AcademicSession[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] =
    useState<Section | null>(null);

  const [classId, setClassId] = useState("");
  const [academicSessionId, setAcademicSessionId] =
    useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        sectionsData,
        classesData,
        sessionsData,
      ] = await Promise.all([
        getSections(accessToken),
        getClasses(accessToken),
        getAcademicSessions(accessToken),
      ]);

      setSections(sectionsData);
      setClasses(classesData);
      setAcademicSessions(sessionsData);
    } catch (error) {
      console.error(
        "Failed to load sections data",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load sections data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accessToken]);

  /*
   * Group sections by class.
   *
   * Example:
   *
   * Class 1 → A, B, C
   * Class 2 → A, B
   * Class 3 → A, B, C, D
   */
  const sectionsByClass = useMemo(() => {
    const groups = new Map<string, Section[]>();

    for (const section of sections) {
      const existing = groups.get(section.classId);

      if (existing) {
        existing.push(section);
      } else {
        groups.set(section.classId, [section]);
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) =>
        a[0].class.displayOrder -
        b[0].class.displayOrder,
    );
  }, [sections]);

  const openCreateModal = () => {
    setEditingSection(null);

    setClassId("");
    setAcademicSessionId("");
    setName("");
    setCapacity("");

    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (section: Section) => {
    setEditingSection(section);

    setClassId(section.classId);
    setAcademicSessionId(section.academicSessionId);
    setName(section.name);

    setCapacity(
      section.capacity !== null
        ? String(section.capacity)
        : "",
    );

    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingSection(null);

    setClassId("");
    setAcademicSessionId("");
    setName("");
    setCapacity("");
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    if (!classId) {
      setError("Please select a class.");
      return;
    }

    if (!academicSessionId) {
      setError(
        "Please select an academic session.",
      );
      return;
    }

    if (!name.trim()) {
      setError("Section name is required.");
      return;
    }

    let capacityValue: number | undefined;

    if (capacity.trim()) {
      const parsedCapacity = Number(capacity);

      if (
        !Number.isInteger(parsedCapacity) ||
        parsedCapacity < 1 ||
        parsedCapacity > 32767
      ) {
        setError(
          "Capacity must be an integer between 1 and 32767.",
        );
        return;
      }

      capacityValue = parsedCapacity;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingSection) {
        const updatedSection =
          await updateSection(
            editingSection.id,
            {
              classId,
              academicSessionId,
              name: name.trim(),
              capacity: capacityValue,
            },
            accessToken,
          );

        setSections((currentSections) =>
          currentSections.map((section) =>
            section.id === updatedSection.id
              ? updatedSection
              : section,
          ),
        );
      } else {
        const newSection =
          await createSection(
            {
              classId,
              academicSessionId,
              name: name.trim(),
              capacity: capacityValue,
            },
            accessToken,
          );

        setSections((currentSections) => [
          ...currentSections,
          newSection,
        ]);
      }

      closeModal();
    } catch (error) {
      console.error(
        "Failed to save section",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save section",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Sections
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage class sections for academic
            sessions.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading sections...
        </div>
      ) : sectionsByClass.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <School className="mb-3 h-8 w-8 text-muted-foreground" />

            <h3 className="text-sm font-semibold">
              No sections found
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Create your first section to begin
              managing the class structure.
            </p>

            <Button
              onClick={openCreateModal}
              className="mt-4 bg-blue-600 text-xs hover:bg-blue-700"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* 
         * Four classes per row on large screens.
         * Each class has its own vertically scrollable
         * section list.
         */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sectionsByClass.map((classSections) => {
            const firstSection = classSections[0];

            return (
              <Card
                key={firstSection.classId}
                className="flex min-h-0 flex-col"
              >
                {/* Class Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40">
                      <School className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {firstSection.class.name}
                      </CardTitle>

                      <p className="truncate text-xs text-muted-foreground">
                        {firstSection.academicSession.name}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {/* Sections */}
                <CardContent className="min-h-0">
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {classSections
                      .sort((a, b) =>
                        a.name.localeCompare(b.name),
                      )
                      .map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between rounded-md border bg-slate-50 p-3 dark:bg-slate-900"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              Section {section.name}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Capacity:{" "}
                              {section.capacity ??
                                "Not set"}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              openEditModal(section)
                            }
                            className="ml-2 h-8 w-8 shrink-0 text-slate-500 hover:text-blue-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                    {editingSection
                      ? "Edit Section"
                      : "Create Section"}
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure section information.
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
                    value={classId}
                    onChange={(event) =>
                      setClassId(event.target.value)
                    }
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((schoolClass) => (
                      <option
                        key={schoolClass.id}
                        value={schoolClass.id}
                      >
                        {schoolClass.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Session */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Academic Session
                  </label>

                  <select
                    value={academicSessionId}
                    onChange={(event) =>
                      setAcademicSessionId(
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

                {/* Section Name */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Section Name
                  </label>

                  <Input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Example: A"
                    maxLength={10}
                    disabled={isSaving}
                  />
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Capacity
                  </label>

                  <Input
                    type="number"
                    min="1"
                    max="32767"
                    value={capacity}
                    onChange={(event) =>
                      setCapacity(event.target.value)
                    }
                    placeholder="Example: 45"
                    disabled={isSaving}
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
                      : editingSection
                        ? "Update Section"
                        : "Create Section"}
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