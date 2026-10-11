import { describe, expect, it } from "vitest";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION } from "./fixtures";
import { CreativeDna, EvidenceRef, Perception } from "./schema";

describe("contracts", () => {
  it("accept the fixtures", () => {
    expect(Perception.safeParse(FIXTURE_PERCEPTION).success).toBe(true);
    expect(CreativeDna.safeParse(FIXTURE_DNA).success).toBe(true);
  });

  it("only accept typed evidence references", () => {
    for (const ok of ["caption", "metadata", "slide:0", "slide:12"]) expect(EvidenceRef.safeParse(ok).success, ok).toBe(true);
    for (const bad of ["slide", "slide:-1", "Slide:1", "slide 1", "image:0", "caption "]) expect(EvidenceRef.safeParse(bad).success, bad).toBe(false);
  });

  it("reject a slug outside the taxonomy", () => {
    const dna = clone(FIXTURE_DNA) as unknown as { primary_archetype: { slug: string } };
    dna.primary_archetype.slug = "viral-banger";
    expect(CreativeDna.safeParse(dna).success).toBe(false);
  });

  it("reject output for another taxonomy or schema version", () => {
    expect(CreativeDna.safeParse({ ...clone(FIXTURE_DNA), taxonomy_version: "2020.01.01-1" }).success).toBe(false);
    expect(CreativeDna.safeParse({ ...clone(FIXTURE_DNA), schema_version: "0.9" }).success).toBe(false);
  });

  it("hold the takeaway and rationale counts the brief sets", () => {
    expect(CreativeDna.safeParse({ ...clone(FIXTURE_DNA), takeaways: ["one", "two"] }).success).toBe(false);
    expect(CreativeDna.safeParse({ ...clone(FIXTURE_DNA), takeaways: ["1", "2", "3", "4", "5", "6"] }).success).toBe(false);
    expect(CreativeDna.safeParse({ ...clone(FIXTURE_DNA), creative_rationale: [FIXTURE_DNA.creative_rationale[0]] }).success).toBe(false);
  });

  it("reject keys the contract doesn't know about when parsed strictly", () => {
    expect(CreativeDna.strict().safeParse({ ...clone(FIXTURE_DNA), went_viral: true }).success).toBe(false);
  });

  it("reject empty or overlong text", () => {
    expect(CreativeDna.safeParse({ ...clone(FIXTURE_DNA), concept: "   " }).success).toBe(false);
    expect(CreativeDna.safeParse({ ...clone(FIXTURE_DNA), concept: "x".repeat(161) }).success).toBe(false);
  });

  it("reject a slide with a negative or fractional position", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.slides[0].position = -1;
    expect(Perception.safeParse(p).success).toBe(false);
    p.slides[0].position = 0.5;
    expect(Perception.safeParse(p).success).toBe(false);
  });
});
