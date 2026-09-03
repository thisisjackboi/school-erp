import { API_BASE_URL } from "./config";
import type { Period, TimetableSlot } from "../types/timetable";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

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
  const response = await fetch(`${API_BASE_URL}/timetable/periods`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch timetable periods");
  }

  return result.data;
}

export async function createPeriod(
  data: CreatePeriodPayload,
  accessToken?: string | null,
): Promise<Period> {
  const response = await fetch(`${API_BASE_URL}/timetable/periods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create period");
  }

  return result.data;
}

export async function updatePeriod(
  id: string,
  data: UpdatePeriodPayload,
  accessToken?: string | null,
): Promise<Period> {
  const response = await fetch(`${API_BASE_URL}/timetable/periods/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update period");
  }

  return result.data;
}

export async function deletePeriod(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/timetable/periods/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete period");
  }
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

  const response = await fetch(url, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch timetable slots");
  }

  return result.data;
}

export async function createTimetableSlot(
  data: CreateTimetableSlotPayload,
  accessToken?: string | null,
): Promise<TimetableSlot> {
  const response = await fetch(`${API_BASE_URL}/timetable/slots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create timetable slot");
  }

  return result.data;
}

export async function updateTimetableSlot(
  id: string,
  data: UpdateTimetableSlotPayload,
  accessToken?: string | null,
): Promise<TimetableSlot> {
  const response = await fetch(`${API_BASE_URL}/timetable/slots/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update timetable slot");
  }

  return result.data;
}

export async function deleteTimetableSlot(
  id: string,
  accessToken?: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/timetable/slots/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete timetable slot");
  }
}
