export type ResultStatus = "PASS" | "FAIL" | "PENDING";

export interface Mark {
  id: string;
  examScheduleId: string;
  studentEnrollmentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  enteredByEmployeeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  examSchedule?: {
    id: string;
    examId: string;
    subjectId: string;
    examDate: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passingMarks: number;
    room?: string | null;
    exam?: {
      id: string;
      name: string;
      examType?: { id: string; name: string };
      academicSession?: { id: string; name: string };
      class?: { id: string; name: string };
    };
    subject?: { id: string; name: string; code?: string };
  };
  studentEnrollment?: {
    id: string;
    studentId: string;
    rollNumber?: string | null;
    student?: {
      id: string;
      firstName: string;
      lastName: string;
      admissionNumber: string;
    };
    class?: { id: string; name: string };
    section?: { id: string; name: string };
    academicSession?: { id: string; name: string };
  };
  enteredByEmployee?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentEnrollmentId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  gradeId?: string | null;
  rankInSection?: number | null;
  resultStatus: ResultStatus;
  createdAt?: string;
  updatedAt?: string;
  exam?: {
    id: string;
    name: string;
    examType?: { id: string; name: string };
    academicSession?: { id: string; name: string };
    class?: { id: string; name: string };
  };
  studentEnrollment?: {
    id: string;
    studentId: string;
    rollNumber?: string | null;
    student?: {
      id: string;
      firstName: string;
      lastName: string;
      admissionNumber: string;
    };
    class?: { id: string; name: string };
    section?: { id: string; name: string };
  };
  grade?: {
    id: string;
    gradeName: string;
    minPercent: number;
    maxPercent: number;
    gradePoint?: number | null;
  } | null;
}

export interface Grade {
  id: string;
  gradeName: string;
  minPercent: number;
  maxPercent: number;
  gradePoint?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
