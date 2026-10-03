"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { PermissionGate } from "@/components/auth/permission-gate";
import { HomeworkFormDialog } from "@/components/modules/homework-form-dialog";

import { useAuth } from "@/lib/auth/auth-context";
import { useRole } from "@/lib/permissions";
import { formatDisplayDate, parseApiDate } from "@/lib/dates";
import { getAcademicSessions } from "@/lib/api/academic-sessions.api";
import { getClasses } from "@/lib/api/classes.api";
import { getSections } from "@/lib/api/sections.api";
import { deleteHomework, getHomework } from "@/lib/api/homework.api";

import type { AcademicSession } from "@/lib/types/academic-session";
import type { SchoolClass } from "@/lib/types/class";
import type { Section } from "@/lib/types/section";
import type { Homework } from "@/lib/types/homework";
import { HOMEWORK_ANY } from "@/lib/types/homework";

const PAGE_LIMIT = 20;

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-xs";

/**
 * `dueDate` is a date-only column, so "overdue" means the date has passed.
 *
 * This must stay identical to `HomeworkService.startOfToday()` on the backend,
 * which also uses UTC. Using local time here made the badge and the
 * "Overdue only" filter disagree for a few hours every morning, so a task could
 * be badged overdue in the list yet missing from the filtered result.
 */
function isOverdue(homework: Homework): boolean {
  const due = parseApiDate(homework.dueDate);

  if (!due) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  return due.getTime() < startOfToday.getTime();
}

