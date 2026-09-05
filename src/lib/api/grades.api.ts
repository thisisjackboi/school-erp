import { API_BASE_URL } from "./config";
import type { Grade } from "../types/marks";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

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
  const response = await fetch(`${API_BASE_URL}/grades`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch grades");
  }
  return result.data;
}

export async function getGrade(
  id: string,
  accessToken?: string | null
): Promise<Grade> {
  const response = await fetch(`${API_BASE_URL}/grades/${id}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch grade");
  }
  return result.data;
}

export async function createGrade(
  data: CreateGradePayload,
  accessToken?: string | null
): Promise<Grade> {
  const response = await fetch(`${API_BASE_URL}/grades`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create grade");
  }
  return result.data;
}

export async function updateGrade(
  id: string,
  data: UpdateGradePayload,
  accessToken?: string | null
): Promise<Grade> {
  const response = await fetch(`${API_BASE_URL}/grades/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update grade");
  }
  return result.data;
}

export async function deleteGrade(
  id: string,
  accessToken?: string | null
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/grades/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete grade");
  }
}
