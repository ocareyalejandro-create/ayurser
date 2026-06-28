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

The check-in works fully **without** any database. Persistence is wired but dormant until you add Supabase (below).

---

## Activate Supabase (optional — capture early, interpret later)

The journal records every check-in so it can one day notice patterns. Until env vars are present, saving silently no-ops and never blocks the minute. To turn it on:

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Add the two public env vars.** Copy `.env.local.example` to `.env.local` and fill in your project URL and **anon (public)** key:
   ```bash
   cp .env.local.example .env.local
   # then edit NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
3. **Run the migration.** In the Supabase SQL Editor, paste and run [`supabase/migrations/0001_check_ins.sql`](supabase/migrations/0001_check_ins.sql). It creates the `check_ins` table, enables Row Level Security, and adds an anon-insert policy appropriate for an anonymous-device journal (the rationale is documented in the SQL).
4. **Restart `npm run dev`.** Completed check-ins now write to `check_ins`, keyed by an anonymous per-device id stored in `localStorage`.

---

## Structure

```
app/            Next.js App Router — globals.css (design tokens), layout, the check-in page
lib/            engine.ts (the qualities engine, pure + unit-tested) and the edges:
                supabase.ts, device.ts, saveCheckIn.ts
supabase/       migrations/0001_check_ins.sql
legacy/         the preserved static prototype (index.html)
prototype/      engine.html — the hand-built reference (palette, voice, content)
knowledge/      cited Ayurveda notes the engine draws from
```

The engine is the heart: it is quality-based (never dosha-counting), pure, and deterministic. The dosha name (wind / fire / earth) is only a gentle gloss on the read-out — *weather, not label*. Mixed and balanced are first-class outcomes.

Built by Alex. Phase 0 foundation.
