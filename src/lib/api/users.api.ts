import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { PaginatedResponse, RbacUser, Role } from "../types/rbac";

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

  return apiData<PaginatedResponse<RbacUser>>(
    `${API_BASE_URL}/users?${params.toString()}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch users",
  );
}

export async function checkUsernameAvailability(
  username: string,
  accessToken?: string | null,
): Promise<{ available: boolean }> {
  const params = new URLSearchParams({ username });

  return apiData<{ available: boolean }>(
    `${API_BASE_URL}/users/check-username?${params.toString()}`,
    { headers: authHeaders(accessToken) },
    "Failed to check username",
  );
}

export async function createUser(
  data: CreateUserPayload,
  accessToken?: string | null,
): Promise<RbacUser> {
  return apiData<RbacUser>(
    `${API_BASE_URL}/users`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create user",
  );
}

export async function getUserRoles(
  userId: string,
  accessToken?: string | null,
): Promise<Role[]> {
  return apiData<Role[]>(
    `${API_BASE_URL}/users/${userId}/roles`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch user roles",
  );
}

export async function updateUserRoles(
  userId: string,
  roleIds: string[],
  accessToken?: string | null,
): Promise<{
  userId: string;
  roles: Role[];
}> {
  return apiData<{
    userId: string;
    roles: Role[];
  }>(
    `${API_BASE_URL}/users/${userId}/roles`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        roleIds,
      }),
    },
    "Failed to update user roles",
  );
}

export async function deleteUser(
  userId: string,
  accessToken?: string | null,
): Promise<{ message: string }> {
  return apiData<{ message: string }>(
    `${API_BASE_URL}/users/${userId}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to deactivate user",
  );
}

export async function restoreUser(
  userId: string,
  accessToken?: string | null,
): Promise<{ message: string }> {
  return apiData<{ message: string }>(
    `${API_BASE_URL}/users/${userId}/restore`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
    },
    "Failed to reactivate user",
  );
}
