# Ayurser

*Life-being.* A calm, one-minute daily check-in — a living health journal, inspired by Ayurveda.

Answer five gentle questions and receive one considered result: a focus, and a few quiet lines (Eat / Ritual / Breath / Move). The engine reads which *qualities* (gunas) are running high today and offers their opposites — *"like increases like; opposites restore balance"* (Ashtanga Hridaya, Sutrasthana 1.13½).

> Lifestyle guidance inspired by Ayurveda — not medical advice.

This is the **Next.js foundation** (Phase 0) replacing the original static prototype. The old static app is preserved untouched in [`legacy/index.html`](legacy/index.html). See [`PHILOSOPHY.md`](PHILOSOPHY.md) and [`ROADMAP.md`](ROADMAP.md).

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm test             # engine unit tests (vitest)
```

The check-in works fully **without** any database. Persistence is wired but dormant until you add a Postgres connection string (below).

---

## Activate persistence (optional — capture early, interpret later)

The journal records every check-in so it can one day notice patterns. The browser POSTs each completed check-in to a server Route Handler (`app/api/check-in/route.ts`), which inserts it into **Neon / Vercel Postgres** using a **secret, server-only** connection string — the browser never touches the database. Until the env var is present, saving silently no-ops and never blocks the minute. To turn it on:

1. **Provision a database** — Neon, or the Neon integration in the Vercel dashboard (always-warm, Postgres).
2. **Add the connection string.** Copy `.env.local.example` to `.env.local` and set `DATABASE_URL` (the app also accepts `POSTGRES_URL`, which Vercel's Neon integration may inject):
   ```bash
   cp .env.local.example .env.local
   # then edit DATABASE_URL=postgres://...   (SECRET — never NEXT_PUBLIC_)
   ```
3. **Run the migration.** Apply [`migrations/0001_check_ins.sql`](migrations/0001_check_ins.sql) against the database (e.g. `psql "$DATABASE_URL" -f migrations/0001_check_ins.sql`). It creates the `check_ins` table and the `(device_id, created_at desc)` index. No RLS — access is server-side via the connection string.
4. **Restart `npm run dev`.** Completed check-ins now POST to `/api/check-in` and write to `check_ins`, keyed by an anonymous per-device id stored in `localStorage`.

---

## Structure

```
app/            Next.js App Router — globals.css (design tokens), layout, the check-in page,
                api/check-in/route.ts (server-side save endpoint)
lib/            engine.ts (the qualities engine, pure + unit-tested) and the edges:
                db.ts (server Postgres), device.ts, saveCheckIn.ts
migrations/     0001_check_ins.sql (plain Postgres)
legacy/         the preserved static prototype (index.html)
prototype/      engine.html — the hand-built reference (palette, voice, content)
knowledge/      cited Ayurveda notes the engine draws from
```

The engine is the heart: it is quality-based (never dosha-counting), pure, and deterministic. The dosha name (wind / fire / earth) is only a gentle gloss on the read-out — *weather, not label*. Mixed and balanced are first-class outcomes.

Built by Alex. Phase 0 foundation.
