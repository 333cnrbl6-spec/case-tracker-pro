/**
 * Shared date utilities used across the app.
 */

/**
 * Returns the number of days from now until the given date string.
 * Negative values mean the date is in the past.
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if the date is within the given number of days from now.
 */
export function isWithinDays(dateStr, days) {
  const d = daysUntil(dateStr);
  return d !== null && d >= 0 && d <= days;
}

/**
 * Formats a date string to UK format (DD/MM/YYYY).
 */
export function formatDateGB(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB');
}