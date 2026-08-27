"use client";

import React, { useEffect, useState } from "react";
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
  createClass,
  getClasses,
  updateClass,
} from "@/lib/api/classes.api";

import type { SchoolClass } from "@/lib/types/class";

export default function ClassesPage() {
  const { accessToken } = useAuth();

  const [classes, setClasses] = useState<
    SchoolClass[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingClass, setEditingClass] =
    useState<SchoolClass | null>(null);

  const [name, setName] = useState("");

  const [displayOrder, setDisplayOrder] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const loadClasses = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getClasses(
        accessToken,
      );

      setClasses(data);
    } catch (error) {
      console.error(
        "Failed to load classes",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load classes",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingClass(null);
    setName("");
    setDisplayOrder("");
    setIsModalOpen(true);
  };

  const openEditModal = (
    schoolClass: SchoolClass,
  ) => {
    setEditingClass(schoolClass);
    setName(schoolClass.name);
    setDisplayOrder(
      String(schoolClass.displayOrder),
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingClass(null);
    setName("");
    setDisplayOrder("");
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!accessToken || !name.trim()) {
      return;
    }

    const order = Number(displayOrder);

    if (
      !displayOrder ||
      Number.isNaN(order)
    ) {
      return;
    }

    setIsSaving(true);

    try {
      if (editingClass) {
        const updatedClass =
          await updateClass(
            editingClass.id,
            {
              name: name.trim(),
              displayOrder: order,
            },
            accessToken,
          );

        setClasses((currentClasses) =>
          currentClasses
            .map((schoolClass) =>
              schoolClass.id === updatedClass.id
                ? updatedClass
                : schoolClass,
            )
            .sort(
              (a, b) =>
                a.displayOrder -
                b.displayOrder,
            ),
        );
      } else {
        const newClass =
          await createClass(
            {
              name: name.trim(),
              displayOrder: order,
            },
            accessToken,
          );

        setClasses((currentClasses) =>
          [...currentClasses, newClass].sort(
            (a, b) =>
              a.displayOrder -
              b.displayOrder,
          ),
        );
      }

      closeModal();
    } catch (error) {
      console.error(
        "Failed to save class",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save class",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Classes
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage school classes and their
            display order.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Class
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading classes...
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <School className="mb-3 h-8 w-8 text-muted-foreground" />

            <h3 className="text-sm font-semibold">
              No classes found
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Create your first class to begin
              managing the academic structure.
            </p>

            <Button
              onClick={openCreateModal}
              className="mt-4 bg-blue-600 text-xs hover:bg-blue-700"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((schoolClass) => (
            <Card
              key={schoolClass.id}
              className="group hover:border-blue-500"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40">
                      <School className="h-5 w-5" />
                    </div>

                    <div>
                      <CardTitle className="text-base">
                        {schoolClass.name}
                      </CardTitle>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Display Order:{" "}
                        {schoolClass.displayOrder}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      openEditModal(
                        schoolClass,
                      )
                    }
                    className="h-8 w-8 text-slate-500 hover:text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-md bg-slate-50 p-3 text-xs text-muted-foreground dark:bg-slate-900">
                  Class ID
                  <p className="mt-1 break-all font-mono text-[10px] text-slate-700 dark:text-slate-300">
                    {schoolClass.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingClass
                      ? "Edit Class"
                      : "Create Class"}
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure the basic class
                    information.
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
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Class Name
                  </label>

                  <Input
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="Example: Class 10"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Display Order
                  </label>

                  <Input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(event) =>
                      setDisplayOrder(
                        event.target.value,
                      )
                    }
                    placeholder="Example: 10"
                    disabled={isSaving}
                  />
                </div>

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
                      : editingClass
                        ? "Update Class"
                        : "Create Class"}
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