import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type { Section } from "../types/section";

export interface CreateSectionPayload {
  classId: string;
  academicSessionId: string;
  name: string;
  capacity?: number;
  classTeacherEmployeeId?: string;
}

export interface UpdateSectionPayload {
  classId?: string;
  academicSessionId?: string;
  name?: string;
  capacity?: number;
  classTeacherEmployeeId?: string | null;
}

export async function getSections(
  accessToken?: string | null,
): Promise<Section[]> {
  return apiData<Section[]>(
    `${API_BASE_URL}/sections`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch sections",
  );
}

export async function getSection(
  id: string,
  accessToken?: string | null,
): Promise<Section> {
  return apiData<Section>(
    `${API_BASE_URL}/sections/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch section",
  );
}

export async function createSection(
  data: CreateSectionPayload,
  accessToken?: string | null,
): Promise<Section> {
  return apiData<Section>(
    `${API_BASE_URL}/sections`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create section",
  );
}

export async function updateSection(
  id: string,
  data: UpdateSectionPayload,
  accessToken?: string | null,
): Promise<Section> {
  return apiData<Section>(
    `${API_BASE_URL}/sections/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update section",
  );
}
