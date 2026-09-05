import { API_BASE_URL } from "./config";
import type { Mark } from "../types/marks";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

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
  const response = await fetch(`${API_BASE_URL}/marks${queryString}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch marks");
  }
  return result.data;
}

export async function getMark(
  id: string,
  accessToken?: string | null
): Promise<Mark> {
  const response = await fetch(`${API_BASE_URL}/marks/${id}`, {
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch mark");
  }
  return result.data;
}

export async function createMark(
  data: CreateMarkPayload,
  accessToken?: string | null
): Promise<Mark> {
  const response = await fetch(`${API_BASE_URL}/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create mark");
  }
  return result.data;
}

export async function bulkCreateMarks(
  data: BulkCreateMarkPayload,
  accessToken?: string | null
): Promise<Mark[]> {
  const response = await fetch(`${API_BASE_URL}/marks/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to bulk create marks");
  }
  return result.data;
}

export async function updateMark(
  id: string,
  data: UpdateMarkPayload,
  accessToken?: string | null
): Promise<Mark> {
  const response = await fetch(`${API_BASE_URL}/marks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update mark");
  }
  return result.data;
}

export async function deleteMark(
  id: string,
  accessToken?: string | null
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/marks/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete mark");
  }
}
