import { API_BASE_URL } from "./config";

import type { Section } from "../types/section";

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

export interface CreateSectionPayload {
  classId: string;
  academicSessionId: string;
  name: string;
  capacity?: number;
  classTeacherEmployeeId?: string;
}

export interface UpdateSectionPayload {
  classId?: string;
  academicSessionId?: string;
  name?: string;
  capacity?: number;
  classTeacherEmployeeId?: string | null;
}

export async function getSections(
  accessToken?: string | null,
): Promise<Section[]> {
  const response = await fetch(
    `${API_BASE_URL}/sections`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch sections",
    );
  }

  return result.data;
}

export async function getSection(
  id: string,
  accessToken?: string | null,
): Promise<Section> {
  const response = await fetch(
    `${API_BASE_URL}/sections/${id}`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch section",
    );
  }

  return result.data;
}

export async function createSection(
  data: CreateSectionPayload,
  accessToken?: string | null,
): Promise<Section> {
  const response = await fetch(
    `${API_BASE_URL}/sections`,
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
        "Failed to create section",
    );
  }

  return result.data;
}

export async function updateSection(
  id: string,
  data: UpdateSectionPayload,
  accessToken?: string | null,
): Promise<Section> {
  const response = await fetch(
    `${API_BASE_URL}/sections/${id}`,
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
        "Failed to update section",
    );
  }

  return result.data;
}