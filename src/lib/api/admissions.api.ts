import { API_BASE_URL } from "./config";

import type { Admission, AdmissionStatus } from "@/lib/types/admission";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export interface CreateAdmissionPayload {
  applicationNumber: string;
  applicantFirstName: string;
  applicantLastName: string;
  dateOfBirth: string;
  gender: string;
  applyingForClassId: string;
  academicSessionId: string;
  guardianName: string;
  guardianPhone: string;
}

export interface UpdateAdmissionPayload {
  applicantFirstName?: string;
  applicantLastName?: string;
  dateOfBirth?: string;
  gender?: string;
  applyingForClassId?: string;
  academicSessionId?: string;
  guardianName?: string;
  guardianPhone?: string;
  status?: AdmissionStatus;
}

export interface ConvertAdmissionPayload {
  sectionId: string;
  username: string;
  password: string;
}

export async function getAdmissions(
  accessToken?: string | null,
): Promise<Admission[]> {
  const response = await fetch(`${API_BASE_URL}/admissions`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch admissions");
  }

  return result.data;
}

export async function getAdmission(
  id: string,
  accessToken?: string | null,
): Promise<Admission> {
  const response = await fetch(`${API_BASE_URL}/admissions/${id}`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch admission");
  }

  return result.data;
}

export async function createAdmission(
  data: CreateAdmissionPayload,
  accessToken?: string | null,
): Promise<Admission> {
  const response = await fetch(`${API_BASE_URL}/admissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create admission");
  }

  return result.data;
}

export async function updateAdmission(
  id: string,
  data: UpdateAdmissionPayload,
  accessToken?: string | null,
): Promise<Admission> {
  const response = await fetch(`${API_BASE_URL}/admissions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update admission");
  }

  return result.data;
}

export async function updateAdmissionStatus(
  id: string,
  status: AdmissionStatus,
  accessToken?: string | null,
): Promise<Admission> {
  const response = await fetch(`${API_BASE_URL}/admissions/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify({
      status,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update admission status");
  }

  return result.data;
}

export async function deleteAdmission(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admissions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete admission");
  }
}

export async function convertAdmission(
  id: string,
  data: ConvertAdmissionPayload,
  accessToken?: string | null,
) {
  const response = await fetch(`${API_BASE_URL}/admissions/${id}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to convert admission");
  }

  return result.data;
}
