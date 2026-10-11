import { describe, expect, it } from "vitest";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION, galleryFixture } from "./fixtures";
import { alignSlides, evidenceGroups, numberingOf, oneBased, parseEvidence, briefText, sentences, toPublicAnalysis, type AnalysisRecord, type SlideRecord } from "./publicAnalysis";
import type { CreativeDna, SlideObservation } from "./schema";
import { term } from "./taxonomy";

const CURRENT = "v-current";
const OLD = "v-old";

const record = (dna: unknown, count: number, overrides: Partial<AnalysisRecord> = {}): AnalysisRecord => ({
  creative_dna: dna,
  current_version_id: CURRENT,
  image_analysis_complete: true,
  expected_slides: count,
  processed_slides: count,
  ...overrides,
});
const rows = (slides: SlideObservation[], version = CURRENT): SlideRecord[] => slides.map((observation) => ({ version_id: version, position: observation.position, observation }));

describe("parseEvidence and evidenceGroups", () => {
  it("maps zero-based slide refs to the image they name, and names them from one", () => {
    const targets = parseEvidence(["slide:6", "slide:0", "caption"], 7);
    expect(targets).toEqual([{ kind: "slide", index: 0 }, { kind: "slide", index: 6 }, { kind: "caption" }]);
    expect(evidenceGroups(targets).map((group) => group.label)).toEqual(["Slide 1", "Slide 7", "Caption"]);
  });

  it("drops malformed and out-of-range refs instead of linking nowhere", () => {
    expect(parseEvidence(["slide:7", "slide:-1", "slide:x", "Slide:2", "image:1", 4, null, "metadata", "caption", "caption"], 7)).toEqual([{ kind: "caption" }, { kind: "metadata" }]);
    expect(parseEvidence("slide:1", 7)).toEqual([]);
  });

  it("groups consecutive slides into ranges and keeps sparse ones apart", () => {
    const groups = evidenceGroups(parseEvidence(["slide:5", "slide:0", "slide:1", "slide:2", "slide:3", "slide:4"], 7));
    expect(groups).toEqual([{ label: "Slides 1–6", target: { kind: "slide", index: 0 } }]);
    expect(evidenceGroups(parseEvidence(["slide:0", "slide:3", "slide:4", "metadata"], 7)).map((group) => group.label)).toEqual(["Slide 1", "Slides 4–5", "Post details"]);
  });
});

describe("oneBased", () => {
  it("renumbers slide mentions in stored prose from one", () => {
    expect(oneBased("The name repeats across slides 0 to 5. Slide 6 changes.", 7)).toBe("The name repeats across slides 1 to 6. Slide 7 changes.");
    expect(oneBased("Slide 2's name is low; slides 2, 4 and 5 are dark; slides 4–6 vary.", 7)).toBe("Slide 3's name is low; slides 3, 5 and 6 are dark; slides 5–7 vary.");
  });

  it("leaves counts and mentions that can't be zero-based alone", () => {
    expect(oneBased("All 7 slides share a template, and 13 slides in all.", 7)).toBe("All 7 slides share a template, and 13 slides in all.");
    expect(oneBased("Slide 7 is the product.", 7)).toBe("Slide 7 is the product.");
  });
});

