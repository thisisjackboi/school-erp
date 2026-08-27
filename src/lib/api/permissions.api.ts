import { API_BASE_URL } from "./config";
import type {
  PaginatedResponse,
  Permission,
} from "../types/rbac";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

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

  const response = await fetch(
    `${API_BASE_URL}/permissions?${params.toString()}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch permissions",
    );
  }

  return result.data;
}

export async function createPermission(
  data: {
    code: string;
    module: string;
    description?: string;
  },
  accessToken?: string | null,
): Promise<Permission> {
  const response = await fetch(
    `${API_BASE_URL}/permissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(accessToken),
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to create permission",
    );
  }

  return result.data;
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
  const response = await fetch(
    `${API_BASE_URL}/permissions/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(accessToken),
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to update permission",
    );
  }

  return result.data;
}

export async function deletePermission(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/permissions/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to delete permission",
    );
  }
}