/**
 * Validation utilities
 */

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{7,15}$/,
  API_DATE: /^\d{2}\/\d{2}\/\d{4}$/,
  NUMERIC_ONLY: /^\d+$/,
};

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return REGEX_PATTERNS.EMAIL.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  return REGEX_PATTERNS.PHONE.test(phone.trim());
}

export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;
  return REGEX_PATTERNS.API_DATE.test(dateStr.trim());
}

export function isNonEmptyString(val: unknown): boolean {
  return typeof val === 'string' && val.trim().length > 0;
}

export function isPositiveNumber(val: unknown): boolean {
  return typeof val === 'number' && !isNaN(val) && val > 0;
}

export function isNonNegativeNumber(val: unknown): boolean {
  return typeof val === 'number' && !isNaN(val) && val >= 0;
}
