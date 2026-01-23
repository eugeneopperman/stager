/**
 * String formatting utilities used across the application
 */

/**
 * Format a hyphenated room type string to Title Case
 * @example formatRoomType("living-room") // "Living Room"
 */
export function formatRoomType(roomType: string): string {
  return roomType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format a hyphenated style string to Title Case
 * @example formatStyle("mid-century-modern") // "Mid Century Modern"
 */
export function formatStyle(style: string): string {
  return style
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format a date string to short format (e.g., "Jan 23")
 */
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date string to full format with time (e.g., "Jan 23, 2024, 3:45 PM")
 */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
