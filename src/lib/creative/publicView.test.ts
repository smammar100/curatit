import { describe, expect, it } from "vitest";
import { observationPoints } from "./publicView";

describe("observationPoints", () => {
  it("splits points joined by semicolons and capitalises each", () => {
    expect(observationPoints("White-haired person holds stone-like object; white LOEWE and On marks overlay black outfit.")).toEqual([
      "White-haired person holds stone-like object",
      "White LOEWE and On marks overlay black outfit",
    ]);
  });

  it("splits sentences", () => {
    expect(observationPoints("A shoe lies on linen. Orange laces trail off the edge.")).toEqual(["A shoe lies on linen", "Orange laces trail off the edge"]);
  });

  it("keeps abbreviations whole", () => {
    expect(observationPoints("Chart compares cash with U.S. Stocks. Values rise to $30,109.")).toEqual(["Chart compares cash with U.S. Stocks", "Values rise to $30,109"]);
    expect(observationPoints("Small text, e.g. the logo, sits low")).toEqual(["Small text, e.g. the logo, sits low"]);
  });

  it("returns a single point as one", () => {
    expect(observationPoints("Blank black frame.")).toEqual(["Blank black frame"]);
    expect(observationPoints("")).toEqual([]);
  });
});
