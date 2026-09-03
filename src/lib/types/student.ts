export type Gender = "MALE" | "FEMALE" | "OTHER";
export type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "GRADUATED"
  | "SUSPENDED"
  | "TRANSFERRED"
  | "WITHDRAWN";

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
}
