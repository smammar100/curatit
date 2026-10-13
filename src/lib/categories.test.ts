import { describe, expect, it } from "vitest";
import { CATEGORIES, categoriesWithPosts, inCategory, OLD_SLUGS } from "./categories";

const p = (main: string, ...extra: string[]) => ({ category: { slug: main }, categories: [main, ...extra].map((slug) => ({ slug })) });

describe("categories", () => {
  it("has the 28 app categories, each slug once", () => {
    expect(CATEGORIES).toHaveLength(28);
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(28);
  });

  it("maps every old slug to a current one", () => {
    for (const slug of Object.values(OLD_SLUGS)) expect(CATEGORIES.some((c) => c.slug === slug)).toBe(true);
  });

  it("lists only categories with posts, in the list's order, counting extra tags", () => {
    const posts = [p("sports", "shopping"), p("finance"), p("ai", "productivity")];
    expect(categoriesWithPosts(posts).map((c) => c.slug)).toEqual(["ai", "finance", "productivity", "shopping", "sports"]);
    expect(categoriesWithPosts(posts, { main: true }).map((c) => c.slug)).toEqual(["ai", "finance", "sports"]);
    expect(categoriesWithPosts(posts, { min: 2 })).toEqual([]);
  });

  it("puts a post in its main category and its tags", () => {
    expect(inCategory(p("sports", "shopping"), "shopping")).toBe(true);
    expect(inCategory(p("sports"), "shopping")).toBe(false);
  });
});

describe("old categories", () => {
  it("turns saved answers into today's slugs, in order, once each", async () => {
    const { currentSlugs } = await import("./categories");
    expect(currentSlugs(["technology", "fintech", "ecommerce", "finance"])).toEqual(["ai", "finance", "crypto-web3", "shopping", "business"]);
    expect(currentSlugs(["sports"])).toEqual(["sports"]);
  });
});
