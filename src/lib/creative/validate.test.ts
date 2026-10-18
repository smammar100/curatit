import { describe, expect, it } from "vitest";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION, FIXTURE_POST, legacy21 } from "./fixtures";
import { needsReview, periodMiscounts, validateDna, validatePerception, yearRanges } from "./validate";

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
  it.each(["Cannot check the data.", "Claims cannot be verified.", "We can't verify the figures."])("rejects generic filler: %s", (note) => {
    const dna = clone(FIXTURE_DNA);
    dna.constraints_or_uncertainties = [note];
    expect(codes(validateDna(dna, post).errors)).toContain("verification_boilerplate");
  });
  it("rejects repeated public caveats and generic verification filler", () => {
    const dna = clone(FIXTURE_DNA);
    const note = "Product availability and prices are not independently verified.";
    dna.integrity_notes = [{ aspect: "Availability", status: "cannot_verify", note, evidence: ["slide:0"] }];
    dna.constraints_or_uncertainties = [note];
    const errors = codes(validateDna(dna, post).errors);
    expect(errors).toContain("verification_boilerplate");
    expect(errors).toContain("duplicate_caveat");
  });

  it("preserves a concrete missing chart source", () => {
    const dna = clone(FIXTURE_DNA);
    dna.integrity_notes = [{ aspect: "Sample", status: "cannot_verify", note: "The survey percentage has no sample size or fieldwork date in its footnote.", evidence: ["slide:0"] }];
    dna.constraints_or_uncertainties = [];
    expect(codes(validateDna(dna, post).errors)).not.toContain("verification_boilerplate");
  });
  it("checks a creative decision's evidence like any other", () => {
    const dna = clone(FIXTURE_DNA);
    dna.creative_decisions![0].evidence = ["slide:7"];
    expect(validateDna(dna, post).errors.map((issue) => `${issue.code}@${issue.path}`)).toContain("bad_evidence_ref@creative_decisions.0");
  });

  it("refuses advice to distort data or play down a disclosure, but lets descriptions say so", () => {
    const dna = clone(FIXTURE_DNA);
    dna.takeaways[0] = "Keep the sources and disclaimer small and low-contrast at the bottom so they do not compete with the data.";
    dna.takeaways[1] = "Give the lagging series a muted hue and a flat line so it looks static next to the rising ones.";
    dna.creative_decisions![0].principle = "Truncate the y-axis so the gap between the series looks bigger.";
    const paths = validateDna(dna, post).errors.filter((issue) => issue.code === "recommends_distortion").map((issue) => issue.path);
    expect(paths).toEqual(["takeaways.0", "takeaways.1", "creative_decisions.0.principle"]);

    const described = clone(FIXTURE_DNA);
    described.creative_decisions![0].observation = "The sources and disclaimer sit small and low-contrast under the chart.";
    described.creative_decisions![0].avoid_when = "When the disclaimer is material; this one is hard to read at phone size.";
    described.takeaways[0] = "Keep every source legible at phone size, set below the chart in the body colour.";
    expect(codes(validateDna(described, post).errors)).not.toContain("recommends_distortion");
  });

  it("refuses jargon and scores nobody measured", () => {
    const dna = clone(FIXTURE_DNA);
    dna.creative_decisions![0].rationale = "The contrast creates cognitive tension that may hold attention.";
    dna.visual_notes!.colour = "A palette that rates 9/10 for warmth.";
    const found = validateDna(dna, post).errors.map((issue) => `${issue.code}@${issue.path}`);
    expect(found).toContain("buzzword@creative_decisions.0.rationale");
    expect(found).toContain("invented_score@visual_notes.colour");
  });

  it("asks for an integrity check when a slide shows data, only on 2.1 analyses", () => {
    const perception = clone(FIXTURE_PERCEPTION);
    perception.slides[1].imagery = ["data-visualization"];
    expect(codes(validateDna(clone(FIXTURE_DNA), post, perception).errors)).toContain("integrity_missing");
    const older = clone(FIXTURE_DNA);
    delete older.integrity_notes;
    expect(codes(validateDna(older, post, perception).errors)).not.toContain("integrity_missing");
    const checked = clone(FIXTURE_DNA);
    checked.integrity_notes = [{ aspect: "Start values", status: "sound", note: "Every series starts from the same amount in the same year.", evidence: ["slide:1"] }];
    expect(codes(validateDna(checked, post, perception).errors)).not.toContain("integrity_missing");
  });

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
    single.creative_decisions = [{ ...single.creative_decisions![0], evidence: ["slide:0"] }];
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

