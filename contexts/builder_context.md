# Builder Context — Last updated: 2026-06-28, persistence moved Supabase → Neon/Vercel Postgres (branch feat/next-foundation)

## Project Structure
- `app/` — Next.js 14 App Router. `globals.css` (design tokens), `layout.tsx` (next/font), `page.tsx` (the check-in, client component), `checkin.module.css`, `api/check-in/route.ts` (server-side save endpoint).
- `lib/` — `engine.ts` (the heart, pure) + `engine.test.ts`; edges: `db.ts` (server Postgres), `device.ts`, `saveCheckIn.ts`.
- `migrations/0001_check_ins.sql` — the journal's memory (plain Postgres).
- `legacy/index.html` — the preserved static prototype (moved off root).
- `prototype/`, `knowledge/`, `references/` (gitignored), `*.md` — left as-is. Reference for palette/voice/content.
- `.env.local.example` — `DATABASE_URL` (SECRET, server-only; `POSTGRES_URL` fallback).

## Established Patterns
- Next.js 14 App Router + TypeScript strict (`noUncheckedIndexedAccess` on). Path alias `@/*`.
- NO Tailwind, NO UI kit. Plain CSS: global tokens (`:root`) + CSS modules. Two fonts (Cormorant Garamond + Inter via next/font), one accent (`--terra` #B87A54). Palette is locked; the third brown is killed.
- Tests: vitest, `lib/**/*.test.ts`, node env (engine is pure). Run `npm test`.
- Engine is pure/deterministic, no IO. Side effects (persistence) live only in the lib edges.
- Persistence is fire-and-forget; errors swallowed ONLY in `saveCheckIn.ts` (documented exception). Everything else fails loudly.

## What Has Been Built
- The qualities engine (`lib/engine.ts`): quality-based (NOT dosha-counting), 10 qualities / 5 opposed pairs, 5 questions, `SPEAKING_THRESHOLD=2`, opposites pacify, balanced + mixed first-class, dosha as gentle read-out gloss.
- CONTENT now wired to `knowledge/ayurveda.md` (real, cited). `Guidance` = ONE loud `anchor` + quiet quartet `eat`/`ritual`/`breath`/`move`. Each is a `GuidanceLine { text, detail, source }` — `detail`+`source` are the tappable why/how + citation, co-located with the recommendation. `CLUSTER_CONTENT` (single), `MIXED_OVERLAP` (the 3 honest pair-overlaps, keyed order-independently via `mixedKey`), `BALANCED`. Food corrected: Vata warm/cooked/moist/oily (no raw cucumber); Pitta cooling, coconut only tentative; Kapha light/warm/dry/spiced. `ritual` = dinacharya element (tongue scraping + warm water / gandūṣa oil-pull / dry rub udvartana), kept DISTINCT from the anchor so they don't echo.
- The check-in UI (`app/page.tsx`): intro → 5 questions → result. Result = loud `Anchor` ("One thing") + quiet `GuidanceRow`s (Eat/Ritual/Breath/Move), each with a restrained `WhyToggle` (underlined "More" → reveals detail+source, hidden by default). CSS for anchor/why/detail in `checkin.module.css`.
- Persistence (SAVE path) — Neon/Vercel Postgres, server-side. Browser `saveCheckIn.ts` POSTs `{deviceId, answers, qualities, outcome}` to `app/api/check-in/route.ts`, which validates defensively and inserts via `lib/db.ts` (neon serverless SQL tag). Connection string is server-only secret (`DATABASE_URL` → `POSTGRES_URL` fallback). DORMANT when no env var: route returns 200 `{saved:false,reason:"dormant"}`, never blocks the minute. `device.ts` unchanged. READ path is a later task.

## Current State
- All passing: 28 engine tests (`npx vitest run`), `npx tsc --noEmit` clean, `next build` green (route registered `ƒ /api/check-in`), dev server :3000 serves 200, dormant POST verified 200 `{saved:false}`.
- Working tree clean. 5 new focused commits on `feat/next-foundation` (knowledge→guidance, ritual+label, footer, citations, persistence rework). NOT merged, NOT deployed.
- Known issue (unchanged): `npm audit` flags next/postcss/esbuild (dev toolchain) transitive — deferred; none from `@neondatabase/serverless`.

## Key Decisions Made
- Hand-scaffolded (no create-next-app) to keep deps minimal per PHILOSOPHY restraint.
- Neon/Vercel Postgres over Supabase (free tier pauses; Neon always-warm + Vercel-native; D1 would need a separate Worker). Server-side insert via Route Handler — browser never touches the DB; no RLS needed (connection string is the trust boundary).
- Anonymous device UUID in localStorage (`ayurser_device_id`) — no auth, "the app that sends you away." Sent in the POST body.
- Mixed never broken by array order; balanced is an honest outcome.

## Next Steps
- Journal READ route (fetch a device's history by `(device_id, created_at desc)`) is the next persistence task — not built yet.
- Alex provisions the DB (Neon / Vercel Neon integration), sets `DATABASE_URL`, runs `migrations/0001_check_ins.sql`, restarts dev. Then decide merge.
- Breath/Move depth honest-but-thin ("Frawley, *Yoga & Ayurveda* — to be deepened"); deepen later with real citations (no yoga reviewer yet).
- Mixed `MIXED_OVERLAP` menu calls are reasoned synthesis — worth a practitioner pass. Later: opt-in learn card (seam in `page.tsx`), time-of-day weighting, cycle layer, pattern-noticing.
