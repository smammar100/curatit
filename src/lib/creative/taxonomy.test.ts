import { describe, expect, it } from "vitest";
import { ARCHETYPES, ARCHETYPE_FAMILIES, DIMENSIONS, TAXONOMY_VERSION, familyOf, resolve, slugs, term } from "./taxonomy";

describe("taxonomy", () => {
  it("has a dated version", () => {
    expect(TAXONOMY_VERSION).toMatch(/^\d{4}\.\d{2}\.\d{2}-\d+$/);
  });

  it("uses unique, kebab-case slugs in every dimension", () => {
    for (const [name, terms] of Object.entries(DIMENSIONS)) {
      const list = terms.map((t) => t.slug);
      expect(new Set(list).size, name).toBe(list.length);
      for (const slug of list) expect(slug, `${name}.${slug}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("gives every dimension a way out (other, unknown or none)", () => {
    for (const [name, terms] of Object.entries(DIMENSIONS)) {
      if (name === "palette") continue; // multicolour plays that part for colour
      expect(terms.some((t) => ["other", "unknown", "none"].includes(t.slug)), name).toBe(true);
    }
  });

  it("puts every archetype under a family that exists", () => {
    const families = new Set(ARCHETYPE_FAMILIES.map((t) => t.slug));
    for (const archetype of ARCHETYPES) {
      if (archetype.slug === "other" || archetype.slug === "unknown") continue;
      expect(families.has(archetype.parent ?? ""), archetype.slug).toBe(true);
    }
    expect(familyOf("product-launch")).toBe("launch");
    expect(familyOf("nonexistent")).toBeUndefined();
  });

  it("covers the families the brief names", () => {
    const families = ARCHETYPE_FAMILIES.map((t) => t.slug);
    for (const slug of ["product", "launch", "promotion", "proof", "partnership", "education", "brand", "community", "entertainment", "lifestyle", "event", "impact", "recruiting", "operational", "editorial", "lead-gen", "utility", "other", "unknown"]) {
      expect(families).toContain(slug);
    }
  });

  it("keeps the long tail as synonyms, never as competing slugs", () => {
    const all = new Set(ARCHETYPES.map((t) => t.slug));
    for (const archetype of ARCHETYPES) for (const synonym of archetype.synonyms ?? []) expect(all.has(synonym)).toBe(false);
  });

  it("resolves slugs, labels and synonyms loosely", () => {
    expect(resolve("archetype", "product-launch")).toBe("product-launch");
    expect(resolve("archetype", "Product launch")).toBe("product-launch");
    expect(resolve("archetype", "BTS")).toBe("behind-the-scenes");
    expect(resolve("archetype", "user generated")).toBe("ugc-repost");
    expect(resolve("archetype", "  Collab ")).toBe("collaboration");
    expect(resolve("archetype", "something else entirely")).toBeNull();
    expect(resolve("archetype", "")).toBeNull();
  });

  it("returns slug tuples for zod and looks terms up", () => {
    expect(slugs("cta")).toContain("link-in-bio");
    expect(term("layout", "split")?.label).toBe("Split");
    expect(term("layout", "nope")).toBeUndefined();
  });
});
