const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatRelativeTime(createdAt: string | Date, now = Date.now()): string {
  const timestamp = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return "Now";

  const elapsed = Math.max(0, now - timestamp);
  if (elapsed < MINUTE) return "Now";

  const minutes = Math.floor(elapsed / MINUTE);
  if (elapsed < HOUR) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(elapsed / HOUR);
  if (elapsed < DAY) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(elapsed / DAY);
  if (days === 1) return "Yesterday";
  if (elapsed < WEEK) return `${days} days ago`;

  const weeks = Math.floor(elapsed / WEEK);
  if (elapsed < MONTH) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  const months = Math.floor(elapsed / MONTH);
  if (elapsed < YEAR) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(elapsed / YEAR);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function getRelativeTimeRefreshDelay(createdAt: string | Date, now = Date.now()): number {
  const timestamp = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp) || timestamp > now) return MINUTE;

  const elapsed = now - timestamp;
  if (elapsed < HOUR) return MINUTE - (elapsed % MINUTE);
  if (elapsed < DAY) return HOUR - (elapsed % HOUR);
  if (elapsed < WEEK) return DAY - (elapsed % DAY);
  if (elapsed < MONTH) return WEEK - (elapsed % WEEK);
  if (elapsed < YEAR) return MONTH - (elapsed % MONTH);
  return YEAR - (elapsed % YEAR);
}
