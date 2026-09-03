export interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: string;
  teacherSubjectAssignmentId: string;
  periodId: string;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  room?: string | null;
  createdAt: string;
  updatedAt: string;

  period?: Period;
  teacherSubjectAssignment?: {
    id: string;
    employeeId: string;
    subjectId: string;
    sectionId: string;
    academicSessionId: string;
    employee?: {
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
    };
    subject?: {
      id: string;
      name: string;
      code: string;
    };
    section?: {
      id: string;
      name: string;
      classId?: string;
    };
    academicSession?: {
      id: string;
      name: string;
    };
  };
}
