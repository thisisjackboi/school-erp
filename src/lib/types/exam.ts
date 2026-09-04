export type ExamStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

export interface ExamType {
  id: string;
  name: string;
  weightagePercent?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Exam {
  id: string;
  name: string;
  examTypeId: string;
  academicSessionId: string;
  classId: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  createdAt?: string;
  updatedAt?: string;
  examType?: ExamType;
  academicSession?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

export interface ExamSchedule {
  id: string;
  examId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  room?: string | null;
  createdAt?: string;
  updatedAt?: string;
  exam?: Exam;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
}
