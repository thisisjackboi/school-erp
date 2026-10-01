import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { Mark } from "../types/marks";

export interface GetMarksFilters {
  examScheduleId?: string;
  studentEnrollmentId?: string;
  examId?: string;
  subjectId?: string;
}

export interface CreateMarkPayload {
  examScheduleId: string;
  studentEnrollmentId: string;
  marksObtained: number;
  isAbsent?: boolean;
  enteredByEmployeeId?: string;
}

export interface UpdateMarkPayload {
  examScheduleId?: string;
  studentEnrollmentId?: string;
  marksObtained?: number;
  isAbsent?: boolean;
  enteredByEmployeeId?: string;
}

export interface BulkCreateMarkPayload {
  examScheduleId: string;
  records: {
    studentEnrollmentId: string;
    marksObtained: number;
    isAbsent?: boolean;
    enteredByEmployeeId?: string;
  }[];
}

export async function getMarks(
  filters?: GetMarksFilters,
  accessToken?: string | null
): Promise<Mark[]> {
  const query = new URLSearchParams();
  if (filters?.examScheduleId) query.append("examScheduleId", filters.examScheduleId);
  if (filters?.studentEnrollmentId) query.append("studentEnrollmentId", filters.studentEnrollmentId);
  if (filters?.examId) query.append("examId", filters.examId);
  if (filters?.subjectId) query.append("subjectId", filters.subjectId);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiData<Mark[]>(
    `${API_BASE_URL}/marks${queryString}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch marks",
  );
}

export async function getMark(
  id: string,
  accessToken?: string | null
): Promise<Mark> {
  return apiData<Mark>(
    `${API_BASE_URL}/marks/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch mark",
  );
}

export async function createMark(
  data: CreateMarkPayload,
  accessToken?: string | null
): Promise<Mark> {
  return apiData<Mark>(
    `${API_BASE_URL}/marks`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create mark",
  );
}

export async function bulkCreateMarks(
  data: BulkCreateMarkPayload,
  accessToken?: string | null
): Promise<Mark[]> {
  return apiData<Mark[]>(
    `${API_BASE_URL}/marks/bulk`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to bulk create marks",
  );
}

export async function updateMark(
  id: string,
  data: UpdateMarkPayload,
  accessToken?: string | null
): Promise<Mark> {
  return apiData<Mark>(
    `${API_BASE_URL}/marks/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update mark",
  );
}

export async function deleteMark(
  id: string,
  accessToken?: string | null
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/marks/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete mark",
  );
}

export async function deleteMarks(
  marks: Mark[],
  accessToken?: string | null
): Promise<{ deleted: number; failed: string[] }> {
  let deleted = 0;
  const failed: string[] = [];
  for (const m of marks) {
    try {
      await deleteMark(m.id, accessToken);
      deleted++;
    } catch {
      failed.push(m.id);
    }
  }
  return { deleted, failed };
}
