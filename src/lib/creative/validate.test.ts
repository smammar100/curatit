import { describe, expect, it } from "vitest";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION, FIXTURE_POST } from "./fixtures";
import { needsReview, validateDna, validatePerception } from "./validate";

const post = { caption: FIXTURE_POST.caption, expectedSlides: FIXTURE_POST.expectedSlides };
const codes = (list: { code: string }[]) => list.map((issue) => issue.code);

describe("validatePerception", () => {
  it("passes the fixture", () => {
    expect(validatePerception(FIXTURE_PERCEPTION, post)).toEqual({ errors: [], warnings: [] });
  });

  it("catches a missing slide", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.slides.pop();
    expect(codes(validatePerception(p, post).errors)).toEqual(["missing_slide"]);
  });

  it("catches a phantom slide (one-based numbering)", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.slides.forEach((slide) => (slide.position += 1));
    expect(codes(validatePerception(p, post).errors).sort()).toEqual(["missing_slide", "phantom_slide"]);
  });

  it("catches a duplicated slide", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.slides[2].position = 1;
    expect(codes(validatePerception(p, post).errors).sort()).toEqual(["duplicate_slide", "missing_slide"]);
  });

  it("catches text on a slide that says it has none", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.slides[0].legibility = "no-text";
    expect(codes(validatePerception(p, post).errors)).toEqual(["text_contradiction"]);
  });

  it("warns on a hook that isn't in the caption, low confidence and conflicts", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.caption.hook_text = "Get rich quick";
    p.slides[1].confidence = "low";
    p.conflicts = ["The caption mentions a sale the images don't show"];
    expect(codes(validatePerception(p, post).warnings).sort()).toEqual(["hook_not_in_caption", "low_confidence_slide", "text_image_conflict"]);
  });

  it("handles a single static image at position 0", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.slides = [p.slides[0]];
    expect(validatePerception(p, { ...post, expectedSlides: 1 }).errors).toEqual([]);
  });
});

