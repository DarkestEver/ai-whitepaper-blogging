/**
 * Format a date as a relative time string (e.g., "2 days ago")
 * Falls back to absolute date format if older than 30 days
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) {
    return secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`;
  }

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return minutesAgo === 1 ? "1 minute ago" : `${minutesAgo} minutes ago`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) {
    return daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;
  }

  // Fall back to absolute date for older items
  return date.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Format a date for display with optional relative time
 * Returns: "Title · 2 days ago" format
 */
export function formatDateWithRelative(dateString: string, title?: string): string {
  const relative = formatRelativeTime(dateString);
  return title ? `${title} · ${relative}` : relative;
}
