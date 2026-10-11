// Creative Intelligence: a made-up three-slide post with a perception and a Creative DNA that pass
// every check, for the tests and the mock model. Not an analysis of a real Curatit post; tests
// break it on purpose with clone() and a single change.
import type { CreativeDna, Perception } from "./schema";
import { SCHEMA_VERSION } from "./schema";
import { TAXONOMY_VERSION } from "./taxonomy";

export const FIXTURE_POST = {
  id: "fixture-post",
  caption: "Your money, on autopilot. Set a rule once and every payday a slice goes straight to savings. Swipe to see how. Link in bio to start.",
  brand: "Example Bank",
  category: "Fintech",
  expectedSlides: 3,
};

export const FIXTURE_PERCEPTION: Perception = {
  schema_version: SCHEMA_VERSION,
  slides: [
    {
      position: 0,
      role: "hook",
      visible_text: { headline: "Saving, minus the effort", body: null },
      legibility: "clear",
      text_density: "low",
      typography: { classes: ["sans-serif"], weight: "heavy" },
      layout: ["text-only", "centered"],
      imagery: ["typographic"],
      palette: { families: ["green", "white"], hex: ["#1f7a4d", "#ffffff"] },
      devices: ["swipe-cue"],
      product_prominence: "none",
      people_prominence: "none",
      objects: [],
      brand_treatment: "Small wordmark bottom left",
      observation: "A single heavy headline centred on a flat green ground with an arrow pointing right.",
      confidence: "high",
    },
    {
      position: 1,
      role: "step",
      visible_text: { headline: "Pick a rule", body: "Round up every card payment" },
      legibility: "clear",
      text_density: "medium",
      typography: { classes: ["sans-serif"], weight: "bold" },
      layout: ["ui-mockup"],
      imagery: ["screenshot-ui"],
      palette: { families: ["green", "white"], hex: ["#1f7a4d"] },
      devices: ["annotations", "numbered-steps"],
      product_prominence: "high",
      people_prominence: "none",
      objects: ["phone", "toggle"],
      brand_treatment: null,
      observation: "A phone screen showing the rule settings with a callout on the round-up toggle, numbered 1.",
      confidence: "high",
    },
    {
      position: 2,
      role: "cta",
      visible_text: { headline: "Start in two minutes", body: "Link in bio" },
      legibility: "clear",
      text_density: "low",
      typography: { classes: ["sans-serif"], weight: "heavy" },
      layout: ["text-only", "centered"],
      imagery: ["typographic"],
      palette: { families: ["green", "white"], hex: ["#1f7a4d"] },
      devices: ["logo-lockup"],
      product_prominence: "low",
      people_prominence: "none",
      objects: [],
      brand_treatment: "Logo centred under the headline",
      observation: "Closing slide repeats the green ground with the headline and the logo.",
      confidence: "high",
    },
  ],
  caption: {
    hook_text: "Your money, on autopilot.",
    hook_technique: "bold-claim",
    cta: "link-in-bio",
    tone: ["confident", "minimal"],
    promotional_language: true,
    partnership_signals: [],
    topic: "Automatic saving rules",
    audience: "People who find it hard to save regularly",
  },
  conflicts: [],
};

export const FIXTURE_DNA: CreativeDna = {
  schema_version: SCHEMA_VERSION,
  taxonomy_version: TAXONOMY_VERSION,
  primary_archetype: { slug: "product-feature", evidence: ["slide:1", "caption"] },
  secondary_archetypes: [{ slug: "how-to-use", evidence: ["slide:1"] }],
  marketing_objective: { slug: "consideration", evidence: ["caption", "slide:2"] },
  concept: "Saving made to feel like a setting you switch on once",
  creative_summary:
    "A three-slide explainer that turns an automatic savings rule into a simple sequence: the promise, the one setting, the payoff. Flat brand green and one heavy sans-serif keep every frame quiet so the interface screenshot carries the detail.",
  content_intent: "Explain one feature well enough that the next step feels small",
  hook: { technique: "bold-claim", observed_text: "Saving, minus the effort", location: "both", evidence: ["slide:0", "caption"] },
  visual_system: {
    composition: ["text-only", "ui-mockup"],
    typography: ["sans-serif"],
    imagery: ["typographic", "screenshot-ui"],
    palette: ["green", "white"],
    text_hierarchy: "One heavy headline per slide; the middle slide adds a short body line under it.",
    decorative_system: "Numbered callout and a single arrow; nothing else decorates the frames.",
    brand_consistency: "The same green ground and wordmark open and close the set.",
  },
  narrative: {
    pattern: "step-by-step",
    slide_roles: [
      { position: 0, role: "hook" },
      { position: 1, role: "step" },
      { position: 2, role: "cta" },
    ],
    arc: "Promise, then the single action that delivers it, then how little time it takes.",
  },
  copy_strategy: {
    tone: ["confident", "minimal"],
    persuasion: ["utility", "curiosity"],
    cta: "link-in-bio",
    complexity: "low",
    notes: "Short declaratives; the caption restates the promise and points to the link.",
  },
  attention_mechanisms: [
    { statement: "A flat brand colour with very little text on the first slide", kind: "observation", evidence: ["slide:0"] },
    { statement: "The callout pulls the eye to the one control that matters", kind: "interpretation", evidence: ["slide:1"] },
  ],
  creative_rationale: [
    { hypothesis: "Showing the actual setting may make the feature feel easy to try.", evidence: ["slide:1"] },
    { hypothesis: "Matching first and last slides may make the set read as one complete thought.", evidence: ["slide:0", "slide:2"] },
  ],
  takeaways: [
    "Put the one control that delivers the promise on its own slide, annotated",
    "Open and close on the same ground colour so a short carousel feels finished",
    "Keep each frame to one headline when a screenshot has to carry the detail",
  ],
  adaptation_ideas: ["A meal-kit brand could show its single skip-a-week switch the same way, with its own screens and words."],
  constraints_or_uncertainties: [],
  evidence: [
    { ref: "caption", observation: "The caption opens with the promise", quote: "Your money, on autopilot." },
    { ref: "slide:0", observation: "Headline on a flat green ground", quote: "Saving, minus the effort" },
    { ref: "slide:1", observation: "Round-up toggle with a numbered callout", quote: "Pick a rule" },
  ],
  quality: { image_analysis_complete: true, expected_slides: 3, processed_slides: 3, needs_review: true, uncertainties: [] },
};

export const clone = <T,>(value: T): T => structuredClone(value);
