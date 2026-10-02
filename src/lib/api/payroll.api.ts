import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import {
  toPayrollRegister,
  toPayrollRun,
  toPayrollRunItem,
} from "./payroll-mappers";

import type {
  GeneratePayrollPayload,
  GeneratePayrollResult,
  MarkPayrollPaidPayload,
  PayrollRegister,
  PayrollRun,
  PayrollRunItem,
  PayrollRunListParams,
  PayslipResult,
  UpdatePayrollRunItemPayload,
} from "../types/payroll";

export async function listPayrollRuns(
  params: PayrollRunListParams = {},
  accessToken?: string | null,
): Promise<PayrollRun[]> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.month) query.set("month", String(params.month));
  if (params.status) query.set("status", params.status);

  const search = query.toString();
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs${search ? `?${search}` : ""}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch payroll runs",
  );

  return Array.isArray(raw) ? raw.map(toPayrollRun) : [];
}

export async function getPayrollRun(
  id: string,
  accessToken?: string | null,
): Promise<PayrollRun> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${id}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch payroll run",
  );
  return toPayrollRun(raw);
}

export async function listPayrollRunItems(
  runId: string,
  employeeId?: string,
  accessToken?: string | null,
): Promise<PayrollRunItem[]> {
  const search = employeeId
    ? `?employeeId=${encodeURIComponent(employeeId)}`
    : "";
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/items${search}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch payroll lines",
  );
  return Array.isArray(raw) ? raw.map(toPayrollRunItem) : [];
}

export async function getPayrollRegister(
  runId: string,
  accessToken?: string | null,
): Promise<PayrollRegister> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/register`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch payroll register",
  );
  return toPayrollRegister(raw);
}

export async function getPayslip(
  itemId: string,
  accessToken?: string | null,
): Promise<PayslipResult> {
  const raw = await apiData<any>(
    `${API_BASE_URL}/payroll/payslips/${itemId}`,
    { headers: authHeaders(accessToken) },
    "Failed to fetch payslip",
  );
  return {
    item: toPayrollRunItem(raw?.item),
    run: toPayrollRun(raw?.run),
  };
}

export async function generatePayroll(
  data: GeneratePayrollPayload,
  accessToken?: string | null,
): Promise<GeneratePayrollResult> {
  const raw = await apiData<any>(
    `${API_BASE_URL}/payroll/runs`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to generate payroll",
  );

  return {
    run: toPayrollRun(raw?.run),
    skipped: Array.isArray(raw?.skipped)
      ? raw.skipped.map((entry: Record<string, any>) => ({
          employeeId: String(entry.employeeId ?? ""),
          employeeCode: String(entry.employeeCode ?? ""),
          reason: String(entry.reason ?? ""),
        }))
      : [],
  };
}

export async function processPayroll(
  runId: string,
  accessToken?: string | null,
): Promise<PayrollRun> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/process`,
    { method: "PUT", headers: jsonHeaders(accessToken) },
    "Failed to process payroll",
  );
  return toPayrollRun(raw);
}

export async function unprocessPayroll(
  runId: string,
  accessToken?: string | null,
): Promise<PayrollRun> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/unprocess`,
    { method: "PUT", headers: authHeaders(accessToken) },
    "Failed to revert payroll run to draft",
  );
  return toPayrollRun(raw);
}

export async function updatePayrollRunItem(
  runId: string,
  itemId: string,
  data: UpdatePayrollRunItemPayload,
  accessToken?: string | null,
): Promise<PayrollRun> {
  // The backend recalculates the run and returns it in full, so the caller can
  // refresh totals without a second round trip.
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/items/${itemId}`,
    {
      method: "PATCH",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to update payroll line",
  );
  return toPayrollRun(raw);
}

export async function discardPayrollRun(
  runId: string,
  accessToken?: string | null,
): Promise<PayrollRun> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}`,
    { method: "DELETE", headers: authHeaders(accessToken) },
    "Failed to discard payroll run",
  );
  return toPayrollRun(raw);
}

export async function approvePayroll(
  runId: string,
  accessToken?: string | null,
): Promise<PayrollRun> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/approve`,
    { method: "PUT", headers: jsonHeaders(accessToken) },
    "Failed to approve payroll",
  );
  return toPayrollRun(raw);
}

export async function unapprovePayroll(
  runId: string,
  accessToken?: string | null,
): Promise<PayrollRun> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/unapprove`,
    { method: "PUT", headers: authHeaders(accessToken) },
    "Failed to revert payroll run to processed",
  );
  return toPayrollRun(raw);
}

export async function markPayrollPaid(
  runId: string,
  data: MarkPayrollPaidPayload,
  accessToken?: string | null,
): Promise<PayrollRun> {
  const raw = await apiData<unknown>(
    `${API_BASE_URL}/payroll/runs/${runId}/pay`,
    {
      method: "PUT",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(data),
    },
    "Failed to mark payroll as paid",
  );
  return toPayrollRun(raw);
}