/**
 * Input sanitization for security: trim, normalize, and limit length
 * to prevent XSS and injection when displaying or sending user input.
 */

const MAX_TEXT_LENGTH = 10000;
const MAX_EMAIL_LENGTH = 254;
const MAX_HANDLE_LENGTH = 30;

/** Strip control chars and trim; limit length. */
export function sanitizeText(input: string | null | undefined, maxLength: number = MAX_TEXT_LENGTH): string {
  if (input == null) return '';
  let s = String(input)
    // eslint-disable-next-line no-control-regex -- intentional: strip control characters for security
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  if (s.length > maxLength) s = s.slice(0, maxLength);
  return s;
}

/** Normalize email: lowercase, trim, basic format; return empty if invalid. */
export function sanitizeEmail(input: string | null | undefined): string {
  const s = sanitizeText(input ?? '', MAX_EMAIL_LENGTH).toLowerCase();
  if (!s) return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(s) ? s : '';
}

/** Sanitize handle (username): alphanumeric + underscore, max length. */
export function sanitizeHandle(input: string | null | undefined): string {
  const s = sanitizeText(input ?? '', MAX_HANDLE_LENGTH);
  return s.replace(/[^a-zA-Z0-9_]/g, '');
}

/** Sanitize for display: escape HTML-like chars to prevent XSS in web views. */
export function sanitizeForDisplay(input: string | null | undefined): string {
  if (input == null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
