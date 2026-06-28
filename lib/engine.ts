/**
 * The qualities engine — the heart of Ayurser.
 *
 * It is QUALITY-BASED, never dosha-counting. Each check-in answer raises one or
 * more *qualities* (gunas). We tally those qualities, see which are "speaking"
 * (running high), and offer their OPPOSITES — the classical law:
 *
 *   "Equal qualities lead to increase; opposing qualities lead to decrease."
 *   — Ashtanga Hridaya, Sutrasthana 1.13½
 *
 * The dosha name (wind / fire / earth) is only a gentle gloss on the read-out —
 * "weather, not label." Mixed is a first-class outcome. Balanced is honest.
 *
 * This module is pure and deterministic: same answers in, same result out. No IO,
 * no side effects. Side effects (persistence) live at the edges. See PHILOSOPHY.md.
 */

// --- Qualities (gunas) -------------------------------------------------------

export const QUALITIES = [
  "cold",
  "hot",
  "dry",
  "oilydamp",
  "light",
  "heavy",
  "mobile",
  "stable",
  "sharp",
  "dull",
] as const;

export type Quality = (typeof QUALITIES)[number];

/**
 * The opposed pairs (AH Su. 1.18 — the ten opposed guna pairs are the toolkit).
 * A quality running high is pacified by the quality it is paired with.
 */
export const OPPOSITE: Readonly<Record<Quality, Quality>> = {
  cold: "hot",
  hot: "cold",
  dry: "oilydamp",
  oilydamp: "dry",
  light: "heavy",
  heavy: "light",
  mobile: "stable",
  stable: "mobile",
  sharp: "dull",
  dull: "sharp",
};

/**
 * A quality is "speaking" once its tally reaches this threshold across the five
 * answers. Named so it is trivial to tune as the engine learns.
 */
export const SPEAKING_THRESHOLD = 2;

// --- Questions ---------------------------------------------------------------

export type QuestionKey = "sleep" | "energy" | "body" | "digestion" | "mind";

export interface Option {
  /** The label shown to the person. */
  readonly label: string;
  /** The qualities this option raises. Empty = a calm, balanced answer. */
  readonly qualities: readonly Quality[];
}

export interface Question {
  readonly key: QuestionKey;
  readonly prompt: string;
  readonly options: readonly Option[];
}

/**
 * The five questions. Each option's quality tags are the contract the engine and
 * the UI share. Order of options is presentation only — it never breaks a tie.
 */
export const QUESTIONS: readonly Question[] = [
  {
    key: "sleep",
    prompt: "How did you sleep?",
    options: [
      { label: "Deep and restful", qualities: [] },
      { label: "Light, broken, kept waking", qualities: ["mobile", "light"] },
      { label: "Hot, restless, vivid", qualities: ["hot", "sharp"] },
      { label: "Heavy, long, hard to wake", qualities: ["heavy", "dull"] },
    ],
  },
  {
    key: "energy",
    prompt: "Your energy right now?",
    options: [
      { label: "Calm and steady", qualities: [] },
      { label: "Wired, restless, can't settle", qualities: ["mobile", "light"] },
      { label: "Driven, intense, a touch irritable", qualities: ["hot", "sharp"] },
      { label: "Sluggish, slow to start", qualities: ["heavy", "dull", "stable"] },
    ],
  },
  {
    key: "body",
    prompt: "How does your body feel?",
    options: [
      { label: "Comfortable", qualities: [] },
      { label: "Cold hands, dry skin or lips", qualities: ["cold", "dry"] },
      { label: "Warm, flushed, or inflamed", qualities: ["hot", "sharp"] },
      { label: "Heavy, puffy, congested, damp", qualities: ["cold", "heavy", "oilydamp"] },
    ],
  },
  {
    key: "digestion",
    prompt: "And your digestion?",
    options: [
      { label: "Steady, regular", qualities: [] },
      { label: "Irregular — hungry then not, gassy", qualities: ["dry", "mobile"] },
      { label: "Sharp — strong, acidic, burning", qualities: ["hot", "sharp"] },
      { label: "Dull — low appetite, heavy after", qualities: ["heavy", "dull"] },
    ],
  },
  {
    key: "mind",
    prompt: "And your mind today?",
    options: [
      { label: "Settled, clear", qualities: [] },
      { label: "Anxious, scattered, racing", qualities: ["mobile", "light"] },
      { label: "Irritable, intense, critical", qualities: ["hot", "sharp"] },
      { label: "Foggy, unmotivated, stuck", qualities: ["heavy", "dull"] },
    ],
  },
];

