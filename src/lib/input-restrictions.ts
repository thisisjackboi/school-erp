// Shared input-restriction constants, sanitizers and validators used across
// all project forms. Keeps field rules consistent and production-ready.

export const LIMITS = {
  NAME_MAX: 50,
  USERNAME_MAX: 30,
  CODE_MAX: 30,
  EMAIL_MAX: 120,
  PHONE_MAX: 10,
  PHONE_INTL_MAX: 15,
  TITLE_MAX: 100,
  TEXT_MAX: 255,
  REMARKS_MAX: 500,
  ADDRESS_MAX: 255,
  SUBJECT_NAME_MAX: 60,
  EXAM_NAME_MAX: 150,
  MARKS_INT_MAX: 6,
  MARKS_DECIMAL: 2,
};

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  PHONE_10: /^\d{10}$/,
  PHONE_7_10: /^\d{7,10}$/,
  CODE: /^[a-zA-Z0-9_-]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9_]+$/,
  NAME: /^[a-zA-Z][a-zA-Z'. -]*$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  USERNAME: /^[a-zA-Z0-9_.]+$/,
};

// ── Numeric sanitizers ─────────────────────────────────────
export function onlyDigits(value: string, max = LIMITS.PHONE_MAX): string {
  return value.replace(/\D/g, "").slice(0, max);
}

export function onlyDecimal(
  value: string,
  maxInt = LIMITS.MARKS_INT_MAX,
  maxDecimals = LIMITS.MARKS_DECIMAL
): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [intPart = "", ...rest] = cleaned.split(".");
  const decimals = rest.length > 0 ? `.${rest.slice(0, maxDecimals).join("")}` : "";
  return `${intPart.slice(0, maxInt)}${decimals}`;
}

// ── Text sanitizers ────────────────────────────────────────
export function onlyName(value: string, max = LIMITS.NAME_MAX): string {
  return value.replace(/[^a-zA-Z .'-]/g, "").slice(0, max);
}

export function onlyCode(value: string, max = LIMITS.CODE_MAX): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, max);
}

export function onlyAlphanumeric(value: string, max = LIMITS.CODE_MAX): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, max);
}

export function onlyUsername(value: string, max = LIMITS.USERNAME_MAX): string {
  return value.replace(/[^a-zA-Z0-9_.]/g, "").slice(0, max);
}

export function trimMax(value: string, max: number): string {
  return value.slice(0, max);
}

// ── Validators ─────────────────────────────────────────────
type ValidationResult = string;

export function validateRequired(value: string, label: string): ValidationResult {
  return value.trim() ? "" : `${label} is required.`;
}

export function validateMaxLength(
  value: string,
  label: string,
  max: number
): ValidationResult {
  return value.trim().length <= max ? "" : `${label} cannot exceed ${max} characters.`;
}

export function validateEmail(value: string, label = "Email"): ValidationResult {
  return REGEX.EMAIL.test(value.trim()) ? "" : `Enter a valid ${label.toLowerCase()} address (e.g. name@school.edu).`;
}

export function validatePhone(value: string, label = "Phone number"): ValidationResult {
  return REGEX.PHONE_10.test(value.trim()) ? "" : `Enter a valid 10-digit ${label.toLowerCase()}.`;
}

export function validateCode(value: string, label = "Code"): ValidationResult {
  return REGEX.CODE.test(value.trim()) ? "" : `${label} may contain only letters, numbers, underscore or hyphen.`;
}

export function validateName(value: string, label = "Name"): ValidationResult {
  return REGEX.NAME.test(value.trim()) ? "" : `${label} may contain only letters, spaces, hyphen or apostrophe.`;
}

export function validateNumeric(
  value: string,
  label: string,
  options?: { min?: number; max?: number }
): ValidationResult {
  const num = Number(value);
  if (value === "" || Number.isNaN(num)) return `${label} must be a valid number.`;
  if (options?.min !== undefined && num < options.min) return `${label} cannot be less than ${options.min}.`;
  if (options?.max !== undefined && num > options.max) return `${label} cannot exceed ${options.max}.`;
  return "";
}

/**
 * Runs all validators in order and returns the first error message found
 * (or "" when every validator passes). Usage:
 *   const err = firstError(
 *     validateRequired(name, "Name"),
 *     validateName(name, "Name"),
 *     validateMaxLength(name, "Name", LIMITS.NAME_MAX)
 *   );
 */
export function firstError(...validators: ValidationResult[]): ValidationResult {
  return validators.find((result) => result !== "") || "";
}