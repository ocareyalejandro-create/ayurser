/**
 * The feeling → wisdom map.
 *
 * The five-tap check-in reads the weather; the open door lets a person say how
 * they feel in their OWN words. This module meets those words: it recognises a
 * small set of common felt experiences and answers each in our own voice — the
 * convergent wisdom of the lineage, plainly.
 *
 * OUR VOICE — quiet and reverent. Spare, calm, almost meditative. Rules, so the
 * lexicon only ever grows in ONE author's voice (never a template):
 *  - Meet the felt experience in human terms FIRST. Translate, don't teach — do
 *    not open by naming the quality/mechanism.
 *  - Offer one or two grounded moves, spoken softly — never a checklist.
 *  - No template tails ("the classic answer", "tends to settle it"). Each line
 *    finds its own quiet close. Vary the cadence.
 *  - Weather, not label. Lifestyle only — never diagnosis or medical advice.
 *
 * Honesty, by design:
 *  - "We noticed you mentioned X" (the result's heading), never "you ARE X".
 *  - Where a feeling is ambiguous we say so and point to a real practitioner
 *    (the app=relationship, practitioner=intervention keystone — see PHILOSOPHY.md).
 *  - Provenance lives UNDERNEATH (the `source` field) — never shown inline; it
 *    pools into the References section later. We are our own author, crediting
 *    our influences lightly, and we never reproduce a source verbatim.
 *
 * Deterministic and pure: same words in, same matches out. No IO. This is the
 * honest first gear; an LLM that translates arbitrary prose (over our own cited
 * notes, never the raw books) is a later gear — same lungs, more air.
 */

import type { Quality } from "./engine";

export interface FeelingMatch {
  /** The experience we recognised, phrased to slot into "You mentioned ___." */
  readonly feeling: string;
  /** The qualities (gunas) this experience tends to signal — the engine's vocabulary. */
  readonly qualities: readonly Quality[];
  /** Our own-author response, in the quiet-and-reverent voice (see file header). */
  readonly response: string;
  /** Provenance, underneath — never shown inline; pooled into References later. */
  readonly source: string;
}

interface FeelingEntry extends FeelingMatch {
  /** Word-boundary patterns that signal this feeling. Case-insensitive. */
  readonly patterns: readonly RegExp[];
}

/** At most this many reflections — calm via restraint; never a wall. */
export const MAX_FEELINGS = 2;

/**
 * The lexicon. A small, high-confidence starter set of the most common felt
 * experiences. It grows over time (more feelings, richer responses); the engine
 * that consumes it does not change. Every response is in our one voice.
 */
