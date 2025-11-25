/**
 * Date formatting and manipulation utilities
 */

import {
  format,
  formatDistanceToNow,
  addDays,
  addHours,
  isAfter,
  isBefore,
  parseISO,
  differenceInDays,
  differenceInHours,
} from "date-fns";

/**
 * Format date to display format
 */
export function formatDate(date: Date | string, formatString = "PPP"): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format date with time
 */
export function formatDateTime(
  date: Date | string,
  formatString = "PPP p",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Estimate delivery date
 */
export function estimateDeliveryDate(days: number, fromDate?: Date): Date {
  const startDate = fromDate || new Date();
  return addDays(startDate, days);
}

/**
 * Format delivery estimate
 */
export function formatDeliveryEstimate(days: number): string {
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "Tomorrow";
  }
  if (days <= 7) {
    return `${days} days`;
  }
  if (days <= 14) {
    return "1-2 weeks";
  }
  if (days <= 30) {
    return "2-4 weeks";
  }
  return `${Math.ceil(days / 30)} months`;
}

/**
 * Format delivery date range
 */
export function formatDeliveryRange(minDays: number, maxDays: number): string {
  const minDate = estimateDeliveryDate(minDays);
  const maxDate = estimateDeliveryDate(maxDays);

  return `${formatDate(minDate, "MMM d")} - ${formatDate(maxDate, "MMM d")}`;
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Get days until date
 */
export function getDaysUntil(date: Date | string): number {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return differenceInDays(dateObj, new Date());
}

/**
 * Get hours until date
 */
export function getHoursUntil(date: Date | string): number {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return differenceInHours(dateObj, new Date());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date | string, hours: number): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return addHours(dateObj, hours);
}

/**
 * Check if data is stale (older than threshold)
 */
export function isDataStale(
  lastUpdated: Date | string,
  thresholdMinutes = 60,
): boolean {
  const lastUpdatedObj =
    typeof lastUpdated === "string" ? parseISO(lastUpdated) : lastUpdated;
  const now = new Date();
  const diffMinutes = differenceInHours(now, lastUpdatedObj) * 60;

  return diffMinutes > thresholdMinutes;
}

/**
 * Format cache expiration time
 */
export function formatCacheExpiration(ttlSeconds: number): string {
  if (ttlSeconds < 60) {
    return `${ttlSeconds}s`;
  }
  if (ttlSeconds < 3600) {
    return `${Math.floor(ttlSeconds / 60)}m`;
  }
  if (ttlSeconds < 86400) {
    return `${Math.floor(ttlSeconds / 3600)}h`;
  }
  return `${Math.floor(ttlSeconds / 86400)}d`;
}

/**
 * Get timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * Get ISO timestamp
 */
export function getISOTimestamp(): string {
  return new Date().toISOString();
}
