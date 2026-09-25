"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Power, RotateCcw, ShieldCheck, UserPlus, UserRound, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

import { useAuth } from "@/lib/auth/auth-context";
import { PermissionGate } from "@/components/auth/permission-gate";
import {
  checkUsernameAvailability,
  createUser,
  deleteUser,
  getUserRoles,
  getUsers,
  restoreUser,
  updateUserRoles,
} from "@/lib/api/users.api";
import { getRoles } from "@/lib/api/roles.api";

import type { RbacUser, Role } from "@/lib/types/rbac";

import {
  LIMITS,
  firstError,
  onlyUsername,
  trimMax,
  validateEmail,
  validateMaxLength,
  validatePhone,
  validateRequired,
} from "@/lib/input-restrictions";

export default function UsersPage() {
  const { accessToken, user: authUser } = useAuth();

  const [users, setUsers] = useState<RbacUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "all" | "SYSTEM" | "STUDENT" | "EMPLOYEE" | "GUARDIAN" | "deactivated"
  >("all");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<RbacUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const usernameCheckSeq = useRef(0);
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const loadData = async () => {
    if (!accessToken) {
      setError("Unauthorized");
      setLoading(false);
      return;
    }

    const userType =
      activeTab === "all" || activeTab === "deactivated"
        ? undefined
        : activeTab;
    const status: "active" | "deactivated" =
      activeTab === "deactivated" ? "deactivated" : "active";

    try {
      setLoading(true);
      setError("");

      const [usersResponse, rolesResponse] = await Promise.all([
        getUsers(1, 100, undefined, userType, status, accessToken),
        getRoles(1, 100, accessToken),
      ]);

      setUsers(usersResponse.items);
      setRoles(rolesResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accessToken, activeTab]);

  const handleDeactivate = async (user: RbacUser) => {
    if (!accessToken) {
      setError("Unauthorized");
      return;
    }

    if (
      !window.confirm(
        `Deactivate "${user.username}"? Their login will be blocked immediately. You can reactivate them later from the Deactivated tab.`,
      )
    ) {
      return;
    }

    setDeletingId(user.id);
    setError("");

    try {
      await deleteUser(user.id, accessToken);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (user: RbacUser) => {
    if (!accessToken) {
      setError("Unauthorized");
      return;
    }

    if (
      !window.confirm(
        `Reactivate "${user.username}"? Their login will work again.`,
      )
    ) {
      return;
    }

    setRestoringId(user.id);
    setError("");

    try {
      await restoreUser(user.id, accessToken);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate user");
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    const value = form.username.trim();

    if (usernameCheckTimer.current) {
      clearTimeout(usernameCheckTimer.current);
      usernameCheckTimer.current = null;
    }

    if (value.length < 3) {
      usernameCheckSeq.current += 1;
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");

    const seq = usernameCheckSeq.current + 1;
    usernameCheckSeq.current = seq;

    usernameCheckTimer.current = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(value, accessToken);

        if (usernameCheckSeq.current !== seq) {
          return;
        }

        setUsernameStatus(result.available ? "available" : "taken");
      } catch {
        if (usernameCheckSeq.current !== seq) {
          return;
        }

        setUsernameStatus("idle");
      }
    }, 400);
  }, [form.username, accessToken]);

  useEffect(() => {
    return () => {
      if (usernameCheckTimer.current) {
        clearTimeout(usernameCheckTimer.current);
      }
      usernameCheckSeq.current += 1;
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      user.username.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value) ||
      user.phone?.toLowerCase().includes(value) ||
      user.userType.toLowerCase().includes(value)
    );
  });

  const openCreate = () => {
    setForm({
      username: "",
      email: "",
      phone: "",
      password: "",
    });

    setSelectedRoleIds([]);
    setError("");
    setUsernameStatus("idle");
    setPhoneError("");
    setEmailError("");
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (creating) {
      return;
    }

    setCreateOpen(false);

    setForm({
      username: "",
      email: "",
      phone: "",
      password: "",
    });

    setSelectedRoleIds([]);
    setError("");
    setUsernameStatus("idle");
    setPhoneError("");
    setEmailError("");
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setError("Unauthorized");
      return;
    }

    if (!form.username.trim()) {
      setError("Username is required");
      return;
    }

    if (usernameStatus === "taken") {
      setError("Username is already taken");
      return;
    }

    if (!form.password) {
      setError("Password is required");
      return;
    }

    if (selectedRoleIds.length === 0) {
      setError("Select at least one role");
      return;
    }

    const userError = firstError(
      validateRequired(form.username, "Username"),
      validateMaxLength(form.username, "Username", LIMITS.USERNAME_MAX),
      validateRequired(form.password, "Password"),
      validateMaxLength(form.password, "Password", LIMITS.TEXT_MAX),
    );
    if (userError) {
      setError(userError);
      return;
    }

    const emailErrorMsg = firstError(
      validateRequired(form.email, "Email"),
      validateEmail(form.email),
    );
    setEmailError(emailErrorMsg);

    const phoneErrorMsg = firstError(
      validateRequired(form.phone, "Phone number"),
      validatePhone(form.phone),
    );
    setPhoneError(phoneErrorMsg);

    if (emailErrorMsg || phoneErrorMsg) {
      setError(emailErrorMsg || phoneErrorMsg);
      return;
    }

    try {
      setCreating(true);
      setError("");

      const user = await createUser(
        {
          username: form.username.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          password: form.password,
          userType: "SYSTEM",
        },
        accessToken,
      );

      await updateUserRoles(user.id, selectedRoleIds, accessToken);

      closeCreate();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = async (user: RbacUser) => {
    if (!accessToken) {
      setError("Unauthorized");
      return;
    }

    try {
      setSelectedUser(user);
      setSelectedRoleIds([]);
      setError("");
      setEditOpen(true);
      setLoadingRoles(true);

      const userRoles = await getUserRoles(user.id, accessToken);

      setSelectedRoleIds(userRoles.map((role) => role.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load user roles",
      );
    } finally {
      setLoadingRoles(false);
    }
  };

  const closeEdit = () => {
    if (savingRoles) {
      return;
    }

    setEditOpen(false);
    setSelectedUser(null);
    setSelectedRoleIds([]);
    setError("");
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  };

  const saveRoles = async () => {
    if (!accessToken || !selectedUser) {
      return;
    }

    if (selectedRoleIds.length === 0) {
      setError("Select at least one role");
      return;
    }

    try {
      setSavingRoles(true);
      setError("");

      await updateUserRoles(selectedUser.id, selectedRoleIds, accessToken);

      closeEdit();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update roles");
    } finally {
      setSavingRoles(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Users</h1>

          <p className="text-xs text-muted-foreground">
            Manage system users and their roles.
          </p>
        </div>

        <PermissionGate permission="users.create">
        <Button
          type="button"
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </PermissionGate>
      </div>

      {error && !createOpen && !editOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserRound className="h-4 w-4 text-blue-600" />
              User List
            </CardTitle>

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="max-w-xs text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { value: "all", label: "All" },
                { value: "SYSTEM", label: "System" },
                { value: "STUDENT", label: "Student" },
                { value: "EMPLOYEE", label: "Employee" },
                { value: "GUARDIAN", label: "Guardian" },
                { value: "deactivated", label: "Deactivated" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Username</th>
                    <th className="px-4 py-3 text-left text-xs">Email</th>
                    <th className="px-4 py-3 text-left text-xs">Phone</th>
                    <th className="px-4 py-3 text-left text-xs">Type</th>
                    <th className="px-4 py-3 text-left text-xs">Status</th>
                    <th className="px-4 py-3 text-left text-xs">Roles</th>
                    <th className="px-4 py-3 text-right text-xs">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        accessToken={accessToken}
                        onEdit={openEdit}
                        onDeactivate={handleDeactivate}
                        onRestore={handleRestore}
                        isDeactivated={activeTab === "deactivated"}
                        isProcessing={
                          deletingId === user.id || restoringId === user.id
                        }
                        isSelf={user.id === authUser?.id}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Add User</CardTitle>

                  <p className="text-xs text-muted-foreground">
                    Create a standalone system user.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeCreate}
                  disabled={creating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} noValidate className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Username *
                  </label>

                  <Input
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: onlyUsername(
                          event.target.value,
                          LIMITS.USERNAME_MAX,
                        ),
                      }))
                    }
                    placeholder="Enter username"
                    maxLength={LIMITS.USERNAME_MAX}
                    disabled={creating}
                    className="text-xs"
                  />

                  {usernameStatus !== "idle" && (
                    <div
                      className={`mt-1 text-xs ${
                        usernameStatus === "taken"
                          ? "text-red-600"
                          : usernameStatus === "available"
                            ? "text-green-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {usernameStatus === "taken"
                        ? "Username is already taken"
                        : usernameStatus === "available"
                          ? "Username is available"
                          : "Checking availability..."}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Email *
                  </label>

                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        email: trimMax(
                          event.target.value,
                          LIMITS.EMAIL_MAX,
                        ),
                      }));
                      setEmailError("");
                    }}
                    onBlur={() =>
                      setEmailError(
                        form.email.trim()
                          ? validateEmail(form.email)
                          : "Email is required.",
                      )
                    }
                    placeholder="Enter email"
                    maxLength={LIMITS.EMAIL_MAX}
                    disabled={creating}
                    invalid={!!emailError}
                    className="text-xs"
                  />

                  {emailError && (
                    <p className="mt-1 text-xs text-red-600">{emailError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Phone *
                  </label>

                  <PhoneInput
                    value={form.phone}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        phone: value,
                      }));
                      setPhoneError("");
                    }}
                    onBlur={() =>
                      setPhoneError(
                        form.phone.trim()
                          ? validatePhone(form.phone)
                          : "Phone number is required.",
                      )
                    }
                    placeholder="Enter phone"
                    invalid={!!phoneError}
                    disabled={creating}
                    className="mt-0.5"
                  />

                  {phoneError && (
                    <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Password *
                  </label>

                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: trimMax(
                          event.target.value,
                          LIMITS.TEXT_MAX,
                        ),
                      }))
                    }
                    placeholder="Enter password"
                    maxLength={LIMITS.TEXT_MAX}
                    disabled={creating}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    User Type
                  </label>

                  <Input value="SYSTEM" disabled className="bg-muted text-xs" />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium">
                    Roles *
                  </label>

                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border p-2">
                    {roles.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No roles available.
                      </div>
                    ) : (
                      roles.map((role) => {
                        const checked = selectedRoleIds.includes(role.id);

                        return (
                          <label
                            key={role.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRole(role.id)}
                              disabled={creating}
                            />

                            <div className="flex-1">
                              <p className="text-xs font-semibold">
                                {role.name}
                              </p>

                              {role.description && (
                                <p className="text-[10px] text-muted-foreground">
                                  {role.description}
                                </p>
                              )}
                            </div>

                            {checked && (
                              <ShieldCheck className="h-4 w-4 text-blue-600" />
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeCreate}
                    disabled={creating}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      creating ||
                      roles.length === 0 ||
                      usernameStatus === "taken"
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {editOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Edit User Roles</CardTitle>

                  <p className="text-xs text-muted-foreground">
                    {selectedUser.username}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeEdit}
                  disabled={savingRoles}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {loadingRoles ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading roles...
                </div>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => {
                    const checked = selectedRoleIds.includes(role.id);

                    return (
                      <label
                        key={role.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(role.id)}
                          disabled={savingRoles}
                        />

                        <div className="flex-1">
                          <p className="text-xs font-semibold">{role.name}</p>

                          {role.description && (
                            <p className="text-[10px] text-muted-foreground">
                              {role.description}
                            </p>
                          )}
                        </div>

                        {checked && (
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEdit}
                  disabled={savingRoles}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={saveRoles}
                  disabled={savingRoles || loadingRoles}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {savingRoles ? "Saving..." : "Save Roles"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface UserTableRowProps {
  user: RbacUser;
  accessToken: string | null;
  isDeactivated: boolean;
  isProcessing: boolean;
  isSelf: boolean;
  onEdit: (user: RbacUser) => void;
  onDeactivate: (user: RbacUser) => void;
  onRestore: (user: RbacUser) => void;
}

function UserTableRow({
  user,
  accessToken,
  isDeactivated,
  isProcessing,
  isSelf,
  onEdit,
  onDeactivate,
  onRestore,
}: UserTableRowProps) {
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadRoles = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const result = await getUserRoles(user.id, accessToken);

        if (mounted) {
          setUserRoles(result);
        }
      } catch (error) {
        console.error("Failed to load user roles", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadRoles();

    return () => {
      mounted = false;
    };
  }, [user.id, accessToken]);

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{user.username}</span>
        </div>
      </td>

      <td className="px-4 py-3 text-muted-foreground">{user.email || "-"}</td>

      <td className="px-4 py-3 text-muted-foreground">{user.phone || "-"}</td>

      <td className="px-4 py-3">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium">
          {user.userType}
        </span>
      </td>

      <td className="px-4 py-3">
        {user.isLocked ? (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-medium text-red-700">
            Locked
          </span>
        ) : isDeactivated ? (
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-700">
            Deactivated
          </span>
        ) : user.isActive ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
            Inactive
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        {loading ? (
          <span className="text-xs text-muted-foreground">Loading...</span>
        ) : userRoles.length === 0 ? (
          <span className="text-xs text-muted-foreground">No roles</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {userRoles.map((role) => (
              <span
                key={role.id}
                className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700"
              >
                {role.name}
              </span>
            ))}
          </div>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        {isDeactivated ? (
          <PermissionGate permission="users.update">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRestore(user)}
              disabled={isProcessing}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              {isProcessing ? "Restoring..." : "Reactivate"}
            </Button>
          </PermissionGate>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <PermissionGate permission="users.update">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
                disabled={isProcessing}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </Button>
            </PermissionGate>

            <PermissionGate permission="users.delete">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDeactivate(user)}
                disabled={isProcessing || isSelf}
                title={
                  isSelf
                    ? "You cannot deactivate your own account"
                    : undefined
                }
              >
                <Power className="mr-2 h-3.5 w-3.5" />
                {isProcessing ? "Deactivating..." : "Deactivate"}
              </Button>
            </PermissionGate>
          </div>
        )}
      </td>
    </tr>
  );
}