// --- Answers -----------------------------------------------------------------

/** A completed answer set: the chosen option index for each question key. */
export type Answers = Readonly<Partial<Record<QuestionKey, number>>>;

/** The full tally of every quality (0 for any not raised). */
export type QualityTally = Readonly<Record<Quality, number>>;

// --- Dosha gloss (the gentle read-out) --------------------------------------

export type Cluster = "wind" | "fire" | "earth";

/**
 * Which qualities lean toward which dosha gloss. A quality may belong to more than
 * one (e.g. cold reads both wind and earth) — this is honest, not a bug.
 *   Vata ≈ cold / dry / light / mobile
 *   Pitta ≈ hot / sharp
 *   Kapha ≈ heavy / dull / stable / oilydamp / cold
 */
const CLUSTER_QUALITIES: Readonly<Record<Cluster, readonly Quality[]>> = {
  wind: ["cold", "dry", "light", "mobile"],
  fire: ["hot", "sharp"],
  earth: ["heavy", "dull", "stable", "oilydamp", "cold"],
};

/** Human-facing names for each cluster: the real word + the plain image. */
export const CLUSTER_GLOSS: Readonly<Record<Cluster, { dosha: string; image: string }>> = {
  wind: { dosha: "Vata", image: "wind" },
  fire: { dosha: "Pitta", image: "fire" },
  earth: { dosha: "Kapha", image: "earth" },
};

// --- The result --------------------------------------------------------------

export type Outcome = "balanced" | "single" | "mixed";

export interface Guidance {
  /** A short focus, e.g. "Ground & Warm". */
  readonly focus: string;
  /** The read-out — weather, not label. Leads with qualities. */
  readonly readout: string;
  readonly eat: string;
  readonly ritual: string;
  readonly breath: string;
  readonly move: string;
}

export interface Result {
  readonly outcome: Outcome;
  /** Every quality and its tally — captured for the journal. */
  readonly tally: QualityTally;
  /** Qualities that reached the threshold, highest first. */
  readonly speaking: readonly Quality[];
  /** The qualities we offer in response (the opposites of the speaking ones). */
  readonly offering: readonly Quality[];
  /** The dosha clusters that are speaking (0 = balanced, 1 = single, 2+ = mixed). */
  readonly clusters: readonly Cluster[];
  readonly guidance: Guidance;
}

// --- Core logic --------------------------------------------------------------

function emptyTally(): Record<Quality, number> {
  const t = {} as Record<Quality, number>;
  for (const q of QUALITIES) t[q] = 0;
  return t;
}

/**
 * Tally every quality across the five answers. Unanswered questions and
 * out-of-range indices are ignored (defensive — the UI should never send them).
 */
export function tallyQualities(answers: Answers): QualityTally {
  const tally = emptyTally();
  for (const question of QUESTIONS) {
    const choice = answers[question.key];
    if (choice === undefined) continue;
    const option = question.options[choice];
    if (!option) continue;
    for (const quality of option.qualities) tally[quality] += 1;
  }
  return tally;
}

/**
 * The qualities that are "speaking" (tally >= threshold), strongest first.
 * Ties are broken by the fixed QUALITIES order purely for stable output — this
 * affects ordering only, never *which* outcome is returned.
 */
function speakingQualities(tally: QualityTally): Quality[] {
  return QUALITIES.filter((q) => tally[q] >= SPEAKING_THRESHOLD).sort(
    (a, b) => tally[b] - tally[a],
  );
}

/**
 * Which dosha clusters are speaking. A cluster speaks if any of its qualities is
 * speaking. Returned strongest first (by summed tally of its speaking qualities).
 */
function speakingClusters(speaking: readonly Quality[], tally: QualityTally): Cluster[] {
  const speakingSet = new Set(speaking);
  const clusters: Cluster[] = [];
  for (const cluster of ["wind", "fire", "earth"] as const) {
    if (CLUSTER_QUALITIES[cluster].some((q) => speakingSet.has(q))) clusters.push(cluster);
  }
  return clusters.sort((a, b) => clusterWeight(b, tally) - clusterWeight(a, tally));
}

function clusterWeight(cluster: Cluster, tally: QualityTally): number {
  return CLUSTER_QUALITIES[cluster].reduce((sum, q) => sum + tally[q], 0);
}

/**
 * Compute the full result from a completed answer set. Pure and deterministic.
 */
