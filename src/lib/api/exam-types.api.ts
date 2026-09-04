import { API_BASE_URL } from "./config";
import type { ExamType } from "../types/exam";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

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
  const response = await fetch(`${API_BASE_URL}/exam-types`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exam types");
  }
  return result.data;
}

export async function getExamType(
  id: string,
  accessToken?: string | null
): Promise<ExamType> {
  const response = await fetch(`${API_BASE_URL}/exam-types/${id}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exam type");
  }
  return result.data;
}

export async function createExamType(
  data: CreateExamTypePayload,
  accessToken?: string | null
): Promise<ExamType> {
  const response = await fetch(`${API_BASE_URL}/exam-types`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create exam type");
  }
  return result.data;
}

export async function updateExamType(
  id: string,
  data: UpdateExamTypePayload,
  accessToken?: string | null
): Promise<ExamType> {
  const response = await fetch(`${API_BASE_URL}/exam-types/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update exam type");
  }
  return result.data;
}

export async function deleteExamType(
  id: string,
  accessToken?: string | null
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/exam-types/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete exam type");
  }
}
