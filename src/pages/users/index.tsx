"use client";

import { useEffect, useState } from "react";
import { Pencil, ShieldCheck, UserPlus, UserRound, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/lib/auth/auth-context";
import {
  createUser,
  getUserRoles,
  getUsers,
  updateUserRoles,
} from "@/lib/api/users.api";
import { getRoles } from "@/lib/api/roles.api";

import type { RbacUser, Role } from "@/lib/types/rbac";

export default function UsersPage() {
  const { accessToken } = useAuth();

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

  const [selectedUser, setSelectedUser] = useState<RbacUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const loadData = async () => {
    if (!accessToken) {
      setError("Unauthorized");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [usersResponse, rolesResponse] = await Promise.all([
        getUsers(1, 100, undefined, accessToken),
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
  }, [accessToken]);

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

    if (!form.password) {
      setError("Password is required");
      return;
    }

    if (selectedRoleIds.length === 0) {
      setError("Select at least one role");
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

        <Button
          type="button"
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
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

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Username *
                  </label>

                  <Input
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    placeholder="Enter username"
                    disabled={creating}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Email
                  </label>

                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Enter email"
                    disabled={creating}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Phone
                  </label>

                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Enter phone"
                    disabled={creating}
                    className="text-xs"
                  />
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
                        password: event.target.value,
                      }))
                    }
                    placeholder="Enter password"
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
                    disabled={creating || roles.length === 0}
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
  onEdit: (user: RbacUser) => void;
}

function UserTableRow({ user, accessToken, onEdit }: UserTableRowProps) {
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(user)}
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
      </td>
    </tr>
  );
}