export function evaluate(answers: Answers): Result {
  const tally = tallyQualities(answers);
  const speaking = speakingQualities(tally);

  // BALANCED — nothing reached the threshold. An honest, first-class outcome.
  if (speaking.length === 0) {
    return {
      outcome: "balanced",
      tally,
      speaking: [],
      offering: [],
      clusters: [],
      guidance: GUIDANCE.balanced,
    };
  }

  // Offer the opposite of each speaking quality (deduped, order preserved).
  const offering = dedupe(speaking.map((q) => OPPOSITE[q]));
  const clusters = speakingClusters(speaking, tally);
  const outcome: Outcome = clusters.length >= 2 ? "mixed" : "single";

  return {
    outcome,
    tally,
    speaking,
    offering,
    clusters,
    guidance: buildGuidance(outcome, clusters, speaking),
  };
}

function dedupe<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

// --- Content layer -----------------------------------------------------------
// Adapted from prototype/engine.html's CONTENT object (drawn from knowledge/),
// re-expressed against the qualities-cluster model. One calm result, no bloat.

const CLUSTER_GUIDANCE: Readonly<Record<Cluster, Guidance>> = {
  wind: {
    focus: "Ground & Warm",
    readout: "",
    eat: "Warm, cooked, lightly oiled food — oats with ghee, soups, stews.",
    ritual: "Warm oil on the feet; a steady, unhurried routine.",
    breath: "Nadi Shodhana — slow alternate-nostril breathing.",
    move: "Slow, grounding movement; gentle forward folds.",
  },
  fire: {
    focus: "Cool & Soften",
    readout: "",
    eat: "Cooling foods — cucumber, coconut, mint, sweet fruit. Less heat and spice.",
    ritual: "Shade, a little rose water, an unhurried walk.",
    breath: "Sheetali — the cooling breath.",
    move: "Easy and non-competitive — gentle twists, a swim if you can.",
  },
  earth: {
    focus: "Stir & Lighten",
    readout: "",
    eat: "Light, warm, spiced food. Skip the heavy and the sweet.",
    ritual: "Dry brushing before a warm shower; open a window.",
    breath: "Kapalabhati — gentle, energising breath.",
    move: "Brisk movement — a few sun salutations to begin the day.",
  },
};

const GUIDANCE: Readonly<Record<"balanced", Guidance>> = {
  balanced: {
    focus: "In Balance",
    readout: "In balance — nothing pulling you off centre today.",
    eat: "Eat as you naturally would; favour warm, fresh, simple food.",
    ritual: "Keep the rhythms that are serving you.",
    breath: "A few slow breaths, simply to arrive.",
    move: "Move in whatever way feels good today.",
  },
};

/** Plain-language phrasing for a quality, used to build the read-out. */
const QUALITY_WORD: Readonly<Record<Quality, string>> = {
  cold: "cold",
  hot: "hot",
  dry: "dry",
  oilydamp: "damp",
  light: "light",
  heavy: "heavy",
  mobile: "restless",
  stable: "settled",
  sharp: "sharp",
  dull: "dull",
};

function buildGuidance(
  outcome: Outcome,
  clusters: readonly Cluster[],
  speaking: readonly Quality[],
): Guidance {
  const qualityWords = speaking.slice(0, 2).map((q) => QUALITY_WORD[q]);
  const qualityPhrase = joinWords(qualityWords);

  if (outcome === "mixed") {
    // Two clusters speak — say so honestly, and offer the overlap of their care.
    const [a, b] = [clusters[0]!, clusters[1]!];
    const focus = `${CLUSTER_GUIDANCE[a].focus} · ${CLUSTER_GUIDANCE[b].focus}`;
    const readout =
      `Today reads ${qualityPhrase} — two are speaking, ` +
      `${CLUSTER_GLOSS[a].image} and ${CLUSTER_GLOSS[b].image}. ` +
      `We'll tend both, gently.`;
    return {
      focus,
      readout,
      // Lead with the steadier of the two clusters' lines; both directions hold.
      eat: `${CLUSTER_GUIDANCE[a].eat} And: ${CLUSTER_GUIDANCE[b].eat}`,
      ritual: CLUSTER_GUIDANCE[a].ritual,
      breath: CLUSTER_GUIDANCE[a].breath,
      move: CLUSTER_GUIDANCE[a].move,
    };
  }

  // Single cluster speaking.
  const cluster = clusters[0]!;
  const gloss = CLUSTER_GLOSS[cluster];
  const base = CLUSTER_GUIDANCE[cluster];
  const readout = `Today reads ${qualityPhrase} — a ${gloss.image}-like morning (${gloss.dosha}).`;
  return { ...base, readout };
}

function joinWords(words: readonly string[]): string {
  if (words.length === 0) return "steady";
  if (words.length === 1) return words[0]!;
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]!}`;
}
