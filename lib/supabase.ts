/**
 * A thin Supabase browser client — wired but dormant.
 *
 * Persistence is best-effort and entirely optional in local development. If the
 * two public env vars are absent, this returns null and the app simply does not
 * remember — the one-minute check-in is never blocked or broken.
 *
 * Env vars (see .env.local.example):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Only the anon (public) key is used here — it is safe to ship to the browser.
 * No secrets live in source.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Dormant by design: no keys locally => no-op persistence.
    cached = null;
    return cached;
  }

  cached = createClient(url, anonKey, {
    auth: {
      // Anonymous device journal — no user sessions to persist or refresh.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
