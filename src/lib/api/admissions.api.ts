import { API_BASE_URL } from "./config";
import { apiData, apiRequest, authHeaders, jsonHeaders } from "./request";

import type { Admission, AdmissionStatus } from "@/lib/types/admission";

export interface CreateAdmissionPayload {
  applicationNumber?: string;
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
  sectionId?: string;
  guardianName?: string;
  guardianPhone?: string;
  status?: AdmissionStatus;
}

export interface ConvertAdmissionPayload {
  sectionId: string;
  username: string;
  password: string;
  admissionNumber?: string;
  rollNumber?: string;
}

export async function getNextApplicationNumber(
  accessToken?: string | null,
): Promise<string> {
  const result = await apiRequest<{ applicationNumber: string }>(
    `${API_BASE_URL}/admissions/next-application-number`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch next application number",
  );

  return result.data.applicationNumber;
}

export async function getNextConversionNumbers(
  sectionId: string,
  academicSessionId: string,
  accessToken?: string | null,
): Promise<{ admissionNumber: string; rollNumber: string }> {
  const params = new URLSearchParams({ sectionId, academicSessionId });
  return apiData<{ admissionNumber: string; rollNumber: string }>(
    `${API_BASE_URL}/admissions/next-conversion-numbers?${params.toString()}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch conversion numbers",
  );
}

export async function getAdmissions(
  accessToken?: string | null,
): Promise<Admission[]> {
  return apiData<Admission[]>(
    `${API_BASE_URL}/admissions`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch admissions",
  );
}

export async function getAdmission(
  id: string,
  accessToken?: string | null,
): Promise<Admission> {
  return apiData<Admission>(
    `${API_BASE_URL}/admissions/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch admission",
  );
}

export async function createAdmission(
  data: CreateAdmissionPayload,
  accessToken?: string | null,
): Promise<Admission> {
  return apiData<Admission>(
    `${API_BASE_URL}/admissions`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create admission",
  );
}

export async function updateAdmission(
  id: string,
  data: UpdateAdmissionPayload,
  accessToken?: string | null,
): Promise<Admission> {
  return apiData<Admission>(
    `${API_BASE_URL}/admissions/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update admission",
  );
}

export async function updateAdmissionStatus(
  id: string,
  status: AdmissionStatus,
  accessToken?: string | null,
): Promise<Admission> {
  return apiData<Admission>(
    `${API_BASE_URL}/admissions/${id}/status`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        status,
      }),
    },
    "Failed to update admission status",
  );
}

export async function deleteAdmission(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/admissions/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete admission",
  );
}

export async function convertAdmission(
  id: string,
  data: ConvertAdmissionPayload,
  accessToken?: string | null,
): Promise<any> {
  return apiData<any>(
    `${API_BASE_URL}/admissions/${id}/convert`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to convert admission",
  );
}
