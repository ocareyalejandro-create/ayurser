/**
 * POST /api/check-in — persist one completed check-in, server-side.
 *
 * The browser POSTs a finished check-in here; we insert it into Postgres using
 * the secret connection string (which never leaves the server). This replaces
 * the old browser-anon-insert approach.
 *
 * Graceful / dormant: if no DATABASE_URL/POSTGRES_URL is configured (local dev
 * without a DB), we no-op and return 200 { saved: false }. Persistence must
 * NEVER block or break the one-minute check-in, so even unexpected failures are
 * logged and answered with a non-error "not saved" — the client treats this as
 * best-effort. This is the deliberate, documented swallow-at-the-boundary.
 *
 * Scope: SAVE path only. The journal READ route is a later, scoped task.
 */

import { getSql } from "@/lib/db";
import { QUESTIONS, type Outcome } from "@/lib/engine";

/** Node runtime: the Neon serverless driver works on edge or node; we pick node
 *  to keep parity with the rest of the app and avoid edge-only surprises. */
export const runtime = "nodejs";
/** Never cache a write endpoint. */
export const dynamic = "force-dynamic";

const VALID_OUTCOMES: ReadonlySet<Outcome> = new Set<Outcome>([
  "balanced",
  "single",
  "mixed",
]);

const VALID_QUESTION_KEYS: ReadonlySet<string> = new Set(QUESTIONS.map((q) => q.key));

/** The accepted POST body. Mirrors the client's CheckInRecord + device id. */
interface CheckInBody {
  readonly deviceId: string;
  readonly answers: Record<string, number>;
  readonly qualities: Record<string, number>;
  readonly outcome: Outcome;
  /** Optional free-text note — the person's own words. */
  readonly note?: string;
}

function isRecordOfNumbers(value: unknown): value is Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === "number");
}

/**
 * Validate and normalize the request body. Returns the typed body, or a short
 * reason string when invalid. Explicit, defensive — the boundary never trusts
 * the client.
 */
function parseBody(raw: unknown): CheckInBody | { error: string } {
  if (typeof raw !== "object" || raw === null) return { error: "body must be an object" };
  const b = raw as Record<string, unknown>;

  if (typeof b.deviceId !== "string" || b.deviceId.length === 0 || b.deviceId.length > 100) {
    return { error: "deviceId missing or invalid" };
  }
  if (!isRecordOfNumbers(b.answers)) return { error: "answers missing or invalid" };
  for (const key of Object.keys(b.answers)) {
    if (!VALID_QUESTION_KEYS.has(key)) return { error: `unknown answer key: ${key}` };
  }
  if (!isRecordOfNumbers(b.qualities)) return { error: "qualities missing or invalid" };
  if (typeof b.outcome !== "string" || !VALID_OUTCOMES.has(b.outcome as Outcome)) {
    return { error: "outcome missing or invalid" };
  }

  // The note is optional. Accept a string, trim it, cap its length, and treat an
  // empty note as absent (the door left closed). The boundary never trusts the client.
  let note: string | undefined;
  if (b.note !== undefined && b.note !== null) {
    if (typeof b.note !== "string") return { error: "note must be a string" };
    const trimmed = b.note.trim();
    if (trimmed.length > 2000) return { error: "note too long" };
    note = trimmed.length > 0 ? trimmed : undefined;
  }

  return {
    deviceId: b.deviceId,
    answers: b.answers as Record<string, number>,
    qualities: b.qualities as Record<string, number>,
    outcome: b.outcome as Outcome,
    note,
  };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  // Dormant: no DB configured => accept-and-skip, never an error.
  const sql = getSql();
  if (!sql) return json({ saved: false, reason: "dormant" }, 200);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ saved: false, error: "invalid JSON" }, 400);
  }

  const parsed = parseBody(raw);
  if ("error" in parsed) return json({ saved: false, error: parsed.error }, 400);

  try {
    await sql`
      insert into check_ins (device_id, answers, qualities, outcome, note)
      values (
        ${parsed.deviceId},
        ${JSON.stringify(parsed.answers)}::jsonb,
        ${JSON.stringify(parsed.qualities)}::jsonb,
        ${parsed.outcome},
        ${parsed.note ?? null}
      )
    `;
    return json({ saved: true }, 201);
  } catch (err) {
    // Best-effort: log for observability, but never surface a failure that would
    // make the user feel the minute "broke". The check-in already succeeded.
    console.warn("[ayurser] check-in not persisted:", err);
    return json({ saved: false, error: "persist failed" }, 200);
  }
}
