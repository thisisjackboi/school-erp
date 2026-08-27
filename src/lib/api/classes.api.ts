import { API_BASE_URL } from "./config";

import type {
  SchoolClass,
} from "../types/class";

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

export interface CreateClassPayload {
  name: string;
  displayOrder: number;
}

export interface UpdateClassPayload {
  name?: string;
  displayOrder?: number;
}

export async function getClasses(
  accessToken?: string | null,
): Promise<SchoolClass[]> {
  const response = await fetch(
    `${API_BASE_URL}/classes`,
    {
      headers: getAuthHeaders(accessToken),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch classes",
    );
  }

  return result.data;
}

export async function createClass(
  data: CreateClassPayload,
  accessToken?: string | null,
): Promise<SchoolClass> {
  const response = await fetch(
    `${API_BASE_URL}/classes`,
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
        "Failed to create class",
    );
  }

  return result.data;
}

export async function updateClass(
  id: string,
  data: UpdateClassPayload,
  accessToken?: string | null,
): Promise<SchoolClass> {
  const response = await fetch(
    `${API_BASE_URL}/classes/${id}`,
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
        "Failed to update class",
    );
  }

  return result.data;
}