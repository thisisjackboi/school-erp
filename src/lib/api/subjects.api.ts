import { API_BASE_URL } from "./config";

import type { Subject } from "../types/subject";

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

export interface CreateSubjectPayload {
  name: string;
  code: string;
  isElective?: boolean;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  isElective?: boolean;
}

export async function getSubjects(
  accessToken?: string | null,
): Promise<Subject[]> {
  const response = await fetch(
    `${API_BASE_URL}/subjects`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch subjects",
    );
  }

  return result.data;
}

export async function getSubject(
  id: string,
  accessToken?: string | null,
): Promise<Subject> {
  const response = await fetch(
    `${API_BASE_URL}/subjects/${id}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch subject",
    );
  }

  return result.data;
}

export async function createSubject(
  data: CreateSubjectPayload,
  accessToken?: string | null,
): Promise<Subject> {
  const response = await fetch(
    `${API_BASE_URL}/subjects`,
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
        "Failed to create subject",
    );
  }

  return result.data;
}

export async function updateSubject(
  id: string,
  data: UpdateSubjectPayload,
  accessToken?: string | null,
): Promise<Subject> {
  const response = await fetch(
    `${API_BASE_URL}/subjects/${id}`,
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
        "Failed to update subject",
    );
  }

  return result.data;
}