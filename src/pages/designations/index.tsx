import React, { useEffect, useState } from "react";
import { BriefcaseBusiness, Pencil, Plus, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/lib/auth/auth-context";

import {
  createDesignation,
  getDesignations,
  updateDesignation,
} from "@/lib/api/designations.api";

import type { Designation, DesignationCategory } from "@/lib/types/designation";

const CATEGORY_OPTIONS: {
  value: DesignationCategory;
  label: string;
}[] = [
  {
    value: "TEACHING",
    label: "Teaching",
  },
  {
    value: "ADMINISTRATIVE",
    label: "Administrative",
  },
  {
    value: "SUPPORT",
    label: "Support",
  },
];

function getCategoryLabel(category: DesignationCategory) {
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category)?.label ||
    category
  );
}

function getCategoryBadgeClass(category: DesignationCategory) {
  switch (category) {
    case "TEACHING":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";

    case "ADMINISTRATIVE":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";

    case "SUPPORT":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function DesignationsPage() {
  const { accessToken } = useAuth();

  const [designations, setDesignations] = useState<Designation[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingDesignation, setEditingDesignation] =
    useState<Designation | null>(null);

  const [title, setTitle] = useState("");

  const [category, setCategory] = useState<DesignationCategory>("TEACHING");

  const [isSaving, setIsSaving] = useState(false);

  const loadDesignations = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getDesignations(accessToken);

      setDesignations(result);
    } catch (error) {
      console.error("Failed to load designations", error);

      setError(
        error instanceof Error ? error.message : "Failed to load designations",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDesignations();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingDesignation(null);
    setTitle("");
    setCategory("TEACHING");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (designation: Designation) => {
    setEditingDesignation(designation);
    setTitle(designation.title);
    setCategory(designation.category);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingDesignation(null);
    setTitle("");
    setCategory("TEACHING");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Designation title is required.");
      return;
    }

    if (trimmedTitle.length > 100) {
      setError("Designation title cannot exceed 100 characters.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingDesignation) {
        await updateDesignation(
          editingDesignation.id,
          {
            title: trimmedTitle,
            category,
          },
          accessToken,
        );
      } else {
        await createDesignation(
          {
            title: trimmedTitle,
            category,
          },
          accessToken,
        );
      }

      closeModal();

      await loadDesignations();
    } catch (error) {
      console.error("Failed to save designation", error);

      setError(
        error instanceof Error ? error.message : "Failed to save designation",
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
            Designations
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage employee designations and their organizational categories.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Designation
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Designation List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
              Designation List
            </CardTitle>

            <span className="text-xs text-muted-foreground">
              {designations.length} total
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading designations...
            </div>
          ) : designations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <BriefcaseBusiness className="mb-3 h-8 w-8 text-muted-foreground" />

              <h3 className="text-sm font-semibold">No designations found</h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Create the first designation to continue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Designation
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Category
                    </th>

                    <th className="w-[90px] px-4 py-3 text-right text-xs font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {designations.map((designation) => (
                    <tr
                      key={designation.id}
                      className="border-b last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40">
                            <BriefcaseBusiness className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-medium">
                              {designation.title}
                            </p>

                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {designation.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${getCategoryBadgeClass(
                            designation.category,
                          )}`}
                        >
                          {getCategoryLabel(designation.category)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(designation)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600"
                            title="Edit designation"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingDesignation
                      ? "Edit Designation"
                      : "Create Designation"}
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure the designation title and category.
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Designation Title
                  </label>

                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: Senior Teacher"
                    maxLength={100}
                    disabled={isSaving}
                  />

                  <p className="text-[11px] text-muted-foreground">
                    Maximum 100 characters.
                  </p>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Category</label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as DesignationCategory)
                    }
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                      : editingDesignation
                        ? "Update Designation"
                        : "Create Designation"}
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
