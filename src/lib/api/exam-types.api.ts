import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { ExamType } from "../types/exam";

export interface CreateExamTypePayload {
  name: string;
  weightagePercent?: number;
}

export interface UpdateExamTypePayload {
  name?: string;
  weightagePercent?: number;
}

export async function getExamTypes(
  accessToken?: string | null
): Promise<ExamType[]> {
  return apiData<ExamType[]>(
    `${API_BASE_URL}/exam-types`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exam types",
  );
}

export async function getExamType(
  id: string,
  accessToken?: string | null
): Promise<ExamType> {
  return apiData<ExamType>(
    `${API_BASE_URL}/exam-types/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exam type",
  );
}

export async function createExamType(
  data: CreateExamTypePayload,
  accessToken?: string | null
): Promise<ExamType> {
  return apiData<ExamType>(
    `${API_BASE_URL}/exam-types`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create exam type",
  );
}

export async function updateExamType(
  id: string,
  data: UpdateExamTypePayload,
  accessToken?: string | null
): Promise<ExamType> {
  return apiData<ExamType>(
    `${API_BASE_URL}/exam-types/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update exam type",
  );
}

export async function deleteExamType(
  id: string,
  accessToken?: string | null
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/exam-types/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete exam type",
  );
}
