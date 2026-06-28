# Builder Context — Last updated: 2026-06-28, real knowledge wired into guidance + tappable depth (branch feat/next-foundation)

## Project Structure
- `app/` — Next.js 14 App Router. `globals.css` (design tokens), `layout.tsx` (next/font), `page.tsx` (the check-in, client component), `checkin.module.css`.
- `lib/` — `engine.ts` (the heart, pure) + `engine.test.ts`; edges: `supabase.ts`, `device.ts`, `saveCheckIn.ts`.
- `supabase/migrations/0001_check_ins.sql` — the journal's memory.
- `legacy/index.html` — the preserved static prototype (moved off root).
- `prototype/`, `knowledge/`, `references/` (gitignored), `*.md` — left as-is. Reference for palette/voice/content.
- `.env.local.example` — the two public Supabase env vars.

## Established Patterns
- Next.js 14 App Router + TypeScript strict (`noUncheckedIndexedAccess` on). Path alias `@/*`.
- NO Tailwind, NO UI kit. Plain CSS: global tokens (`:root`) + CSS modules. Two fonts (Cormorant Garamond + Inter via next/font), one accent (`--terra` #B87A54). Palette is locked; the third brown is killed.
- Tests: vitest, `lib/**/*.test.ts`, node env (engine is pure). Run `npm test`.
- Engine is pure/deterministic, no IO. Side effects (persistence) live only in the lib edges.
- Persistence is fire-and-forget; errors swallowed ONLY in `saveCheckIn.ts` (documented exception). Everything else fails loudly.

## What Has Been Built
- The qualities engine (`lib/engine.ts`): quality-based (NOT dosha-counting), 10 qualities / 5 opposed pairs, 5 questions, `SPEAKING_THRESHOLD=2`, opposites pacify, balanced + mixed first-class, dosha as gentle read-out gloss.
- CONTENT now wired to `knowledge/ayurveda.md` (real, cited). `Guidance` = ONE loud `anchor` + quiet trio `eat`/`breath`/`move`. Each is a `GuidanceLine { text, detail, source }` — `detail`+`source` are the tappable why/how + citation, co-located with the recommendation. `CLUSTER_CONTENT` (single), `MIXED_OVERLAP` (the 3 honest pair-overlaps, keyed order-independently via `mixedKey`), `BALANCED`. Food corrected: Vata warm/cooked/moist/oily (no raw cucumber); Pitta cooling, coconut only tentative; Kapha light/warm/dry/spiced.
- The check-in UI (`app/page.tsx`): intro → 5 questions → result. Result = loud `Anchor` ("One thing") + quiet `GuidanceRow`s, each with a restrained `WhyToggle` (underlined "Why?" → reveals detail+source, hidden by default). CSS for anchor/why/detail in `checkin.module.css`.
- Supabase capture wired but dormant: `supabase.ts` / `device.ts` / `saveCheckIn.ts` + migration `0001`.

## Current State
- All passing: 27 engine tests (`npx vitest run`), `npx tsc --noEmit` clean, dev server on :3000 serves 200. (Did NOT re-run `next build` this session — type+test green.)
- Working tree clean. 2 new focused commits on `feat/next-foundation`. NOT merged, NOT deployed.
- Known issue (unchanged): `npm audit` flags postcss in next@14 transitive — deferred.

## Key Decisions Made
- Hand-scaffolded (no create-next-app) to keep deps minimal per PHILOSOPHY restraint.
- RLS: anon-INSERT-only at this phase (least privilege); reads are a later scoped phase. Documented in the SQL.
- Anonymous device UUID in localStorage (`ayurser_device_id`) — no auth, "the app that sends you away."
- Mixed never broken by array order; balanced is an honest outcome.

## Next Steps
- Breath/Move depth is honest-but-thin (plain descriptions, sourced as "yoga–Ayurveda synthesis, to be deepened"). Deepen later from Frawley/Pole with real citations — NOT invented authority (no yoga reviewer yet).
- Mixed `MIXED_OVERLAP` menu calls are reasoned synthesis flagged "(confirm with practitioner)" — fine to surface, worth a practitioner pass later.
- Alex: review branch; activate Supabase; decide merge. Later: opt-in learn card (seam in `page.tsx`), time-of-day weighting (dosha clock is in knowledge), cycle layer, pattern-noticing.
