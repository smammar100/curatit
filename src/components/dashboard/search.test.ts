import { describe, expect, it } from "vitest";
import { rank } from "./forYou";
import { brandNamed, compact, matches, normalise } from "./search";
import type { DashPost } from "./types";

const post = (shortCode: string, brand: string, slug: string, hook: string, category = "fintech", addedAt = "2026-10-10T09:00:00Z"): DashPost => ({
  id: shortCode,
  shortCode,
  hook,
  brand: { name: brand, slug, logo: null },
  category: { name: category, slug: category },
  format: "static",
  width: null,
  height: null,
  postedAt: "2026-09-01T00:00:00Z",
  addedAt,
  cover: "",
});

const library = [
  post("a1", "Public", "public", "Transfer your portfolio in minutes", "fintech", "2026-10-12T11:00:00Z"),
  post("b1", "Wealthfront", "wealthfront", "Why every public company reports this", "fintech"),
  post("c1", "H&M", "hm", "The party edit", "fashion"),
  post("d1", "Coca-Cola", "coca-cola", "Share a Coke", "food-delivery"),
  post("e1", "Uber Eats", "uber-eats", "Late-night cravings", "food-delivery"),
];

describe("search", () => {
  it("ignores punctuation, accents and spacing", () => {
    expect(normalise("Café-Crème & Co.")).toBe("cafe creme co");
    expect(compact("Uber Eats")).toBe("ubereats");
  });

  it("finds brands however they're typed", () => {
    expect(matches(library[2], "hm")).toBe(true);
    expect(matches(library[2], "H&M")).toBe(true);
    expect(matches(library[3], "coca cola")).toBe(true);
    expect(matches(library[4], "ubereats")).toBe(true);
    expect(matches(library[3], "pepsi")).toBe(false);
  });

  it("treats a brand's exact name or slug as that brand alone", () => {
    expect(brandNamed(library, "public")?.slug).toBe("public");
    expect(brandNamed(library, "Uber eats")?.slug).toBe("uber-eats");
    expect(brandNamed(library, "public company")).toBeNull();
    expect(brandNamed(library, "")).toBeNull();
    // A plain word search still reaches other brands' hooks
    expect(library.filter((p) => matches(p, "public")).map((p) => p.shortCode)).toEqual(["a1", "b1"]);
  });
});

describe("For you and the newest import", () => {
  const answers = { industries: ["fashion"], brands: [], taste: [] };

  it("lifts the library's newest import day in the feed, as much as a picked industry", () => {
    const ranked = rank(library, answers, library, { fresh: true }).map((p) => p.shortCode);
    expect(ranked.slice(0, 2).sort()).toEqual(["a1", "c1"]);
  });

  it("leaves the welcome flow's ranking alone", () => {
    expect(rank(library, answers, library)[0].shortCode).toBe("c1");
    expect(rank(library, answers, library).map((p) => p.shortCode).indexOf("a1")).toBeGreaterThan(0);
  });
});
