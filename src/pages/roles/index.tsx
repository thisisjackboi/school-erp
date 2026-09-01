"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/lib/auth/auth-context";

import {
  createRole,
  deleteRole,
  getRolePermissions,
  getRoles,
  updateRole,
  updateRolePermissions,
} from "@/lib/api/roles.api";

import { getPermissions } from "@/lib/api/permissions.api";

import type { Permission, Role } from "@/lib/types/rbac";

export default function RolesPage() {
  const { accessToken } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );

  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});

  const [isLoading, setIsLoading] = useState(true);

  const [isPermissionLoading, setIsPermissionLoading] = useState(false);

  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const [isSavingRole, setIsSavingRole] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [roleName, setRoleName] = useState("");

  const [roleDescription, setRoleDescription] = useState("");

  const loadRolesAndPermissions = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [rolesResult, permissionsResult] = await Promise.all([
        getRoles(1, 100, accessToken),
        getPermissions(1, 100, undefined, undefined, accessToken),
      ]);

      setRoles(rolesResult.items);
      setPermissions(permissionsResult.items);

      if (selectedRole) {
        const refreshedRole = rolesResult.items.find(
          (role) => role.id === selectedRole.id,
        );

        if (refreshedRole) {
          setSelectedRole(refreshedRole);
        } else {
          setSelectedRole(null);
          setSelectedPermissionIds([]);
        }
      }
    } catch (error) {
      console.error("Failed to load roles", error);

      setError(error instanceof Error ? error.message : "Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRolesAndPermissions();
  }, [accessToken]);

  const selectRole = async (role: Role) => {
    if (!accessToken) {
      return;
    }

    setSelectedRole(role);
    setSelectedPermissionIds([]);
    setIsPermissionLoading(true);
    setError(null);

    try {
      const rolePermissions = await getRolePermissions(role.id, accessToken);

      setSelectedPermissionIds(
        rolePermissions.map((permission) => permission.id),
      );
    } catch (error) {
      console.error("Failed to load role permissions", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load role permissions",
      );
    } finally {
      setIsPermissionLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setError(null);
    setIsRoleModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setError(null);
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    if (isSavingRole) {
      return;
    }

    setIsRoleModalOpen(false);
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
  };

  const handleRoleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    const name = roleName.trim();
    const description = roleDescription.trim();

    if (!name) {
      setError("Role name is required.");
      return;
    }

    setIsSavingRole(true);
    setError(null);

    try {
      if (editingRole) {
        await updateRole(
          editingRole.id,
          {
            name,
            description,
          },
          accessToken,
        );
      } else {
        await createRole(
          {
            name,
            description,
          },
          accessToken,
        );
      }

      closeRoleModal();

      await loadRolesAndPermissions();
    } catch (error) {
      console.error("Failed to save role", error);

      setError(error instanceof Error ? error.message : "Failed to save role");
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!accessToken) {
      return;
    }

    if (role.isSystemRole) {
      setError("System roles cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete role "${role.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteRole(role.id, accessToken);

      if (selectedRole?.id === role.id) {
        setSelectedRole(null);
        setSelectedPermissionIds([]);
      }

      await loadRolesAndPermissions();
    } catch (error) {
      console.error("Failed to delete role", error);

      setError(
        error instanceof Error ? error.message : "Failed to delete role",
      );
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((current) => {
      if (current.includes(permissionId)) {
        return current.filter((id) => id !== permissionId);
      }

      return [...current, permissionId];
    });
  };

  const handleSavePermissions = async () => {
    if (!accessToken || !selectedRole) {
      return;
    }

    setIsSavingPermissions(true);
    setError(null);

    try {
      await updateRolePermissions(
        selectedRole.id,
        selectedPermissionIds,
        accessToken,
      );

      const updatedRoles = await getRoles(1, 100, accessToken);

      setRoles(updatedRoles.items);

      const refreshedRole = updatedRoles.items.find(
        (role) => role.id === selectedRole.id,
      );

      if (refreshedRole) {
        setSelectedRole(refreshedRole);
      }
    } catch (error) {
      console.error("Failed to update role permissions", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update role permissions",
      );
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const permissionsByModule = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    for (const permission of permissions) {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }

      groups[permission.module].push(permission);
    }

    return groups;
  }, [permissions]);

  const modules = useMemo(
    () => Object.keys(permissionsByModule).sort(),
    [permissionsByModule],
  );

  const toggleModule = (module: string) => {
    setExpandedModules((current) => ({
      ...current,
      [module]: current[module] === undefined ? false : !current[module],
    }));
  };

  const selectAllModulePermissions = (module: string) => {
    const modulePermissionIds = permissionsByModule[module].map(
      (permission) => permission.id,
    );

    setSelectedPermissionIds((current) => {
      const withoutModule = current.filter(
        (id) => !modulePermissionIds.includes(id),
      );

      return [...withoutModule, ...modulePermissionIds];
    });
  };

  const clearModulePermissions = (module: string) => {
    const modulePermissionIds = permissionsByModule[module].map(
      (permission) => permission.id,
    );

    setSelectedPermissionIds((current) =>
      current.filter((id) => !modulePermissionIds.includes(id)),
    );
  };

  const getModuleSelectedCount = (module: string) => {
    return permissionsByModule[module].filter((permission) =>
      selectedPermissionIds.includes(permission.id),
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Roles
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage system roles and assign permissions.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create Role
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main */}
      {isLoading ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Loading roles...
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Role List
                </CardTitle>

                <span className="text-xs text-muted-foreground">
                  {roles.length} total
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {roles.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <p className="text-xs font-medium">No roles found</p>

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Create a role to get started.
                  </p>
                </div>
              ) : (
                <div className="max-h-[650px] space-y-2 overflow-y-auto pr-1">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className={`rounded-lg border p-3 transition ${
                        selectedRole?.id === role.id
                          ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => selectRole(role)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {role.name}
                            </p>

                            {role.isSystemRole && (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                System
                              </span>
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                            {role.description || "No description"}
                          </p>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(role)}
                            disabled={role.isSystemRole}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600"
                            title={
                              role.isSystemRole
                                ? "System role cannot be renamed"
                                : "Edit role"
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role)}
                            disabled={role.isSystemRole}
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            title={
                              role.isSystemRole
                                ? "System role cannot be deleted"
                                : "Delete role"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permission Assignment */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">
                    Permission Assignment
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedRole
                      ? `Managing permissions for ${selectedRole.name}`
                      : "Select a role to manage its permissions."}
                  </p>
                </div>

                {selectedRole && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {selectedPermissionIds.length} selected
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {!selectedRole ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <ShieldCheck className="mb-3 h-9 w-9 text-muted-foreground" />

                  <p className="text-sm font-semibold">Select a role</p>

                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Choose a role from the list to view and manage its assigned
                    permissions.
                  </p>
                </div>
              ) : isPermissionLoading ? (
                <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
                  Loading role permissions...
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.length === 0 ? (
                    <div className="rounded-md border border-dashed p-8 text-center">
                      <p className="text-xs font-medium">
                        No permissions found
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Create permissions first from the Permissions page.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                      {modules.map((module) => {
                        const modulePermissions = permissionsByModule[module];

                        const selectedCount = getModuleSelectedCount(module);

                        const isExpanded = expandedModules[module] !== false;

                        return (
                          <div key={module} className="rounded-lg border">
                            <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 dark:bg-slate-900">
                              <button
                                type="button"
                                onClick={() => toggleModule(module)}
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 shrink-0" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 shrink-0" />
                                )}

                                <span className="truncate text-xs font-bold uppercase">
                                  {module}
                                </span>

                                <span className="text-[10px] text-muted-foreground">
                                  {selectedCount}/{modulePermissions.length}
                                </span>
                              </button>

                              <div className="flex shrink-0 gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    selectAllModulePermissions(module)
                                  }
                                  className="h-7 text-[10px]"
                                >
                                  All
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => clearModulePermissions(module)}
                                  className="h-7 text-[10px]"
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="divide-y">
                                {modulePermissions.map((permission) => {
                                  const checked =
                                    selectedPermissionIds.includes(
                                      permission.id,
                                    );

                                  return (
                                    <label
                                      key={permission.id}
                                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          togglePermission(permission.id)
                                        }
                                        className="h-4 w-4"
                                      />

                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium">
                                          {permission.code}
                                        </p>

                                        {permission.description && (
                                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                                            {permission.description}
                                          </p>
                                        )}
                                      </div>

                                      {checked && (
                                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedRole && (
                    <div className="flex justify-end border-t pt-4">
                      <Button
                        type="button"
                        onClick={handleSavePermissions}
                        disabled={isSavingPermissions || isPermissionLoading}
                        className="bg-blue-600 text-xs hover:bg-blue-700"
                      >
                        {isSavingPermissions ? "Saving..." : "Save Permissions"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingRole ? "Edit Role" : "Create Role"}
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure the role name and description.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeRoleModal}
                  disabled={isSavingRole}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleRoleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Role Name</label>

                  <Input
                    value={roleName}
                    onChange={(event) => setRoleName(event.target.value)}
                    placeholder="Example: Teacher"
                    disabled={isSavingRole}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Description</label>

                  <textarea
                    value={roleDescription}
                    onChange={(event) => setRoleDescription(event.target.value)}
                    placeholder="Describe what this role is used for..."
                    disabled={isSavingRole}
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeRoleModal}
                    disabled={isSavingRole}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSavingRole}
                  >
                    {isSavingRole
                      ? "Saving..."
                      : editingRole
                        ? "Update Role"
                        : "Create Role"}
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
