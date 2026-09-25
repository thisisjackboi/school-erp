import { API_BASE_URL } from "./config";
import type { PaginatedResponse, RbacUser, Role } from "../types/rbac";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export type UserType = "SYSTEM" | "EMPLOYEE" | "STUDENT" | "GUARDIAN";

export type UserStatus = "active" | "deactivated";

export interface CreateUserPayload {
  username: string;
  email?: string;
  phone?: string;
  password: string;
  userType: UserType;
}

export async function getUsers(
  page = 1,
  limit = 50,
  search?: string,
  userType?: UserType,
  status?: UserStatus,
  accessToken?: string | null,
): Promise<PaginatedResponse<RbacUser>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) {
    params.set("search", search);
  }

  if (userType) {
    params.set("userType", userType);
  }

  if (status) {
    params.set("status", status);
  }

  const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch users");
  }

  return result.data;
}

export async function checkUsernameAvailability(
  username: string,
  accessToken?: string | null,
): Promise<{ available: boolean }> {
  const params = new URLSearchParams({ username });

  const response = await fetch(
    `${API_BASE_URL}/users/check-username?${params.toString()}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to check username");
  }

  return result.data;
}

export async function createUser(
  data: CreateUserPayload,
  accessToken?: string | null,
): Promise<RbacUser> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
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
    headers: getAuthHeaders(accessToken),
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
      ...getAuthHeaders(accessToken),
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

export async function deleteUser(
  userId: string,
  accessToken?: string | null,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to deactivate user");
  }

  return result.data;
}

export async function restoreUser(
  userId: string,
  accessToken?: string | null,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/restore`, {
    method: "PATCH",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to reactivate user");
  }

  return result.data;
}
