import { describe, expect, it } from "vitest";
import { evaluate, jaccard, precisionAtK, type Prediction } from "./evaluate";
import { clone, FIXTURE_DNA, FIXTURE_POST } from "./fixtures";

const prediction = (post_id: string, patch: (dna: typeof FIXTURE_DNA) => void = () => {}): Prediction => {
  const dna = clone(FIXTURE_DNA);
  patch(dna);
  return { post_id, dna, caption: FIXTURE_POST.caption, expectedSlides: 3, slidesRecorded: 3 };
};

describe("metrics", () => {
  it("jaccard", () => {
    expect(jaccard(["a", "b"], ["b", "c"])).toBeCloseTo(1 / 3);
    expect(jaccard([], [])).toBe(1);
    expect(jaccard(["a"], [])).toBe(0);
  });

  it("precision at k counts misses in a short list as misses", () => {
    expect(precisionAtK(["a", "b", "c", "d", "e", "f"], ["a", "c", "f"], 5)).toBe(0.4);
    expect(precisionAtK(["a"], ["a"], 5)).toBe(0.2);
    expect(precisionAtK([], ["a"], 5)).toBe(0);
  });
});

describe("evaluate", () => {
  const predictions = [
    prediction("p1"), // product-feature, consideration, step-by-step
    prediction("p2", (dna) => {
      dna.primary_archetype.slug = "product-launch";
      dna.quality.uncertainties = ["Can't tell if this is new"];
    }),
    prediction("p3", (dna) => {
      dna.primary_archetype.slug = "tutorial";
      dna.visual_system.typography = ["serif"];
    }),
  ];
  const labels = [
    { post_id: "p1", primary_archetype: "product-feature", objective: "consideration", typography: ["sans-serif"], slide_roles: [{ position: 0, role: "hook" }, { position: 1, role: "step" }] },
    { post_id: "p2", primary_archetype: "feature-launch", objective: "awareness" },
    { post_id: "p3", primary_archetype: "tutorial", typography: ["sans-serif"] },
    { post_id: "p4", primary_archetype: "meme" }, // not analysed
  ];

  it("scores the AI against the people's labels", () => {
    const report = evaluate(labels, predictions);
    expect(report).toMatchObject({ labelled: 4, analysed: 3 });
    expect(report.primaryArchetype).toEqual({ accuracy: 0.667, n: 3 });
    // product-launch and feature-launch share the launch family
    expect(report.family).toEqual({ accuracy: 1, n: 3 });
    expect(report.objective).toEqual({ accuracy: 0.5, n: 2 });
    expect(report.perArchetype["tutorial"]).toEqual({ precision: 1, recall: 1, support: 1 });
    expect(report.perArchetype["feature-launch"]).toEqual({ precision: null, recall: 0, support: 1 });
    expect(report.attributes.typography).toBe(0.5);
    expect(report.slideRoles).toEqual({ accuracy: 1, n: 2 });
    expect(report.missedSlideRate).toBe(0);
    expect(report.evidenceValidity).toBe(1);
  });

  it("checks whether flagged analyses are the wrong ones", () => {
    const report = evaluate(labels, predictions);
    expect(report.uncertainty).toEqual({ flaggedAccuracy: 0, unflaggedAccuracy: 1 });
  });

  it("counts missed slides and broken evidence", () => {
    const partial = prediction("p1", (dna) => {
      dna.evidence[0].quote = "Not in the caption";
    });
    partial.slidesRecorded = 2;
    const report = evaluate([labels[0]], [partial]);
    expect(report.missedSlideRate).toBeCloseTo(0.333, 3);
    expect(report.evidenceValidity).toBeLessThan(1);
  });

  it("reports Precision@5 for search", () => {
    const report = evaluate([], [], [
      { query: "fintech explainers", results: ["a", "b", "c", "d", "e"], relevant: ["a", "b"] },
      { query: "launch teasers", results: ["x"], relevant: ["x"] },
    ]);
    expect(report.search).toEqual({ queries: 2, precisionAt5: 0.3 });
  });
});
