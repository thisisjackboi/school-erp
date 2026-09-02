import { API_BASE_URL } from "./config";
import type { PaginatedResponse, RbacUser, Role } from "../types/rbac";

export async function getUsers(
  page = 1,
  limit = 50,
  search?: string,
  accessToken?: string | null,
): Promise<PaginatedResponse<RbacUser>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) {
    params.set("search", search);
  }

  const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
    headers: {
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch users");
  }

  return result.data;
}

export async function createUser(
  payload: {
    username: string;
    email?: string;
    phone?: string;
    password: string;
    userType: "STUDENT" | "EMPLOYEE" | "GUARDIAN" | "SYSTEM";
  },
  accessToken?: string | null,
): Promise<RbacUser> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create user");
  }

  return result.data;
}

export async function getUserRoles(
  userId: string,
  accessToken?: string | null,
): Promise<Role[]> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/roles`, {
    headers: {
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch user roles");
  }

  return result.data;
}

export async function updateUserRoles(
  userId: string,
  roleIds: string[],
  accessToken?: string | null,
): Promise<{
  userId: string;
  roles: Role[];
}> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/roles`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    },
    body: JSON.stringify({
      roleIds,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update user roles");
  }

  return result.data;
}
