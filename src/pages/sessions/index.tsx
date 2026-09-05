"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/lib/auth/auth-context";

import type { AcademicSession } from "@/lib/types/academic-session";

import {
  createAcademicSession,
  getAcademicSessions,
  setCurrentAcademicSession,
  updateAcademicSession,
} from "@/lib/api/academic-sessions.api";

import {
  LIMITS,
  firstError,
  validateMaxLength,
  validateRequired,
} from "@/lib/input-restrictions";

interface SessionFormData {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const emptyForm: SessionFormData = {
  name: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateForInput(date: string) {
  return new Date(date).toISOString().split("T")[0];
}

export default function SessionsPage() {
  const { accessToken } = useAuth();

  const [sessions, setSessions] = useState<
    AcademicSession[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [editingSession, setEditingSession] =
    useState<AcademicSession | null>(null);

  const [formData, setFormData] =
    useState<SessionFormData>(emptyForm);

  const loadSessions = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAcademicSessions(
        accessToken,
      );

      setSessions(data);
    } catch (error) {
      console.error(
        "Failed to load academic sessions",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load academic sessions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [accessToken]);

  const handleCreate = () => {
    setEditingSession(null);
    setFormData(emptyForm);
    setError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (
    session: AcademicSession,
  ) => {
    setEditingSession(session);

    setFormData({
      name: session.name,
      startDate: formatDateForInput(
        session.startDate,
      ),
      endDate: formatDateForInput(
        session.endDate,
      ),
      isCurrent: session.isCurrent,
    });

    setError(null);
    setIsFormOpen(true);
  };

  const handleInputChange = (
    field: keyof SessionFormData,
    value: string | boolean,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    const nameError = firstError(
      validateRequired(formData.name, "Session name"),
      validateMaxLength(formData.name, "Session name", LIMITS.NAME_MAX),
    );
    if (nameError) {
      setError(nameError);
      return;
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      setError(
        "End date cannot be before the start date.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingSession) {
        await updateAcademicSession(
          editingSession.id,
          formData,
          accessToken,
        );
      } else {
        await createAcademicSession(
          formData,
          accessToken,
        );
      }

      await loadSessions();

      setIsFormOpen(false);
      setEditingSession(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(
        "Failed to save academic session",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save academic session",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async (
    sessionId: string,
  ) => {
    if (!accessToken) {
      return;
    }

    try {
      await setCurrentAcademicSession(
        sessionId,
        accessToken,
      );

      await loadSessions();
    } catch (error) {
      console.error(
        "Failed to set current session",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to set current session",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Academic Sessions
          </h1>

          <p className="text-xs text-muted-foreground">
            Create and manage academic years for
            your school.
          </p>
        </div>

        <Button
          onClick={handleCreate}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-4 w-4" />

          New Academic Session
        </Button>
      </div>

      {error && !isFormOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-[250px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />

              Loading academic sessions...
            </div>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>

            <h3 className="font-semibold">
              No academic sessions found
            </h3>

            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Create your first academic session
              before setting up classes, sections,
              and student records.
            </p>

            <Button
              onClick={handleCreate}
              className="mt-5 bg-blue-600 text-xs hover:bg-blue-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />

              Create Academic Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={
                session.isCurrent
                  ? "border-2 border-blue-500 bg-blue-50/20 dark:bg-blue-950/20"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      {session.name}
                    </CardTitle>

                    <CardDescription>
                      Academic year session
                    </CardDescription>
                  </div>

                  {session.isCurrent ? (
                    <Badge
                      variant="success"
                      className="shrink-0"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />

                      Current
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="shrink-0"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Start Date
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(
                        session.startDate,
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      End Date
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(
                        session.endDate,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      handleEdit(session)
                    }
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />

                    Edit Session
                  </Button>

                  {!session.isCurrent && (
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() =>
                        handleSetCurrent(
                          session.id,
                        )
                      }
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />

                      Set as Current
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader>
              <CardTitle>
                {editingSession
                  ? "Edit Academic Session"
                  : "Create Academic Session"}
              </CardTitle>

              <CardDescription>
                {editingSession
                  ? "Update the academic session details."
                  : "Add a new academic year for your school."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">
                    Session Name
                  </label>

                  <Input
                    value={formData.name}
                    onChange={(event) =>
                      handleInputChange(
                        "name",
                        event.target.value.slice(0, LIMITS.NAME_MAX),
                      )
                    }
                    placeholder="Example: 2026-2027"
                    maxLength={LIMITS.NAME_MAX}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">
                      Start Date
                    </label>

                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(event) =>
                        handleInputChange(
                          "startDate",
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">
                      End Date
                    </label>

                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(event) =>
                        handleInputChange(
                          "endDate",
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-xs">
                  <input
                    type="checkbox"
                    checked={
                      formData.isCurrent
                    }
                    onChange={(event) =>
                      handleInputChange(
                        "isCurrent",
                        event.target.checked,
                      )
                    }
                  />

                  <span>
                    Set this as the current
                    academic session
                  </span>
                </label>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingSession(null);
                      setFormData(emptyForm);
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    )}

                    {isSubmitting
                      ? "Saving..."
                      : editingSession
                        ? "Save Changes"
                        : "Create Session"}
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