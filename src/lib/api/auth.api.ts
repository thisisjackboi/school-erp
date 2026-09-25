import { API_BASE_URL } from "./config";

import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "@/lib/types/auth";

export async function getProfile(
  accessToken: string | null,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: {
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch profile",
    );
  }

  return result.data ?? result;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Login failed",
    );
  }

  return result;
}
