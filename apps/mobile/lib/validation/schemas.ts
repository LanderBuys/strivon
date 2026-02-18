/**
 * Validation helpers for forms and API payloads.
 * Uses simple checks to avoid adding Zod dependency; can be replaced with Zod later.
 */

export function validateEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email.';
  if (trimmed.length > 254) return 'Email is too long.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 128) return 'Password is too long.';
  return null;
}

export function validateHandle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Handle is required.';
  if (trimmed.length < 2) return 'Handle must be at least 2 characters.';
  if (trimmed.length > 30) return 'Handle must be 30 characters or less.';
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Handle can only contain letters, numbers, and underscores.';
  return null;
}

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length > 100) return 'Name is too long.';
  return null;
}

export function validateBio(value: string): string | null {
  if (value.length > 500) return 'Bio must be 500 characters or less.';
  return null;
}
