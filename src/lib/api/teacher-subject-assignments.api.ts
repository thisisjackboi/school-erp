import { API_BASE_URL } from "./config";
import type {
  TeacherSubjectAssignment,
  CreateTeacherSubjectAssignmentPayload,
  UpdateTeacherSubjectAssignmentPayload,
} from "@/lib/types/teacher-subject-assignment";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export async function getTeacherSubjectAssignments(
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment[]> {
  const response = await fetch(`${API_BASE_URL}/teacher-subject-assignments`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch teacher subject assignments",
    );
  }

  return result.data;
}

export async function getTeacherSubjectAssignment(
  id: string,
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment> {
  const response = await fetch(
    `${API_BASE_URL}/teacher-subject-assignments/${id}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch teacher subject assignment",
    );
  }

  return result.data;
}

export async function createTeacherSubjectAssignment(
  data: CreateTeacherSubjectAssignmentPayload,
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment> {
  const response = await fetch(`${API_BASE_URL}/teacher-subject-assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to create teacher subject assignment",
    );
  }

  return result.data;
}

export async function updateTeacherSubjectAssignment(
  id: string,
  data: UpdateTeacherSubjectAssignmentPayload,
  accessToken?: string | null,
): Promise<TeacherSubjectAssignment> {
  const response = await fetch(
    `${API_BASE_URL}/teacher-subject-assignments/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(accessToken),
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to update teacher subject assignment",
    );
  }

  return result.data;
}

export async function deleteTeacherSubjectAssignment(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/teacher-subject-assignments/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to delete teacher subject assignment",
    );
  }
}
