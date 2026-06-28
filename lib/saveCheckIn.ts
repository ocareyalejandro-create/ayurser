/**
 * Persist one completed check-in — fire-and-forget, best-effort.
 *
 * "Capture early, interpret later." We record every check-in from the first
 * morning so the journal can one day notice patterns. But persistence must NEVER
 * interrupt the user's minute: if Supabase is dormant (no keys), if the device
 * has no id, or if the network fails, we degrade silently. Errors are swallowed
 * at THIS boundary only — that is the deliberate, documented exception.
 */

import { getSupabase } from "./supabase";
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
    const supabase = getSupabase();
    if (!supabase) return false; // dormant: no keys configured

    const deviceId = getDeviceId();
    if (!deviceId) return false; // no stable identity on this device

    const { error } = await supabase.from("check_ins").insert({
      device_id: deviceId,
      answers: record.answers,
      qualities: record.qualities,
      outcome: record.outcome,
    });

    if (error) {
      // Best-effort: log for observability, but do not surface to the user.
      console.warn("[ayurser] check-in not saved:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[ayurser] check-in save failed:", err);
    return false;
  }
}
