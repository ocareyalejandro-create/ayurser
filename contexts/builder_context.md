# Builder Context — Last updated: 2026-06-28, persistence moved Supabase → Neon/Vercel Postgres (branch feat/next-foundation)

## Project Structure
- `app/` — Next.js 14 App Router. `globals.css` (design tokens), `layout.tsx` (next/font), `page.tsx` (the check-in, client component), `checkin.module.css`, `api/check-in/route.ts` (server-side save endpoint).
- `lib/` — `engine.ts` (the heart, pure) + `engine.test.ts`; edges: `db.ts` (server Postgres), `device.ts`, `saveCheckIn.ts`.
- `migrations/0001_check_ins.sql` — the journal's memory (plain Postgres).
- `public/logo.png` — the real tree-of-life meditator logo (922×922 RGBA, TRANSPARENT bg), extracted from the design comp bundle. Rendered via `next/image`: large on the settle screen, small/faint (opacity .26) top-right of the result card.
- `legacy/index.html` — the preserved static prototype (moved off root).
- `prototype/`, `knowledge/`, `references/` (gitignored), `*.md` — left as-is. Reference for palette/voice/content.
- `.env.local.example` — `DATABASE_URL` (SECRET, server-only; `POSTGRES_URL` fallback).

## Established Patterns
- Next.js 14 App Router + TypeScript strict (`noUncheckedIndexedAccess` on). Path alias `@/*`.
- NO Tailwind, NO UI kit. Plain CSS: global tokens (`:root`) + CSS modules. Two fonts (Cormorant Garamond + Inter via next/font), one accent `--accent` #8C6236 (CTAs/taps/More), `--accent-deep` #79522B hover. Palette = approved Claude Design comp (warm brown-led); terracotta dropped. Motion keyframes `ac-fade/rise/breathe/pulse` in globals.
- Tests: vitest, `lib/**/*.test.ts`, node env (engine is pure). Run `npm test`.
- Engine is pure/deterministic, no IO. Side effects (persistence) live only in the lib edges.
- Persistence is fire-and-forget; errors swallowed ONLY in `saveCheckIn.ts` (documented exception). Everything else fails loudly.

## What Has Been Built
- The qualities engine (`lib/engine.ts`): quality-based (NOT dosha-counting), 10 qualities / 5 opposed pairs, 5 questions, `SPEAKING_THRESHOLD=2`, opposites pacify, balanced + mixed first-class, dosha as gentle read-out gloss.
- CONTENT now wired to `knowledge/ayurveda.md` (real, cited). `Guidance` = ONE loud `anchor` + quiet quartet `eat`/`ritual`/`breath`/`move`. Each is a `GuidanceLine { text, detail, source }` — `detail`+`source` are the tappable why/how + citation, co-located with the recommendation. `CLUSTER_CONTENT` (single), `MIXED_OVERLAP` (the 3 honest pair-overlaps, keyed order-independently via `mixedKey`), `BALANCED`. Food corrected: Vata warm/cooked/moist/oily (no raw cucumber); Pitta cooling, coconut only tentative; Kapha light/warm/dry/spiced. `ritual` = dinacharya element (tongue scraping + warm water / gandūṣa oil-pull / dry rub udvartana), kept DISTINCT from the anchor so they don't echo.
- The check-in UI (`app/page.tsx`) — RE-SKINNED to the approved Claude Design comp (harvested from `~/Downloads/Ayurser (2).html`, decoded from its bundled `__bundler/template`). Flow: settling open (breathing tree-of-life mark inline SVG + "How are you today?") → 5 questions (breathing progress, "One of five" labels, gentle Back) → result card (read-out sentence, ONE loud anchor in a warm panel, quiet Eat/Ritual/Breath/Move with "More" expander → cited depth, epigraph, separated disclaimer). Below the card: the **Wisdom** opt-in card (dosha explainer — three forces, Prakriti/Vikriti — BEHIND the tap, never up front) + the **practitioner teaser** ("Find a practitioner / Learn — Coming soon", honest). All comp placeholder copy REJECTED; substance is our engine + cited content. All styling in `checkin.module.css`.
- Persistence (SAVE path) — Neon/Vercel Postgres, server-side. Browser `saveCheckIn.ts` POSTs `{deviceId, answers, qualities, outcome}` to `app/api/check-in/route.ts`, which validates defensively and inserts via `lib/db.ts` (neon serverless SQL tag). Connection string is server-only secret (`DATABASE_URL` → `POSTGRES_URL` fallback). DORMANT when no env var: route returns 200 `{saved:false,reason:"dormant"}`, never blocks the minute. `device.ts` unchanged. READ path is a later task.

## Current State
- All passing: 28 engine tests (`npx vitest run`), `npx tsc --noEmit` clean, `next build` green (route `ƒ /api/check-in`). No dev server running (coordinator starts one for review).
- Working tree clean. Focused commits on `feat/next-foundation` (knowledge→guidance, ritual+label, footer, citations, persistence rework, + 2-commit surface re-skin). NOT merged, NOT deployed.
- Known issue (unchanged): `npm audit` flags next/postcss/esbuild (dev toolchain) transitive — deferred; none from `@neondatabase/serverless`.

## Key Decisions Made
- Hand-scaffolded (no create-next-app) to keep deps minimal per PHILOSOPHY restraint.
- Neon/Vercel Postgres over Supabase (free tier pauses; Neon always-warm + Vercel-native; D1 would need a separate Worker). Server-side insert via Route Handler — browser never touches the DB; no RLS needed (connection string is the trust boundary).
- Anonymous device UUID in localStorage (`ayurser_device_id`) — no auth, "the app that sends you away." Sent in the POST body.
- Mixed never broken by array order; balanced is an honest outcome.
- Re-skin: skin from the comp, substance from our engine. Comp placeholder content NOT imported. Tree-of-life ported as inline SVG (no raster dependency). The comp's name-onboarding/home/3-screen intro/swipe were NOT ported (out of scope; our flow has no name capture yet).

## Next Steps
- Journal READ route (fetch a device's history by `(device_id, created_at desc)`) is the next persistence task — not built yet.
- Possible later: name onboarding + returning-greeting + 3-screen first-run primer + swipe (all in the comp, deferred this pass). The "Wisdom"/"Find a practitioner" teaser is presentational only (no targets yet).
- FLAG (UX redundancy): the bottom teaser nav word was renamed "Learn"→"Wisdom" per request, but the opt-in explainer card is ALSO titled "Wisdom" — so the result screen now has TWO "Wisdom" entry points (the working opt-in card + the non-functional teaser link). Reconcile later (e.g. teaser → "Learn the basics", or make the teaser "Wisdom" the actual entry to a future Wisdom/Learn surface and retitle the opt-in card).
- Alex provisions the DB (Neon / Vercel Neon integration), sets `DATABASE_URL`, runs `migrations/0001_check_ins.sql`, restarts dev. Then decide merge.
- Breath/Move depth honest-but-thin ("Frawley, *Yoga & Ayurveda* — to be deepened"); deepen later with real citations (no yoga reviewer yet).
- Mixed `MIXED_OVERLAP` menu calls are reasoned synthesis — worth a practitioner pass. Later: opt-in learn card (seam in `page.tsx`), time-of-day weighting, cycle layer, pattern-noticing.
