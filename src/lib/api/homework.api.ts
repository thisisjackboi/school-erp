import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type {
  CreateHomeworkPayload,
  Homework,
  HomeworkAssignmentOption,
  HomeworkListFilters,
  UpdateHomeworkPayload,
} from "../types/homework";
import type { PaginatedResponse } from "../types/rbac";

export async function getHomework(
  filters: HomeworkListFilters = {},
  accessToken?: string | null,
): Promise<PaginatedResponse<Homework>> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.academicSessionId) {
    params.set("academicSessionId", filters.academicSessionId);
  }

  if (filters.classId) {
    params.set("classId", filters.classId);
  }

  if (filters.sectionId) {
    params.set("sectionId", filters.sectionId);
  }

  if (filters.subjectId) {
    params.set("subjectId", filters.subjectId);
  }

  if (filters.teacherEmployeeId) {
    params.set("teacherEmployeeId", filters.teacherEmployeeId);
  }

  if (filters.isOverdue) {
    params.set("isOverdue", "true");
  }

  return apiData<PaginatedResponse<Homework>>(
    `${API_BASE_URL}/homework?${params.toString()}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch homework",
  );
}

/**
 * Cascading options for the assign form.
 *
 * The backend narrows this by role: a teacher only ever receives their own
 * assignments (so their subject list is exactly what they teach), while an
 * administrator may pass `subjectId` to get only the teachers actually assigned
 * to that subject in that section.
 */
export async function getHomeworkAssignmentOptions(
  params: { sectionId: string; subjectId?: string },
  accessToken?: string | null,
): Promise<HomeworkAssignmentOption[]> {
  const query = new URLSearchParams({ sectionId: params.sectionId });

  if (params.subjectId) {
    query.set("subjectId", params.subjectId);
  }

  return apiData<HomeworkAssignmentOption[]>(
    `${API_BASE_URL}/homework/assignment-options?${query.toString()}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch assignment options",
  );
}

export async function createHomework(
  data: CreateHomeworkPayload,
  accessToken?: string | null,
): Promise<Homework> {
  return apiData<Homework>(
    `${API_BASE_URL}/homework`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to assign homework",
  );
}

export async function updateHomework(
  id: string,
  data: UpdateHomeworkPayload,
  accessToken?: string | null,
): Promise<Homework> {
  return apiData<Homework>(
    `${API_BASE_URL}/homework/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update homework",
  );
}

export async function deleteHomework(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/homework/${id}`,
    { method: "DELETE", headers: authHeaders(accessToken) },
    "Failed to delete homework",
  );
}
