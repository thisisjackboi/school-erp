import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type { AcademicSession } from "../types/academic-session";

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
  return apiData<AcademicSession[]>(
    `${API_BASE_URL}/academic-sessions`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch academic sessions",
  );
}

export async function createAcademicSession(
  data: CreateAcademicSessionPayload,
  accessToken?: string | null,
): Promise<AcademicSession> {
  return apiData<AcademicSession>(
    `${API_BASE_URL}/academic-sessions`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create academic session",
  );
}

export async function updateAcademicSession(
  id: string,
  data: UpdateAcademicSessionPayload,
  accessToken?: string | null,
): Promise<AcademicSession> {
  return apiData<AcademicSession>(
    `${API_BASE_URL}/academic-sessions/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update academic session",
  );
}

export async function setCurrentAcademicSession(
  id: string,
  accessToken?: string | null,
): Promise<AcademicSession> {
  return apiData<AcademicSession>(
    `${API_BASE_URL}/academic-sessions/${id}/set-current`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
    },
    "Failed to set current academic session",
  );
}
