import { API_BASE_URL } from "./config";

import type { AcademicSession } from "../types/academic-session";

function getAuthHeaders(
  accessToken?: string | null,
) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export interface CreateAcademicSessionPayload {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface UpdateAcademicSessionPayload {
  name?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

export async function getAcademicSessions(
  accessToken?: string | null,
): Promise<AcademicSession[]> {
  const response = await fetch(
    `${API_BASE_URL}/academic-sessions`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch academic sessions",
    );
  }

  return result.data;
}

export async function createAcademicSession(
  data: CreateAcademicSessionPayload,
  accessToken?: string | null,
): Promise<AcademicSession> {
  const response = await fetch(
    `${API_BASE_URL}/academic-sessions`,
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
      result.message ||
        "Failed to create academic session",
    );
  }

  return result.data;
}

export async function updateAcademicSession(
  id: string,
  data: UpdateAcademicSessionPayload,
  accessToken?: string | null,
): Promise<AcademicSession> {
  const response = await fetch(
    `${API_BASE_URL}/academic-sessions/${id}`,
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
      result.message ||
        "Failed to update academic session",
    );
  }

  return result.data;
}

export async function setCurrentAcademicSession(
  id: string,
  accessToken?: string | null,
): Promise<AcademicSession> {
  const response = await fetch(
    `${API_BASE_URL}/academic-sessions/${id}/set-current`,
    {
      method: "PATCH",
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to set current academic session",
    );
  }

  return result.data;
}