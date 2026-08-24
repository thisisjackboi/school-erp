import { API_BASE_URL } from "./config";

import type { LoginRequest, LoginResponse } from "@/lib/types/auth";

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
