export type AdmissionStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEWED"
  | "APPROVED"
  | "REJECTED"
  | "ENROLLED";

export interface Admission {
  id: string;

  applicationNumber: string;

  applicantFirstName: string;
  applicantLastName: string;

  dateOfBirth: string;

  gender: string;

  applyingForClassId: string;
  academicSessionId: string;

  status: AdmissionStatus;

  guardianName: string;
  guardianPhone: string;

  convertedStudentId: string | null;

  createdAt: string;
  updatedAt: string;
}
