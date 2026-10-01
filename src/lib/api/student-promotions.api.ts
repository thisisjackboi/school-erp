import { API_BASE_URL } from "./config";
import { apiData, authHeaders, jsonHeaders } from "./request";
import type {
  ExecutePromotionPayload,
  ExecutePromotionResult,
  PromotionHistoryRow,
  PromotionPreview,
  PromotionScopeOptions,
} from "../types/student-promotion";

/** Promote writes up to 500 rows in one transaction, so it needs a long leash. */
const EXECUTE_TIMEOUT_MS = 120_000;

export async function getPromotionScopeOptions(
  accessToken?: string | null,
  filters?: { toSessionId?: string; toClassId?: string },
): Promise<PromotionScopeOptions> {
  const params = new URLSearchParams();
  if (filters?.toSessionId) params.set("toSessionId", filters.toSessionId);
  if (filters?.toClassId) params.set("toClassId", filters.toClassId);

  const qs = params.toString();
  return apiData<PromotionScopeOptions>(
    `${API_BASE_URL}/student-promotions/scope-options${qs ? `?${qs}` : ""}`,
    { headers: authHeaders(accessToken) },
    "Failed to load promotion options",
  );
}

export async function previewPromotion(
  accessToken: string | null | undefined,
  payload: {
    fromSessionId: string;
    fromClassId: string;
    fromSectionId: string;
    toSessionId: string;
  },
): Promise<PromotionPreview> {
  return apiData<PromotionPreview>(
    `${API_BASE_URL}/student-promotions/preview`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(payload),
    },
    "Failed to load the promotion preview",
  );
}

export async function executePromotion(
  accessToken: string | null | undefined,
  payload: ExecutePromotionPayload,
): Promise<ExecutePromotionResult> {
  return apiData<ExecutePromotionResult>(
    `${API_BASE_URL}/student-promotions/execute`,
    {
      method: "POST",
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(payload),
    },
    "Failed to apply the promotion batch",
    { timeoutMs: EXECUTE_TIMEOUT_MS, retry: false },
  );
}

export async function getPromotionHistory(
  accessToken?: string | null,
  filters?: {
    fromSessionId?: string;
    toSessionId?: string;
    fromClassId?: string;
    from?: string;
    to?: string;
  },
): Promise<PromotionHistoryRow[]> {
  const params = new URLSearchParams();
  if (filters?.fromSessionId) params.set("fromSessionId", filters.fromSessionId);
  if (filters?.toSessionId) params.set("toSessionId", filters.toSessionId);
  if (filters?.fromClassId) params.set("fromClassId", filters.fromClassId);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const qs = params.toString();
  return apiData<PromotionHistoryRow[]>(
    `${API_BASE_URL}/student-promotions/batches${qs ? `?${qs}` : ""}`,
    { headers: authHeaders(accessToken) },
    "Failed to load promotion history",
  );
}

export async function getStudentPromotionHistory(
  studentId: string,
  accessToken?: string | null,
): Promise<PromotionHistoryRow[]> {
  return apiData<PromotionHistoryRow[]>(
    `${API_BASE_URL}/student-promotions/student/${studentId}`,
    { headers: authHeaders(accessToken) },
    "Failed to load the student's promotion history",
  );
}
