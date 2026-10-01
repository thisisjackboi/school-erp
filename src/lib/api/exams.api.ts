import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { Exam, ExamStatus } from "../types/exam";

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
  return apiData<Exam[]>(
    `${API_BASE_URL}/exams${queryString}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exams",
  );
}

export async function getExam(
  id: string,
  accessToken?: string | null
): Promise<Exam> {
  return apiData<Exam>(
    `${API_BASE_URL}/exams/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exam",
  );
}

export async function createExam(
  data: CreateExamPayload,
  accessToken?: string | null
): Promise<Exam> {
  return apiData<Exam>(
    `${API_BASE_URL}/exams`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create exam",
  );
}

export async function updateExam(
  id: string,
  data: UpdateExamPayload,
  accessToken?: string | null
): Promise<Exam> {
  return apiData<Exam>(
    `${API_BASE_URL}/exams/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update exam",
  );
}

export async function deleteExam(
  id: string,
  accessToken?: string | null
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/exams/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete exam",
  );
}
