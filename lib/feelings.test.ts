import { describe, it, expect } from "vitest";
import { scanFeelings, MAX_FEELINGS } from "./feelings";

describe("scanFeelings", () => {
  it("recognises bloating and dryness in one sentence", () => {
    const feelings = scanFeelings("feel a little bloated and my skin is dry today").map(
      (m) => m.feeling,
    );
    expect(feelings).toContain("bloating");
    expect(feelings).toContain("dryness");
  });

  it("is case-insensitive", () => {
    const feelings = scanFeelings("I am SO ANXIOUS today").map((m) => m.feeling);
    expect(feelings).toContain("feeling restless or anxious");
  });

  it("returns empty for an empty or unrecognised note", () => {
    expect(scanFeelings("")).toHaveLength(0);
    expect(scanFeelings("   ")).toHaveLength(0);
    expect(scanFeelings("the weather is lovely")).toHaveLength(0);
  });

  it("respects word boundaries — 'laundry' does not match 'dry'", () => {
    expect(scanFeelings("did the laundry")).toHaveLength(0);
  });

  it("caps the number of reflections at MAX_FEELINGS", () => {
    const busy = "bloated, dry, anxious, heavy, hot, exhausted";
    expect(scanFeelings(busy).length).toBeLessThanOrEqual(MAX_FEELINGS);
  });

  it("each match carries a response and a source (provenance underneath)", () => {
    const [first] = scanFeelings("feeling hot and irritable");
    expect(first?.response.length).toBeGreaterThan(0);
    expect(first?.source.length).toBeGreaterThan(0);
  });
});
