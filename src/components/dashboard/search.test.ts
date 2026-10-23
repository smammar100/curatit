import { describe, expect, it } from "vitest";
import { rank, spread } from "./forYou";
import { brandNamed, categoryNamed, compact, hookNamed, matches, normalise, typeNamed } from "./search";
import type { DashPost } from "./types";

const post = (shortCode: string, brand: string, slug: string, hook: string, category = "fintech", addedAt = "2026-10-10T09:00:00Z"): DashPost => ({
  id: shortCode,
  shortCode,
  hook,
  brand: { name: brand, slug, logo: null },
  category: { name: category, slug: category },
  categories: [{ name: category, slug: category }],
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

describe("extra categories (2026-10-13)", () => {
  // Nike's main category is Sports; it also carries Shopping
  const nike: DashPost = { ...post("N1", "Nike", "nike", "Just do it", "sports"), categories: [{ name: "Sports", slug: "sports" }, { name: "Shopping", slug: "shopping" }] };
  const wise = post("W1", "Wise", "wise", "Send money abroad", "finance");

  it("search finds a post by an extra category's name", () => {
    expect(matches(nike, "shopping")).toBe(true);
    expect(matches(wise, "shopping")).toBe(false);
  });

  it("For you counts an industry picked through an extra tag", () => {
    const ranked = rank([wise, nike], { industries: ["shopping"], brands: [], taste: [] });
    expect(ranked[0].shortCode).toBe("N1");
  });
});

describe("category words and names (review, 2026-10-13)", () => {
  const claude: DashPost = { ...post("C1", "Claude", "claude", "Meet the new model", "ai"), categories: [{ name: "AI", slug: "ai" }, { name: "Productivity", slug: "productivity" }] };
  const airbnb: DashPost = { ...post("A1", "Airbnb", "airbnb", "Stay again in Paris", "travel-transportation"), categories: [{ name: "Travel & Transportation", slug: "travel-transportation" }, { name: "Lifestyle", slug: "lifestyle" }] };
  const revolut: DashPost = { ...post("R1", "Revolut", "revolut", "Spend abroad", "finance"), categories: [{ name: "Finance", slug: "finance" }] };

  it("matches a category's words whole: \"life\" isn't Lifestyle, though hooks and brands still match in part", () => {
    expect(matches(airbnb, "lifestyle")).toBe(true);
    expect(matches(airbnb, "life")).toBe(false);
    expect(matches(claude, "ai")).toBe(true);
    // The AI chip doesn't search words at all: the feed sees the query names a category (categoryNamed)
    // and keeps that category's posts, so Airbnb's name and hook can't pull it in
    expect(categoryNamed("AI")?.slug).toBe("ai");
  });

  it("still finds posts by the old category names", () => {
    expect(matches(revolut, "fintech")).toBe(true);
    expect(matches(claude, "technology")).toBe(true);
    expect(matches(airbnb, "fintech")).toBe(false);
  });

  it("knows a query that names a category exactly", () => {
    expect(categoryNamed("AI")?.slug).toBe("ai");
    expect(categoryNamed("travel transportation")?.slug).toBe("travel-transportation");
    expect(categoryNamed("Food & Drink")?.slug).toBe("food-drink");
    expect(categoryNamed("launch")).toBeNull();
  });
});

describe("spread", () => {
  it("keeps a brand out of the next places while another brand can go there", () => {
    const posts = [post("a1", "A", "a", ""), post("a2", "A", "a", ""), post("a3", "A", "a", ""), post("b1", "B", "b", ""), post("c1", "C", "c", "")];
    expect(spread(posts, 2).map((p) => p.shortCode)).toEqual(["a1", "b1", "c1", "a2", "a3"]);
  });
  it("keeps the order when no brand repeats", () => {
    const posts = [post("a1", "A", "a", ""), post("b1", "B", "b", "")];
    expect(spread(posts, 3).map((p) => p.shortCode)).toEqual(["a1", "b1"]);
  });
});

describe("breakdown search", () => {
  const withBreakdown = { ...post("x1", "X", "x", "Big news"), breakdown: { headline: "Lead with a runner's challenge", type: "Social impact", hook: "Number or statistic" } };
  it("finds a post by its strategy line, type and hook", () => {
    expect(matches(withBreakdown, "runner")).toBe(true);
    expect(matches(withBreakdown, "statistic")).toBe(true);
  });
  it("names a type of post exactly, however it's spaced", () => {
    expect(typeNamed([withBreakdown], "social impact")).toBe("Social impact");
    expect(typeNamed([withBreakdown], "social")).toBe(null);
  });
  it("names a hook exactly", () => {
    expect(hookNamed([withBreakdown], "Number or statistic")).toBe("Number or statistic");
    expect(hookNamed([withBreakdown], "number")).toBe(null);
  });
});
