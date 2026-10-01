import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type {
  TeacherSubjectAssignment,
  CreateTeacherSubjectAssignmentPayload,
  UpdateTeacherSubjectAssignmentPayload,
} from "@/lib/types/teacher-subject-assignment";

export async function getTeacherSubjectAssignments(
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment[]> {
  return apiData<TeacherSubjectAssignment[]>(
    `${API_BASE_URL}/teacher-subject-assignments`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch teacher subject assignments",
  );
}

export async function getTeacherSubjectAssignment(
  id: string,
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment> {
  return apiData<TeacherSubjectAssignment>(
    `${API_BASE_URL}/teacher-subject-assignments/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch teacher subject assignment",
  );
}

export async function createTeacherSubjectAssignment(
  data: CreateTeacherSubjectAssignmentPayload,
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment> {
  return apiData<TeacherSubjectAssignment>(
    `${API_BASE_URL}/teacher-subject-assignments`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create teacher subject assignment",
  );
}

export async function updateTeacherSubjectAssignment(
  id: string,
  data: UpdateTeacherSubjectAssignmentPayload,
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment> {
  return apiData<TeacherSubjectAssignment>(
    `${API_BASE_URL}/teacher-subject-assignments/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update teacher subject assignment",
  );
}

export async function deleteTeacherSubjectAssignment(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/teacher-subject-assignments/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete teacher subject assignment",
  );
}
