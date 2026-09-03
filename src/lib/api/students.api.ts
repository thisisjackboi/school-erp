import { API_BASE_URL } from "./config";
import type { StudentRecord, Gender, StudentStatus } from "../types/student";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

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

  const response = await fetch(url, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch students");
  }

  return result.data;
}

export async function getStudent(
  id: string,
  accessToken?: string | null,
): Promise<StudentRecord> {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch student");
  }

  return result.data;
}

export async function createStudent(
  data: CreateStudentPayload,
  accessToken?: string | null,
): Promise<{ student: StudentRecord; user: any }> {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create student");
  }

  return result.data;
}

export async function updateStudent(
  id: string,
  data: UpdateStudentPayload,
  accessToken?: string | null,
): Promise<StudentRecord> {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update student");
  }

  return result.data;
}

export async function deleteStudent(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete student");
  }
}
