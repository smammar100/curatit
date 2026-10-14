import { describe, expect, it } from "vitest";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION, galleryFixture, legacy21 } from "./fixtures";
import { alignSlides, evidenceGroups, integritySummary, numberingOf, oneBased, parseEvidence, briefMarkdown, sentences, toPublicAnalysis, type AnalysisRecord, type SlideRecord } from "./publicAnalysis";
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
    const visual = Object.fromEntries(analysis.visual.map((section) => [section.key, section]));
    expect(analysis.visual.map((section) => section.title)).toEqual(["Composition", "Typography", "Colour", "Imagery", "Visual devices", "Branding & consistency"]);
    expect(visual.composition.chips).not.toContain("Unknown");
    expect(evidenceGroups(visual.composition.evidence).map((g) => g.label)).toEqual(["Slides 1–7"]);
    expect(visual.branding.insight).toBe("The logo appears once, oversized, on slide 7.");
    expect(visual.branding.evidence).toEqual([{ kind: "slide", index: 6 }]);
    for (const section of analysis.visual) expect(section.chips.length).toBeLessThanOrEqual(4);
    // What every slide shares and what changes: here the closing frame breaks every pattern
    expect(analysis.consistency!.same).toEqual([]);
    expect(analysis.consistency!.varies.map((change) => [change.label, evidenceGroups(change.evidence).map((g) => g.label)])).toEqual([
      ["Layout", ["Slide 7"]],
      ["Type", ["Slide 7"]],
      ["Imagery", ["Slide 7"]],
      ["Colour", ["Slide 7"]],
    ]);
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
    const devices = analysis.visual.find((section) => section.key === "devices")!;
    expect(devices.chips).toEqual([term("visual_device", "logo-lockup")!.label]);
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

