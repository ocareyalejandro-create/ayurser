/**
 * Server-side Postgres access for the journal — Neon / Vercel Postgres.
 *
 * Wired but DORMANT by default: if no connection string is configured, this
 * returns null and the save path no-ops silently. The one-minute check-in is
 * never blocked by persistence.
 *
 * SERVER-ONLY. The connection string is a secret and must never reach the
 * browser — this module is imported only from Route Handlers (app/api/**),
 * never from a "use client" component. There is no NEXT_PUBLIC_ here on purpose.
 *
 * Env (see .env.local.example):
 *   DATABASE_URL   — preferred. The Neon/Postgres connection string (secret).
 *   POSTGRES_URL   — fallback. Vercel's Neon integration may inject this name.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null | undefined;

/** The connection string, or undefined when persistence is dormant. */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? undefined;
}

/**
 * The Neon SQL tag, or null when no connection string is configured.
 * Cached across invocations within a warm serverless instance.
 */
export function getSql(): NeonQueryFunction<false, false> | null {
  if (cached !== undefined) return cached;

  const url = databaseUrl();
  if (!url) {
    // Dormant by design: no connection string => no-op persistence.
    cached = null;
    return cached;
  }

  cached = neon(url);
  return cached;
}
