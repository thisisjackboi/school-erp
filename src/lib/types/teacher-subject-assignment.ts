export interface TeacherSubjectAssignment {
  id: string;
  employeeId: string;
  subjectId: string;
  sectionId: string;
  academicSessionId: string;
  createdAt: string;
  updatedAt: string;

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
  };
  academicSession?: {
    id: string;
    name: string;
  };
}

export interface CreateTeacherSubjectAssignmentPayload {
  employeeId: string;
  subjectId: string;
  sectionId: string;
  academicSessionId: string;
}

export interface UpdateTeacherSubjectAssignmentPayload {
  employeeId?: string;
  subjectId?: string;
  sectionId?: string;
  academicSessionId?: string;
}
