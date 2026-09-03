export type Gender = "MALE" | "FEMALE" | "OTHER";
export type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "GRADUATED"
  | "SUSPENDED"
  | "TRANSFERRED"
  | "WITHDRAWN";

export interface StudentEnrollmentContext {
  id: string;
  rollNumber: string | null;
  enrollmentDate: string;
  status: string;
  class: { id: string; name: string; displayOrder: number };
  section: { id: string; name: string };
  academicSession: { id: string; name: string };
}

export interface StudentRecord {
  id: string;
  userId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string | null;
  address?: string | null;
  admissionDate: string;
  photoUrl?: string | null;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  // Present only when queried with enrollment filters
  enrollment?: StudentEnrollmentContext;
}
