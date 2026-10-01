/**
 * A `TeacherSubjectAssignment` row. This is the unit a homework is attached to,
 * so it is what the assign form selects. It resolves the full
 * subject / class / section / academic-session chain in one object, which keeps
 * the "teacher must actually teach this subject" rule enforceable.
 */
export interface HomeworkAssignmentOption {
  id: string;
  employeeId: string;
  subjectId: string;
  sectionId: string;
  academicSessionId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  section: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  academicSession: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

export interface Homework {
  id: string;
  teacherSubjectAssignmentId: string;
  title: string;
  description: string | null;
  assignedDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  teacherSubjectAssignment: HomeworkAssignmentOption;
  /** The staff member who posted the homework, when they are an employee. */
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  } | null;
}

export interface HomeworkListFilters {
  page?: number;
  limit?: number;
  search?: string;
  academicSessionId?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  teacherEmployeeId?: string;
  isOverdue?: boolean;
}

export interface CreateHomeworkPayload {
  teacherSubjectAssignmentId: string;
  title: string;
  description?: string;
  assignedDate: string;
  dueDate: string;
}

export type UpdateHomeworkPayload = Partial<CreateHomeworkPayload>;

/** Broad codes: administrators may act on any teacher's homework. */
export const HOMEWORK_PERMISSIONS = {
  read: "homework.read",
  create: "homework.create",
  update: "homework.update",
  delete: "homework.delete",
} as const;

/** Self-scoped codes: teachers act on their own subjects, students read theirs. */
export const HOMEWORK_SELF_PERMISSIONS = {
  read: "homework.read.own",
  create: "homework.create.own",
  update: "homework.update.own",
  delete: "homework.delete.own",
} as const;

/** Either the broad or the self-scoped code, for `anyPermission` gates. */
export const HOMEWORK_ANY = {
  read: [HOMEWORK_PERMISSIONS.read, HOMEWORK_SELF_PERMISSIONS.read],
  create: [HOMEWORK_PERMISSIONS.create, HOMEWORK_SELF_PERMISSIONS.create],
  update: [HOMEWORK_PERMISSIONS.update, HOMEWORK_SELF_PERMISSIONS.update],
  delete: [HOMEWORK_PERMISSIONS.delete, HOMEWORK_SELF_PERMISSIONS.delete],
} as const;
