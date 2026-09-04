import { API_BASE_URL } from "./config";
import type { ExamSchedule } from "../types/exam";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export interface GetExamSchedulesFilters {
  examId?: string;
  subjectId?: string;
  examDate?: string;
}

export interface CreateExamSchedulePayload {
  examId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  room?: string;
}

export interface UpdateExamSchedulePayload {
  examId?: string;
  subjectId?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  maxMarks?: number;
  passingMarks?: number;
  room?: string;
}

export async function getExamSchedules(
  filters?: GetExamSchedulesFilters,
  accessToken?: string | null
): Promise<ExamSchedule[]> {
  const query = new URLSearchParams();
  if (filters?.examId) query.append("examId", filters.examId);
  if (filters?.subjectId) query.append("subjectId", filters.subjectId);
  if (filters?.examDate) query.append("examDate", filters.examDate);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/exam-schedules${queryString}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exam schedules");
  }
  return result.data;
}

export async function getExamSchedule(
  id: string,
  accessToken?: string | null
): Promise<ExamSchedule> {
  const response = await fetch(`${API_BASE_URL}/exam-schedules/${id}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch exam schedule");
  }
  return result.data;
}

export async function createExamSchedule(
  data: CreateExamSchedulePayload,
  accessToken?: string | null
): Promise<ExamSchedule> {
  const response = await fetch(`${API_BASE_URL}/exam-schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create exam schedule");
  }
  return result.data;
}

export async function updateExamSchedule(
  id: string,
  data: UpdateExamSchedulePayload,
  accessToken?: string | null
): Promise<ExamSchedule> {
  const response = await fetch(`${API_BASE_URL}/exam-schedules/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update exam schedule");
  }
  return result.data;
}

export async function deleteExamSchedule(
  id: string,
  accessToken?: string | null
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/exam-schedules/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete exam schedule");
  }
}
