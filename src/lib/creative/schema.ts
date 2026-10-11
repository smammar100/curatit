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
// the post communicates, with what was done, why it might work, the transferable principle, and
// the slides that show it. A post gets one to five, never padded. From 3.0 each is one technique
// with a short explanation shown first and a watch-out; when to use the idea moved to the post's
// `application`, so use_when and avoid_when are only in analyses written before.
export const CreativeDecision = z.object({
  // A short technique, written as an instruction ("Lead with a verdict, then show the comparison")
  title: text(90),
  // 3.0: what the choice is and why it matters, in one or two sentences, shown before the rest
  explanation: text(240).optional(),
  // What the designer did, from visible evidence
  observation: text(300),
  // Why it might work: a hedged mechanism of attention, comprehension or storytelling
  rationale: text(300),
  // The design rule underneath, in one sentence someone could reuse
  principle: text(200),
  use_when: text(200).optional(),
  avoid_when: text(200).optional(),
  // 3.0: what this choice costs or risks in this post, or null when nothing notable
  watch_out: text(200).nullable().optional(),
  evidence: refs,
  confidence: z.enum(["high", "medium", "low"]),
});
export type CreativeDecision = z.infer<typeof CreativeDecision>;

// What synthesis writes from 3.0 (prompt 2026.10.11-4): one technique, short enough to scan
const CreativeDecisionOutput = z.object({
  title: text(70),
  explanation: text(220),
  observation: text(220),
  rationale: text(220),
  principle: text(160),
  watch_out: text(180).nullable(),
  evidence: refs,
  confidence: z.enum(["high", "medium", "low"]),
});

// A check on what a data-driven creative (charts, statistics, prices, financial, health or
// scientific claims, comparisons) shows, apart from how well it's designed. Nothing here is
// independently fact-checked. From 3.0 the status says what kind of statement it is: "observed"
// (a fact about what the creative shows), "potential_concern" (something that could mislead) or
// "cannot_verify" (a figure or claim the post doesn't let anyone check). A "verified" status is
// reserved for real verification against a source, which the pipeline never does. Analyses
// written before 3.0 say "sound", "concern" or "unverified"; the page reads them as observed,
// potential concern and cannot verify.
export const INTEGRITY_STATUS = ["observed", "potential_concern", "cannot_verify"] as const;
export const IntegrityNote = z.object({
  // What was checked: "Start values", "Time period", "Baseline", "Inflation", "Sources and disclaimers"…
  aspect: text(60),
  status: z.enum(["sound", "concern", "unverified", ...INTEGRITY_STATUS]),
  note: text(240),
  evidence: refs,
});
export type IntegrityNote = z.infer<typeof IntegrityNote>;
const IntegrityNoteOutput = IntegrityNote.extend({ aspect: text(48), status: z.enum(INTEGRITY_STATUS), note: text(200) });

// How the visual system is actually executed, a sentence per dimension the tags can't say.
// Typography and devices joined in 3.0
const VisualNotes = z.object({
  composition: text(240).nullable(),
  typography: text(240).nullable().optional(),
  colour: text(240).nullable(),
  imagery: text(240).nullable(),
  devices: text(240).nullable().optional(),
  branding: text(240).nullable(),
});
const VisualNotesOutput = z.object({
  composition: text(180).nullable(),
  typography: text(180).nullable(),
  colour: text(180).nullable(),
  imagery: text(180).nullable(),
  devices: text(180).nullable(),
  branding: text(180).nullable(),
});

// A colour the post is built on and the job it does ("Background", "Headline", "Accent: the
// stocks line"). The hex is one measured from the slides' pixels (colours.ts), never guessed
export const ColourRole = z.object({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/), role: text(48) });

// When the idea is worth using and when it isn't (3.0), for the Apply tab
const Application = z.object({ when_to_use: some(text(160), 1, 3), when_not_to_use: some(text(160), 1, 3) });

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
  // Creative Intelligence 3.0 (prompt 2026.10.11-4), optional for the same reason:
  // the strategy in one line of 8 to 14 words, and a sentence or two after it
  strategy_headline: text(110).optional(),
  strategy_summary: text(280).optional(),
  colour_roles: some(ColourRole, 0, 6).optional(),
  // How the words work, for a brief: voice, length, what the headline does, what the caption adds
  copywriting: text(240).nullable().optional(),
  application: Application.optional(),
});
export type CreativeDna = z.infer<typeof CreativeDna>;

// What synthesis must return from 3.0 on: the same Creative DNA with the new parts required and
// the reading text kept short (headline 8 to 14 words, explanations in a sentence or two)
export const CreativeDnaOutput = CreativeDna.extend({
  creative_decisions: some(CreativeDecisionOutput, 1, 4),
  integrity_notes: some(IntegrityNoteOutput, 0, 8),
  visual_notes: VisualNotesOutput,
  creative_formula: text(140).nullable(),
  strategy_headline: text(110),
  strategy_summary: text(240),
  colour_roles: some(ColourRole, 0, 6),
  copywriting: text(220).nullable(),
  application: Application,
  takeaways: some(text(180), 3, 5),
  adaptation_ideas: some(text(220), 1, 2),
});
export type CreativeDnaOutput = z.infer<typeof CreativeDnaOutput>;
