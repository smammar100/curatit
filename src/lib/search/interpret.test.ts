import { describe, expect, it } from "vitest";
import { DIMENSIONS } from "@/lib/creative/taxonomy";
import { CATEGORIES } from "@/lib/categories";
import { interpretSearch, type SearchVocabulary } from "./interpret";
import { searchRefinements } from "./refine";

const vocabulary: SearchVocabulary = {
  categories: CATEGORIES,
  brands: [{ name: "On", slug: "on" }, { name: "Public", slug: "public" }, { name: "Wise", slug: "wise" }, { name: "Coca-Cola", slug: "coca-cola" }, { name: "H&M", slug: "hm" }, { name: "Nike", slug: "nike" }],
  dimensions: Object.fromEntries(Object.entries(DIMENSIONS).map(([key, terms]) => [key, [...terms]])),
};
const parse = (q: string) => interpretSearch(q, vocabulary);

describe("natural search", () => {
  it.each([
    ["Show me fintech carousels that open with a stat", { category: "finance", format: "carousel", hook_technique: ["number"] }, ""],
    ["Find food posts with product photography", { category: "food-drink", imagery: ["product-photography"] }, ""],
    ["Show me blue carousels from Nike", { brand: "nike", format: "carousel", palette: ["blue"] }, ""],
    ["fintech posts launching a feature", { category: "finance", archetype: ["feature-launch"] }, ""],
    ["posts using sans serif fonts", { typography: ["sans-serif"] }, ""],
    ["single image brand partnership posts", { format: "static", archetype: ["collaboration"] }, ""],
    ["collaboration posts", { archetype: ["collaboration"] }, ""],
    ["food posts about Halloween", { category: "food-drink" }, "halloween"],
    ["posts from On", { brand: "on" }, ""],
    ["text on blue", { palette: ["blue"] }, "text"],
    ["public company", {}, "public company"],
    ['fintech posts about "Black Friday"', { category: "finance" }, '"Black Friday"'],
    ['"sans serif"', {}, '"sans serif"'],
    ["hm", { brand: "hm" }, ""],
    ["Coca Cola carousels", { brand: "coca-cola", format: "carousel" }, ""],
  ])("interprets %s", (query, filters, remaining) => {
    const result = parse(query);
    expect(result.error).toBeUndefined();
    expect(result.filters).toEqual(filters);
    expect(result.query).toBe(remaining);
  });

  it.each(["show me", "   ", "without blue carousels", "don't show blue", "-blue", "red and blue posts", "Nike or Wise", "static carousels", "latest fintech posts"])("does not silently broaden or invert %s", (query) => {
    expect(parse(query).error).toBeTruthy();
  });

  it("keeps unknown terms and Unicode, and matches whole words", () => {
    expect(parse("Airbnb again").filters).toEqual({});
    expect(parse("عید مبارک").query).toBe("عید مبارک");
    expect(parse("premium zqxv").query).toBe("premium zqxv");
    expect(parse("x".repeat(301)).error).toBeTruthy();
  });

  it.each([
    ["I am looking for fintech ads announcing a new feature", { category: "finance", archetype: ["feature-launch"] }],
    ["Fintech feature launches", { category: "finance", archetype: ["feature-launch"] }],
    ["posts with customer reviews", { archetype: ["testimonial"] }],
    ["food ads showcasing a product", { category: "food-drink", archetype: ["product-showcase"] }],
    ["carousels with app screens", { format: "carousel", imagery: ["screenshot-ui"] }],
    ["ads with charts and graphs", { imagery: ["data-visualization"] }],
    ["text over a photo", { layout: ["text-over-image"] }],
    ["education goal posts", { objective: ["education"] }],
    ["collaboration creative approach posts", { archetype: ["collaboration"] }],
  ])("understands the paraphrase %s", (query, filters) => {
    expect(parse(query)).toMatchObject({ filters, query: "" });
    expect(parse(query).error).toBeUndefined();
  });

  it.each([
    ["fintehc carousels", { category: "finance", format: "carousel" }],
    ["food carosuel posts", { category: "food-drink", format: "carousel" }],
    ["product photgraphy", { imagery: ["product-photography"] }],
    ["posts with illustratons", { imagery: ["illustration"] }],
  ])("corrects and discloses one long-word typo: %s", (query, filters) => {
    const result = parse(query);
    expect(result.filters).toEqual(filters);
    expect(result.query).toBe("");
    expect(result.corrections).toHaveLength(1);
  });

  it("does not correct quotes, ambiguous typos or short words", () => {
    expect(parse('"carosuel"')).toMatchObject({ query: '"carosuel"', filters: {}, corrections: [] });
    expect(parse('"unfinished').error).toMatch(/quotation/);
    const custom = { ...vocabulary, brands: [{ name: "Notion", slug: "notion" }], categories: [{ slug: "foobar", name: "Foobar" }, { slug: "foobaz", name: "Foobaz" }] };
    expect(interpretSearch("foobax", custom)).toMatchObject({ query: "foobax", filters: {}, corrections: [] });
    expect(interpretSearch("motion graphics", custom).filters).not.toHaveProperty("brand");
    expect(parse("bule posts").filters).toEqual({});
  });

  it("suggests removing exactly one constraint, and refinements round-trip", () => {
    const original = parse('fintech carousels that open with a stat about "Black Friday"');
    const suggestions = searchRefinements(original.filters, original.query);
    expect(suggestions).toHaveLength(3);
    for (const suggestion of suggestions) {
      const next = parse(suggestion.query);
      expect(next.error).toBeUndefined();
      const removed = Object.keys(original.filters).filter((key) => !(key in next.filters));
      if (next.query === "") {
        expect(next.filters).toEqual(original.filters);
      } else {
        expect(next.query).toBe(original.query);
        expect(removed).toHaveLength(1);
        for (const [key, value] of Object.entries(next.filters)) expect(value).toEqual(original.filters[key]);
      }
    }
    expect(searchRefinements({ category: "finance" }, "")).toEqual([]);
    expect(searchRefinements({ palette: ["red", "blue"] }, "")).toEqual([]);
  });
});
