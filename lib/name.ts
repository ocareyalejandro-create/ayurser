/**
 * The person's chosen name — a gentle, optional bit of warmth, not an account.
 *
 * Stored in localStorage so "Welcome back, {name}" can greet on return. We never
 * ask for more than a first name, and we never require it to be real. Browser-
 * only; returns null on the server or when storage is blocked (best-effort).
 */

const STORAGE_KEY = "ayurser_name";

/** Max stored length — a name, not a paragraph. Guards storage and layout. */
export const NAME_MAX_LENGTH = 24;

/**
 * Tidy a raw input into a safe, friendly name: trim, collapse inner whitespace,
 * cap length, and capitalize the first letter (leaving the rest as typed, so
 * "McKay" or "de la O" survive). Pure — easy to test.
 */
export function cleanName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ").slice(0, NAME_MAX_LENGTH);
  if (trimmed.length === 0) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Read the stored name, or null if none / unavailable. */
export function getName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Store a cleaned name. Returns the cleaned value actually stored, or null if it
 * was empty (nothing stored) or storage is unavailable. Never throws.
 */
export function setName(raw: string): string | null {
  const cleaned = cleanName(raw);
  if (cleaned.length === 0) return null;
  if (typeof window === "undefined") return cleaned;
  try {
    window.localStorage.setItem(STORAGE_KEY, cleaned);
  } catch {
    // Storage blocked — the name just won't persist. Never throw at this edge.
  }
  return cleaned;
}