describe("validateDna", () => {
  it("refuses writing about the pipeline instead of the post", () => {
    const dna = clone(FIXTURE_DNA);
    dna.visual_system.brand_consistency = "As described in the notes, the eyebrow repeats on every slide.";
    dna.constraints_or_uncertainties = ["Analysis relies on text notes rather than the image itself."];
    dna.quality.uncertainties = ["Only the notes were available, not the image, so the wording is unverified."];
    const paths = validateDna(dna, post, FIXTURE_PERCEPTION).errors.filter((issue) => issue.code === "process_talk").map((issue) => issue.path);
    expect(paths).toEqual(["visual_system.brand_consistency", "constraints_or_uncertainties.0", "quality.uncertainties.0"]);
  });

  it("lets ordinary uses of the word notes through", () => {
    const dna = clone(FIXTURE_DNA);
    dna.evidence[0].observation = "The caption notes that the views may change.";
    dna.visual_system.decorative_system = "A screenshot of the Notes app frames the list.";
    dna.copy_strategy.notes = "Short lines that read like tasting notes.";
    expect(codes(validateDna(dna, post, FIXTURE_PERCEPTION).errors)).not.toContain("process_talk");
  });

  it("passes the fixture", () => {
    expect(validateDna(FIXTURE_DNA, post, FIXTURE_PERCEPTION).errors).toEqual([]);
  });

  it("refuses to call a partial analysis complete", () => {
    const dna = clone(FIXTURE_DNA);
    dna.quality.processed_slides = 2;
    expect(codes(validateDna(dna, post).errors)).toContain("false_complete");
  });

  it("refuses complete when perception skipped a slide", () => {
    const p = clone(FIXTURE_PERCEPTION);
    p.slides.pop();
    expect(codes(validateDna(FIXTURE_DNA, post, p).errors)).toContain("false_complete");
  });

  it("accepts an honest partial result", () => {
    const dna = clone(FIXTURE_DNA);
    dna.quality = { ...dna.quality, image_analysis_complete: false, processed_slides: 2, uncertainties: ["Slide 2 failed to load"] };
    const verdict = validateDna(dna, post);
    expect(verdict.errors).toEqual([]);
    expect(needsReview(verdict, dna)).toBe(true);
  });

  it("catches the wrong slide count", () => {
    const dna = clone(FIXTURE_DNA);
    dna.quality.expected_slides = 4;
    expect(codes(validateDna(dna, post).errors)).toContain("wrong_expected_slides");
  });

  it("catches narrative roles for slides that don't exist, or missing ones", () => {
    const dna = clone(FIXTURE_DNA);
    dna.narrative.slide_roles.push({ position: 3, role: "closing" });
    expect(codes(validateDna(dna, post).errors)).toContain("phantom_slide");
    dna.narrative.slide_roles = dna.narrative.slide_roles.slice(0, 2);
    expect(codes(validateDna(dna, post).errors)).toContain("missing_slide");
  });

  it("catches evidence that points past the last slide", () => {
    const dna = clone(FIXTURE_DNA);
    dna.creative_rationale[0].evidence = ["slide:3"];
    expect(codes(validateDna(dna, post).errors)).toEqual(["bad_evidence_ref"]);
  });

  it("catches citing a caption the post doesn't have", () => {
    const dna = clone(FIXTURE_DNA);
    dna.hook.location = "image";
    const verdict = validateDna(dna, { caption: "", expectedSlides: 3 });
    expect(codes(verdict.errors)).toContain("bad_evidence_ref");
  });

  it("catches a quote that isn't in the caption", () => {
    const dna = clone(FIXTURE_DNA);
    dna.evidence[0].quote = "Save 40% this week";
    expect(codes(validateDna(dna, post).errors)).toEqual(["quote_not_found"]);
  });

  it("tolerates curly quotes, case and spacing in a real quote", () => {
    const dna = clone(FIXTURE_DNA);
    dna.evidence[0].quote = "your  MONEY, on autopilot.";
    expect(validateDna(dna, post).errors).toEqual([]);
  });

  it("warns when a slide quote wasn't read off that slide", () => {
    const dna = clone(FIXTURE_DNA);
    dna.evidence[2].quote = "Start in two minutes"; // that's slide 2's text, cited as slide 1
    expect(codes(validateDna(dna, post, FIXTURE_PERCEPTION).warnings)).toContain("quote_not_read");
  });

  it("catches a caption hook that isn't in the caption", () => {
    const dna = clone(FIXTURE_DNA);
    dna.hook.location = "caption";
    expect(codes(validateDna(dna, post).errors)).toContain("quote_not_found");
  });

  it("catches performance claims", () => {
    for (const claim of ["This high-converting layout works", "The post went viral", "Drove sales for the brand", "Gets 30% more engagement", "A strong CTR"]) {
      const dna = clone(FIXTURE_DNA);
      dna.creative_rationale[0].hypothesis = claim;
      expect(codes(validateDna(dna, post).errors), claim).toContain("performance_claim");
    }
  });

  it("doesn't flag hedged hypotheses", () => {
    const dna = clone(FIXTURE_DNA);
    dna.creative_rationale[0].hypothesis = "A 3-step layout may be easier to follow than a dense single frame.";
    expect(validateDna(dna, post).errors).toEqual([]);
  });

  it("catches a summary that repeats the caption", () => {
    const dna = clone(FIXTURE_DNA);
    dna.creative_summary = FIXTURE_POST.caption;
    expect(codes(validateDna(dna, post).errors)).toContain("repeats_caption");
  });

  it("catches an archetype listed twice", () => {
    const dna = clone(FIXTURE_DNA);
    dna.secondary_archetypes = [{ slug: "product-feature", evidence: ["slide:1"] }];
    expect(codes(validateDna(dna, post).errors)).toContain("duplicate_archetype");
  });

  it("warns on filler takeaways and a multi-slide pattern on one image", () => {
    const dna = clone(FIXTURE_DNA);
    dna.takeaways[0] = "Use bright colours.";
    expect(codes(validateDna(dna, post).warnings)).toContain("generic_takeaway");

    const single = clone(FIXTURE_DNA);
    single.narrative.slide_roles = [{ position: 0, role: "hook" }];
    single.quality = { ...single.quality, expected_slides: 1, processed_slides: 1 };
    single.evidence = [single.evidence[0], single.evidence[1]];
    single.marketing_objective.evidence = ["caption"];
    single.secondary_archetypes = [];
    single.primary_archetype.evidence = ["slide:0"];
    single.attention_mechanisms = [single.attention_mechanisms[0]];
    single.creative_rationale = [
      { hypothesis: "A single bold line may read at a glance.", evidence: ["slide:0"] },
      { hypothesis: "The caption may carry the detail the image leaves out.", evidence: ["caption"] },
    ];
    const verdict = validateDna(single, { ...post, expectedSlides: 1 });
    expect(verdict.errors).toEqual([]);
    expect(codes(verdict.warnings)).toContain("single_image_pattern");
  });

  it("always wants review while the AI flags it, and on any warning", () => {
    expect(needsReview({ errors: [], warnings: [] }, FIXTURE_DNA)).toBe(true); // fixture sets needs_review
    const dna = clone(FIXTURE_DNA);
    dna.quality.needs_review = false;
    expect(needsReview({ errors: [], warnings: [] }, dna)).toBe(false);
    expect(needsReview({ errors: [], warnings: [{ code: "uncertain", message: "" }] }, dna)).toBe(true);
  });
});
