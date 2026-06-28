# Builder Context — Last updated: 2026-06-28, Phase 0 foundation (branch feat/next-foundation)

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
- The qualities engine (`lib/engine.ts`): quality-based (NOT dosha-counting), 10 qualities / 5 opposed pairs, 5 questions, `SPEAKING_THRESHOLD=2`, opposites pacify, balanced + mixed first-class, dosha as gentle read-out gloss. Content lines adapted from `prototype/engine.html`.
- The check-in UI (`app/page.tsx`): intro → 5 questions (quiet progress + Back) → result card → Again. Seam left for the future "why did we ask?" learn card.
- Supabase capture wired but dormant: `supabase.ts` / `device.ts` / `saveCheckIn.ts` + migration `0001`.
- README updated; `.env.local.example` added.

## Current State
- All passing: 15 engine tests, `npx tsc --noEmit` clean, `npx next build` static success, `npm run dev` serves the check-in (verified 200, intro renders).
- Working tree clean. 6 focused commits on `feat/next-foundation` (off master). NOT merged, NOT deployed.
- Known issue: `npm audit` flags 1 high/1 moderate in next@14's transitive postcss — only fixable via major bump to next@16 (deferred, out of scope).

## Key Decisions Made
- Hand-scaffolded (no create-next-app) to keep deps minimal per PHILOSOPHY restraint.
- RLS: anon-INSERT-only at this phase (least privilege); reads are a later scoped phase. Documented in the SQL.
- Anonymous device UUID in localStorage (`ayurser_device_id`) — no auth, "the app that sends you away."
- Mixed never broken by array order; balanced is an honest outcome.

## Next Steps
- Alex: review the branch; activate Supabase (create project → `.env.local` → run migration 0001 → restart dev). Then decide on merge.
- Later phases (NOT now): the opt-in learn card (seam is in `page.tsx`), time-of-day weighting, cycle layer (Vanessa's domain), pattern-noticing intelligence on top of captured data.
