/**
 * Anonymous identity for the journal.
 *
 * We never ask anyone to sign up. Each device lazily mints a UUID, stored in
 * localStorage, so the journal can quietly remember without an account. This is
 * the seam for "capture early, interpret later" — every check-in is tied to a
 * stable, anonymous device id from the very first morning.
 *
 * Browser-only. Returns null on the server or when storage is unavailable
 * (private mode, blocked storage) — callers must treat the id as best-effort.
 */

const STORAGE_KEY = "ayurser_device_id";

export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Storage blocked (private mode, hardened browser). The minute still works;
    // it just won't be remembered on this device. Never throw at this boundary.
    return null;
  }
}
