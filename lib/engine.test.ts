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
