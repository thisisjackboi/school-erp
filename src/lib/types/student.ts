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

export interface StudentGuardianRecord {
  id: string;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  canPickup: boolean;
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    relation: string;
    phone: string;
    email?: string | null;
    occupation?: string | null;
    address?: string | null;
  };
}

export interface StudentDocumentRecord {
  id: string;
  documentType: string;
  fileUrl: string;
  createdAt: string;
}

export interface StudentMedicalRecord {
  id: string;
  allergies?: string | null;
  chronicConditions?: string | null;
  medications?: string | null;
  emergencyDoctorName?: string | null;
  emergencyDoctorPhone?: string | null;
  notes?: string | null;
}

export interface StudentHouseAllocationRecord {
  id: string;
  allocatedAt: string;
  house: {
    id: string;
    name: string;
    houseColor?: string | null;
  };
}

export interface StudentLeavingCertificateRecord {
  id: string;
  certificateNumber: string;
  issueDate: string;
  reason: string;
  remarks?: string | null;
}

export interface StudentDisciplinaryRecord {
  id: string;
  incidentDate: string;
  description: string;
  severity: string;
  actionTaken?: string | null;
  guardianNotified: boolean;
  guardianNotifiedAt?: string | null;
}

/**
 * The enriched shape returned by `GET /students/:id` with every piece of
 * profile-related data resolved in a single call.
 */
export interface StudentProfile extends StudentRecord {
  enrollments: StudentEnrollmentContext[];
  guardians: StudentGuardianRecord[];
  documents: StudentDocumentRecord[];
  medicalRecord?: StudentMedicalRecord | null;
  houseAllocation?: StudentHouseAllocationRecord | null;
  leavingCertificates: StudentLeavingCertificateRecord[];
  disciplinaryRecords: StudentDisciplinaryRecord[];
}