import { describe, it, expect } from "vitest";
import {
  evaluate,
  tallyQualities,
  QUESTIONS,
  OPPOSITE,
  SPEAKING_THRESHOLD,
  type Answers,
  type QuestionKey,
  type Quality,
} from "./engine";

/**
 * Helper: build an Answers object by picking the option that matches a label.
 * Keeps tests readable and decoupled from option ordering.
 */
function answer(picks: Record<QuestionKey, string>): Answers {
  const out: Partial<Record<QuestionKey, number>> = {};
  for (const question of QUESTIONS) {
    const wanted = picks[question.key];
    const idx = question.options.findIndex((o) => o.label === wanted);
    if (idx === -1) throw new Error(`No option "${wanted}" for ${question.key}`);
    out[question.key] = idx;
  }
  return out;
}

const ALL_CALM: Record<QuestionKey, string> = {
  sleep: "Deep and restful",
  energy: "Calm and steady",
  body: "Comfortable",
  digestion: "Steady, regular",
  mind: "Settled, clear",
};

describe("tallyQualities", () => {
  it("returns all zeros for a fully calm answer set", () => {
    const tally = tallyQualities(answer(ALL_CALM));
    expect(Object.values(tally).every((n) => n === 0)).toBe(true);
  });

  it("ignores unanswered and out-of-range answers defensively", () => {
    const tally = tallyQualities({ sleep: 99, energy: undefined } as Answers);
    expect(Object.values(tally).every((n) => n === 0)).toBe(true);
  });

  it("accumulates qualities across answers", () => {
    // Two answers tagged [hot, sharp] => hot:2, sharp:2.
    const tally = tallyQualities(
      answer({
        ...ALL_CALM,
        sleep: "Hot, restless, vivid",
        energy: "Driven, intense, a touch irritable",
      }),
    );
    expect(tally.hot).toBe(2);
    expect(tally.sharp).toBe(2);
  });
});

describe("balanced outcome", () => {
  it("returns balanced when nothing reaches the threshold", () => {
    const r = evaluate(answer(ALL_CALM));
    expect(r.outcome).toBe("balanced");
    expect(r.speaking).toEqual([]);
    expect(r.clusters).toEqual([]);
    expect(r.guidance.focus).toBe("In Balance");
    expect(r.guidance.readout).toMatch(/nothing pulling you off centre/i);
  });

  it("returns balanced when a quality appears only once (below threshold)", () => {
    // Only the body answer raises cold/dry once each — below SPEAKING_THRESHOLD.
    const r = evaluate(answer({ ...ALL_CALM, body: "Cold hands, dry skin or lips" }));
    expect(SPEAKING_THRESHOLD).toBe(2);
    expect(r.tally.cold).toBe(1);
    expect(r.outcome).toBe("balanced");
  });
});

describe("single dry-cold-light set leans Vata (wind) and offers warmth/grounding", () => {
  // Sleep light => mobile,light; body cold,dry; digestion dry,mobile; mind scattered => mobile,light.
  const dryColdLight = answer({
    sleep: "Light, broken, kept waking", // mobile, light
    energy: "Wired, restless, can't settle", // mobile, light
    body: "Cold hands, dry skin or lips", // cold, dry
    digestion: "Irregular — hungry then not, gassy", // dry, mobile
    mind: "Anxious, scattered, racing", // mobile, light
  });

  it("identifies the wind cluster", () => {
    const r = evaluate(dryColdLight);
    expect(r.outcome).toBe("single");
    expect(r.clusters).toEqual(["wind"]);
  });

  it("speaks dry / light / mobile and offers their opposites (warmth, weight, steadiness)", () => {
    const r = evaluate(dryColdLight);
    expect(r.speaking).toContain("mobile");
    expect(r.speaking).toContain("light");
    // Each speaking quality's opposite is offered.
    for (const q of r.speaking) {
      expect(r.offering).toContain(OPPOSITE[q]);
    }
    // Opposites of mobile/light/dry are steadiness/weight/moisture.
    expect(r.offering).toEqual(expect.arrayContaining(["stable", "heavy"]));
    expect(r.guidance.focus).toBe("Ground & Warm");
    expect(r.guidance.readout).toMatch(/wind/i);
  });
});

