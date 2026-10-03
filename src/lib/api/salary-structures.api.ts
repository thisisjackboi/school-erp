import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import {
  toMissingStructureEmployees,
  toSalaryComponent,
  toSalaryStructure,
} from "./payroll-mappers";

import type {
  CreateSalaryComponentPayload,
  CreateSalaryStructurePayload,
  MissingStructureEmployee,
  SalaryComponent,
  SalaryStructure,
  UpdateSalaryComponentPayload,
  UpdateSalaryStructurePayload,
} from "../types/payroll";

export async function listSalaryComponents(
  accessToken?: string | null,
  includeInactive = false,
): Promise<SalaryComponent[]> {
  const search = includeInactive ? "?includeInactive=true" : "";
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/components${search}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch salary components",
  );
  return Array.isArray(raw) ? raw.map(toSalaryComponent) : [];
}

export async function getSalaryComponent(
  id: string,
  accessToken?: string | null,
): Promise<SalaryComponent> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/components/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch salary component",
  );
  return toSalaryComponent(raw);
}

export async function createSalaryComponent(
  data: CreateSalaryComponentPayload,
  accessToken?: string | null,
): Promise<SalaryComponent> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/components`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create salary component",
  );
  return toSalaryComponent(raw);
}

export async function updateSalaryComponent(
  id: string,
  data: UpdateSalaryComponentPayload,
  accessToken?: string | null,
): Promise<SalaryComponent> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/components/${id}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update salary component",
  );
  return toSalaryComponent(raw);
}

export async function deleteSalaryComponent(
  id: string,
  accessToken?: string | null,
): Promise<SalaryComponent> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/components/${id}`,
    { method: "DELETE", headers: authHeaders(accessToken) },
    "Failed to delete salary component",
  );
  return toSalaryComponent(raw);
}

/** Every saved salary structure revision across all employees. */
export async function listSalaryStructures(
  accessToken?: string | null,
): Promise<SalaryStructure[]> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch salary structures",
  );
  return Array.isArray(raw) ? raw.map(toSalaryStructure) : [];
}

/** Full version history for one employee, newest first. */
export async function listEmployeeSalaryStructures(
  employeeId: string,
  accessToken?: string | null,
): Promise<SalaryStructure[]> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/employee/${employeeId}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch salary structures for employee",
  );
  return Array.isArray(raw) ? raw.map(toSalaryStructure) : [];
}

/**
 * Active employees with no salary structure at all. Payroll generation skips
 * them silently, so the UI surfaces them as a pre-flight warning.
 */
export async function listEmployeesWithoutStructure(
  accessToken?: string | null,
): Promise<MissingStructureEmployee[]> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/missing`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch employees without a salary structure",
  );
  return toMissingStructureEmployees(raw);
}

export async function createSalaryStructure(
  data: CreateSalaryStructurePayload,
  accessToken?: string | null,
): Promise<SalaryStructure> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to create salary structure",
  );
  return toSalaryStructure(raw);
}

export async function updateSalaryStructure(
  id: string,
  data: UpdateSalaryStructurePayload,
  accessToken?: string | null,
): Promise<SalaryStructure> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/${id}`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update salary structure",
  );
  return toSalaryStructure(raw);
}

export async function deleteSalaryStructure(
  id: string,
  accessToken?: string | null,
): Promise<SalaryStructure> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/salary-structures/${id}`,
    { method: "DELETE", headers: authHeaders(accessToken) },
    "Failed to delete salary structure",
  );
  return toSalaryStructure(raw);
}