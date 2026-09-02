export type Gender = "MALE" | "FEMALE" | "OTHER";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT";

export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export interface EmployeeUser {
  id: string;
  username: string;
  userType: string;
}

export interface EmployeeDesignation {
  id: string;
  title: string;
  category: string;
}

export interface Employee {
  id: string;

  userId: string | null;

  employeeCode: string;

  firstName: string;

  lastName: string;

  dateOfBirth: string | null;

  gender: Gender | null;

  designationId: string | null;

  dateOfJoining: string;

  employmentType: EmploymentType;

  phone: string;

  address: string | null;

  status: EmployeeStatus;

  deletedAt: string | null;

  createdAt: string;

  updatedAt: string;

  user: EmployeeUser | null;

  designation: EmployeeDesignation | null;
}
