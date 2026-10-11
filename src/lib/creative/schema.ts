// Creative Intelligence: the contracts the model's output must meet, as zod schemas. Two stages:
// perception (what each slide shows, and what the caption says) and synthesis (the Creative DNA
// a designer reads). Everything enumerable is a taxonomy slug (taxonomy.ts); free text is only in
// summaries, rationale and observations, and every claim worth checking points at its evidence:
// "caption", "metadata", or "slide:N" with N the zero-based post_images.position. What's observed
// is kept apart from what's interpreted or hypothesised. These schemas check shape; the rules
// that need the post itself (every slide present, quotes really in the caption…) are in
// validate.ts.
import { z } from "zod";
import { slugs, TAXONOMY_VERSION } from "./taxonomy";

export const SCHEMA_VERSION = "1.0";

const text = (max: number) => z.string().trim().min(1).max(max);
const enumOf = (dimension: Parameters<typeof slugs>[0]) => z.enum(slugs(dimension));
const some = <T extends z.ZodType>(item: T, min: number, max: number) => z.array(item).min(min).max(max);

// Where a statement comes from
export const EvidenceRef = z.string().regex(/^(caption|metadata|slide:\d{1,3})$/, "Evidence must be caption, metadata or slide:N");
export type EvidenceRef = z.infer<typeof EvidenceRef>;
const refs = some(EvidenceRef, 1, 6);

// ---- Perception: one record per slide, and the caption ----

export const SlideObservation = z.object({
  position: z.number().int().min(0),
  role: enumOf("slide_role"),
  // Copy visible on the slide, as written; null when there is none or it can't be read
  visible_text: z.object({
    headline: text(200).nullable(),
    body: text(600).nullable(),
  }),
  legibility: z.enum(["clear", "partial", "illegible", "no-text"]),
  text_density: enumOf("level"),
  typography: z.object({ classes: some(enumOf("typography"), 1, 3), weight: enumOf("type_weight") }),
  layout: some(enumOf("layout"), 1, 3),
  imagery: some(enumOf("imagery"), 1, 3),
  palette: z.object({
    families: some(enumOf("palette"), 1, 4),
    // Approximate, from the image; not brand colour codes
    hex: some(z.string().regex(/^#[0-9a-fA-F]{6}$/), 0, 5),
  }),
  devices: some(enumOf("visual_device"), 0, 6),
  product_prominence: enumOf("level"),
  people_prominence: enumOf("level"),
  objects: some(text(40), 0, 8),
  brand_treatment: text(200).nullable(),
  observation: text(400),
  confidence: z.enum(["high", "medium", "low"]),
});
export type SlideObservation = z.infer<typeof SlideObservation>;

export const CaptionAnalysis = z.object({
  hook_text: text(240).nullable(),
  hook_technique: enumOf("hook_technique"),
  cta: enumOf("cta"),
  tone: some(enumOf("tone"), 1, 3),
  promotional_language: z.boolean(),
  // Accounts, brands or words that signal a partnership, as written
  partnership_signals: some(text(80), 0, 6),
  topic: text(160).nullable(),
  audience: text(160).nullable(),
});
export type CaptionAnalysis = z.infer<typeof CaptionAnalysis>;

export const Perception = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  slides: some(SlideObservation, 1, 20),
  caption: CaptionAnalysis,
  // Where the caption and the images disagree, kept rather than resolved
  conflicts: some(text(240), 0, 6),
});
export type Perception = z.infer<typeof Perception>;

// ---- Synthesis: the Creative DNA ----

const Label = (dimension: Parameters<typeof slugs>[0]) => z.object({ slug: enumOf(dimension), evidence: refs });

// A creative decision (Creative Intelligence 2.1): one specific, observable choice that shapes how
// the post communicates, with what was done, why it might work, the transferable principle, when
// to use it and when not, and the slides that show it. A post gets one to five, never padded.
export const CreativeDecision = z.object({
  // A short technique, written as an instruction ("Lead with a verdict, then show the comparison")
  title: text(90),
  // What the designer did, from visible evidence
  observation: text(300),
  // Why it might work: a hedged mechanism of attention, comprehension or storytelling
  rationale: text(300),
  // The design rule underneath, in one sentence someone could reuse
  principle: text(200),
  use_when: text(200),
  avoid_when: text(200),
  evidence: refs,
  confidence: z.enum(["high", "medium", "low"]),
});
export type CreativeDecision = z.infer<typeof CreativeDecision>;

