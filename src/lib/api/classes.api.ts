import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type {
  SchoolClass,
} from "../types/class";

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
  return apiData<SchoolClass[]>(
    `${API_BASE_URL}/classes`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch classes",
  );
}

export async function createClass(
  data: CreateClassPayload,
  accessToken?: string | null,
): Promise<SchoolClass> {
  return apiData<SchoolClass>(
    `${API_BASE_URL}/classes`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create class",
  );
}

export async function updateClass(
  id: string,
  data: UpdateClassPayload,
  accessToken?: string | null,
): Promise<SchoolClass> {
  return apiData<SchoolClass>(
    `${API_BASE_URL}/classes/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update class",
  );
}
