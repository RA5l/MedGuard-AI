/**
 * Shared date and time utilities.
 * No React imports — pure functions only.
 */

/**
 * Formats an ISO date string into a short human-readable date.
 * Returns '—' for null/undefined inputs.
 *
 * @example formatDate('2026-06-14T09:00:00Z') → '14 Jun 2026'
 */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

/**
 * Formats an ISO date string into HH:MM (24-hour).
 * Returns '—' for null/undefined inputs.
 *
 * @example formatTime('2026-06-14T09:18:00Z') → '09:18'
 */
export function formatTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns a greeting word based on the current hour.
 * Used in the dashboard welcome heading.
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
