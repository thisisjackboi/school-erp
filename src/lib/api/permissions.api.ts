import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type {
  PaginatedResponse,
  Permission,
} from "../types/rbac";

export async function getPermissions(
  page = 1,
  limit = 100,
  search?: string,
  module?: string,
  accessToken?: string | null,
): Promise<PaginatedResponse<Permission>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) {
    params.set("search", search);
  }

  if (module) {
    params.set("module", module);
  }

  return apiData<PaginatedResponse<Permission>>(
    `${API_BASE_URL}/permissions?${params.toString()}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch permissions",
  );
}

export async function createPermission(
  data: {
    code: string;
    module: string;
    description?: string;
  },
  accessToken?: string | null,
): Promise<Permission> {
  return apiData<Permission>(
    `${API_BASE_URL}/permissions`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create permission",
  );
}

export async function updatePermission(
  id: string,
  data: {
    code?: string;
    module?: string;
    description?: string;
  },
  accessToken?: string | null,
): Promise<Permission> {
  return apiData<Permission>(
    `${API_BASE_URL}/permissions/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update permission",
  );
}

export async function deletePermission(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/permissions/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete permission",
  );
}
