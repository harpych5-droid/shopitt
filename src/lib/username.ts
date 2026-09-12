export const USERNAME_MAX_LENGTH = 24;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function sanitizeUsername(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_]/g, "_").slice(0, USERNAME_MAX_LENGTH);
}

export function isValidUsername(value: string): boolean {
  return /^[a-zA-Z0-9_]{2,24}$/.test(value);
}