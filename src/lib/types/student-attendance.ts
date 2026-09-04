export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "EXCUSED";

export type AttendanceType = "DAILY" | "PERIOD";

export interface StudentAttendance {
  id: string;
  studentEnrollmentId: string;
  attendanceDate: string;
  attendanceType: AttendanceType;
  status: AttendanceStatus;
  remarks?: string | null;
  timetableSlotId?: string | null;
  subjectId?: string | null;
  periodId?: string | null;
  markedByEmployeeId?: string | null;
  createdAt: string;
  updatedAt: string;

  studentEnrollment?: {
    id: string;
    rollNumber?: string | null;
    student?: {
      id: string;
      firstName: string;
      lastName: string;
      admissionNumber: string;
    };
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  period?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
}

export interface StudentAttendanceItemPayload {
  studentEnrollmentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkStudentAttendancePayload {
  attendanceDate: string;
  attendanceType?: AttendanceType;
  timetableSlotId?: string;
  subjectId?: string;
  periodId?: string;
  markedByEmployeeId?: string;
  records: StudentAttendanceItemPayload[];
}