describe("alignSlides", () => {
  it("keeps only the current version's records when two versions share a position", () => {
    const current = clone(FIXTURE_PERCEPTION.slides);
    const old = clone(FIXTURE_PERCEPTION.slides).map((slide) => ({ ...slide, observation: "OLD VERSION TEXT" }));
    const aligned = alignSlides([...rows(old, OLD), ...rows(current)], CURRENT, 3);
    expect(aligned.map((o) => o?.observation)).toEqual(current.map((slide) => slide.observation));
  });

  it("puts rows that arrive out of order at their own index", () => {
    const slides = clone(FIXTURE_PERCEPTION.slides);
    expect(alignSlides(rows([slides[2], slides[0], slides[1]]), CURRENT, 3).map((o) => o?.position)).toEqual([0, 1, 2]);
  });

  it("leaves a missing slide empty instead of shifting the next one into its place", () => {
    const slides = clone(FIXTURE_PERCEPTION.slides);
    const aligned = alignSlides(rows([slides[0], slides[2]]), CURRENT, 3);
    expect(aligned.map((o) => o?.position ?? null)).toEqual([0, null, 2]);
  });

  it("ignores repeats, positions that aren't an image, and everything without a current version", () => {
    const slides = clone(FIXTURE_PERCEPTION.slides);
    const repeat = { ...slides[0], observation: "a repeat" };
    const aligned = alignSlides([...rows(slides), ...rows([repeat]), { version_id: CURRENT, position: 9, observation: {} }, { version_id: CURRENT, position: 1.5, observation: {} }], CURRENT, 3);
    expect(aligned[0]?.observation).toBe(slides[0].observation);
    expect(alignSlides(rows(slides), null, 3)).toEqual([null, null, null]);
  });
});

