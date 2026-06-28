/**
 * Persist one completed check-in — fire-and-forget, best-effort.
 *
 * "Capture early, interpret later." We record every check-in from the first
 * morning so the journal can one day notice patterns. But persistence must NEVER
 * interrupt the user's minute.
 *
 * The browser POSTs the finished check-in to our own Route Handler
 * (`/api/check-in`), which inserts it into Postgres server-side. The DB
 * connection string lives only on the server — the browser never touches the
 * database. If the device has no id, or the request fails, or the server is
 * dormant (no DB configured), we degrade silently. Errors are swallowed at THIS
 * boundary only — the deliberate, documented exception.
 */

import { getDeviceId } from "./device";
import type { Answers, QualityTally, Outcome } from "./engine";

export interface CheckInRecord {
  /** The five raw answers (option indices per question key). */
  readonly answers: Answers;
  /** The tallied qualities. */
  readonly qualities: QualityTally;
  /** The read-out / cluster outcome (balanced | single | mixed). */
  readonly outcome: Outcome;
}

/**
 * Save a check-in. Resolves to true if the row was written, false if persistence
 * was skipped or failed. Always resolves — never rejects, never throws.
 */
export async function saveCheckIn(record: CheckInRecord): Promise<boolean> {
  try {
    const deviceId = getDeviceId();
    if (!deviceId) return false; // no stable identity on this device

    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceId,
        answers: record.answers,
        qualities: record.qualities,
        outcome: record.outcome,
      }),
      // The minute is already done; don't keep the page busy waiting on this.
      keepalive: true,
    });

    if (!res.ok) {
      console.warn("[ayurser] check-in not saved:", res.status);
      return false;
    }

    const body = (await res.json().catch(() => null)) as { saved?: boolean } | null;
    return body?.saved === true;
  } catch (err) {
    console.warn("[ayurser] check-in save failed:", err);
    return false;
  }
}