const FEELINGS: readonly FeelingEntry[] = [
  {
    feeling: "bloating",
    patterns: [/\bbloat/i, /\bgassy\b/i, /\bflatulen/i, /\bdistend/i],
    qualities: ["dry", "mobile"],
    response:
      "Bloating and gas come when digestion loses its rhythm. Meet it with " +
      "warmth and simplicity — cooked food, gently spiced, eaten slowly and " +
      "unhurried. A calm meal is half the medicine.",
    source: "after Lad, *The Science of Self-Healing*, pp. 82–83 · Aṣṭāṅga Hṛdaya, Sū. 1.14",
  },
  {
    feeling: "dryness",
    patterns: [/\bdry\b/i, /\bdryness\b/i, /\bflaky\b/i, /\bchapped\b/i, /\bcracked\b/i],
    qualities: ["dry", "cold"],
    response:
      "Dryness is the body asking for what it lacks: warmth, and oil. Let the " +
      "food be cooked and warm, the water unhurried, and take a moment to oil " +
      "the skin before you wash. Old, simple, kind.",
    source: "after Lad, *The Science of Self-Healing*, p. 128 · Aṣṭāṅga Hṛdaya, Sū. 2.8–9",
  },
  {
    feeling: "feeling restless or anxious",
    patterns: [
      /\banxious\b/i,
      /\banxiety\b/i,
      /\bwired\b/i,
      /\brestless\b/i,
      /\bracing\b/i,
      /\bscattered\b/i,
      /\boverwhelm/i,
      /\bon edge\b/i,
    ],
    qualities: ["mobile", "light"],
    response:
      "A restless, scattered mind is the wind rising in you. Meet it with weight " +
      "and warmth — a slower pace, a steady routine, breath drawn long and " +
      "unhurried. The body remembers how to settle when you stop asking it to rush.",
    source: "after Lad, *The Science of Self-Healing* (Vāta) · Aṣṭāṅga Hṛdaya, Sū. 1",
  },
  {
    feeling: "feeling heavy or foggy",
    patterns: [
      /\bheavy\b/i,
      /\bsluggish\b/i,
      /\bfoggy\b/i,
      /\bgroggy\b/i,
      /\blethargic\b/i,
      /\bunmotivated\b/i,
      /\bcongested\b/i,
    ],
    qualities: ["heavy", "dull"],
    response:
      "Heaviness and fog settle when the body slows too far. Not more rest, but " +
      "gentle motion answers it — a little warmth, a little stir, light food and " +
      "light movement, enough to lift the weight by a degree.",
    source: "after Lad, *The Science of Self-Healing*, p. 104 · Aṣṭāṅga Hṛdaya, Sū. 1.6½–7½",
  },
  {
    feeling: "feeling hot or irritable",
    patterns: [
      /\birritable\b/i,
      /\birritated\b/i,
      /\binflamed\b/i,
      /\bburning\b/i,
      /\bacidic\b/i,
      /\bheartburn\b/i,
      /\bflushed\b/i,
      /\boverheated\b/i,
      /\bhot\b/i,
    ],
    qualities: ["hot", "sharp"],
    response:
      "Heat — in the skin, in the temper — is fire asking for shade. Cool, sweet, " +
      "simple food; calm over effort; nothing rushed in the warm hours. Let the " +
      "edge soften before you meet the day.",
    source: "after Lad, *The Science of Self-Healing* (Pitta) · Aṣṭāṅga Hṛdaya, Sū. 1",
  },
  {
    feeling: "restless sleep",
    patterns: [
      /\binsomnia\b/i,
      /\brestless sleep\b/i,
      /\bbroken sleep\b/i,
      /\bcan'?t sleep\b/i,
      /\bkeep waking\b/i,
      /\bkept waking\b/i,
      /\btossing\b/i,
    ],
    qualities: ["mobile", "light"],
    response:
      "Broken sleep follows a mind still in motion at nightfall. Let the evening " +
      "grow warm and quiet — a settled meal, dimmed light, less screen — and give " +
      "the body the slowness it needs to fall.",
    source: "after Lad, *The Science of Self-Healing*, p. 102 · Aṣṭāṅga Hṛdaya, Sū. 2",
  },
  {
    feeling: "low energy",
    patterns: [
      /\btired\b/i,
      /\bexhausted\b/i,
      /\bdrained\b/i,
      /\bfatigue/i,
      /\bworn out\b/i,
      /\bno energy\b/i,
      /\blow energy\b/i,
    ],
    qualities: [],
    response:
      "Low energy keeps many doors. Begin gently — warmth, real nourishment, " +
      "true rest — and notice what returns. If the tiredness lingers, let a " +
      "practitioner look closer; some things ask for a human eye.",
    source: "after Lad, *The Science of Self-Healing*",
  },
];

/**
 * Recognise the felt experiences named in a free-text note. Returns at most
 * MAX_FEELINGS matches, in lexicon order. Empty when nothing is recognised — we
 * stay silent rather than guess (an empty result is never a failure).
 */
export function scanFeelings(note: string): readonly FeelingMatch[] {
  const text = note.trim();
  if (!text) return [];

  const matches: FeelingMatch[] = [];
  for (const entry of FEELINGS) {
    if (entry.patterns.some((re) => re.test(text))) {
      matches.push({
        feeling: entry.feeling,
        qualities: entry.qualities,
        response: entry.response,
        source: entry.source,
      });
      if (matches.length >= MAX_FEELINGS) break;
    }
  }
  return matches;
}
