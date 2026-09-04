import { API_BASE_URL } from "./config";
import type {
  StudentAttendance,
  BulkStudentAttendancePayload,
  AttendanceType,
} from "@/lib/types/student-attendance";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

export interface GetAttendanceFilters {
  studentEnrollmentId?: string;
  attendanceDate?: string;
  attendanceType?: AttendanceType;
  timetableSlotId?: string;
  subjectId?: string;
  periodId?: string;
  sectionId?: string;
  classId?: string;
}

export async function getStudentAttendance(
  accessToken?: string | null,
  filters?: GetAttendanceFilters,
): Promise<StudentAttendance[]> {
  const params = new URLSearchParams();
  if (filters?.studentEnrollmentId)
    params.set("studentEnrollmentId", filters.studentEnrollmentId);
  if (filters?.attendanceDate)
    params.set("attendanceDate", filters.attendanceDate);
  if (filters?.attendanceType)
    params.set("attendanceType", filters.attendanceType);
  if (filters?.timetableSlotId)
    params.set("timetableSlotId", filters.timetableSlotId);
  if (filters?.subjectId) params.set("subjectId", filters.subjectId);
  if (filters?.periodId) params.set("periodId", filters.periodId);
  if (filters?.sectionId) params.set("sectionId", filters.sectionId);
  if (filters?.classId) params.set("classId", filters.classId);

  const qs = params.toString();
  const url = `${API_BASE_URL}/student-attendance${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch student attendance");
  }

  return result.data;
}

export async function bulkMarkStudentAttendance(
  payload: BulkStudentAttendancePayload,
  accessToken?: string | null,
): Promise<StudentAttendance[]> {
  const response = await fetch(`${API_BASE_URL}/student-attendance/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to save student attendance");
  }

  return result.data;
}
