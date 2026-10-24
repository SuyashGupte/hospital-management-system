import { ApiError } from '../api/client';

/**
 * Extract human-readable error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
      const fieldList = Object.entries(error.fieldErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
      return `${error.message} (${fieldList})`;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract field-specific errors if available
 */
export function getFieldErrors(error: unknown): Record<string, string> | undefined {
  if (error instanceof ApiError && error.fieldErrors) {
    return error.fieldErrors;
  }
  return undefined;
}