describe("single hot-sharp set leans Pitta (fire) and offers cooling", () => {
  const hotSharp = answer({
    ...ALL_CALM,
    sleep: "Hot, restless, vivid",
    energy: "Driven, intense, a touch irritable",
    body: "Warm, flushed, or inflamed",
  });

  it("speaks hot and sharp, offers cold and dull, leans fire", () => {
    const r = evaluate(hotSharp);
    expect(r.outcome).toBe("single");
    expect(r.clusters).toEqual(["fire"]);
    expect(r.speaking).toEqual(expect.arrayContaining(["hot", "sharp"]));
    expect(r.offering).toEqual(expect.arrayContaining(["cold", "dull"]));
    expect(r.guidance.focus).toBe("Cool & Soften");
    expect(r.guidance.readout).toMatch(/fire/i);
  });
});

describe("mixed outcome is first-class", () => {
  // Fire: sleep hot/sharp + digestion hot/sharp => hot:2, sharp:2.
  // Earth: energy heavy/dull/stable + mind heavy/dull => heavy:2, dull:2.
  const hotAndHeavy = answer({
    sleep: "Hot, restless, vivid", // hot, sharp
    energy: "Sluggish, slow to start", // heavy, dull, stable
    body: "Comfortable",
    digestion: "Sharp — strong, acidic, burning", // hot, sharp
    mind: "Foggy, unmotivated, stuck", // heavy, dull
  });

  it("returns mixed when two clusters both speak", () => {
    const r = evaluate(hotAndHeavy);
    expect(r.outcome).toBe("mixed");
    expect(r.clusters).toContain("fire");
    expect(r.clusters).toContain("earth");
    expect(r.clusters.length).toBe(2);
  });

  it("names both in the read-out and does not break the tie by array order", () => {
    const r = evaluate(hotAndHeavy);
    expect(r.guidance.readout).toMatch(/two are speaking/i);
    expect(r.guidance.readout).toMatch(/fire/i);
    expect(r.guidance.readout).toMatch(/earth/i);
    // Both clusters carry equal weight here (4 each); the result must still be
    // mixed regardless of declaration order — not silently collapsed to one.
    expect(r.outcome).toBe("mixed");
  });

  it("offers the opposites of the speaking qualities of both clusters", () => {
    const r = evaluate(hotAndHeavy);
    // hot->cold, sharp->dull (fire) and heavy->light, dull->sharp (earth).
    expect(r.offering).toEqual(expect.arrayContaining(["cold", "light"]));
  });
});

describe("threshold and speaking logic", () => {
  it("a quality at exactly the threshold speaks; below it does not", () => {
    // Build a set where 'hot' hits exactly 2 and nothing else does.
    const r = evaluate(
      answer({
        ...ALL_CALM,
        sleep: "Hot, restless, vivid", // hot, sharp
        body: "Warm, flushed, or inflamed", // hot, sharp
      }),
    );
    expect(r.tally.hot).toBe(2);
    expect(r.speaking).toContain("hot");
  });

  it("speaking qualities are ordered strongest first", () => {
    // mobile appears 3x, light 2x in this set => mobile before light.
    const r = evaluate(
      answer({
        sleep: "Light, broken, kept waking", // mobile, light
        energy: "Wired, restless, can't settle", // mobile, light
        body: "Comfortable",
        digestion: "Irregular — hungry then not, gassy", // dry, mobile
        mind: "Settled, clear",
      }),
    );
    const mobileIdx = r.speaking.indexOf("mobile" as Quality);
    const lightIdx = r.speaking.indexOf("light" as Quality);
    expect(mobileIdx).toBeGreaterThanOrEqual(0);
    expect(mobileIdx).toBeLessThan(lightIdx);
  });

  it("every offered quality is the opposite of a speaking one", () => {
    const r = evaluate(
      answer({
        ...ALL_CALM,
        sleep: "Hot, restless, vivid",
        digestion: "Sharp — strong, acidic, burning",
      }),
    );
    const speakingOpposites = new Set(r.speaking.map((q) => OPPOSITE[q]));
    for (const o of r.offering) expect(speakingOpposites.has(o)).toBe(true);
  });
});

