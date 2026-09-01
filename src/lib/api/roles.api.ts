import { API_BASE_URL } from "./config";
import type { PaginatedResponse, Permission, Role } from "../types/rbac";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export async function getRoles(
  page = 1,
  limit = 50,
  accessToken?: string | null,
): Promise<PaginatedResponse<Role>> {
  const response = await fetch(
    `${API_BASE_URL}/roles?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch roles");
  }

  return result.data;
}

export async function getRolePermissions(
  roleId: string,
  accessToken?: string | null,
): Promise<Permission[]> {
  const response = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch role permissions");
  }

  return result.data;
}

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[],
  accessToken?: string | null,
): Promise<Role> {
  const response = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify({
      permissionIds,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update role permissions");
  }

  return result.data;
}

export async function createRole(
  data: {
    name: string;
    description?: string;
  },
  accessToken?: string | null,
): Promise<Role> {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create role");
  }

  return result.data;
}

export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
  },
  accessToken?: string | null,
): Promise<Role> {
  const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update role");
  }

  return result.data;
}

export async function deleteRole(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete role");
  }
}
