import { describe, expect, it } from "vitest";
import { toAnalysis } from "./display";
import { clone, FIXTURE_DNA } from "./fixtures";
import { term } from "./taxonomy";

describe("toAnalysis", () => {
  it("puts the labels in words and keeps only what a designer reads", () => {
    const dna = clone(FIXTURE_DNA);
    const slides = dna.narrative.slide_roles.length;
    const analysis = toAnalysis(dna, slides)!;
    expect(analysis.concept).toBe(dna.concept);
    expect(analysis.labels[0]).toEqual(["Type", term("archetype", dna.primary_archetype.slug)!.label]);
    expect(analysis.roles).toHaveLength(slides);
    expect(analysis.roles[0]).toBe(term("slide_role", dna.narrative.slide_roles[0].role)!.label);
    expect(analysis.why).toEqual(dna.creative_rationale.map((item) => item.hypothesis));
    expect(analysis.takeaways).toEqual(dna.takeaways);
    expect(Object.keys(analysis)).not.toContain("evidence");
  });

  it("leaves out other, unknown, and the structure and roles of a single image", () => {
    const dna = clone(FIXTURE_DNA);
    dna.marketing_objective.slug = "unknown";
    dna.narrative.pattern = "single-image";
    const analysis = toAnalysis(dna, 1)!;
    expect(analysis.labels.map(([name]) => name)).toEqual(["Type", "Hook"]);
    expect(analysis.roles).toEqual([]);
  });

  it("gives a slide the analysis has no role for a null role, and survives a broken record", () => {
    const dna = clone(FIXTURE_DNA);
    dna.narrative.slide_roles = [{ position: 0, role: "hook" }];
    expect(toAnalysis(dna, 3)!.roles).toEqual([term("slide_role", "hook")!.label, null, null]);
    expect(toAnalysis(null, 3)).toBeNull();
    expect(toAnalysis({ concept: "" }, 3)).toBeNull();
    expect(toAnalysis({ concept: "Just a concept" }, 2)).toMatchObject({ concept: "Just a concept", labels: [], roles: [null, null], why: [], takeaways: [] });
  });
});