describe("validateDna: Creative Intelligence 3.0", () => {
  it("still accepts an analysis written before 3.0", () => {
    expect(validateDna(legacy21(FIXTURE_DNA), post, FIXTURE_PERCEPTION).errors).toEqual([]);
  });

  it("sends back a decision that's two techniques", () => {
    const dna = clone(FIXTURE_DNA);
    dna.creative_decisions![0].title = "Start all lines together and label their ends";
    expect(codes(validateDna(dna, post).errors)).toContain("compound_decision");
    // "and" between two things, not two moves, is fine
    dna.creative_decisions![0].title = "Set the name in black and white capitals";
    expect(codes(validateDna(dna, post).errors)).not.toContain("compound_decision");
  });

  it("warns when two decisions say the same thing", () => {
    const dna = clone(FIXTURE_DNA);
    dna.creative_decisions![1] = { ...dna.creative_decisions![1], title: "Put the promise alone on the cover slide" };
    expect(codes(validateDna(dna, post).warnings)).toContain("duplicate_decision");
  });

  it("holds the strategy headline to 8 to 14 words, give or take, and explanations to two sentences", () => {
    const dna = clone(FIXTURE_DNA);
    dna.strategy_headline = "Promise first";
    expect(codes(validateDna(dna, post).errors)).toContain("too_long");
    const long = clone(FIXTURE_DNA);
    long.creative_decisions![0].explanation = "The cover is bold. It has one line. Nothing else is on it.";
    expect(codes(validateDna(long, post).errors)).toContain("too_long");
  });

  it("only lets colour roles use colours measured on a slide", () => {
    const dna = clone(FIXTURE_DNA);
    expect(validateDna(dna, post, FIXTURE_PERCEPTION).errors).toEqual([]);
    dna.colour_roles = [{ hex: "#ff00ff", role: "Accent" }];
    const errors = validateDna(dna, post, FIXTURE_PERCEPTION).errors;
    expect(codes(errors)).toEqual(["colour_not_measured"]);
    expect(errors[0].message).toContain("#1f7a4d");
    // A near miss from copying is fine
    dna.colour_roles = [{ hex: "#1f7b4e", role: "Background" }];
    expect(validateDna(dna, post, FIXTURE_PERCEPTION).errors).toEqual([]);
  });

  it("never lets a data check call a figure accurate or verified", () => {
    const dna = clone(FIXTURE_DNA);
    dna.integrity_notes = [{ aspect: "Figures", status: "observed", note: "The end values are accurate.", evidence: ["slide:1"] }];
    expect(codes(validateDna(dna, post).errors)).toContain("overclaims_verification");
    dna.integrity_notes[0].note = "The end values can't be checked from the post; they are not verified.";
    expect(codes(validateDna(dna, post).errors)).not.toContain("overclaims_verification");
  });

  // The Wealthsimple chart: the copy says "the next 11 years" and the axis runs 2015 to 2025
  it("catches a period counted by its labels, unless it's the post's own claim", () => {
    const perception = clone(FIXTURE_PERCEPTION);
    perception.slides[1].visible_text.body = "Value of TFSA\n2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025";
    const dna = clone(FIXTURE_DNA);
    dna.concept = "A three-line chart showing $10,000 growing in stocks but shrinking in cash over 11 years";
    const errors = validateDna(dna, post, perception).errors;
    expect(codes(errors)).toContain("period_miscount");
    expect(errors.find((e) => e.code === "period_miscount")?.message).toContain("10 years elapse");

    dna.concept = "A three-line chart showing $10,000 growing in stocks but shrinking in cash from 2015 to 2025";
    dna.integrity_notes = [{ aspect: "Time period", status: "potential_concern", note: "The copy says 11 years, but the axis runs 2015 to 2025, 10 years between labels.", evidence: ["slide:1"] }];
    expect(codes(validateDna(dna, post, perception).errors)).not.toContain("period_miscount");
  });

  it("reads year ranges from dashes and from a chart's axis, and counts years in words", () => {
    expect(yearRanges(["From 2015–2025", "Axis 2019 2020 2021 2022"])).toEqual([
      [2015, 2025],
      [2019, 2022],
    ]);
    expect(periodMiscounts("Cash shrank over eleven years.", [[2015, 2025]])).toEqual([{ said: 11, range: [2015, 2025] }]);
    expect(periodMiscounts("Cash shrank over 10 years.", [[2015, 2025]])).toEqual([]);
    expect(periodMiscounts("A 4-year span.", [[2019, 2022]])).toEqual([{ said: 4, range: [2019, 2022] }]);
    expect(periodMiscounts("It shows 11 labelled years.", [[2015, 2025]])).toEqual([]);
    expect(periodMiscounts("Over 11 years.", [])).toEqual([]);
  });

  it("checks the new prose for performance claims, process talk and distortion", () => {
    const dna = clone(FIXTURE_DNA);
    dna.application!.when_to_use = ["Make the disclaimer smaller so it doesn't compete with the chart."];
    dna.strategy_summary = "This high-converting layout went viral.";
    const found = codes(validateDna(dna, post).errors);
    expect(found).toContain("recommends_distortion");
    expect(found).toContain("performance_claim");
  });
});
