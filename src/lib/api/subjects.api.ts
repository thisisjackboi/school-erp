import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type { Subject } from "../types/subject";

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
  return apiData<Subject[]>(
    `${API_BASE_URL}/subjects`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch subjects",
  );
}

export async function getSubject(
  id: string,
  accessToken?: string | null,
): Promise<Subject> {
  return apiData<Subject>(
    `${API_BASE_URL}/subjects/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch subject",
  );
}

export async function createSubject(
  data: CreateSubjectPayload,
  accessToken?: string | null,
): Promise<Subject> {
  return apiData<Subject>(
    `${API_BASE_URL}/subjects`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create subject",
  );
}

export async function updateSubject(
  id: string,
  data: UpdateSubjectPayload,
  accessToken?: string | null,
): Promise<Subject> {
  return apiData<Subject>(
    `${API_BASE_URL}/subjects/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update subject",
  );
}
