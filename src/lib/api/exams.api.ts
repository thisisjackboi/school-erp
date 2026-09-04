import { API_BASE_URL } from "./config";
import type { Exam, ExamStatus } from "../types/exam";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export interface GetExamsFilters {
  academicSessionId?: string;
  classId?: string;
  examTypeId?: string;
  status?: ExamStatus;
}

export interface CreateExamPayload {
  name: string;
  examTypeId: string;
  academicSessionId: string;
  classId: string;
  startDate: string;
  endDate: string;
  status?: ExamStatus;
}

export interface UpdateExamPayload {
  name?: string;
  examTypeId?: string;
  academicSessionId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
  status?: ExamStatus;
}

export async function getExams(
  filters?: GetExamsFilters,
  accessToken?: string | null
): Promise<Exam[]> {
  const query = new URLSearchParams();
  if (filters?.academicSessionId) query.append("academicSessionId", filters.academicSessionId);
  if (filters?.classId) query.append("classId", filters.classId);
  if (filters?.examTypeId) query.append("examTypeId", filters.examTypeId);
  if (filters?.status) query.append("status", filters.status);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/exams${queryString}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exams");
  }
  return result.data;
}

export async function getExam(
  id: string,
  accessToken?: string | null
): Promise<Exam> {
  const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exam");
  }
  return result.data;
}

export async function createExam(
  data: CreateExamPayload,
  accessToken?: string | null
): Promise<Exam> {
  const response = await fetch(`${API_BASE_URL}/exams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create exam");
  }
  return result.data;
}

export async function updateExam(
  id: string,
  data: UpdateExamPayload,
  accessToken?: string | null
): Promise<Exam> {
  const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update exam");
  }
  return result.data;
}

export async function deleteExam(
  id: string,
  accessToken?: string | null
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete exam");
  }
}