describe("toPublicAnalysis", () => {
  it("fills every view from the fixture, with labels in words", () => {
    const analysis = toPublicAnalysis(record(FIXTURE_DNA, 3), rows(FIXTURE_PERCEPTION.slides), 3)!;
    expect(analysis.concept).toBe(FIXTURE_DNA.concept);
    expect(analysis.labels[0]).toMatchObject({ label: "Type", value: term("archetype", FIXTURE_DNA.primary_archetype.slug)!.label });
    expect(analysis.mechanisms.length).toBeGreaterThan(0);
    expect(analysis.hypotheses).toHaveLength(FIXTURE_DNA.creative_rationale.length);
    expect(analysis.visual.map((section) => section.title)).toContain("Typography");
    expect(analysis.slides.every(Boolean)).toBe(true);
    expect(analysis.slides[0]!.role).toBe(term("slide_role", FIXTURE_PERCEPTION.slides[0].role)!.label);
    expect(analysis.takeaways).toEqual(FIXTURE_DNA.takeaways);
    expect(analysis.adaptations).toEqual(FIXTURE_DNA.adaptation_ideas);
    expect(analysis.complete).toBe(true);
    // Nothing of the review machinery or the raw contract
    expect(Object.keys(analysis)).not.toEqual(expect.arrayContaining(["quality", "evidence", "schema_version"]));
  });

  it("reads the seven-slide gallery the way a designer should see it", () => {
    const { dna, slides } = galleryFixture();
    const analysis = toPublicAnalysis(record(dna, 7), rows([...slides].reverse()), 7)!;
    expect(analysis.labels.map((l) => [l.label, l.value])).toEqual([
      ["Type", term("archetype", "creator-feature")!.label],
      ["Inferred goal", term("objective", "awareness")!.label],
      ["Hook", term("hook_technique", "visual-only")!.label],
      ["Format", term("narrative_pattern", "gallery")!.label],
    ]);
    expect(analysis.sequence.formula).toBe(`${term("slide_role", "hook")!.label} → ${term("slide_role", "gallery-frame")!.label} ×5 → ${term("slide_role", "closing")!.label}`);
    expect(analysis.sequence.arc).toContain("Slide 7 signs off");
    expect(analysis.mechanisms.map((d) => d.kind)).toEqual(["observation", "interpretation", "observation"]);
    expect(analysis.mechanisms[1].text).toContain("slides 1 to 6");
    expect(evidenceGroups(analysis.hypotheses[0].evidence).map((g) => g.label)).toEqual(["Slides 1–6"]);
    expect(evidenceGroups(analysis.mechanisms[2].evidence)).toEqual([{ label: "Slide 7", target: { kind: "slide", index: 6 } }]);
    expect(analysis.slides[0]).toMatchObject({ index: 0, headline: "ALEX RIVERA", confidence: "high" });
    expect(analysis.slides[6]).toMatchObject({ index: 6, headline: null, brandTreatment: "Large white logo in the bottom corner over the photo." });
    expect(analysis.slides[6]!.changes).toEqual(expect.arrayContaining([expect.stringContaining("Product: low → high"), expect.stringContaining("New colours")]));
    const visual = Object.fromEntries(analysis.visual.map((section) => [section.title, section]));
    expect(visual.Composition.rows.map((row) => row.value)).not.toContain("Unknown");
    expect(evidenceGroups(visual.Composition.rows[0].evidence).map((g) => g.label)).toEqual(["Slides 1–7"]);
    expect(visual.Consistency.text).toBe("The name placement repeats across slides 1 to 6. Slide 7 changes to a product frame.");
    expect(visual.Branding.rows[0].evidence).toEqual([{ kind: "slide", index: 6 }]);
    expect(analysis.adaptations).toHaveLength(2);
    expect(analysis.caveats).toEqual(["Slide 3's name sits over a white shirt, so contrast is weaker there."]);
  });

  it("hides other, unknown and none wherever they'd show", () => {
    const { dna, slides } = galleryFixture();
    dna.marketing_objective.slug = "unknown";
    dna.primary_archetype.slug = "other";
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis.labels.map((l) => l.label)).toEqual(["Hook", "Format"]);
    expect(analysis.slides[0]!.facts.find((fact) => fact.label === "Devices")).toBeUndefined();
    expect(analysis.slides[6]!.facts.find((fact) => fact.label === "Type")).toBeUndefined();
    const devices = analysis.visual.find((section) => section.title === "Devices and texture")!;
    expect(devices.rows.map((row) => row.value)).toEqual([term("visual_device", "logo-lockup")!.label]);
  });

  it("makes swatches only from valid six-digit hex values", () => {
    const { dna, slides } = galleryFixture();
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis.slides[0]!.colours).toEqual(["#0b0a10", "#d9453d", "#f2eeee"]);
  });

  it("says when the analysis is incomplete instead of scoring it", () => {
    const { dna, slides } = galleryFixture();
    const partial = toPublicAnalysis(record(dna, 7, { processed_slides: 6, image_analysis_complete: false }), rows(slides.slice(0, 6)), 7)!;
    expect(partial.complete).toBe(false);
    expect(partial.slides[6]).toBeNull();
    expect(JSON.stringify(partial)).not.toMatch(/score|confidence_score|needs_review/);
    expect(toPublicAnalysis(record(dna, 7), rows(slides), 7)!.complete).toBe(true);
  });

  it("records a blank frame as blank and says nothing about it", () => {
    const { dna, slides } = galleryFixture();
    slides[3] = { ...slides[3], visible_text: { headline: null, body: null }, legibility: "no-text", imagery: ["video-frame"], objects: [], confidence: "low", observation: "Blank: the saved cover frame of this video slide is one flat colour, so what the video shows can't be told." };
    const blank = toPublicAnalysis(record(dna, 7), rows(slides), 7)!.slides[3]!;
    expect(blank).toMatchObject({ blank: true, facts: [], colours: [], headline: null, changes: [] });
  });

  it("survives an old or malformed record without crashing", () => {
    for (const junk of [null, undefined, 42, "text", [], {}, { concept: "" }, { concept: 7 }]) expect(toPublicAnalysis(record(junk, 3), [], 3)).toBeNull();
    const minimal = toPublicAnalysis(record({ concept: "Just a concept", narrative: "nope", visual_system: [1], takeaways: [null, "One", 3] }, 2), [{ version_id: CURRENT, position: 0, observation: "not an object" }], 2)!;
    expect(minimal).toMatchObject({ concept: "Just a concept", labels: [], creativeDecisions: [], mechanisms: [], hypotheses: [], takeaways: ["One"], adaptations: [], caveats: [] });
    expect(minimal.slides[0]).toMatchObject({ index: 0, facts: [], colours: [] });
    expect(minimal.slides[1]).toBeNull();
  });

  it("gives a single image no carousel story", () => {
    const dna = clone(FIXTURE_DNA) as CreativeDna;
    dna.narrative = { pattern: "single-image", arc: "One image.", slide_roles: [{ position: 0, role: "hook" }] };
    const analysis = toPublicAnalysis(record(dna, 1), rows([FIXTURE_PERCEPTION.slides[0]]), 1)!;
    expect(analysis.sequence).toEqual({ pattern: null, formula: null, arc: null, roles: [] });
    expect(analysis.labels.map((l) => l.label)).not.toContain("Format");
  });
});

