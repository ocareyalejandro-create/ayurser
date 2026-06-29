# The Ayurser Tree — Biology First

> Design the nature before the code. Once the rules of the living thing make sense,
> building it becomes almost mechanical. This document is the biology, not the implementation.

**Status:** Phase 5 design artifact. Captured 2026-06-29. NOT yet being built.
Gated on the one-minute check-in persisting and earning a real person's tomorrow first.

---

## What the tree *is*

The tree is not a feature. It is the **main character** of Ayurser — the way Duo *is*
Duolingo and the contribution graph *is* GitHub. When someone thinks of Ayurser, we want
them to think: *"the tree that grows with me."*

It is the **living journal**. No calendar, no timeline, no dashboard. You don't scroll
your history — you walk through it. The tree *is* the memory.

And it is not a tree of Ayurvedic theory. It is **a tree of your relationship with your
own body** — which is universal. After a year you never see `Vata 47% / Pitta 32%`. You
see a tree that grew because you learned what helps you: breathwork, morning sunlight,
warm meals, stretching, sleep, connection. Things anyone understands, whether or not
they have ever heard the word "dosha."

---

## The Law (what the tree must never do)

- **No scores. No levels. No streaks. No "100% complete." No XP.**
- It grows from **choices, not compliance.** Finishing a breath practice grows a root —
  not because you kept a streak, but because you *chose* something that supports you.
- It **grows only; it never shames.** A skipped day is not punished.
- **Falling leaves are change, not failure** — habits or phases you've outgrown.
- It tells your story. It does not measure you.

If the tree ever makes someone feel watched, graded, or behind, the design has failed.

---

## The Biology (each part, and what it means)

| Part | Represents |
|------|------------|
| 🌱 **Seed** | The beginning of your journey — the Ayurser symbol itself |
| 🫚 **Roots** | Habits that support you (breathwork, nourishing meals, sleep, movement) |
| 🌳 **Trunk** | Time and consistency — *not* perfection |
| 🌿 **Branches** | Dimensions of wellbeing (energy, digestion, mind, rest, connection…) |
| 🍃 **Leaves** | Meaningful journal moments and reflections |
| 🌸 **Blossoms** | Periods of thriving / experienced balance |
| 🍎 **Fruit** | Personal insights *you* discovered about your own body |
| 🍂 **Falling leaves** | Habits or phases you've outgrown — change, not failure |

### Roots, by pigment (earned, never legended)
- 🟤 **Warm ochre** — nourishing practices
- 🔵 **Soft indigo** — breathing
- 🟢 **Sage** — movement
- 🟡 **Golden turmeric** — food

No key, no legend. After months a user simply *knows*: "my tree has so much indigo —
that's all the breathing I've done." Their practice, made visible to them alone.

---

## The logo is the seed (the visual signature)

Every user begins with **exactly the same seed: the Ayurser symbol.** Not an acorn, not
a generic seed — *the mark.* Over months it slowly unfolds into the tree, so the logo is
literally *alive*. However mature the tree becomes, it still reads, unmistakably, as
**"an Ayurser tree."**

**Aesthetic register:** almost sacred, never realistic. Japanese botanical illustration,
Ayurvedic manuscript, fine ink line, watercolour wash, soft paper texture. Hand-painted,
intentional — never a clip-art plant.

**The vessel:** the tree grows from a **handmade ceramic bowl** inspired by Ayurvedic
medicine. The bowl never changes — it is your foundation. The tree grows; the vessel
holds. Cared-for, intentional, timeless.

---

## Weather, not label (the one correction baked in)

The tree expresses **today's weather** (Vikriti), never a fixed identity.

- Its **health and harmony tell the story, and they change**: windswept → grounded;
  sun-scorched leaves → fresh green growth; a heavy closed canopy → light filtering
  through as balance returns. This is on-brand and beautiful.
- What we hold **loosely**: any *dosha character* of the tree. It is **never stamped on
  day one** from thin data, never named before the experience earns it. A user could go
  six months without ever seeing the word "Vata," then one day meet it as: *"oh — this
  explains what I've already been noticing."* Jargon as reward, not toll.
- The tree says *"we noticed,"* never *"you are."*

---

## How you move through it (experiences, not days)

Days do not become leaves — **experiences do.** Three years of daily entries would be
1,000 unnavigable leaves. Instead leaves grow in **clusters** (a canopy / grapevine).

**Pinch to zoom**, like Apple Photos or Google Maps:

`whole tree → branches → twigs → leaf clusters → a single leaf → that day's journal`

You aren't scrolling a timeline. You're exploring your own life.

---

## The gardener (the engine, in spirit)

Each night the engine asks **"what *grew* today?"** — never "what score?"

> Today: slept well · did Nadi Shodhana · warm meals
> → grow a breath root · add a leaf on the energy branch · raise blossom-chance on mind

Pattern-driven, tied to **choices**, never random animation. Far later, the gardener
earns the right to surface a **fruit** — an insight from the user's *own* evidence:
*"you've had warm ginger tea on 14 evenings; on 11 you reported less bloating — worth
keeping."* That power requires **months of persisted data** (see Prerequisite).

---

## How it's drawn (the buildable approach — for later)

- **Modular "LEGO" art**, one cohesive hand-drawn set: 1 trunk, ~8 branch pieces,
  12 root pieces, 15 leaf types, 6 flowers, 4 fruits. The app assembles from sockets /
  growth-points on the trunk. Everything matches because it's one set.
  (Rejected: illustrator-draws-every-stage = boring & identical for all;
  AI-generates = inconsistent, off-brand.)
- **Deterministic, not procedurally random.** Each user gets a hidden seed (e.g. `839182`).
  Tree shape = f(seed, choice-history) → fully reproducible. Reinstall on a new phone →
  the *exact same tree*, forever. (Minecraft-terrain-gen, but for a life.)
- **Animation = quiet wonder, never "pop".** Time-lapse: roots crawl through soil, a leaf
  unfolds, a blossom opens over ~3s, an old leaf gently falls. Ambient life: leaves sway,
  a bird lands, morning light, night, rain, wind. *The tree breathes.*

---

## The seed moment (the feeling we're chasing)

First check-in → **no fanfare. No confetti. No "Congratulations!"** Just a tiny seed
placed in the ceramic pot. A week later, unprompted, the user opens the app and finds a
green shoot. *No one told them it would grow.* That quiet surprise — "something has been
alive while I was living my life" — is the whole point. **Wonder, not excitement.**

### Growth, roughly
week 1: a root · week 2: a stem · month 2: a branch curls · month 6: canopy forms ·
year 3: a mature tree — and still, recognisably, the logo.

---

## Prerequisite (the hard dependency — read this twice)

**Every leaf is a persisted check-in.** The tree is *literally impossible* without
durable storage of every check-in from the first morning. *Capture early, interpret
later.* No persistence → no seed, ever. This is why turning on the database comes before
a single line of tree code — and why it is the highest-leverage work for this entire
vision, today.

---

## Open questions to settle (in design, before any art or code)

1. The full life-cycle as *nature*: seed → sprout → roots → first leaf → branch → blossom
   → fruit → falling leaf → seasons. Define the rules before drawing.
2. What single choice grows what, and by how much? (the root/leaf/blossom mapping)
3. When (if ever) does the dosha *character* gently emerge — and how do we keep it weather?
4. Branch taxonomy: which dimensions of wellbeing are branches, and are they fixed?
5. Seasons — do they track real seasons (ritucharya), the user's state, or both?
