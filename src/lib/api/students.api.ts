import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type {
  StudentProfile,
  StudentRecord,
  Gender,
  StudentStatus,
} from "../types/student";

export interface CreateStudentPayload {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  admissionDate: string;
  photoUrl?: string;
  status?: StudentStatus;
}

export interface UpdateStudentPayload {
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: string;
  address?: string;
  admissionDate?: string;
  photoUrl?: string;
  status?: StudentStatus;
}

export async function getStudents(
  accessToken?: string | null,
  filters?: {
    academicSessionId?: string;
    classId?: string;
    sectionId?: string;
  },
): Promise<StudentRecord[]> {
  const params = new URLSearchParams();
  if (filters?.academicSessionId) params.set("academicSessionId", filters.academicSessionId);
  if (filters?.classId) params.set("classId", filters.classId);
  if (filters?.sectionId) params.set("sectionId", filters.sectionId);

  const qs = params.toString();
  const url = `${API_BASE_URL}/students${qs ? `?${qs}` : ""}`;

  return apiData<StudentRecord[]>(
    url,
    { headers: authHeaders(accessToken) },
    "Failed to fetch students",
  );
}

export async function getStudent(
  id: string,
  accessToken?: string | null,
): Promise<StudentProfile> {
  return apiData<StudentProfile>(
    `${API_BASE_URL}/students/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch student",
  );
}

export async function createStudent(
  data: CreateStudentPayload,
  accessToken?: string | null,
): Promise<{ student: StudentRecord; user: any }> {
  return apiData<{ student: StudentRecord; user: any }>(
    `${API_BASE_URL}/students`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create student",
  );
}

export async function updateStudent(
  id: string,
  data: UpdateStudentPayload,
  accessToken?: string | null,
): Promise<StudentRecord> {
  return apiData<StudentRecord>(
    `${API_BASE_URL}/students/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update student",
  );
}

export async function deleteStudent(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/students/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete student",
  );
}
