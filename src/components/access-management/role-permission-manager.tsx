import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  getRoles,
  getRolePermissions,
  updateRolePermissions,
} from "@/lib/api/roles.api";

import { getPermissions } from "@/lib/api/permissions.api";
import { useAuth } from "@/lib/auth/auth-context";

import type {
  Permission,
  Role,
} from "@/lib/types/rbac";

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

export function RolePermissionManager() {
  const { accessToken } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] =
    useState<Permission[]>([]);

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<string[]>([]);

  const [permissionSearch, setPermissionSearch] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isLoadingRolePermissions, setIsLoadingRolePermissions] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [expandedModules, setExpandedModules] =
    useState<string[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);

      try {
        const [
          rolesResponse,
          permissionsResponse,
        ] = await Promise.all([
          getRoles(1, 100, accessToken),
          getPermissions(
            1,
            1000,
            undefined,
            undefined,
            accessToken,
          ),
        ]);

        setRoles(rolesResponse.items);
        setPermissions(
          permissionsResponse.items,
        );

        setExpandedModules([
          ...new Set(
            permissionsResponse.items.map(
              (permission) =>
                permission.module,
            ),
          ),
        ]);

        if (rolesResponse.items.length > 0) {
          setSelectedRole(
            rolesResponse.items[0],
          );
        }
      } catch (error) {
        console.error(
          "Failed to load access management data",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, [accessToken]);

  useEffect(() => {
    const loadRolePermissions = async () => {
      if (
        !selectedRole ||
        !accessToken
      ) {
        return;
      }

      setIsLoadingRolePermissions(true);

      try {
        const rolePermissions =
          await getRolePermissions(
            selectedRole.id,
            accessToken,
          );

        setSelectedPermissionIds(
          rolePermissions.map(
            (permission) =>
              permission.id,
          ),
        );
      } catch (error) {
        console.error(
          "Failed to load role permissions",
          error,
        );
      } finally {
        setIsLoadingRolePermissions(false);
      }
    };

    void loadRolePermissions();
  }, [
    selectedRole,
    accessToken,
  ]);

  const filteredPermissions =
    useMemo(() => {
      const search =
        permissionSearch.toLowerCase().trim();

      if (!search) {
        return permissions;
      }

      return permissions.filter(
        (permission) =>
          permission.code
            .toLowerCase()
            .includes(search) ||
          permission.module
            .toLowerCase()
            .includes(search) ||
          permission.description
            ?.toLowerCase()
            .includes(search),
      );
    }, [
      permissions,
      permissionSearch,
    ]);

  const permissionsByModule =
    useMemo(() => {
      return filteredPermissions.reduce<
        Record<string, Permission[]>
      >((grouped, permission) => {
        if (
          !grouped[
            permission.module
          ]
        ) {
          grouped[
            permission.module
          ] = [];
        }

        grouped[
          permission.module
        ].push(permission);

        return grouped;
      }, {});
    }, [filteredPermissions]);

  const togglePermission = (
    permissionId: string,
  ) => {
    setSelectedPermissionIds(
      (currentIds) => {
        if (
          currentIds.includes(
            permissionId,
          )
        ) {
          return currentIds.filter(
            (id) =>
              id !== permissionId,
          );
        }

        return [
          ...currentIds,
          permissionId,
        ];
      },
    );
  };

  const toggleModule = (
    modulePermissions: Permission[],
  ) => {
    const modulePermissionIds =
      modulePermissions.map(
        (permission) =>
          permission.id,
      );

    const areAllSelected =
      modulePermissionIds.every(
        (id) =>
          selectedPermissionIds.includes(
            id,
          ),
      );

    setSelectedPermissionIds(
      (currentIds) => {
        if (areAllSelected) {
          return currentIds.filter(
            (id) =>
              !modulePermissionIds.includes(
                id,
              ),
          );
        }

        return [
          ...new Set([
            ...currentIds,
            ...modulePermissionIds,
          ]),
        ];
      },
    );
  };

  const toggleModuleExpanded = (
    module: string,
  ) => {
    setExpandedModules(
      (currentModules) => {
        if (
          currentModules.includes(
            module,
          )
        ) {
          return currentModules.filter(
            (item) =>
              item !== module,
          );
        }

        return [
          ...currentModules,
          module,
        ];
      },
    );
  };

  const handleSave = async () => {
    if (
      !selectedRole ||
      !accessToken
    ) {
      return;
    }

    setIsSaving(true);

    try {
      await updateRolePermissions(
        selectedRole.id,
        selectedPermissionIds,
        accessToken,
      );
    } catch (error) {
      console.error(
        "Failed to update role permissions",
        error,
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs text-muted-foreground">
            Loading access management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />

            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Access Management
            </h1>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Configure what each role can
            access and manage within
            the school ERP.
          </p>
        </div>

        {selectedRole && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950">
              <UsersRound className="h-4 w-4 text-blue-600" />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Editing Role
              </p>

              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedRole.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Layout */}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Roles */}

        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Roles
                </CardTitle>

                <CardDescription>
                  Select a role to configure
                  its permissions.
                </CardDescription>
              </div>

              <Badge variant="secondary">
                {roles.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {roles.map((role) => {
              const isSelected =
                selectedRole?.id === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() =>
                    setSelectedRole(
                      role,
                    )
                  }
                  className={[
                    "group flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-all",
                    isSelected
                      ? "border-blue-200 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-950/40"
                      : "border-transparent hover:border-border hover:bg-muted/60",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={[
                          "truncate text-sm font-semibold",
                          isSelected
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-900 dark:text-slate-100",
                        ].join(" ")}
                      >
                        {role.name}
                      </p>

                      {role.isSystemRole && (
                        <Badge
                          variant="info"
                          className="text-[9px]"
                        >
                          System
                        </Badge>
                      )}
                    </div>

                    {role.description && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                        {
                          role.description
                        }
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    className={[
                      "h-4 w-4 shrink-0 transition-transform",
                      isSelected
                        ? "translate-x-0.5 text-blue-600"
                        : "text-muted-foreground",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Permissions */}

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                {selectedRole
                  ? `Permissions for ${selectedRole.name}`
                  : "Permissions"}
              </CardTitle>

              <CardDescription>
                Enable or disable module
                actions for this role.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {
                  selectedPermissionIds.length
                }{" "}
                selected
              </Badge>

              <Button
                type="button"
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !selectedRole
                }
                className="bg-blue-600 text-xs hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search */}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={permissionSearch}
                onChange={(event) =>
                  setPermissionSearch(
                    event.target.value,
                  )
                }
                placeholder="Search permissions or modules..."
                className="pl-9"
              />
            </div>

            {/* Permission Loading */}

            {isLoadingRolePermissions ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />

                  <p className="text-xs text-muted-foreground">
                    Loading role permissions...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  permissionsByModule,
                ).map(
                  ([
                    module,
                    modulePermissions,
                  ]) => {
                    const isExpanded =
                      expandedModules.includes(
                        module,
                      );

                    const selectedCount =
                      modulePermissions.filter(
                        (
                          permission,
                        ) =>
                          selectedPermissionIds.includes(
                            permission.id,
                          ),
                      ).length;

                    const allSelected =
                      selectedCount ===
                        modulePermissions.length &&
                      modulePermissions.length >
                        0;

                    return (
                      <div
                        key={module}
                        className="overflow-hidden rounded-lg border"
                      >
                        {/* Module Header */}

                        <div className="flex items-center justify-between bg-slate-50 px-4 py-3 dark:bg-slate-900/60">
                          <button
                            type="button"
                            onClick={() =>
                              toggleModuleExpanded(
                                module,
                              )
                            }
                            className="flex min-w-0 items-center gap-2"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}

                            <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                              {module}
                            </span>

                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {
                                modulePermissions.length
                              }
                            </Badge>
                          </button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleModule(
                                modulePermissions,
                              )
                            }
                            className="h-7 text-[11px]"
                          >
                            {allSelected
                              ? "Clear All"
                              : "Select All"}
                          </Button>
                        </div>

                        {/* Module Permissions */}

                        {isExpanded && (
                          <div className="divide-y">
                            {modulePermissions.map(
                              (
                                permission,
                              ) => {
                                const isChecked =
                                  selectedPermissionIds.includes(
                                    permission.id,
                                  );

                                return (
                                  <label
                                    key={
                                      permission.id
                                    }
                                    className={[
                                      "flex cursor-pointer items-center justify-between gap-4 px-4 py-3 transition-colors",
                                      isChecked
                                        ? "bg-blue-50/50 dark:bg-blue-950/20"
                                        : "hover:bg-muted/40",
                                    ].join(
                                      " ",
                                    )}
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div
                                        className={[
                                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                                          isChecked
                                            ? "border-blue-600 bg-blue-600"
                                            : "border-input bg-background",
                                        ].join(
                                          " ",
                                        )}
                                      >
                                        {isChecked && (
                                          <Check className="h-3.5 w-3.5 text-white" />
                                        )}
                                      </div>

                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={
                                          isChecked
                                        }
                                        onChange={() =>
                                          togglePermission(
                                            permission.id,
                                          )
                                        }
                                      />

                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                          {
                                            permission.code
                                          }
                                        </p>

                                        {permission.description && (
                                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            {
                                              permission.description
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {isChecked && (
                                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                                    )}
                                  </label>
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>
                    );
                  },
                )}

                {Object.keys(
                  permissionsByModule,
                ).length === 0 && (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed">
                    <Search className="mb-3 h-6 w-6 text-muted-foreground" />

                    <p className="text-sm font-medium">
                      No permissions found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Try a different search
                      term.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}