describe("briefText", () => {
  it("builds a usable brief from what's on screen, with the reference and a credit", () => {
    const { dna, slides } = galleryFixture();
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    const brief = briefText(analysis, { brand: "Example Sports", url: "https://www.instagram.com/p/EXAMPLE/", format: "carousel", slides: 7 });
    for (const heading of ["CREATIVE PRINCIPLE", "SUGGESTED OBJECTIVE", "CONCEPT", "FORMAT", "VISUAL DIRECTION", "CONTENT STRUCTURE", "EXECUTION STEPS", "IMPORTANT CONSTRAINTS", "ORIGINAL REFERENCE", "ATTRIBUTION"]) expect(brief).toContain(heading);
    expect(brief).toContain("Fix one type treatment and position across a series so the images do the varying.");
    expect(brief).toContain("Built on: Hook portrait → Repeated portraits → Product reveal");
    expect(brief).toContain("Instagram carousel, about 7 slides");
    expect(brief).toMatch(/- Slides 2–6: /);
    expect(brief).toContain("1. Fix one name style and position across a portrait set.");
    expect(brief).toContain("- The product is the news, or people may stop before the last slide.");
    expect(brief).toContain("https://www.instagram.com/p/EXAMPLE/");
    expect(brief).toContain("Reference creative by Example Sports, used for its principle only.");
    expect(brief).not.toMatch(/ALEX RIVERA/);
  });
});

describe("creative decisions (2.1)", () => {
  it("maps decisions with one-based slides, and the formula, visual notes and data checks", () => {
    const { dna, slides } = galleryFixture();
    dna.integrity_notes = [
      { aspect: "Start values", status: "sound", note: "All series start at the same amount.", evidence: ["slide:0"] },
      { aspect: "Sources and disclaimers", status: "concern", note: "The source line on slide 6 is hard to read at phone size.", evidence: ["slide:6"] },
    ];
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis.creativeDecisions.map((d) => d.title)).toEqual(["Keep one name treatment across every portrait", "Hold the product back for the last frame"]);
    expect(evidenceGroups(analysis.creativeDecisions[0].evidence).map((g) => g.label)).toEqual(["Slides 1–6"]);
    expect(analysis.creativeDecisions[0].observation).toContain("slides 1 to 6");
    expect(analysis.creativeDecisions[1].observation).toMatch(/^Slide 7 drops/);
    expect(analysis.creativeDecisions[1].confidence).toBe("medium");
    expect(analysis.formula).toBe("Hook portrait → Repeated portraits → Product reveal");
    expect(analysis.visual.find((s) => s.title === "Composition")!.text).toContain("Tight crops");
    expect(analysis.visual.find((s) => s.title === "Branding")!.text).toBe("The logo appears once, oversized, on slide 7.");
    expect(analysis.integrity.map((n) => [n.aspect, n.status])).toEqual([["Start values", "sound"], ["Sources and disclaimers", "concern"]]);
    expect(analysis.integrity[1].note).toContain("slide 7");
  });

  it("drops a decision that's incomplete or rests only on a blank frame, rather than show half of it", () => {
    const { dna, slides } = galleryFixture();
    slides[6] = { ...slides[6], visible_text: { headline: null, body: null }, legibility: "no-text", imagery: ["video-frame"], objects: [], confidence: "low", observation: "Blank: the saved cover frame of this video slide is one flat colour, so what the video shows can't be told." };
    (dna.creative_decisions![0] as Record<string, unknown>).avoid_when = "";
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis.creativeDecisions).toEqual([]);
  });

  it("shows an analysis written before 2.1 without inventing decisions for it", () => {
    const { dna, slides } = galleryFixture();
    delete dna.creative_decisions;
    delete dna.integrity_notes;
    delete dna.visual_notes;
    delete dna.creative_formula;
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis).toMatchObject({ creativeDecisions: [], integrity: [], formula: null });
    expect(analysis.mechanisms.length).toBeGreaterThan(0);
    expect(analysis.visual.find((s) => s.title === "Composition")!.text).toBeNull();
  });
});