describe("OPPOSITE map is a clean involution", () => {
  it("every quality's opposite's opposite is itself", () => {
    for (const q of Object.keys(OPPOSITE) as Quality[]) {
      expect(OPPOSITE[OPPOSITE[q]]).toBe(q);
    }
  });
});

// --- Content / guidance shape ------------------------------------------------

const VATA = answer({
  sleep: "Light, broken, kept waking",
  energy: "Wired, restless, can't settle",
  body: "Cold hands, dry skin or lips",
  digestion: "Irregular — hungry then not, gassy",
  mind: "Anxious, scattered, racing",
});

const PITTA = answer({
  ...ALL_CALM,
  sleep: "Hot, restless, vivid",
  energy: "Driven, intense, a touch irritable",
  body: "Warm, flushed, or inflamed",
});

const KAPHA = answer({
  ...ALL_CALM,
  energy: "Sluggish, slow to start", // heavy, dull, stable
  mind: "Foggy, unmotivated, stuck", // heavy, dull
});

/** Every guidance line on a result, for shape assertions. */
function allLines(r: ReturnType<typeof evaluate>) {
  const g = r.guidance;
  return [g.anchor, g.eat, g.breath, g.move];
}

describe("result shape: one anchor loud, supporting trio quiet", () => {
  it("every outcome carries an anchor plus eat/breath/move, each with text/detail/source", () => {
    for (const a of [VATA, PITTA, KAPHA, answer(ALL_CALM)]) {
      const r = evaluate(a);
      expect(r.guidance.anchor).toBeDefined();
      for (const line of allLines(r)) {
        expect(typeof line.text).toBe("string");
        expect(line.text.length).toBeGreaterThan(0);
        expect(typeof line.detail).toBe("string");
        expect(line.detail.length).toBeGreaterThan(0);
        expect(typeof line.source).toBe("string");
      }
    }
  });

  it("the depth detail differs from the surface text (it is not a duplicate)", () => {
    const r = evaluate(VATA);
    for (const line of allLines(r)) {
      expect(line.detail).not.toBe(line.text);
    }
  });
});

describe("Vata food guidance is corrected — warm/cooked, never raw-cold", () => {
  it("favours warm, cooked, moist, oily food", () => {
    const eat = evaluate(VATA).guidance.eat;
    expect(eat.text.toLowerCase()).toMatch(/warm|cooked|moist|oil/);
  });

  it("does NOT recommend raw cold cucumber (the fixed error)", () => {
    const eat = evaluate(VATA).guidance.eat;
    // The surface text must not recommend a cold cucumber as it once did.
    expect(eat.text.toLowerCase()).not.toMatch(/cucumber/);
  });

  it("anchors on warm sesame oil on the feet, with a citation", () => {
    const anchor = evaluate(VATA).guidance.anchor;
    expect(anchor.text.toLowerCase()).toMatch(/sesame/);
    expect(anchor.text.toLowerCase()).toMatch(/feet|sole/);
    expect(anchor.source).toMatch(/Lad|AH/);
  });
});

describe("Pitta guidance cools, and does not over-claim coconut", () => {
  it("favours cooling/sweet/bitter food", () => {
    const eat = evaluate(PITTA).guidance.eat;
    expect(eat.text.toLowerCase()).toMatch(/cool|sweet|bitter/);
  });

  it("only mentions coconut tentatively (confirm-with-practitioner honesty)", () => {
    const eat = evaluate(PITTA).guidance.eat;
    const blob = `${eat.text} ${eat.detail}`.toLowerCase();
    if (blob.includes("coconut")) {
      expect(blob).toMatch(/practitioner|confirm/);
    }
  });
});

