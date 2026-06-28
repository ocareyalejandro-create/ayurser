import { describe, it, expect } from "vitest";
import { cleanName, NAME_MAX_LENGTH } from "./name";

describe("cleanName", () => {
  it("trims surrounding whitespace and capitalizes the first letter", () => {
    expect(cleanName("  alex  ")).toBe("Alex");
  });

  it("leaves an already-capitalized name as-is", () => {
    expect(cleanName("Vanessa")).toBe("Vanessa");
  });

  it("preserves internal capitals (does not lowercase the rest)", () => {
    expect(cleanName("mcKay")).toBe("McKay");
  });

  it("collapses inner whitespace runs to a single space", () => {
    expect(cleanName("de   la   O")).toBe("De la O");
  });

  it("returns empty string for whitespace-only or empty input", () => {
    expect(cleanName("   ")).toBe("");
    expect(cleanName("")).toBe("");
  });

  it("caps length at NAME_MAX_LENGTH", () => {
    const long = "a".repeat(NAME_MAX_LENGTH + 20);
    expect(cleanName(long).length).toBe(NAME_MAX_LENGTH);
  });
});