// A check on what a data-driven creative (charts, statistics, prices, financial, health or
// scientific claims, comparisons) shows, apart from how well it's designed. "unverified" when the
// post itself can't settle it; nothing here is independently fact-checked.
export const IntegrityNote = z.object({
  // What was checked: "Start values", "Time period", "Baseline", "Inflation", "Sources and disclaimers"…
  aspect: text(60),
  status: z.enum(["sound", "concern", "unverified"]),
  note: text(240),
  evidence: refs,
});
export type IntegrityNote = z.infer<typeof IntegrityNote>;

// How the visual system is actually executed, a sentence or two per dimension the tags can't say
const VisualNotes = z.object({
  composition: text(240).nullable(),
  colour: text(240).nullable(),
  imagery: text(240).nullable(),
  branding: text(240).nullable(),
});

export const CreativeDna = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  taxonomy_version: z.literal(TAXONOMY_VERSION),
  primary_archetype: Label("archetype"),
  secondary_archetypes: some(Label("archetype"), 0, 3),
  marketing_objective: Label("objective"),
  concept: text(160),
  creative_summary: text(600),
  content_intent: text(280),
  hook: z.object({
    technique: enumOf("hook_technique"),
    observed_text: text(240).nullable(),
    location: z.enum(["image", "caption", "both", "none"]),
    evidence: refs,
  }),
  visual_system: z.object({
    composition: some(enumOf("layout"), 1, 3),
    typography: some(enumOf("typography"), 1, 3),
    imagery: some(enumOf("imagery"), 1, 3),
    palette: some(enumOf("palette"), 1, 4),
    text_hierarchy: text(280),
    decorative_system: text(280).nullable(),
    brand_consistency: text(280).nullable(),
  }),
  narrative: z.object({
    pattern: enumOf("narrative_pattern"),
    slide_roles: some(z.object({ position: z.number().int().min(0), role: enumOf("slide_role") }), 1, 20),
    arc: text(400),
  }),
  copy_strategy: z.object({
    tone: some(enumOf("tone"), 1, 3),
    persuasion: some(enumOf("persuasion"), 1, 4),
    cta: enumOf("cta"),
    complexity: z.enum(["low", "medium", "high"]),
    notes: text(400),
  }),
  attention_mechanisms: some(z.object({ statement: text(240), kind: z.enum(["observation", "interpretation"]), evidence: refs }), 1, 4),
  creative_rationale: some(z.object({ hypothesis: text(320), evidence: refs }), 2, 4),
  takeaways: some(text(220), 3, 5),
  adaptation_ideas: some(text(280), 1, 3),
  constraints_or_uncertainties: some(text(240), 0, 6),
  evidence: some(z.object({ ref: EvidenceRef, observation: text(280), quote: text(160).nullable() }), 1, 20),
  quality: z.object({
    image_analysis_complete: z.boolean(),
    expected_slides: z.number().int().min(0),
    processed_slides: z.number().int().min(0),
    needs_review: z.boolean(),
    uncertainties: some(text(240), 0, 6),
  }),
  // Creative Intelligence 2.1 (prompt 2026.10.11-3). Optional here, so analyses written before
  // them stay valid; the model is held to them through CreativeDnaOutput
  creative_decisions: some(CreativeDecision, 1, 5).optional(),
  integrity_notes: some(IntegrityNote, 0, 8).optional(),
  visual_notes: VisualNotes.optional(),
  // The idea as a reusable sequence of moves: "Bold claim → Clear comparison → Visual evidence"
  creative_formula: text(160).nullable().optional(),
});
export type CreativeDna = z.infer<typeof CreativeDna>;

// What synthesis must return from 2.1 on: the same Creative DNA with the new parts required
export const CreativeDnaOutput = CreativeDna.extend({
  creative_decisions: some(CreativeDecision, 1, 5),
  integrity_notes: some(IntegrityNote, 0, 8),
  visual_notes: VisualNotes,
  creative_formula: text(160).nullable(),
});
export type CreativeDnaOutput = z.infer<typeof CreativeDnaOutput>;
