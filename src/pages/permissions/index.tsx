import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ShieldCheck,
  Pencil,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
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
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/lib/api/permissions.api";

import type { Permission } from "@/lib/types/rbac";

import {
  LIMITS,
  firstError,
  onlyCode,
  trimMax,
  validateMaxLength,
} from "@/lib/input-restrictions";

const PAGE_LIMIT = 50;

export default function PermissionsPage() {
  const { accessToken } = useAuth();

  const [permissions, setPermissions] = useState<
    Permission[]
  >([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] =
    useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingPermission, setEditingPermission] =
    useState<Permission | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] =
    useState(false);

  const [deletingPermission, setDeletingPermission] =
    useState<Permission | null>(null);

  const [code, setCode] = useState("");
  const [module, setModule] = useState("");
  const [description, setDescription] =
    useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] =
    useState(false);

  /*
   * Load permissions from backend.
   */
  const loadPermissions = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPermissions(
        page,
        PAGE_LIMIT,
        search.trim() || undefined,
        moduleFilter || undefined,
        accessToken,
      );

      setPermissions(result.items);
      setTotal(result.meta.total);
      setTotalPages(
        Math.max(1, result.meta.totalPages),
      );
    } catch (error) {
      console.error(
        "Failed to load permissions",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load permissions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPermissions();
  }, [
    accessToken,
    page,
    search,
    moduleFilter,
  ]);

  /*
   * Build module list from the permissions
   * currently returned by the backend.
   */
  const modules = useMemo(() => {
    return Array.from(
      new Set(
        permissions
          .map((permission) => permission.module)
          .filter(Boolean),
      ),
    ).sort();
  }, [permissions]);

  const openCreateModal = () => {
    setEditingPermission(null);

    setCode("");
    setModule("");
    setDescription("");

    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (
    permission: Permission,
  ) => {
    setEditingPermission(permission);

    setCode(permission.code);
    setModule(permission.module);
    setDescription(
      permission.description ?? "",
    );

    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingPermission(null);

    setCode("");
    setModule("");
    setDescription("");
  };

  const openDeleteDialog = (
    permission: Permission,
  ) => {
    setDeletingPermission(permission);
    setIsDeleteOpen(true);
    setError(null);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return;
    }

    setDeletingPermission(null);
    setIsDeleteOpen(false);
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    const trimmedCode = code.trim();
    const trimmedModule = module.trim();
    const trimmedDescription =
      description.trim();

    if (!trimmedCode) {
      setError("Permission code is required.");
      return;
    }

    if (!trimmedModule) {
      setError("Module is required.");
      return;
    }

    const lengthError = firstError(
      validateMaxLength(trimmedCode, "Permission code", 50),
      validateMaxLength(trimmedModule, "Module", LIMITS.NAME_MAX),
      validateMaxLength(trimmedDescription, "Description", LIMITS.REMARKS_MAX),
    );
    if (lengthError) {
      setError(lengthError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingPermission) {
        await updatePermission(
          editingPermission.id,
          {
            code: trimmedCode,
            module: trimmedModule,
            description:
              trimmedDescription || undefined,
          },
          accessToken,
        );
      } else {
        await createPermission(
          {
            code: trimmedCode,
            module: trimmedModule,
            description:
              trimmedDescription || undefined,
          },
          accessToken,
        );
      }

      closeModal();

      /*
       * Reload from backend instead of manually
       * constructing the returned list.
       */
      await loadPermissions();
    } catch (error) {
      console.error(
        "Failed to save permission",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save permission",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !deletingPermission) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deletePermission(
        deletingPermission.id,
        accessToken,
      );

      closeDeleteDialog();

      /*
       * If the last item on the current page
       * was deleted, move back one page.
       */
      if (
        permissions.length === 1 &&
        page > 1
      ) {
        setPage((currentPage) =>
          currentPage - 1,
        );
      } else {
        await loadPermissions();
      }
    } catch (error) {
      console.error(
        "Failed to delete permission",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete permission",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);
    setPage(1);
  };

  const handleModuleChange = (
    value: string,
  ) => {
    setModuleFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Permissions
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage system permissions used by the
            ERP role-based access control system.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Permission
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Search / Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  handleSearchChange(
                    event.target.value,
                  )
                }
                placeholder="Search by code or description..."
                className="pl-9"
              />
            </div>

            <select
              value={moduleFilter}
              onChange={(event) =>
                handleModuleChange(
                  event.target.value,
                )
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">
                All Modules
              </option>

              {modules.map((moduleName) => (
                <option
                  key={moduleName}
                  value={moduleName}
                >
                  {moduleName}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Permission List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Permission List
            </CardTitle>

            <span className="text-xs text-muted-foreground">
              {total} total
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading permissions...
            </div>
          ) : permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <ShieldCheck className="mb-3 h-8 w-8 text-muted-foreground" />

              <h3 className="text-sm font-semibold">
                No permissions found
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Try changing your search or module
                filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Permission Code
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Module
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Description
                    </th>

                    <th className="w-[110px] px-4 py-3 text-right text-xs font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {permissions.map(
                    (permission) => (
                      <tr
                        key={permission.id}
                        className="border-b last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-4 py-3">
                          <code className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            {permission.code}
                          </code>
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {permission.module}
                          </span>
                        </td>

                        <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">
                          {permission.description ||
                            "—"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                openEditModal(
                                  permission,
                                )
                              }
                              className="h-8 w-8 text-slate-500 hover:text-blue-600"
                              title="Edit permission"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                openDeleteDialog(
                                  permission,
                                )
                              }
                              className="h-8 w-8 text-slate-500 hover:text-red-600"
                              title="Delete permission"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading &&
        permissions.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      currentPage - 1,
                  )
                }
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      currentPage + 1,
                  )
                }
              >
                Next
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
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
                    {editingPermission
                      ? "Edit Permission"
                      : "Create Permission"}
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure the permission details.
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
                    Permission Code
                  </label>

                  <Input
                    value={code}
                    onChange={(event) =>
                      setCode(trimMax(event.target.value, 50))
                    }
                    placeholder="Example: students.create"
                    maxLength={50}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Module
                  </label>

                  <Input
                    value={module}
                    onChange={(event) =>
                      setModule(onlyCode(event.target.value, LIMITS.NAME_MAX))
                    }
                    placeholder="Example: students"
                    maxLength={LIMITS.NAME_MAX}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        trimMax(
                          event.target.value,
                          LIMITS.REMARKS_MAX,
                        ),
                      )
                    }
                    placeholder="Describe what this permission allows..."
                    rows={4}
                    maxLength={LIMITS.REMARKS_MAX}
                    disabled={isSaving}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                      : editingPermission
                        ? "Update Permission"
                        : "Create Permission"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen &&
        deletingPermission && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-base">
                  Delete Permission?
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are about to delete:
                </p>

                <code className="block rounded-md bg-slate-100 p-3 text-sm font-medium dark:bg-slate-900">
                  {deletingPermission.code}
                </code>

                <p className="text-xs text-red-600 dark:text-red-400">
                  This action cannot be undone. If
                  this permission is assigned to
                  roles, deletion may also be
                  restricted by the database
                  relationship.
                </p>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDeleteDialog}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? "Deleting..."
                      : "Delete Permission"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}