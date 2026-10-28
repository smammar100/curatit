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
    ["posts with customer testimonials", { archetype: ["testimonial"] }],
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

  // 2026-10-25: requests designers and assistants actually send, which came back empty or refused
  it.each([
    ["memes from food brands", { category: "food-drink", archetype: ["meme"] }, ""],
    ["educational finance content", { objective: ["education"], category: "finance" }, ""],
    ["Halloween campaign", {}, "halloween"],
    ["user generated content", { archetype: ["ugc-repost"] }, ""],
    ["minimalist posts with lots of white space", { tone: ["minimal"] }, ""],
    ["infographics with charts", { imagery: ["data-visualization"] }, ""],
    ["humorous posts", { persuasion: ["humor"] }, ""],
    ["emotional storytelling", { persuasion: ["empathy"], narrative_pattern: ["story-arc"] }, ""],
    ["illustrated carousels explaining a concept", { format: "carousel", imagery: ["illustration"], archetype: ["explainer"] }, ""],
    ["AI product screenshots", { category: "ai", imagery: ["screenshot-ui"] }, "product"],
  ])("reads around everyday words: %s", (query, filters, remaining) => {
    const result = parse(query);
    expect(result.error).toBeUndefined();
    expect(result.filters).toEqual(filters);
    expect(result.query).toBe(remaining);
    expect(result.corrections).toEqual([]);
  });

  it("selects a generic industry or approach family only when it's the whole request", () => {
    const withSynonyms = { ...vocabulary, categories: CATEGORIES.map((category) => (category.slug === "graphics-design" ? { ...category, synonyms: ["design"] } : category)) };
    expect(interpretSearch("clean modern design for a banking app", withSynonyms)).toMatchObject({ filters: { tone: ["minimal"], category: "finance" }, query: "app" });
    expect(interpretSearch("design", withSynonyms).filters).toEqual({ category: "graphics-design" });
    expect(parse("brand").filters).toEqual({ archetype_family: ["brand"] });
    expect(parse("how brands announce a new feature")).toMatchObject({ filters: { archetype: ["feature-launch"] }, query: "" });
  });

  it("corrects typos to names, never to a database synonym", () => {
    const custom = { ...vocabulary, dimensions: { ...vocabulary.dimensions, archetype: [{ slug: "giveaway", label: "Giveaway or contest", synonyms: ["contest"] }] } };
    expect(interpretSearch("context", custom)).toMatchObject({ query: "context", filters: {}, corrections: [] });
    expect(interpretSearch("giveawya", custom)).toMatchObject({ filters: { archetype: ["giveaway"] }, corrections: [{ from: "giveawya", to: "Giveaway or contest" }] });
  });

  it("keeps an 'or' between words left to search, never between brands, industries or formats", () => {
    expect(parse("brand mascots or characters")).toMatchObject({ query: "mascots or characters", filters: {} });
    expect(parse("a celebrity or famous person fronting the post").error).toBeUndefined();
    expect(parse("fintech carousels about cash or cards")).toMatchObject({ query: "cash or cards", filters: { category: "finance", format: "carousel" } });
    for (const query of ["Nike or Wise", "Nike or Coca-Cola", "fintech or food posts", "carousels or videos", "or carousels", "carousels or"]) expect(parse(query).error).toBeTruthy();
  });

  // 2026-10-26: 'posts with charts or data' was refused as two searches
  it("reads an 'or' between two values of one creative label as either, and beside one label as words", () => {
    for (const [query, filters, words] of [
      ["red or blue posts", { palette: ["red", "blue"] }, ""],
      ["witty or playful fintech posts", { tone: ["witty", "playful"], category: "finance" }, ""],
      ["memes or user generated content", { archetype: ["meme", "ugc-repost"] }, ""],
      ["charts or graphs", { imagery: ["data-visualization"] }, ""],
      ["posts with charts or data", {}, "charts or data"],
      ["food carousels with illustrations or photos of people", { category: "food-drink", format: "carousel" }, "illustrations or photos people"],
    ] as const) {
      const result = parse(query);
      expect(result.error, query).toBeUndefined();
      expect(result.filters, query).toEqual(filters);
      expect(result.query, query).toBe(words);
    }
    expect(parse("posts with charts or data").labels).toEqual([]);
    // 'and' still asks for both, which one label can't promise
    expect(parse("red and blue posts").error).toBeTruthy();
  });

  // 2026-10-26: as filters these emptied ordinary requests or brought back the wrong posts
  it("keeps everyday words that are also a label's or an industry's name as words", () => {
    const live = { ...vocabulary, categories: CATEGORIES.map((category) => (category.slug === "finance" ? { ...category, synonyms: ["banking", "investing", "money", "payments"] } : category)) };
    const read = (query: string) => interpretSearch(query, live);
    for (const [query, filters, words] of [
      ["summer campaign ideas", {}, "summer"],
      ["back to school posts", {}, "back school"],
      ["Black Friday deals", {}, "black friday deals"],
      ["funny posts from fintech brands", { category: "finance" }, "funny"],
      ["Nike motivational posts", { brand: "nike" }, "motivational"],
      ["travel inspiration carousels", { category: "travel-transportation", format: "carousel" }, ""],
      ["social proof with customer reviews", { persuasion: ["social-proof"] }, "customer reviews"],
      ["save money on food delivery", { category: "food-drink" }, "save money"],
      ["money-saving deals", {}, "money saving deals"],
      ["script for a reel", { format: "video" }, "script"],
      // A label's or an industry's own name still selects it
      ["seasonal posts", { archetype: ["seasonal"] }, ""],
      ["inspirational tone", { tone: ["inspirational"] }, ""],
      ["finance carousels", { category: "finance", format: "carousel" }, ""],
    ] as const) {
      const result = read(query);
      expect(result.error, query).toBeUndefined();
      expect(result.filters, query).toEqual(filters);
      expect(result.query, query).toBe(words);
    }
  });

  it("keeps a second creative approach as words to match, and says so", () => {
    const result = parse("influencer collaboration posts");
    expect(result).toMatchObject({ filters: { archetype: ["creator-feature"] }, query: "collaboration" });
    expect(result.notes).toEqual(['One creative approach per search: Creator feature is the filter, and "collaboration" is matched as words.']);
    expect(parse("product launch announcement")).toMatchObject({ filters: { archetype: ["product-launch"] }, query: "announcement" });
    // A second value anywhere else is still an alternative, refused rather than guessed
    expect(parse("red and blue posts").error).toBeTruthy();
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