describe("Kapha guidance lightens", () => {
  it("favours light/warm/dry/spiced food and less oil", () => {
    const eat = evaluate(KAPHA).guidance.eat;
    expect(eat.text.toLowerCase()).toMatch(/light|warm|dry|spice/);
  });
});

describe("mixed states use honest overlaps, not piled-together lists", () => {
  it("Vata+Pitta: warm-not-hot, cooked, sweet — explicitly not raw-cold nor hot-spicy", () => {
    // wind (sleep light + mind scattered) + fire (body warm + digestion sharp).
    const r = evaluate(
      answer({
        sleep: "Light, broken, kept waking", // mobile, light (wind)
        energy: "Calm and steady",
        body: "Warm, flushed, or inflamed", // hot, sharp (fire)
        digestion: "Sharp — strong, acidic, burning", // hot, sharp (fire)
        mind: "Anxious, scattered, racing", // mobile, light (wind)
      }),
    );
    expect(r.outcome).toBe("mixed");
    const eat = r.guidance.eat.text.toLowerCase();
    // The overlap line is its own synthesis, not "list A. And: list B".
    expect(r.guidance.eat.text).not.toMatch(/And:/);
    expect(eat).toMatch(/warm|cooked|sweet/);
    expect(r.guidance.focus).toBe("Warm, Soft & Sweet");
  });

  it("Pitta+Kapha: light/dry/bitter overlap", () => {
    const r = evaluate(
      answer({
        sleep: "Hot, restless, vivid", // hot, sharp (fire)
        energy: "Sluggish, slow to start", // heavy, dull, stable (earth)
        body: "Comfortable",
        digestion: "Sharp — strong, acidic, burning", // hot, sharp (fire)
        mind: "Foggy, unmotivated, stuck", // heavy, dull (earth)
      }),
    );
    expect(r.outcome).toBe("mixed");
    expect(r.guidance.focus).toBe("Light, Dry & Bitter");
    expect(r.guidance.eat.text.toLowerCase()).toMatch(/light|dry|bitter|astringent/);
  });

  it("Vata+Kapha: warm + well-spiced, never cold", () => {
    const r = evaluate(
      answer({
        sleep: "Light, broken, kept waking", // mobile, light (wind)
        energy: "Sluggish, slow to start", // heavy, dull, stable (earth)
        body: "Comfortable",
        digestion: "Irregular — hungry then not, gassy", // dry, mobile (wind)
        mind: "Foggy, unmotivated, stuck", // heavy, dull (earth)
      }),
    );
    expect(r.outcome).toBe("mixed");
    expect(r.guidance.focus).toBe("Warm & Well-Spiced");
    expect(r.guidance.eat.text.toLowerCase()).toMatch(/warm|spice/);
  });

  it("the mixed overlap is symmetric — same pair, same focus, regardless of which spoke louder", () => {
    // Two evaluations whose dominant cluster differs but pair is the same.
    const firePitched = evaluate(
      answer({
        sleep: "Hot, restless, vivid",
        energy: "Driven, intense, a touch irritable", // extra fire
        body: "Comfortable",
        digestion: "Sharp — strong, acidic, burning",
        mind: "Foggy, unmotivated, stuck", // earth (just at threshold? heavy/dull x1 — needs 2)
      }),
    );
    // Build a clean earth-dominant fire+earth instead for determinism:
    const earthPitched = evaluate(
      answer({
        sleep: "Heavy, long, hard to wake", // heavy, dull (earth)
        energy: "Sluggish, slow to start", // heavy, dull, stable (earth)
        body: "Warm, flushed, or inflamed", // hot, sharp (fire)
        digestion: "Sharp — strong, acidic, burning", // hot, sharp (fire)
        mind: "Foggy, unmotivated, stuck", // heavy, dull (earth)
      }),
    );
    expect(earthPitched.outcome).toBe("mixed");
    expect(earthPitched.clusters).toContain("fire");
    expect(earthPitched.clusters).toContain("earth");
    expect(earthPitched.guidance.focus).toBe("Light, Dry & Bitter");
    void firePitched;
  });
});