describe("slide numbering, from the review's failing cases", () => {
  it("shifts every slide in a mention and nothing that isn't a slide", () => {
    expect(oneBased("On slide 2, 3 players share the frame.", 7)).toBe("On slide 3, 3 players share the frame.");
    expect(oneBased("Slide 4 or 5 carries the logo.", 7)).toBe("Slide 5 or 6 carries the logo.");
    expect(oneBased("Compare slide 3 vs 4, then slides 4—6.", 7)).toBe("Compare slide 4 vs 5, then slides 5—7.");
    expect(oneBased("Slides 0 to 5, 12 faces in all.", 7)).toBe("Slides 1 to 6, 12 faces in all.");
    expect(oneBased("Slide 3, 2019's kit, sits low.", 7)).toBe("Slide 4, 2019's kit, sits low.");
    expect(oneBased("Slides 2, 4 and 5 are dark.", 7)).toBe("Slides 3, 5 and 6 are dark.");
  });

  it("settles each analysis's convention once, so prose that counts from one isn't shifted", () => {
    const editorWrote = "Slides 1–6 are portraits; slide 7 is the cleat.";
    expect(numberingOf([editorWrote], 7)).toBe("one");
    expect(oneBased(editorWrote, 7, "one")).toBe(editorWrote);
    expect(numberingOf(["The name repeats across slides 0 to 5.", "Slide 6 is the cleat."], 7)).toBe("zero");
    expect(numberingOf(["Slides 4 and 10 are blank."], 13)).toBe("zero");
  });

  it("renumbers the concept and a slide's branding note like everything else", () => {
    const { dna, slides } = galleryFixture();
    dna.concept = "Six portraits, closing on the product on slide 6.";
    slides[6] = { ...slides[6], brand_treatment: "Same lockup as slide 0, now oversized." };
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis.concept).toBe("Six portraits, closing on the product on slide 7.");
    expect(analysis.slides[6]!.brandTreatment).toBe("Same lockup as slide 1, now oversized.");
    expect(analysis.visual.find((s) => s.title === "Branding")!.rows[0].value).toBe("Same lockup as slide 1, now oversized.");
  });
});

describe("sentences", () => {
  it("doesn't break inside decimals, prices or abbreviations", () => {
    expect(sentences("The set uses a 4.5:1 crop on every face. The last frame drops to grass level. Third.", 2)).toBe("The set uses a 4.5:1 crop on every face. The last frame drops to grass level.");
    expect(sentences("A U.S. team roll call in six portraits. Next one. Third.", 1)).toBe("A U.S. team roll call in six portraits.");
    expect(sentences("Priced at $4.99, the offer leads. Then more.", 1)).toBe("Priced at $4.99, the offer leads.");
  });
});

describe("blank frames in Visual DNA", () => {
  it("never cites a blank frame as evidence", () => {
    const { dna, slides } = galleryFixture();
    slides[3] = { ...slides[3], visible_text: { headline: null, body: null }, legibility: "no-text", imagery: ["video-frame"], objects: [], confidence: "low", devices: ["logo-lockup"], observation: "Blank: the saved cover frame of this video slide is one flat colour, so what the video shows can't be told." };
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    for (const section of analysis.visual) for (const row of section.rows) expect(row.evidence).not.toContainEqual({ kind: "slide", index: 3 });
  });
});
