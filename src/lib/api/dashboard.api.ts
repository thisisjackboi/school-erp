import { API_BASE_URL } from "./config";
import { apiData, authHeaders } from "./request";
import type {
  TeacherDashboard,
  DashboardTimetableResponse,
} from "../types/dashboard";

export async function getDashboard<T = TeacherDashboard>(
  accessToken?: string | null,
): Promise<T> {
  return apiData<T>(
    `${API_BASE_URL}/dashboard`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch dashboard",
  );
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

  return apiData<DashboardTimetableResponse>(
    url,
    { headers: authHeaders(accessToken) },
    "Failed to fetch dashboard timetable",
  );
}
