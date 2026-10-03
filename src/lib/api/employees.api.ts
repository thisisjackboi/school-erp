import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";

import type {
  Employee,
  EmployeeStatus,
  EmploymentType,
  Gender,
} from "../types/employee";

export interface CreateEmployeePayload {
  createUser?: boolean;

  user?: {
    username: string;
    email?: string;
    phone?: string;
    password: string;
    userType: string;
    roleId?: string;
  };

  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  designationId?: string;
  dateOfJoining: string;
  employmentType: EmploymentType;
  phone: string;
  address?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeePayload {
  userId?: string;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  designationId?: string;
  dateOfJoining?: string;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT";
  phone?: string;
  address?: string;
  status?: "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
}

export async function getEmployees(
  accessToken?: string | null,
): Promise<Employee[]> {
  return apiData<Employee[]>(
    `${API_BASE_URL}/employees`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch employees",
  );
}

export async function getEmployee(
  id: string,
  accessToken?: string | null,
): Promise<Employee> {
  return apiData<Employee>(
    `${API_BASE_URL}/employees/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch employee",
  );
}

export async function createEmployee(
  data: CreateEmployeePayload,
  accessToken?: string | null,
): Promise<Employee> {
  return apiData<Employee>(
    `${API_BASE_URL}/employees`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create employee",
  );
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeePayload,
  accessToken?: string | null,
): Promise<Employee> {
  return apiData<Employee>(
    `${API_BASE_URL}/employees/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update employee",
  );
}

export async function deleteEmployee(
  id: string,
  accessToken?: string | null,
): Promise<Employee> {
  return apiData<Employee>(
    `${API_BASE_URL}/employees/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
    "Failed to delete employee",
  );
}
