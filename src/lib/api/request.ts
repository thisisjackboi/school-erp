const DEFAULT_TIMEOUT_MS = 8_000;
const RETRY_DELAYS_MS = [400, 1_200];
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SERVER_UNREACHABLE =
  "The server could not be reached. It may be restarting, so please try again in a moment.";

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly isNetworkError: boolean;

  constructor(message: string, status?: number, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface RequestOptions {
  timeoutMs?: number;
  retry?: boolean;
}

export function authHeaders(accessToken?: string | null): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export function jsonHeaders(accessToken?: string | null): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeaders(accessToken) };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const raw = (payload as { message?: unknown }).message;
    if (Array.isArray(raw)) {
      const joined = raw.filter((item) => typeof item === "string").join(", ");
      if (joined) return joined;
    }
    if (typeof raw === "string" && raw.trim()) return raw;
  }
  return fallback;
}

function statusFallback(response: Response, fallback: string): string {
  const detail = response.statusText ? ` ${response.statusText}` : "";
  return `${fallback} (HTTP ${response.status}${detail})`;
}

async function readEnvelope(response: Response): Promise<{ payload: unknown; parseFailed: boolean }> {
  const text = await response.text();
  if (!text) return { payload: undefined, parseFailed: false };
  try {
    return { payload: JSON.parse(text) as unknown, parseFailed: false };
  } catch {
    return { payload: undefined, parseFailed: true };
  }
}

export async function apiRequest<T = unknown>(
  url: string,
  init: RequestInit = {},
  fallbackMessage = "Request failed",
  options: RequestOptions = {},
): Promise<ApiSuccess<T>> {
  const method = (init.method ?? "GET").toUpperCase();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const allowRetry = options.retry ?? IDEMPOTENT_METHODS.has(method);
  const maxAttempts = allowRetry ? RETRY_DELAYS_MS.length + 1 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 0);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const { payload, parseFailed } = await readEnvelope(response);

      const record = payload as { success?: unknown } | undefined;
      if (!response.ok || !record || !record.success) {
        throw new ApiError(
          parseFailed
            ? statusFallback(response, fallbackMessage)
            : extractMessage(payload, fallbackMessage),
          response.status,
        );
      }

      return payload as ApiSuccess<T>;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted) {
        throw new ApiError(
          `Request timed out after ${Math.round(timeoutMs / 1000)}s. ${SERVER_UNREACHABLE}`,
          undefined,
          true,
        );
      }
      if (attempt < maxAttempts - 1) continue;
      throw new ApiError(`${fallbackMessage}. ${SERVER_UNREACHABLE}`, undefined, true);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ApiError(`${fallbackMessage}. ${SERVER_UNREACHABLE}`, undefined, true);
}

export async function apiData<T = unknown>(
  url: string,
  init: RequestInit = {},
  fallbackMessage = "Request failed",
  options: RequestOptions = {},
): Promise<T> {
  const result = await apiRequest<T>(url, init, fallbackMessage, options);
  return result.data;
}
