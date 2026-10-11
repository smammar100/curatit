import { describe, expect, it } from "vitest";
import { BOX, layout404, TILE } from "./notFoundLayout";

describe("layout404", () => {
  const tiles = layout404();

  it("lays out enough covers to read as 404", () => {
    expect(tiles.length).toBeGreaterThan(45);
    expect(tiles.length).toBeLessThan(70);
  });

  it("is the same every time, so the server and the browser agree", () => {
    expect(layout404()).toEqual(tiles);
    expect(layout404(7)).not.toEqual(tiles);
  });

  it("keeps every cover inside the box", () => {
    for (const tile of tiles) {
      expect(tile.left).toBeGreaterThanOrEqual(-1);
      expect(tile.left + tile.width).toBeLessThanOrEqual(101);
      expect(tile.top).toBeGreaterThanOrEqual(-2);
      expect(tile.top + ((TILE * 1.25) / BOX.height) * 100).toBeLessThanOrEqual(102);
    }
  });

  it("covers all three digits, left to right in writing order", () => {
    const thirds = [0, 1, 2].map((d) => tiles.filter((t) => t.cx >= d * 33 && t.cx < (d + 1) * 33 + 1).length);
    expect(Math.min(...thirds)).toBeGreaterThan(12);
    expect(tiles.map((t) => t.order)).toEqual(tiles.map((_, i) => i));
  });

  it("never stacks two covers on one spot", () => {
    for (const [i, a] of tiles.entries()) {
      for (const b of tiles.slice(i + 1)) expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeGreaterThan(2);
    }
  });
});
