import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type { ClassSubject } from "../types/class-subject";

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
  return apiData<ClassSubject[]>(
    `${API_BASE_URL}/class-subjects`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch class-subject assignments",
  );
}

export async function getClassSubject(
  id: string,
  accessToken?: string | null,
): Promise<ClassSubject> {
  return apiData<ClassSubject>(
    `${API_BASE_URL}/class-subjects/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch class-subject assignment",
  );
}

export async function createClassSubject(
  data: CreateClassSubjectPayload,
  accessToken?: string | null,
): Promise<ClassSubject> {
  return apiData<ClassSubject>(
    `${API_BASE_URL}/class-subjects`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create class-subject assignment",
  );
}

export async function updateClassSubject(
  id: string,
  data: UpdateClassSubjectPayload,
  accessToken?: string | null,
): Promise<ClassSubject> {
  return apiData<ClassSubject>(
    `${API_BASE_URL}/class-subjects/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update class-subject assignment",
  );
}
