import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type {
  CreateNoticePayload,
  Notice,
  NoticeListFilters,
  UpdateNoticePayload,
} from "../types/notice";
import type { PaginatedResponse } from "../types/rbac";

export async function getNotices(
  filters: NoticeListFilters = {},
  accessToken?: string | null,
): Promise<PaginatedResponse<Notice>> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.audience) {
    params.set("audience", filters.audience);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  return apiData<PaginatedResponse<Notice>>(
    `${API_BASE_URL}/notices?${params.toString()}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch notices",
  );
}

export async function getNotice(
  id: string,
  accessToken?: string | null,
): Promise<Notice> {
  return apiData<Notice>(
    `${API_BASE_URL}/notices/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch notice",
  );
}

export async function createNotice(
  data: CreateNoticePayload,
  accessToken?: string | null,
): Promise<Notice> {
  return apiData<Notice>(
    `${API_BASE_URL}/notices`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create notice",
  );
}

export async function updateNotice(
  id: string,
  data: UpdateNoticePayload,
  accessToken?: string | null,
): Promise<Notice> {
  return apiData<Notice>(
    `${API_BASE_URL}/notices/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update notice",
  );
}

export async function deleteNotice(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/notices/${id}`,
    { method: "DELETE", headers: authHeaders(accessToken) },
    "Failed to delete notice",
  );
}
