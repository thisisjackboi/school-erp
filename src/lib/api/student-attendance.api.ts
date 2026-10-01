import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type {
  StudentAttendance,
  BulkStudentAttendancePayload,
  AttendanceType,
} from "@/lib/types/student-attendance";

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

  return apiData<StudentAttendance[]>(
    url,
    { headers: authHeaders(accessToken) },
    "Failed to fetch student attendance",
  );
}

export async function bulkMarkStudentAttendance(
  payload: BulkStudentAttendancePayload,
  accessToken?: string | null,
): Promise<StudentAttendance[]> {
  return apiData<StudentAttendance[]>(
    `${API_BASE_URL}/student-attendance/bulk`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(payload),
    },
    "Failed to save student attendance",
  );
}
