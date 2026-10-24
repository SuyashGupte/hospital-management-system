/**
 * Date manipulation and formatting utilities for Hospital System.
 * Backend requires MM/dd/yyyy format for date parameters.
 */

/**
 * Format a Date object or ISO string to backend format 'MM/dd/yyyy'
 */
export function formatToApiDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Format a backend date string ('MM/dd/yyyy') or ISO string into a human-readable display date
 */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';

  // Check if string matches MM/dd/yyyy
  const mdyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim());
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string with time for display
 */
export function formatDisplayDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return formatDisplayDate(dateStr);

  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse 'MM/dd/yyyy' to JavaScript Date object
 */
export function parseApiDate(dateStr: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim());
  if (!match) return null;

  const [, month, day, year] = match;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Validate whether a string is a valid 'MM/dd/yyyy' date
 */
export function isValidApiDate(dateStr: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr.trim())) {
    return false;
  }
  const parsed = parseApiDate(dateStr);
  return parsed !== null;
}

/**
 * Calculate age in years from DOB string ('MM/dd/yyyy' or ISO)
 */
export function calculateAge(dobStr: string | null | undefined): number | null {
  if (!dobStr) return null;
  const birthDate = parseApiDate(dobStr) || new Date(dobStr);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}
