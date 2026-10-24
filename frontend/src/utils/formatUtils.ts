import { ROLE_LABELS } from './constants';

/**
 * Format currency amount with dollar sign and decimals
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format employee full name
 */
export function formatFullName(
  firstName?: string,
  fatherName?: string,
  familyName?: string
): string {
  const parts = [firstName, fatherName, familyName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

/**
 * Get display label for an employee role
 */
export function formatRoleLabel(role?: string): string {
  if (!role) return 'Unknown';
  return ROLE_LABELS[role] || role;
}

/**
 * Truncate long text with ellipsis
 */
export function truncateText(text: string, maxLength = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
