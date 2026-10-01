import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { Grade } from "../types/marks";

export interface CreateGradePayload {
  gradeName: string;
  minPercent: number;
  maxPercent: number;
  gradePoint?: number;
}

export interface UpdateGradePayload {
  gradeName?: string;
  minPercent?: number;
  maxPercent?: number;
  gradePoint?: number;
}

export async function getGrades(
  accessToken?: string | null
): Promise<Grade[]> {
  return apiData<Grade[]>(
    `${API_BASE_URL}/grades`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch grades",
  );
}

export async function getGrade(
  id: string,
  accessToken?: string | null
): Promise<Grade> {
  return apiData<Grade>(
    `${API_BASE_URL}/grades/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch grade",
  );
}

export async function createGrade(
  data: CreateGradePayload,
  accessToken?: string | null
): Promise<Grade> {
  return apiData<Grade>(
    `${API_BASE_URL}/grades`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create grade",
  );
}

export async function updateGrade(
  id: string,
  data: UpdateGradePayload,
  accessToken?: string | null
): Promise<Grade> {
  return apiData<Grade>(
    `${API_BASE_URL}/grades/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update grade",
  );
}

export async function deleteGrade(
  id: string,
  accessToken?: string | null
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/grades/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete grade",
  );
}