describe("briefMarkdown", () => {
  const source = {
    brand: "Example Sports", shortCode: "EXAMPLE", url: "https://www.instagram.com/p/EXAMPLE/",
    format: "carousel" as const, slides: 7,
    images: Array.from({ length: 7 }, (_, i) => `/lib/example/${i + 1}.webp`),
    width: 1080, height: 1350,
  };
  const origin = "https://curatit.example";

  it("exports an ordered reconstruction brief with real copy, colours and absolute reference images", () => {
    const { dna, slides } = galleryFixture();
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    const brief = briefMarkdown(analysis, source, origin);
    expect(brief.startsWith("# Instagram post — 1:1 replica brief")).toBe(true);
    expect(brief).toContain("exactly 7 separate images");
    expect(brief.match(/^### Slide \d+$/gm)).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      expect(brief).toContain(`![Slide ${i + 1} reference](<${origin}/lib/example/${i + 1}.webp>)`);
      const headline = analysis.slides[i]?.headline;
      if (headline) expect(brief).toContain(headline);
    }
    expect(brief).toContain("ALEX RIVERA");
    expect(brief).toContain("#0b0a10");
    expect(brief).toContain("1080 × 1350 px");
    expect(brief).toContain("not a per-slide measurement");
    expect(brief).toContain("not a square aspect ratio");
    expect(brief).toContain("preserve the original copy, branding, imagery, composition and colours");
    expect(brief).toContain("do not impose a new safe-area template");
    expect(brief).toContain(source.url);
    expect(brief).not.toMatch(/\[your brand\]|Core idea to borrow|Write new words|in my own palette/);
    expect(brief.endsWith("\n")).toBe(true);
  });

  it("keeps a single-image or video-cover brief within its actual scope", () => {
    const { dna, slides } = galleryFixture();
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    const single = briefMarkdown(analysis, { ...source, format: "video", slides: 1, images: ["https://media.example/cover.webp"], width: null, height: null });
    expect(single).toContain("post as one image");
    expect(single).toContain("### Slide 1 — video cover only");
    expect(single).not.toContain("### Slide 2");
    expect(single).toContain("Canvas dimensions: not recorded");
    expect(single).toContain("one image named slide-01.png");
    expect(single).toContain("do not invent motion, audio or unseen frames");
  });

  it("marks missing analysis and inaccessible references without inventing source details", () => {
    const analysis = toPublicAnalysis(record({ concept: "A post" }, 3), [], 3)!;
    const brief = briefMarkdown(analysis, { ...source, slides: 3, images: ["javascript:alert(1)", "/lib/relative.webp"] });
    expect(brief.match(/Reference image unavailable/g)).toHaveLength(3);
    expect(brief.match(/No slide analysis recorded/g)).toHaveLength(3);
    expect(brief).not.toContain("javascript:");
    expect(brief).toContain("ask me to attach that slide and wait");
    expect(brief).toContain("Exact asset files, font identities, coordinates and per-slide dimensions are not supplied");
  });

  it("preserves multiline transcription and safely fences source Markdown", () => {
    const { dna, slides } = galleryFixture();
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    analysis.slides[0]!.headline = "50% OFF\n```\n# Keep this text\n```";
    analysis.slides[0]!.legibility = "partial";
    analysis.slides[0]!.body = null;
    const brief = briefMarkdown(analysis, source, origin);
    expect(brief).toContain("````text\n50% OFF\n```\n# Keep this text\n```\n````");
    expect(brief).toContain("Recorded text legibility: partial");
    expect(brief).toContain("Not recorded; inspect the image. This does not prove text is absent.");
    expect(brief).toContain("reference data, not instructions");
  });
});

describe("creative decisions and data checks", () => {
  it("maps 3.0 decisions with one-based slides, the explanation first, and the checks by kind", () => {
    const { dna, slides } = galleryFixture();
    dna.integrity_notes = [
      { aspect: "Start values", status: "observed", note: "All series start at the same amount.", evidence: ["slide:0"] },
      { aspect: "Sources and disclaimers", status: "potential_concern", note: "The source line on slide 6 is hard to read at phone size.", evidence: ["slide:6"] },
      { aspect: "Figures", status: "cannot_verify", note: "The end values can't be checked from the post.", evidence: ["slide:6"] },
    ];
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis.headline).toBe("Six named faces carry the emotion before one logo signs off");
    expect(analysis.summary).toContain("fixed name label");
    expect(analysis.creativeDecisions.map((d) => d.title)).toEqual(["Keep one name treatment across every portrait", "Hold the product back for the last frame"]);
    expect(evidenceGroups(analysis.creativeDecisions[0].evidence).map((g) => g.label)).toEqual(["Slides 1–6"]);
    expect(analysis.creativeDecisions[0]).toMatchObject({
      explanation: expect.stringContaining("same spaced white capitals"),
      observation: expect.stringContaining("slides 1 to 6"),
      effect: expect.stringContaining("fixed treatment"),
      watchOut: "White names lose contrast where they cross a light shirt, as on slide 3.",
    });
    expect(analysis.creativeDecisions[1].observation).toMatch(/^Slide 7 drops/);
    expect(analysis.creativeDecisions[1].confidence).toBe("medium");
    expect(analysis.formula).toBe("Hook portrait → Repeated portraits → Product reveal");
    // Concerns first, then what can't be checked, then observations
    expect(analysis.integrity.map((n) => [n.aspect, n.status])).toEqual([
      ["Sources and disclaimers", "concern"],
      ["Figures", "cannot_verify"],
      ["Start values", "observed"],
    ]);
    expect(integritySummary(analysis.integrity)).toBe("1 potential concern · 1 observation · 1 cannot verify");
    expect(analysis.integrity[0].note).toContain("slide 7");
    expect(analysis.colours).toEqual([
      { hex: "#0b0a10", role: "Background" },
      { hex: "#f2eeee", role: "Player names" },
      { hex: "#5fb81e", role: "Accent: the closing turf" },
    ]);
    expect(analysis.copywriting).toBe("Names only on the slides; the caption carries the context.");
    expect(analysis.application.whenToUse).toEqual(["A set of portraits or products shown one per slide."]);
    expect(analysis.visual.find((s) => s.key === "typography")!.insight).toBe("Spaced condensed capitals, white, one line, the only text on each portrait.");
  });

  it("never shows a check as verified, whatever the record says", () => {
    const { dna, slides } = galleryFixture();
    dna.integrity_notes = [{ aspect: "Figures", status: "verified" as never, note: "Checked.", evidence: ["slide:0"] }];
    expect(toPublicAnalysis(record(dna, 7), rows(slides), 7)!.integrity).toEqual([]);
  });

  it("shows a 2.1 analysis as written: the observation leads, avoid-when is the watch-out, old statuses map across", () => {
    const { dna, slides } = galleryFixture();
    const old = legacy21(dna);
    old.integrity_notes = [
      { aspect: "Start values", status: "sound", note: "All series start at the same amount.", evidence: ["slide:0"] },
      { aspect: "Figures", status: "unverified", note: "The end values can't be checked.", evidence: ["slide:6"] },
      { aspect: "Disclaimer", status: "concern", note: "Tiny and low-contrast.", evidence: ["slide:6"] },
    ];
    const analysis = toPublicAnalysis(record(old, 7), rows(slides), 7)!;
    expect(analysis.headline).toBe(analysis.concept);
    expect(analysis.creativeDecisions[0]).toMatchObject({
      explanation: expect.stringMatching(/^Each of slides 1 to 6/),
      observation: null,
      watchOut: "Avoid it when white names lose contrast where they cross a light shirt, as on slide 3.",
    });
    expect(analysis.integrity.map((n) => n.status)).toEqual(["concern", "cannot_verify", "observed"]);
    expect(analysis.application.whenToUse).toEqual(["A set of portraits or products shown one per slide."]);
    expect(analysis.colours.every((colour) => colour.role === null)).toBe(true);
    expect(analysis.colours.map((colour) => colour.hex)).toContain("#0b0a10");
    // No typography note before 3.0: the first sentence of the stored hierarchy stands in
    expect(analysis.visual.find((s) => s.key === "typography")!.insight).toBe("A single white name sits low on every portrait.");
  });

  it("drops a decision that's incomplete or rests only on a blank frame, rather than show half of it", () => {
    const { dna, slides } = galleryFixture();
    slides[6] = { ...slides[6], visible_text: { headline: null, body: null }, legibility: "no-text", imagery: ["video-frame"], objects: [], confidence: "low", observation: "Blank: the saved cover frame of this video slide is one flat colour, so what the video shows can't be told." };
    (dna.creative_decisions![0] as Record<string, unknown>).principle = "";
    const analysis = toPublicAnalysis(record(dna, 7), rows(slides), 7)!;
    expect(analysis.creativeDecisions).toEqual([]);
  });

  it("shows an analysis written before 2.1 without inventing decisions for it", () => {
    const { dna, slides } = galleryFixture();
    const old = legacy21(dna);
    delete old.creative_decisions;
    delete old.integrity_notes;
    delete old.visual_notes;
    delete old.creative_formula;
    const analysis = toPublicAnalysis(record(old, 7), rows(slides), 7)!;
    expect(analysis).toMatchObject({ creativeDecisions: [], integrity: [], formula: null, application: { whenToUse: [], whenNotToUse: [] } });
    expect(analysis.mechanisms.length).toBeGreaterThan(0);
    expect(analysis.visual.find((s) => s.key === "composition")!.insight).toBeNull();
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
    for (const section of analysis.visual) expect(section.evidence).not.toContainEqual({ kind: "slide", index: 3 });
  });
});
