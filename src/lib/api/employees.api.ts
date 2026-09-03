import { API_BASE_URL } from "./config";

import type {
  Employee,
  EmployeeStatus,
  EmploymentType,
  Gender,
} from "../types/employee";

function getAuthHeaders(accessToken?: string | null) {
  return {
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
}

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
  const response = await fetch(`${API_BASE_URL}/employees`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch employees");
  }

  return result.data;
}

export async function getEmployee(
  id: string,
  accessToken?: string | null,
): Promise<Employee> {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to fetch employee");
  }

  return result.data;
}

export async function createEmployee(
  data: CreateEmployeePayload,
  accessToken?: string | null,
): Promise<Employee> {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create employee");
  }

  return result.data;
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeePayload,
  accessToken?: string | null,
): Promise<Employee> {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(accessToken),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update employee");
  }

  return result.data;
}

export async function deleteEmployee(
  id: string,
  accessToken?: string | null,
): Promise<Employee> {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to delete employee");
  }

  return result.data;
}
