import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { ExamSchedule } from "../types/exam";

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
  return apiData<ExamSchedule[]>(
    `${API_BASE_URL}/exam-schedules${queryString}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exam schedules",
  );
}

export async function getExamSchedule(
  id: string,
  accessToken?: string | null
): Promise<ExamSchedule> {
  return apiData<ExamSchedule>(
    `${API_BASE_URL}/exam-schedules/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exam schedule",
  );
}

export async function createExamSchedule(
  data: CreateExamSchedulePayload,
  accessToken?: string | null
): Promise<ExamSchedule> {
  return apiData<ExamSchedule>(
    `${API_BASE_URL}/exam-schedules`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create exam schedule",
  );
}

export async function updateExamSchedule(
  id: string,
  data: UpdateExamSchedulePayload,
  accessToken?: string | null
): Promise<ExamSchedule> {
  return apiData<ExamSchedule>(
    `${API_BASE_URL}/exam-schedules/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update exam schedule",
  );
}

export async function deleteExamSchedule(
  id: string,
  accessToken?: string | null
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/exam-schedules/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete exam schedule",
  );
}
