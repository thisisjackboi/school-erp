import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type { Period, TimetableSlot } from "../types/timetable";

export interface CreatePeriodPayload {
  name: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
}

export interface UpdatePeriodPayload {
  name?: string;
  startTime?: string;
  endTime?: string;
  sortOrder?: number;
}

export interface CreateTimetableSlotPayload {
  teacherSubjectAssignmentId: string;
  periodId: string;
  dayOfWeek: number;
  room?: string;
}

export interface UpdateTimetableSlotPayload {
  teacherSubjectAssignmentId?: string;
  periodId?: string;
  dayOfWeek?: number;
  room?: string;
}

// =====================================================
// PERIODS API
// =====================================================

export async function getPeriods(
  accessToken?: string | null,
): Promise<Period[]> {
  return apiData<Period[]>(
    `${API_BASE_URL}/timetable/periods`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch timetable periods",
  );
}

export async function createPeriod(
  data: CreatePeriodPayload,
  accessToken?: string | null,
): Promise<Period> {
  return apiData<Period>(
    `${API_BASE_URL}/timetable/periods`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create period",
  );
}

export async function updatePeriod(
  id: string,
  data: UpdatePeriodPayload,
  accessToken?: string | null,
): Promise<Period> {
  return apiData<Period>(
    `${API_BASE_URL}/timetable/periods/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update period",
  );
}

export async function deletePeriod(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/timetable/periods/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete period",
  );
}

// =====================================================
// TIMETABLE SLOTS API
// =====================================================

export async function getTimetableSlots(
  accessToken?: string | null,
  filters?: {
    periodId?: string;
    teacherSubjectAssignmentId?: string;
    dayOfWeek?: number;
    sectionId?: string;
    academicSessionId?: string;
  },
): Promise<TimetableSlot[]> {
  const params = new URLSearchParams();
  if (filters?.periodId) params.set("periodId", filters.periodId);
  if (filters?.teacherSubjectAssignmentId)
    params.set("teacherSubjectAssignmentId", filters.teacherSubjectAssignmentId);
  if (filters?.sectionId) params.set("sectionId", filters.sectionId);
  if (filters?.academicSessionId)
    params.set("academicSessionId", filters.academicSessionId);
  if (filters?.dayOfWeek !== undefined)
    params.set("dayOfWeek", filters.dayOfWeek.toString());

  const qs = params.toString();
  const url = `${API_BASE_URL}/timetable/slots${qs ? `?${qs}` : ""}`;

  return apiData<TimetableSlot[]>(
    url,
    { headers: authHeaders(accessToken) },
    "Failed to fetch timetable slots",
  );
}

export async function createTimetableSlot(
  data: CreateTimetableSlotPayload,
  accessToken?: string | null,
): Promise<TimetableSlot> {
  return apiData<TimetableSlot>(
    `${API_BASE_URL}/timetable/slots`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create timetable slot",
  );
}

export async function updateTimetableSlot(
  id: string,
  data: UpdateTimetableSlotPayload,
  accessToken?: string | null,
): Promise<TimetableSlot> {
  return apiData<TimetableSlot>(
    `${API_BASE_URL}/timetable/slots/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update timetable slot",
  );
}

export async function deleteTimetableSlot(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  await apiData<unknown>(
    `${API_BASE_URL}/timetable/slots/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete timetable slot",
  );
}