export default function HomeworkPage() {
  const { accessToken } = useAuth();
  const { hasPermission } = useRole();
  const { toast } = useToast();

  const canAssign = HOMEWORK_ANY.create.some((code) =>
    hasPermission(code),
  );

  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Holds the first load back until the year filter has been defaulted to the
  // current academic session, so the list is not fetched twice.
  const [isFilterReady, setIsFilterReady] = useState(false);

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(
    null,
  );

  const [deletingHomework, setDeletingHomework] =
    useState<Homework | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setIsFilterReady(true);
      return;
    }

    const loadLookups = async () => {
      try {
        const [sessionList, classList, sectionList] = await Promise.all([
          getAcademicSessions(accessToken),
          getClasses(accessToken),
          getSections(accessToken),
        ]);

        setSessions(sessionList);
        setClasses(classList);
        setSections(sectionList);

        // Homework is scoped to an academic year, so start on the active one
        // instead of an "All years" view that hides the current term's work.
        const current = sessionList.find((session) => session.isCurrent);

        if (current) {
          setSessionFilter(current.id);
        }
      } catch {
        // The list itself is still usable without the filter dropdowns.
        setSessions([]);
        setClasses([]);
        setSections([]);
      } finally {
        setIsFilterReady(true);
      }
    };

    void loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const loadHomework = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await getHomework(
        {
          page,
          limit: PAGE_LIMIT,
          search: search.trim() || undefined,
          academicSessionId: sessionFilter || undefined,
          classId: classFilter || undefined,
          sectionId: sectionFilter || undefined,
          isOverdue: onlyOverdue || undefined,
        },
        accessToken,
      );

      setHomeworkList(result.items);
      setTotal(result.meta.total);
      setTotalPages(Math.max(1, result.meta.totalPages));
    } catch (error) {
      toast(
        "Failed to load homework",
        error instanceof Error
          ? error.message
          : "Failed to load homework",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    accessToken,
    page,
    search,
    sessionFilter,
    classFilter,
    sectionFilter,
    onlyOverdue,
    toast,
  ]);

  useEffect(() => {
    if (!isFilterReady) {
      return;
    }

    void loadHomework();
  }, [isFilterReady, loadHomework]);

  const visibleSections = sections.filter(
    (section) =>
      (!sessionFilter ||
        section.academicSessionId === sessionFilter) &&
      (!classFilter || section.classId === classFilter),
  );

  const handleCreate = () => {
    setEditingHomework(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Homework) => {
    setEditingHomework(item);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingHomework || !accessToken) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteHomework(deletingHomework.id, accessToken);

      toast(
        "Homework deleted",
        `“${deletingHomework.title}” has been removed.`,
        "success",
      );

      setDeletingHomework(null);

      // Removing the only row on the last page should land on a valid page.
      if (homeworkList.length === 1 && page > 1) {
        setPage((current) => current - 1);
        return;
      }

      await loadHomework();
    } catch (error) {
      toast(
        "Failed to delete homework",
        error instanceof Error
          ? error.message
          : "Failed to delete homework",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Homework &amp; Assignments
          </h1>
          <p className="text-xs text-muted-foreground">
            {canAssign
              ? "Assign class work per subject, section and academic year."
              : "Homework assigned for your class."}
          </p>
        </div>

        <PermissionGate anyPermission={[...HOMEWORK_ANY.create]}>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 text-xs hover:bg-blue-700"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Assign Homework
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm">
              All Homework
              {total > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {total} total
                </span>
              )}
            </CardTitle>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search homework..."
                  className="h-9 w-full pl-8 text-xs md:w-48"
                  aria-label="Search homework"
                />
              </div>

              <select
                value={sessionFilter}
                onChange={(event) => {
                  setSessionFilter(event.target.value);
                  setClassFilter("");
                  setSectionFilter("");
                  setPage(1);
                }}
                aria-label="Filter by academic year"
                className={selectClass}
              >
                <option value="">All years</option>

                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                    {session.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </select>

              <select
                value={classFilter}
                onChange={(event) => {
                  setClassFilter(event.target.value);
                  setSectionFilter("");
                  setPage(1);
                }}
                aria-label="Filter by class"
                className={selectClass}
              >
                <option value="">All classes</option>

                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={sectionFilter}
                onChange={(event) => {
                  setSectionFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by section"
                className={selectClass}
              >
                <option value="">All sections</option>

                {visibleSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>

              <label className="flex h-9 cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={onlyOverdue}
                  onChange={(event) => {
                    setOnlyOverdue(event.target.checked);
                    setPage(1);
                  }}
                />
                Overdue only
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-20 w-full" />
              ))}
            </div>
          ) : homeworkList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No homework found</p>
              <p className="text-xs text-muted-foreground">
                {search ||
                sessionFilter ||
                classFilter ||
                sectionFilter ||
                onlyOverdue
                  ? "Try adjusting the search or filters."
                  : canAssign
                    ? "Assign your first homework to get started."
                    : "Nothing has been assigned for your class yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {homeworkList.map((item) => {
                const assignment = item.teacherSubjectAssignment;
                const overdue = isOverdue(item);

                return (
                  <div
                    key={item.id}
                    className="space-y-2 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="info">
                            {assignment.subject.name}
                          </Badge>

                          <Badge variant="secondary">
                            {assignment.section.class.name}-
                            {assignment.section.name}
                          </Badge>

                          <Badge variant="outline">
                            {assignment.academicSession.name}
                          </Badge>

                          {overdue && (
                            <Badge variant="destructive">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <PermissionGate
                          anyPermission={[...HOMEWORK_ANY.update]}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            aria-label={`Edit ${item.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGate>

                        <PermissionGate
                          anyPermission={[...HOMEWORK_ANY.delete]}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingHomework(item)}
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>

                    {item.description && (
                      <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>
                        Teacher:{" "}
                        {assignment.employee.firstName}{" "}
                        {assignment.employee.lastName}
                      </span>

                      <span>
                        Assigned {formatDisplayDate(item.assignedDate)}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Due {formatDisplayDate(item.dueDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && homeworkList.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <HomeworkFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        homework={editingHomework}
        onSuccess={loadHomework}
      />

      {deletingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Delete homework
                </CardTitle>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingHomework(null)}
                  disabled={isDeleting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                This permanently removes{" "}
                <span className="font-semibold text-foreground">
                  {deletingHomework.title}
                </span>{" "}
                from the class. This cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingHomework(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
