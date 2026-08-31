import { API_BASE_URL } from "./config";

import type { ClassSubject } from "../types/class-subject";

function getAuthHeaders(
  accessToken?: string | null,
) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export interface CreateClassSubjectPayload {
  classId: string;
  subjectId: string;
  academicSessionId: string;
  isOptional?: boolean;
}

export interface UpdateClassSubjectPayload {
  classId?: string;
  subjectId?: string;
  academicSessionId?: string;
  isOptional?: boolean;
}

export async function getClassSubjects(
  accessToken?: string | null,
): Promise<ClassSubject[]> {
  const response = await fetch(
    `${API_BASE_URL}/class-subjects`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch class-subject assignments",
    );
  }

  return result.data;
}

export async function getClassSubject(
  id: string,
  accessToken?: string | null,
): Promise<ClassSubject> {
  const response = await fetch(
    `${API_BASE_URL}/class-subjects/${id}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch class-subject assignment",
    );
  }

  return result.data;
}

export async function createClassSubject(
  data: CreateClassSubjectPayload,
  accessToken?: string | null,
): Promise<ClassSubject> {
  const response = await fetch(
    `${API_BASE_URL}/class-subjects`,
    {
      method: "POST",
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
      result.message ||
        "Failed to create class-subject assignment",
    );
  }

  return result.data;
}

export async function updateClassSubject(
  id: string,
  data: UpdateClassSubjectPayload,
  accessToken?: string | null,
): Promise<ClassSubject> {
  const response = await fetch(
    `${API_BASE_URL}/class-subjects/${id}`,
    {
      method: "PATCH",
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
      result.message ||
        "Failed to update class-subject assignment",
    );
  }

  return result.data;
}