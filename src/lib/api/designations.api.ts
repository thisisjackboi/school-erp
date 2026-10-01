import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type { Designation } from "../types/designation";

export interface CreateDesignationPayload {
  title: string;
  category: "TEACHING" | "ADMINISTRATIVE" | "SUPPORT";
}

export interface UpdateDesignationPayload {
  title?: string;
  category?: "TEACHING" | "ADMINISTRATIVE" | "SUPPORT";
}

export async function getDesignations(
  accessToken?: string | null,
): Promise<Designation[]> {
  return apiData<Designation[]>(
    `${API_BASE_URL}/designations`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch designations",
  );
}

export async function getDesignation(
  id: string,
  accessToken?: string | null,
): Promise<Designation> {
  return apiData<Designation>(
    `${API_BASE_URL}/designations/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch designation",
  );
}

export async function createDesignation(
  data: CreateDesignationPayload,
  accessToken?: string | null,
): Promise<Designation> {
  return apiData<Designation>(
    `${API_BASE_URL}/designations`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create designation",
  );
}

export async function updateDesignation(
  id: string,
  data: UpdateDesignationPayload,
  accessToken?: string | null,
): Promise<Designation> {
  return apiData<Designation>(
    `${API_BASE_URL}/designations/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update designation",
  );
}
