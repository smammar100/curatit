import { describe, expect, it } from "vitest";
import { distance, dominantColours, hexOf, rgbOf } from "./colours";

// Pixels as an RGB buffer: [colour, how many]
function pixels(parts: [string, number][]) {
  const out: number[] = [];
  for (const [hex, n] of parts) for (let i = 0; i < n; i++) out.push(...rgbOf(hex));
  return Uint8Array.from(out);
}
const near = (a: string, b: string) => distance(rgbOf(a), rgbOf(b)) < 12;

describe("dominantColours", () => {
  // The Wealthsimple chart in miniature: a dark ground, cream type with soft edges, and two thin
  // accent lines that cover less of the image than the type's own anti-aliasing
  it("keeps the ground, the type and small accents, and drops the blends between them", () => {
    // Anti-aliased edges: a ramp of in-between colours, together more than the accents
    const mix = (t: number) => hexOf(rgbOf("#232f1d").map((v, i) => v + (rgbOf("#e8f6ba")[i] - v) * t));
    const ramp: [string, number][] = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((t) => [mix(t), 40]);
    const colours = dominantColours(pixels([["#232f1d", 9000], ["#e8f6ba", 400], ...ramp, ["#f15208", 60], ["#af82e7", 60]]), 3);
    const hexes = colours.map((c) => c.hex);
    expect(hexes[0]).toBe("#232f1d");
    for (const want of ["#e8f6ba", "#f15208", "#af82e7"]) expect(hexes.some((hex) => near(hex, want))).toBe(true);
    expect(hexes).toHaveLength(4);
  });

  it("gives each colour its share, largest first, and ignores specks", () => {
    const colours = dominantColours(pixels([["#ffffff", 700], ["#000000", 299], ["#ff0000", 1]]), 3);
    expect(colours).toEqual([
      { hex: "#ffffff", share: 0.7 },
      { hex: "#000000", share: 0.299 },
    ]);
  });

  it("reads RGBA as well as RGB, and an empty image has no colours", () => {
    const rgba = Uint8Array.from([31, 122, 77, 255, 31, 122, 77, 255]);
    expect(dominantColours(rgba, 4)).toEqual([{ hex: "#1f7a4d", share: 1 }]);
    expect(dominantColours(new Uint8Array(), 3)).toEqual([]);
  });
});
