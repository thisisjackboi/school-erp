import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { PaginatedResponse, Permission, Role } from "../types/rbac";

export async function getRoles(
  page = 1,
  limit = 50,
  accessToken?: string | null,
): Promise<PaginatedResponse<Role>> {
  return apiData<PaginatedResponse<Role>>(
    `${API_BASE_URL}/roles?page=${page}&limit=${limit}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch roles",
  );
}

export async function getRolePermissions(
  roleId: string,
  accessToken?: string | null,
): Promise<Permission[]> {
  return apiData<Permission[]>(
    `${API_BASE_URL}/roles/${roleId}/permissions`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch role permissions",
  );
}

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[],
  accessToken?: string | null,
): Promise<Role> {
  return apiData<Role>(
    `${API_BASE_URL}/roles/${roleId}/permissions`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        permissionIds,
      }),
    },
    "Failed to update role permissions",
  );
}

export async function createRole(
  data: {
    name: string;
    description?: string;
  },
  accessToken?: string | null,
): Promise<Role> {
  return apiData<Role>(
    `${API_BASE_URL}/roles`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create role",
  );
}

export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
  },
  accessToken?: string | null,
): Promise<Role> {
  return apiData<Role>(
    `${API_BASE_URL}/roles/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update role",
  );
}

export async function deleteRole(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/roles/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete role",
  );
}
