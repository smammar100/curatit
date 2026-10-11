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
});
export type CreativeDna = z.infer<typeof CreativeDna>;
