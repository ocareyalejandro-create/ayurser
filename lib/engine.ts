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

/**
 * One line of guidance, with tappable depth.
 *
 *   text   — the calm surface phrasing (what we say up front).
 *   detail — the "why / how", revealed only on tap. Paraphrased, never copied.
 *   source — the attribution, written as the knowledge file cites (e.g.
 *            "after Lad; AH Su. 2"). We cite; we do not reproduce.
 *
 * Keeping detail + source on the line (not in a separate lookup) keeps the
 * content map maintainable: recommendation and its evidence live together.
 */
export interface GuidanceLine {
  readonly text: string;
  readonly detail: string;
  readonly source: string;
}

/**
 * The result shape: ONE anchor loud, a supporting quartet quiet.
 *
 *   anchor — the single small frictionless thing for the morning (designed for
 *            the weak-willed morning: one kind ask, no willpower needed).
 *   eat / ritual / breath / move — sit quieter beneath it.
 *
 * `ritual` is a distinct daily-routine (dinacharya) element — kept different
 * from the anchor so the two don't echo.
 */
export interface Guidance {
  /** A short focus, e.g. "Ground & Warm". */
  readonly focus: string;
  /** The read-out — weather, not label. Leads with qualities. */
  readonly readout: string;
  /** The loud, single anchor for the morning. */
  readonly anchor: GuidanceLine;
  /** The quiet supporting set: Eat / Ritual / Breath / Move. */
  readonly eat: GuidanceLine;
  readonly ritual: GuidanceLine;
  readonly breath: GuidanceLine;
  readonly move: GuidanceLine;
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
      guidance: BALANCED,
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
// Drawn directly from knowledge/ayurveda.md. Every line carries its source.
// The governing law is the safe ground (AH Su. 1.13½): a quality running high is
// pacified by its opposite. Warm oil opposes Vata's dryness; cooling opposes
// Pitta's heat; little oil + movement opposes Kapha's heaviness.
//
// Honesty note: where the knowledge flags "(confirm with practitioner)" — coconut
// oil for Pitta, dry-brushing as the default Kapha practice — we do NOT present
// those as certain. We use the classical-grounded choices (sunflower/sandalwood
// for Pitta; less-or-no oil for Kapha) so nothing here over-claims.

/** The shape of a single cluster's guidance, before the read-out is computed.
 *  `ritual` is a dinacharya (daily-routine) element, kept distinct from anchor. */
interface ClusterContent {
  readonly focus: string;
  readonly anchor: GuidanceLine;
  readonly eat: GuidanceLine;
  readonly ritual: GuidanceLine;
  readonly breath: GuidanceLine;
  readonly move: GuidanceLine;
}

const CLUSTER_CONTENT: Readonly<Record<Cluster, ClusterContent>> = {
  // VATA — wind. Needs warm, cooked, moist, oily; grounding, steady.
  wind: {
    focus: "Ground & Warm",
    anchor: {
      text: "Warm sesame oil on the soles of your feet.",
      detail:
        "Sesame oil, gently warmed, on the soles at night — heavy and warming, " +
        "the exact opposite of wind's dry, cold, mobile qualities. A tiny, " +
        "low-effort ritual that calms the mind and settles you toward sleep.",
      source: "Lad, *The Science of Self-Healing*, p. 102 · Aṣṭāṅga Hṛdaya, Sū. 2.8–9",
    },
    eat: {
      text: "Warm, cooked, moist, lightly oiled food — soups, stewed fruit, oats with ghee.",
      detail:
        "Wind is dry, cold and light, so warm-cooked-moist-oily food pacifies it " +
        "and raw-cold-dry food feeds it. Favour cooked grains, soups, warm milk, " +
        "stewed apple or pear, a little ghee — not a cold raw salad. Sweet, sour " +
        "and salt tastes settle wind.",
      source: "Lad, *The Science of Self-Healing*, Table 5, pp. 82–83 · Aṣṭāṅga Hṛdaya, Sū. 1.14",
    },
    ritual: {
      text: "Scrape your tongue, then a glass of warm water — keep the morning steady and unhurried.",
      detail:
        "Wind is mobile and irregular, so a steady, predictable routine is itself " +
        "pacifying. Scraping the tongue clears the night's coating (āma); warm water " +
        "wakes digestion and the bowels gently. Same anchors each morning give wind " +
        "the walls it needs.",
      source: "Aṣṭāṅga Hṛdaya, Sū. 2.2–3 · Lad, *The Science of Self-Healing*, p. 100",
    },
    breath: {
      text: "Nadi Shodhana — slow alternate-nostril breathing, to steady.",
      detail:
        "Breathing gently through one nostril then the other, evenly and unhurried. " +
        "A steadying breath for a scattered, mobile morning. Keep it slow — avoid " +
        "fast or forceful breath when wind is high.",
      source: "Frawley, *Yoga & Ayurveda* — to be deepened",
    },
    move: {
      text: "Slow, grounding movement — gentle forward folds, a steady walk.",
      detail:
        "Wind asks for steadiness over intensity: slow, stable, grounding shapes " +
        "and a consistent rhythm rather than anything fast or jarring.",
      source: "Frawley, *Yoga & Ayurveda* — to be deepened",
    },
  },

  // PITTA — fire. Needs cooling, sweet, bitter, astringent; calm, shade.
  fire: {
    focus: "Cool & Soften",
    anchor: {
      text: "Find shade and slow down before the heat of the day.",
      detail:
        "Fire is hot and sharp, so coolness and calm pacify it. Step out of the " +
        "midday sun, let the pace ease, save hard effort for the cooler afternoon. " +
        "A hungry fire turns sharp — don't skip meals.",
      source: "Lad, *The Science of Self-Healing*, Diet p. 80 · Aṣṭāṅga Hṛdaya, Sū. 1",
    },
    eat: {
      text: "Cooling, sweet and bitter food — cucumber, leafy greens, sweet ripe fruit. Less heat and spice.",
      detail:
        "Sweet, bitter and astringent tastes cool fire; sour, salty and pungent " +
        "ones heat it. Favour sweet ripe fruit, leafy greens, cucumber, fennel, " +
        "coriander, mint. Ease off chili, garlic, sour and fermented food. (A " +
        "cooling oil like sunflower or sandalwood suits fire; coconut is common in " +
        "modern practice but worth confirming with a practitioner.)",
      source: "Lad, *The Science of Self-Healing*, Table 5 & Diet p. 80 · Aṣṭāṅga Hṛdaya, Sū. 1.14",
    },
    ritual: {
      text: "Oil-pulling or a cool-water swish, then scrape your tongue — a calm, unhurried start.",
      detail:
        "Gandūṣa — holding and swishing warm water or a little oil in the mouth — is " +
        "the classical root of oil-pulling; followed by scraping the tongue. A slow, " +
        "cooling morning ritual suits fire's heat and sharpness. (Sunflower or coconut " +
        "oil are cooling choices — coconut is common in modern practice, worth " +
        "confirming with a practitioner.)",
      source: "Aṣṭāṅga Hṛdaya, Sū. 2.6 · 2.2–3",
    },
    breath: {
      text: "Sheetali — the cooling breath.",
      detail:
        "A cooling breath: drawing the inhale across the tongue or through pursed " +
        "lips, so the air feels cool, then breathing out softly. Eases heat and " +
        "sharpness. A clear plain description for now — the how-to deepens later.",
      source: "Frawley, *Yoga & Ayurveda* — to be deepened",
    },
    move: {
      text: "Easy and non-competitive — gentle twists, a swim if you can.",
      detail:
        "Fire asks for ease over striving: cooling, unhurried, non-competitive " +
        "movement, away from midday heat and overexertion.",
      source: "Frawley, *Yoga & Ayurveda* — to be deepened",
    },
  },

  // KAPHA — earth. Needs light, warm, dry, well-spiced; less oil; movement.
  earth: {
    focus: "Stir & Lighten",
    anchor: {
      text: "Move first thing — don't linger in bed.",
      detail:
        "The early morning is Kapha time — heavy and slow — so movement is the " +
        "remedy: it breaks the heaviness and gets you going. Earth is the one type " +
        "that can do well to skip a heavy breakfast; eating in Kapha hours adds more " +
        "Kapha.",
      source: "Lad, *The Science of Self-Healing*, p. 104 · Aṣṭāṅga Hṛdaya, Sū. 1.6½–7½",
    },
    eat: {
      text: "Light, warm, dry, well-spiced food — go easy on oil, heavy and sweet.",
      detail:
        "Earth is heavy, cold, oily and slow, so light-warm-dry-spiced food " +
        "pacifies it. Favour pungent and bitter vegetables, light grains (barley, " +
        "millet), and plenty of warming spice — ginger, black pepper, turmeric. " +
        "Pungent, bitter and astringent tastes lighten earth; sweet, sour and salt " +
        "weigh it down.",
      source: "Lad, *The Science of Self-Healing*, Table 5 & Diet p. 80 · Aṣṭāṅga Hṛdaya, Sū. 1.14",
    },
    ritual: {
      text: "Scrape your tongue, then a brisk dry rub before a warm shower — wake the body up.",
      detail:
        "Earth is heavy and oily, so a dry, stimulating rub (udvartana) is the classical " +
        "answer — it lightens and rouses, the opposite of oiling. A vigorous towel rub " +
        "before a warm shower does the same. Skip oil massage when heaviness or " +
        "congestion is high.",
      source: "Aṣṭāṅga Hṛdaya, Sū. 2.15 · 2.8–9",
    },
    breath: {
      text: "Kapalabhati — gentle, energising breath.",
      detail:
        "A light, energising breath: short active exhales through the nose with a " +
        "passive inhale between. Warming and rousing for a heavy, slow morning. Keep " +
        "it gentle. A plain description for now — the how-to deepens later.",
      source: "Frawley, *Yoga & Ayurveda* — to be deepened",
    },
    move: {
      text: "Brisk, warming movement — a few sun salutations to begin the day.",
      detail:
        "Earth asks for stimulation and warmth: vigorous, lifting, heat-building " +
        "movement to clear heaviness and build momentum.",
      source: "Frawley, *Yoga & Ayurveda* — to be deepened",
    },
  },
};

/** The balanced outcome — a first-class, honest result. */
const BALANCED: Guidance = {
  focus: "In Balance",
  readout: "In balance — nothing pulling you off centre today.",
  anchor: {
    text: "A few slow breaths, simply to arrive — then go live your day.",
    detail:
      "Nothing is running high today, so there is nothing to correct. The kind " +
      "move is to keep the rhythms already serving you and step back into the day.",
    source: "Aṣṭāṅga Hṛdaya, Sūtrasthāna 1.13½",
  },
  eat: {
    text: "Eat as you naturally would; favour warm, fresh, simple food.",
    detail:
      "With nothing aggravated, warm, fresh, freshly cooked food keeps digestion " +
      "(agni) steady — the balanced state Ayurveda calls sama.",
    source: "Lad, *The Science of Self-Healing*, Diet pp. 80–81 · Aṣṭāṅga Hṛdaya, Sū. 1.7½",
  },
  ritual: {
    text: "Keep the morning rhythm that already serves you — tongue scraping, a glass of warm water.",
    detail:
      "Nothing is aggravated, so the work is simply to keep the steady daily routine " +
      "(dinacharya) going. Scraping the tongue and warm water on waking are gentle " +
      "anchors that suit everyone.",
    source: "Aṣṭāṅga Hṛdaya, Sū. 2.2–3 · Lad, *The Science of Self-Healing*, p. 100",
  },
  breath: {
    text: "A few slow breaths, simply to arrive.",
    detail: "No correction needed — just a moment to settle into the morning.",
    source: "—",
  },
  move: {
    text: "Move in whatever way feels good today.",
    detail: "Balanced means free to choose; follow what your body asks for.",
    source: "—",
  },
};

/** Mixed-state overlaps — the honest synthesis, NOT two lists piled together.
 *  Keyed by the unordered pair of clusters. Each pacifies BOTH without
 *  aggravating either (knowledge/ayurveda.md → "Mixed states — honest overlaps").
 *  The specific menu calls are reasoned synthesis — flagged for a practitioner. */
interface MixedContent {
  readonly focus: string;
  readonly anchor: GuidanceLine;
  readonly eat: GuidanceLine;
  readonly ritual: GuidanceLine;
}

const MIXED_OVERLAP: Readonly<Record<string, MixedContent>> = {
  // VATA + PITTA — warm-not-hot, moist, mildly sweet, cooked.
  "wind+fire": {
    focus: "Warm, Soft & Sweet",
    anchor: {
      text: "Keep it warm, not hot — slow down without going cold.",
      detail:
        "Wind wants warmth, fire wants cool — opposite temperatures. The honest " +
        "middle is warm-not-hot and unhurried: settle the wind without stoking the " +
        "fire. (Worth a practitioner's eye on the specifics.)",
      source: "Aṣṭāṅga Hṛdaya, Sūtrasthāna 1.13½",
    },
    eat: {
      text: "Sweet, moist, cooked food at a warm — not hot, not iced — temperature.",
      detail:
        "Sweet taste pacifies both wind and fire, so it is the common ground. " +
        "Favour cooked sweet grains, stewed sweet fruit, sweet cooked vegetables, a " +
        "little ghee, coriander or fennel. Avoid both errors: not raw-cold-dry (feeds " +
        "wind) and not hot-spicy-sour (feeds fire). Warm, soft, gently sweet, cooked.",
      source: "Aṣṭāṅga Hṛdaya, Sū. 1.14",
    },
    ritual: {
      text: "Scrape your tongue, then warm water — keep the morning steady and unhurried.",
      detail:
        "A calm, predictable routine settles wind without heating fire. Scraping the " +
        "tongue clears the night's coating (āma); warm water wakes digestion gently. " +
        "Steady and unhurried serves both.",
      source: "Aṣṭāṅga Hṛdaya, Sū. 2.2–3 · Lad, *The Science of Self-Healing*, p. 100",
    },
  },

  // PITTA + KAPHA — light, dry, bitter & astringent, not heavy.
  "fire+earth": {
    focus: "Light, Dry & Bitter",
    anchor: {
      text: "Keep it light — lightness is the common ground.",
      detail:
        "Fire wants cool, earth wants warm — opposite temperatures — so aim " +
        "warm-but-not-hot. The shared ground is lightness: both do best with food " +
        "and habits that are light and not oily. (Worth a practitioner's eye.)",
      source: "Aṣṭāṅga Hṛdaya, Sūtrasthāna 1.13½",
    },
    eat: {
      text: "Light, dry, bitter and astringent food — leafy greens, light grains; gentle spice.",
      detail:
        "Bitter and astringent tastes pacify both fire and earth, and both want " +
        "food that is light, not heavy and not oily. Favour leafy greens, broccoli, " +
        "cauliflower, light grains, beans, with spice used gently. Avoid both errors: " +
        "not hot-spicy-sour-salty (feeds fire) and not heavy-cold-oily-sweet (feeds earth).",
      source: "Aṣṭāṅga Hṛdaya, Sū. 1.14",
    },
    ritual: {
      text: "Scrape your tongue, then a brisk dry rub before a warm-but-not-hot shower.",
      detail:
        "A dry, stimulating rub (udvartana) lightens earth's heaviness; keeping the " +
        "water warm-but-not-hot avoids stoking fire. Light and rousing without heat — " +
        "the common ground for this pair.",
      source: "Aṣṭāṅga Hṛdaya, Sū. 2.15 · 2.2–3",
    },
  },

  // VATA + KAPHA — warm, light-but-nourishing, well-spiced, never cold.
  "wind+earth": {
    focus: "Warm & Well-Spiced",
    anchor: {
      text: "Keep it warm and well-spiced — never cold.",
      detail:
        "Both wind and earth are cold, so warmth and warming spices serve both — " +
        "the easy common ground. Cold food is the worst call here; it feeds both at " +
        "once. (Worth a practitioner's eye on the specifics.)",
      source: "Aṣṭāṅga Hṛdaya, Sūtrasthāna 1.13½",
    },
    eat: {
      text: "Warm, well-spiced, lightly nourishing food — spiced soups, cooked grains, ginger tea.",
      detail:
        "Warmth and warming spice (ginger, cumin, black pepper, turmeric) pacify " +
        "both. The tension is texture: wind wants moist/oily, earth wants dry/light. " +
        "So keep it warm and cooked (for wind) but not heavy, greasy or cold (for " +
        "earth) — moderate oil, generous spice. Avoid both errors: not cold-raw-dry " +
        "and not heavy-oily-dense.",
      source: "Aṣṭāṅga Hṛdaya, Sū. 1.14",
    },
    ritual: {
      text: "Scrape your tongue, then a glass of warm water — a steady, warming start.",
      detail:
        "Both wind and earth are cold, so a warm, steady morning suits both. Scraping " +
        "the tongue clears the night's coating (āma); warm water wakes digestion. Keep " +
        "it warm — never start the day cold.",
      source: "Aṣṭāṅga Hṛdaya, Sū. 2.2–3 · Lad, *The Science of Self-Healing*, p. 100",
    },
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

/** Stable key for a cluster pair, independent of which spoke louder. */
function mixedKey(a: Cluster, b: Cluster): string {
  const order: Record<Cluster, number> = { wind: 0, fire: 1, earth: 2 };
  return order[a] < order[b] ? `${a}+${b}` : `${b}+${a}`;
}

function buildGuidance(
  outcome: Outcome,
  clusters: readonly Cluster[],
  speaking: readonly Quality[],
): Guidance {
  const qualityWords = speaking.slice(0, 2).map((q) => QUALITY_WORD[q]);
  const qualityPhrase = joinWords(qualityWords);

  if (outcome === "mixed") {
    // Two clusters speak — name both, and offer the overlap that pacifies BOTH.
    const [a, b] = [clusters[0]!, clusters[1]!];
    const overlap = MIXED_OVERLAP[mixedKey(a, b)]!;
    const readout =
      `Today reads ${qualityPhrase} — two are speaking, ` +
      `${CLUSTER_GLOSS[a].image} and ${CLUSTER_GLOSS[b].image}. ` +
      `We'll tend both at once, gently.`;
    // Breath & move: lead with the louder cluster's practice (clusters are
    // ordered strongest-first); both directions hold for a mixed morning.
    const lead = CLUSTER_CONTENT[a];
    return {
      focus: overlap.focus,
      readout,
      anchor: overlap.anchor,
      eat: overlap.eat,
      ritual: overlap.ritual,
      breath: lead.breath,
      move: lead.move,
    };
  }

  // Single cluster speaking.
  const cluster = clusters[0]!;
  const gloss = CLUSTER_GLOSS[cluster];
  const base = CLUSTER_CONTENT[cluster];
  const readout = `Today reads ${qualityPhrase} — a ${gloss.image}-like morning (${gloss.dosha}).`;
  return {
    focus: base.focus,
    readout,
    anchor: base.anchor,
    eat: base.eat,
    ritual: base.ritual,
    breath: base.breath,
    move: base.move,
  };
}

function joinWords(words: readonly string[]): string {
  if (words.length === 0) return "steady";
  if (words.length === 1) return words[0]!;
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]!}`;
}
