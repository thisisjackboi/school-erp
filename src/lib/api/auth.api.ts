import { API_BASE_URL } from "./config";
import { apiData, apiRequest, authHeaders } from "./request";

import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "@/lib/types/auth";

export async function getProfile(
  accessToken: string | null,
): Promise<AuthUser> {
  const result = await apiRequest<AuthUser>(
    `${API_BASE_URL}/auth/profile`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch profile",
  );

  return (result.data ?? result) as AuthUser;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse["data"]>(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    },
    "Login failed",
  );
}
