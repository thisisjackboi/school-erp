import { API_BASE_URL } from "./config";

import type { Designation } from "../types/designation";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

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
  const response = await fetch(`${API_BASE_URL}/designations`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch designations");
  }

  return result.data;
}

export async function getDesignation(
  id: string,
  accessToken?: string | null,
): Promise<Designation> {
  const response = await fetch(`${API_BASE_URL}/designations/${id}`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch designation");
  }

  return result.data;
}

export async function createDesignation(
  data: CreateDesignationPayload,
  accessToken?: string | null,
): Promise<Designation> {
  const response = await fetch(`${API_BASE_URL}/designations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create designation");
  }

  return result.data;
}

export async function updateDesignation(
  id: string,
  data: UpdateDesignationPayload,
  accessToken?: string | null,
): Promise<Designation> {
  const response = await fetch(`${API_BASE_URL}/designations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update designation");
  }

  return result.data;
}
