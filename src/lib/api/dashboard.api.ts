import { API_BASE_URL } from "./config";
import type {
  TeacherDashboard,
  DashboardTimetableResponse,
} from "../types/dashboard";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export async function getDashboard<T = TeacherDashboard>(
  accessToken?: string | null,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch dashboard");
  }

  return result.data as T;
}

export async function getDashboardTimetable(
  accessToken?: string | null,
  from?: string,
  to?: string,
): Promise<DashboardTimetableResponse> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const qs = params.toString();
  const url = `${API_BASE_URL}/dashboard/timetable${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch dashboard timetable");
  }

  return result.data;
}