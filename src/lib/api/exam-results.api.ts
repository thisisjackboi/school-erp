import { API_BASE_URL } from "./config";
import { apiData, apiRequest, authHeaders, jsonHeaders } from "./request";
import type { ExamResult, ResultStatus } from "../types/marks";

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

function toExamResult(raw: ExamResult): ExamResult {
  return {
    ...raw,
    percentage: Number(raw.percentage),
    totalMarksObtained: Number(raw.totalMarksObtained),
    totalMaxMarks: Number(raw.totalMaxMarks),
    rankInSection:
      raw.rankInSection == null ? null : Number(raw.rankInSection),
  };
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
  const result = await apiRequest<ExamResult[]>(
    `${API_BASE_URL}/exam-results${queryString}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exam results",
  );

  return result.data.map(toExamResult);
}

export async function getExamResult(
  id: string,
  accessToken?: string | null
): Promise<ExamResult> {
  const result = await apiRequest<ExamResult>(
    `${API_BASE_URL}/exam-results/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch exam result",
  );

  return toExamResult(result.data);
}

export async function createExamResult(
  data: CreateExamResultPayload,
  accessToken?: string | null
): Promise<ExamResult> {
  return apiData<ExamResult>(
    `${API_BASE_URL}/exam-results`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create exam result",
  );
}

export async function updateExamResult(
  id: string,
  data: UpdateExamResultPayload,
  accessToken?: string | null
): Promise<ExamResult> {
  return apiData<ExamResult>(
    `${API_BASE_URL}/exam-results/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update exam result",
  );
}

export async function deleteExamResult(
  id: string,
  accessToken?: string | null
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/exam-results/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete exam result",
  );
}

export async function deleteExamResults(
  results: ExamResult[],
  accessToken?: string | null
): Promise<{ deleted: number; failed: string[] }> {
  let deleted = 0;
  const failed: string[] = [];
  for (const r of results) {
    try {
      await deleteExamResult(r.id, accessToken);
      deleted++;
    } catch {
      failed.push(r.studentEnrollmentId);
    }
  }
  return { deleted, failed };
}
