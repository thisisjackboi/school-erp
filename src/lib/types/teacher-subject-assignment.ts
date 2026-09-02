export interface TeacherSubjectAssignment {
  id: string;
  employeeId: string;
  subjectId: string;
  sectionId: string;
  academicSessionId: string;
  createdAt: string;
  updatedAt: string;
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
