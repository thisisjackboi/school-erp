import { API_BASE_URL } from "./config";
import type { ExamResult, ResultStatus } from "../types/marks";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export interface GetExamResultsFilters {
  academicSessionId?: string;
  examId?: string;
  studentEnrollmentId?: string;
  gradeId?: string;
}

export interface CreateExamResultPayload {
  examId: string;
  studentEnrollmentId: string;
}

export interface UpdateExamResultPayload {
  resultStatus?: ResultStatus;
  rankInSection?: number;
}

export async function getExamResults(
  filters?: GetExamResultsFilters,
  accessToken?: string | null
): Promise<ExamResult[]> {
  const query = new URLSearchParams();
  if (filters?.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters?.examId) query.append("examId", filters.examId);
  if (filters?.studentEnrollmentId) query.append("studentEnrollmentId", filters.studentEnrollmentId);
  if (filters?.gradeId) query.append("gradeId", filters.gradeId);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/exam-results${queryString}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exam results");
  }
  return result.data;
}

export async function getExamResult(
  id: string,
  accessToken?: string | null
): Promise<ExamResult> {
  const response = await fetch(`${API_BASE_URL}/exam-results/${id}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exam result");
  }
  return result.data;
}

export async function createExamResult(
  data: CreateExamResultPayload,
  accessToken?: string | null
): Promise<ExamResult> {
  const response = await fetch(`${API_BASE_URL}/exam-results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create exam result");
  }
  return result.data;
}

export async function updateExamResult(
  id: string,
  data: UpdateExamResultPayload,
  accessToken?: string | null
): Promise<ExamResult> {
  const response = await fetch(`${API_BASE_URL}/exam-results/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update exam result");
  }
  return result.data;
}

export async function deleteExamResult(
  id: string,
  accessToken?: string | null
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/exam-results/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete exam result");
  }
}
