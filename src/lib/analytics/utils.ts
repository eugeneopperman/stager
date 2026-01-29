// Analytics date utilities

/**
 * Get date range for analytics queries
 */
export function getDateRange(periodDays: number): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - periodDays);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/**
 * Get previous period date range for comparison
 */
export function getPreviousPeriodRange(periodDays: number): { start: Date; end: Date } {
  const end = new Date();
  end.setDate(end.getDate() - periodDays);
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - (periodDays * 2));
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate array of dates for the period
 */
export function generateDateRange(periodDays: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = periodDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(formatDateKey(date));
  }

  return dates;
}

/**
 * Calculate percentage change between two values
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Format processing time for display
 */
export function formatProcessingTime(ms: number | null): string {
  if (ms === null) return '-';
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)}s`;
}
