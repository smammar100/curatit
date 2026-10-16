// The public contracts of Curatit's research API, written once in zod and used three ways: MCP
// tools (input and output schemas), the REST routes (validation) and the OpenAPI document
// (generated from these). Keep the shapes flat: no nested unions, no vendor features, so every
// host's schema import copes.
//
// Vocabulary. The catalog classifies posts on separate dimensions and this API keeps them apart:
// an industry (a category: the brand's main one, or one its posts are tagged with), a format
// (static, carousel, video), a goal, a creative approach, and the visual dimensions (typography,
// layout, imagery, palette, visual devices), plus tone, persuasion and call to action. Allowed
// values come from curatit_get_taxonomy, never from guesses; there is no theme or occasion
// dimension in the catalog today, so no filter for it.
//
// 1.1 (2026-10-13) added fields only: the 3.0 analysis (strategy, decisions, data checks, when to
// use it, visual notes, measured colours, the copy brief), a post's every category, and tone,
// persuasion and call to action in the classification. Fields that a later change fills are
// declared optional, so a client never sees one half-built.

import { z } from "zod";
import { ERROR_CODES } from "./errors";

export const SCHEMA_VERSION = "1.1";

// Filters, as a client sends them (plural keys), and the catalog dimension each one maps to.
// `single` filters take one value in this release (the catalog searches one industry and one
// brand at a time); the rest take up to ten terms, alternatives within the dimension.
export const FILTERS = {
  industries: { dimension: "category", single: true, description: "A category: the brand's main category or one its posts are tagged with, e.g. finance (taxonomy dimension `industry`)." },
  brands: { dimension: "brand", single: true, description: "A brand, by slug or name (taxonomy dimension `brand`)." },
  formats: { dimension: "format", single: true, description: "static, carousel or video." },
  goals: { dimension: "objective", single: false, description: "What the post is trying to do (taxonomy dimension `goal`)." },
  creative_approaches: { dimension: "archetype", single: false, description: "The creative approach, e.g. a comparison or a testimonial (taxonomy dimension `creative_approach`)." },
  approach_families: { dimension: "archetype_family", single: false, description: "A family of creative approaches." },
  hook_techniques: { dimension: "hook_technique", single: false, description: "How the first slide earns attention." },
  narrative_patterns: { dimension: "narrative_pattern", single: false, description: "How a carousel's slides are sequenced." },
  typography: { dimension: "typography", single: false, description: "Typographic style seen on the slides." },
  layouts: { dimension: "layout", single: false, description: "Layout patterns seen on the slides." },
  imagery: { dimension: "imagery", single: false, description: "Kind of imagery (photography, illustration, UI...)." },
  palettes: { dimension: "palette", single: false, description: "Colour palette character." },
  visual_devices: { dimension: "visual_device", single: false, description: "Visual devices such as arrows, stickers or charts." },
  tones: { dimension: "tone", single: false, description: "Tone of voice." },
  persuasion: { dimension: "persuasion", single: false, description: "Persuasion technique." },
  ctas: { dimension: "cta", single: false, description: "Call-to-action style." },
} as const;
export type FilterKey = keyof typeof FILTERS;

// What curatit_get_taxonomy calls each dimension, with the filter key that uses it
export const TAXONOMY_DIMENSIONS = [
  { dimension: "industry", filter: "industries" },
  { dimension: "brand", filter: "brands" },
  { dimension: "format", filter: "formats" },
  { dimension: "goal", filter: "goals" },
  { dimension: "creative_approach", filter: "creative_approaches" },
  { dimension: "approach_family", filter: "approach_families" },
  { dimension: "hook_technique", filter: "hook_techniques" },
  { dimension: "narrative_pattern", filter: "narrative_patterns" },
  { dimension: "typography", filter: "typography" },
  { dimension: "layout", filter: "layouts" },
  { dimension: "imagery", filter: "imagery" },
  { dimension: "palette", filter: "palettes" },
  { dimension: "visual_device", filter: "visual_devices" },
  { dimension: "tone", filter: "tones" },
  { dimension: "persuasion", filter: "persuasion" },
  { dimension: "cta", filter: "ctas" },
] as const satisfies readonly { dimension: string; filter: FilterKey }[];
export type TaxonomyDimension = (typeof TAXONOMY_DIMENSIONS)[number]["dimension"];
const dimensionNames = TAXONOMY_DIMENSIONS.map((d) => d.dimension) as [TaxonomyDimension, ...TaxonomyDimension[]];

// Free text a client sends: no control characters other than tab and line breaks, and no lone
// surrogate halves (they can't be encoded, so the database would refuse them anyway)
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
function text<T extends z.ZodString>(schema: T) {
  return schema
    .refine((s) => !CONTROL.test(s), "contains a control character")
    .refine((s) => s.isWellFormed(), "contains an unpaired surrogate (ill-formed Unicode)");
}

// A filter value: a slug, a label or a synonym, as curatit_get_taxonomy lists them. The catalog
// resolves each to its slug and applied.filters reports the slug it searched
const filterValue = text(z.string().trim().min(1).max(100));
// A list of 1 to `max` values. Zod runs length checks on anything with a length, so a lone string
// would also be told it's too long; these run on a list only, and a string gets just "send a list"
const onlyLists = (payload: { value: unknown }) => Array.isArray(payload.value);
function list(max: number, tooMany?: string) {
  return z
    .array(filterValue, { error: (issue) => (issue.code === "invalid_type" ? 'send a list, e.g. ["finance"]' : undefined) })
    .check(
      new z.core.$ZodCheckMinLength({ check: "min_length", minimum: 1, when: onlyLists }),
      new z.core.$ZodCheckMaxLength({ check: "max_length", maximum: max, when: onlyLists, ...(tooMany && { error: () => tooMany }) }),
    );
}
const terms = list(10);
const single = list(1, "takes one value; run one search per value");

export const PostIdSchema = z
  .string()
  .min(5)
  .max(60)
  .regex(/^[A-Za-z0-9_-]+$/, "a post id or Instagram short code")
  .describe("A Curatit post id (digits) or the post's Instagram short code (e.g. DeALQm2D355), as returned by search.");

export const MediaIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{5,60}\.\d{1,2}$/, "a media id, <post id>.<slide index> (e.g. 3999245988837424761.0)")
  .describe("A media id from a post's media index or a carousel page: <post id>.<slide index>, slide 0 being the cover.");

// --- Envelope -------------------------------------------------------------------------------

export const ProvenanceSchema = z.object({
  retrieved_at: z.string().describe("When the data was read, ISO 8601."),
  taxonomy_version: z.string().nullable().describe("The catalog's taxonomy version the result was read against."),
  catalog: z.string().describe("Where the data comes from: Curatit's published library."),
});

export const ErrorBodySchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string(),
  retryable: z.boolean(),
  retry_after_seconds: z.number().int().nonnegative().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// Every tool's structured result: `data` on success, `error` on failure, never both. One shape,
// so a host that validates results against the declared output schema accepts both outcomes.
export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({
    schema_version: z.literal(SCHEMA_VERSION),
    request_id: z.string(),
    data: data.optional(),
    error: ErrorBodySchema.optional(),
    warnings: z.array(z.string()),
    provenance: ProvenanceSchema.optional(),
  });
}

// --- Shared pieces -------------------------------------------------------------------------

export const BrandSchema = z.object({ name: z.string(), slug: z.string(), website: z.string().nullable().optional() });
export const IndustrySchema = z.object({ name: z.string(), slug: z.string() });
export const FormatSchema = z.enum(["static", "carousel", "video"]);

// A post sits in its brand's main category and in any category its posts are tagged with, so
// one post can be in several (a fashion brand's post in Shopping and in Lifestyle)
export const PostCategorySchema = IndustrySchema.extend({
  main: z.boolean().describe("True for the brand's main category (the post's `industry`); false for a tag category."),
});
const PostCategoriesSchema = z.array(PostCategorySchema).describe("Every category the post is in, main category first, then tags. The industries filter matches any of them.");

export const ClassificationSchema = z
  .object({
    creative_approach: z.string().nullable(),
    approach_family: z.string().nullable().describe("The family the creative approach belongs to (the approach_families filter)."),
    secondary_approaches: z.array(z.string()),
    goal: z.string().nullable(),
    hook_technique: z.string().nullable(),
    narrative_pattern: z.string().nullable(),
    typography: z.array(z.string()),
    layouts: z.array(z.string()),
    imagery: z.array(z.string()),
    palettes: z.array(z.string()),
    tones: z.array(z.string()).describe("Tone of voice (the tones filter)."),
    persuasion: z.array(z.string()).describe("Persuasion techniques (the persuasion filter)."),
    cta: z.string().nullable().describe("Call-to-action style (the ctas filter); null when the post has none or it couldn't be told."),
    taxonomy_version: z.string().nullable(),
    confidence: z.string().nullable().describe("Always null: the analysis as a whole has no measured confidence. Each creative decision carries its own, under analysis.decisions."),
  })
  .describe("Slugs from the post's published analysis (AI-drafted, approved for publication), the values the search filters take; null when the post has no published analysis yet. Values that say nothing (unknown, none, other) are left out.");

export const MetricsSchema = z.object({
  likes: z.number().int().nullable().describe("As collected from Instagram; null when Instagram hid the count. Missing is unknown, not zero."),
  comments: z.number().int().nullable(),
  video_views: z.number().int().nullable(),
  observed_at: z.string().nullable().describe("When the counts were collected (the scrape), ISO 8601. Absolute counts say nothing about reach or performance."),
  source: z.literal("instagram_scrape"),
});

export const MediaIndexItemSchema = z.object({
  media_id: MediaIdSchema,
  slide_index: z.number().int().nonnegative().describe("Zero-based, as the API counts slides."),
  slide_label: z.string().describe("The human label, counting from 1: \"Slide 3\", or \"Cover\" for slide 0 of a single image."),
  is_cover: z.boolean(),
  was_video: z.boolean().describe("True when this slide was a video on Instagram; the library keeps only its cover frame."),
  alt_text: z.string().nullable(),
});

// --- curatit_get_taxonomy -------------------------------------------------------------------

export const TaxonomyInput = z.object({
  dimension: z.enum(dimensionNames).optional().describe("One dimension to return; omit for all of them."),
  verbose: z.boolean().optional().describe("Include every value's description and synonyms when listing all dimensions."),
});

export const TaxonomyValueSchema = z.object({
  slug: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  parent: z.string().nullable(),
  synonyms: z.array(z.string()),
  posts: z.number().int().nullable().describe("How many published posts carry this value (null where not counted). For an industry, by main category or tag."),
  main_posts: z.number().int().nullable().optional().describe("For an industry: how many published posts have it as their brand's main category."),
});

export const TaxonomyOutput = z.object({
  taxonomy_version: z.string().nullable(),
  dimensions: z.array(
    z.object({
      dimension: z.enum(dimensionNames),
      filter: z.string().describe("The search filter key that takes these values."),
      single_value: z.boolean().describe("Whether the filter takes one value (true) or up to ten alternatives."),
      description: z.string(),
      populated: z.boolean().optional().describe("False when no published post is labelled on this dimension yet, so its filter matches nothing."),
      values: z.array(TaxonomyValueSchema),
    }),
  ),
  not_available: z.array(z.string()).describe("Dimensions the catalog doesn't classify, so no filter exists for them (e.g. theme or occasion)."),
});

// --- curatit_search_posts -------------------------------------------------------------------

const filterShape = Object.fromEntries(Object.entries(FILTERS).map(([key, f]) => [key, (f.single ? single : terms).optional().describe(f.description)]));

// An unknown filter key is most often a dimension the catalog doesn't have, so say where the real
// ones are listed
const notAFilter = (issue: { code?: string; keys?: string[] }) =>
  issue.code === "unrecognized_keys"
    ? `Unrecognized filter ${(issue.keys ?? []).map((key) => JSON.stringify(key)).join(", ")}: not a filter. curatit_get_taxonomy lists the filters and names what isn't classified (theme, occasion).`
    : undefined;

export const SearchFiltersSchema = z
  .strictObject(
    {
      ...(filterShape as Record<FilterKey, z.ZodOptional<z.ZodArray<z.ZodString>>>),
      platforms: z.array(z.enum(["instagram"])).max(1).optional().describe("Only instagram exists in the catalog today."),
      analysed_only: z.boolean().optional().describe("Only posts with a published creative analysis (every published post has one today)."),
    },
    { error: notAFilter },
  )
  .describe('Filters by dimension, each a list of values from curatit_get_taxonomy (slugs, labels or synonyms), e.g. {"industries":["finance"],"formats":["carousel"],"hook_techniques":["question"]}. Values within a filter are alternatives; every filter given has to match.');

export const SearchInput = z
  .object({
    query: text(z.string().trim().max(300))
      .optional()
      .describe("Free text matched against captions, on-slide text and published analyses, at most 300 characters. Every word must match unless query_mode is any_word."),
    query_mode: z.enum(["all_words", "any_word"]).optional().meta({ default: "all_words" }).describe("all_words (default): every word must match. any_word: any word may match (wider; reported in applied.query_mode)."),
    filters: SearchFiltersSchema.optional(),
    sort: z.enum(["relevance", "newest"]).optional().meta({ default: "relevance" }).describe("relevance (default when there is a query or filters) or newest by posting date."),
    limit: z.number().int().min(1).max(20).optional().meta({ default: 8 }).describe("Results per page, 1 to 20, default 8."),
    cursor: z.string().max(400).optional().describe("The next_cursor of the previous page; send the same query, filters and sort with it."),
  })
  .strict();

export const SearchHitSchema = z.object({
  post_id: z.string(),
  short_code: z.string(),
  source_url: z.string(),
  brand: BrandSchema,
  industry: IndustrySchema.nullable().describe("The brand's main category."),
  categories: PostCategoriesSchema.optional(),
  strategy_headline: z.string().nullable().optional().describe("The published analysis's strategy in one line; null without an analysis."),
  format: FormatSchema,
  posted_at: z.string().nullable(),
  caption_excerpt: z.string().describe("The first 240 characters of the caption."),
  thumbnail: z.object({
    available: z.boolean(),
    media_id: MediaIdSchema.nullable(),
    // A public Curatit-owned cover preview that MCP Apps clients can render without another call.
    url: z.string().url().nullable(),
  }),
  classification: ClassificationSchema.nullable(),
  analysis_available: z.boolean(),
  match_reasons: z.array(z.string()).describe("Why it matched: the fields the query hit and the labels the filters hit, with the slides they were seen on."),
  score: z.number().nullable().describe("The ranking score, for ordering only. Not a measure of quality."),
});

export const SearchOutput = z.object({
  posts: z.array(SearchHitSchema),
  next_cursor: z.string().nullable(),
  applied: z.object({
    query: z.string().nullable(),
    query_mode: z.enum(["all_words", "any_word"]),
    filters: z.record(z.string(), z.array(z.string())).describe("The filters actually applied, as resolved slugs."),
    sort: z.enum(["relevance", "newest"]),
    limit: z.number().int(),
  }),
  suggestions: z.array(z.string()).describe("When nothing matched: ways to relax the search. Nothing is relaxed for you."),
});

// --- curatit_get_post -----------------------------------------------------------------------

export const PostInput = z
  .object({
    post_id: PostIdSchema,
    detail_level: z.enum(["summary", "full"]).optional().meta({ default: "summary" }).describe("summary (default): the post and its analysis in brief. full: every analysis section and slide record."),
  })
  .strict();

export const EvidenceSchema = z.object({
  ref: z.string().describe("Where it was seen: slide:<index>, zero-based (slide:0 is the first image), or caption. decisions[].slides_label names slides as people count them."),
  observation: z.string(),
  quote: z.string().nullable().describe("On-slide or caption text, copied verbatim, when the observation rests on words."),
});

// The slides a statement rests on, both ways: indexes for curatit_get_media and
// curatit_get_carousel, and a label for people
const slidesShape = {
  slides: z.array(z.number().int().nonnegative()).describe("The slides it rests on, zero-based, as media ids and curatit_get_carousel count them."),
  slides_label: z.string().nullable().describe('The same slides as people count them, e.g. "Slides 1–2, 6" ("Cover" on a single image); null when it rests on no slide.'),
  on_caption: z.boolean().describe("Whether it also rests on the caption."),
};

export const DecisionSchema = z.object({
  title: z.string().describe("The technique, written as an instruction."),
  explanation: z.string().describe("What the choice is and why it matters, in a sentence or two."),
  observation: z.string().nullable().describe("What was done, from what's visible; null where the explanation already says it (analyses written before 3.0)."),
  effect: z.string().describe("Why it might work: a hypothesis, not measured performance."),
  principle: z.string().describe("The design rule underneath, reusable elsewhere."),
  watch_out: z.string().nullable().describe("What this choice costs or risks here; null when nothing notable."),
  confidence: z.enum(["high", "medium", "low"]).describe("How sure the analysis is of this decision."),
  ...slidesShape,
});

export const DataCheckSchema = z.object({
  aspect: z.string().describe('What was checked, e.g. "Start values", "Time period", "Sources and disclaimers".'),
  status: z
    .enum(["observed", "potential_concern", "cannot_verify"])
    .describe("observed: a fact about what the creative shows. potential_concern: something that could mislead. cannot_verify: a figure or claim the post gives no way to check."),
  note: z.string(),
  ...slidesShape,
});

export const ApplicationSchema = z.object({
  when_to_use: z.array(z.string()).describe("When the idea is worth borrowing."),
  when_not_to_use: z.array(z.string()).describe("When it isn't."),
});

export const AnalysisSummarySchema = z.object({
  status: z.literal("published"),
  analysis_version: z.string(),
  taxonomy_version: z.string().nullable(),
  published_at: z.string().nullable(),
  source: z.string().describe("ai: drafted by a model, then approved for publication by Curatit."),
  needs_review: z.boolean().describe("True when the analysis is flagged for a closer editor review: read it as an AI draft that was approved for publication, not one an editor checked line by line."),
  image_analysis_complete: z.boolean(),
  slides_analysed: z.number().int(),
  strategy_headline: z.string().describe("The strategy in one line (the concept for analyses written before 3.0)."),
  strategy_summary: z.string().nullable().describe("A sentence or two after the headline."),
  creative_formula: z.string().nullable().describe('The idea as a reusable sequence of moves, e.g. "Bold claim → Clear comparison → Visual evidence".'),
  concept: z.string().nullable(),
  summary: z.string().nullable(),
  hook: z.object({ technique: z.string().nullable(), observed_text: z.string().nullable(), location: z.string().nullable() }),
  decisions: z.array(DecisionSchema).describe("The specific creative choices that shape the post, one to five, each with the slides that show it. Effects are hypotheses, not measured performance."),
  data_checks: z
    .array(DataCheckSchema)
    .describe("Checks on the data, charts and claims the post shows, concerns first. No figure was checked against a source; nothing here is a fact-check."),
  application: ApplicationSchema,
  why_it_might_work: z
    .array(z.object({ hypothesis: z.string(), evidence: z.array(z.string()).describe("Zero-based slide refs (slide:0 is the first image) or caption.") }))
    .describe("Hypotheses, each tied to observed evidence. Not measured performance."),
  takeaways: z.array(z.string()),
  evidence: z.array(EvidenceSchema),
  caveats: z.array(z.string()).describe("What the analysis couldn't establish or wants checked."),
  note: z.string(),
});

export const SlideAnalysisSchema = z.object({
  slide_index: z.number().int(),
  slide_label: z.string(),
  role: z.string().nullable().describe('The slide\'s job in the sequence, in words ("Hook", "Gallery frame"); null when it couldn\'t be told.'),
  headline: z.string().nullable(),
  body: z.string().nullable().describe("Other copy on the slide, as written."),
  legibility: z.enum(["clear", "partial", "illegible", "no-text"]).nullable(),
  observation: z.string().nullable(),
  typography: z.array(z.string()),
  layouts: z.array(z.string()),
  imagery: z.array(z.string()),
  palettes: z.array(z.string()),
  devices: z.array(z.string()),
  colours: z.array(z.string()).describe("Colours measured from the image's pixels (#rrggbb), approximate; not brand colour codes."),
  blank: z.boolean().describe("True for a blank frame (a video's black cover): nothing on it can be described."),
  changes: z.array(z.string()).describe("What differs from the slide before, compared field by field."),
});

export const VisualSchema = z.object({
  dimension: z.enum(["composition", "typography", "colour", "imagery", "devices", "branding"]),
  insight: z.string().nullable().describe("How the post handles it, in a sentence."),
  attributes: z.array(z.string()).describe("Up to four attributes, in words."),
  slides: z.array(z.number().int().nonnegative()).describe("The slides that show them, zero-based."),
});

export const ColourRoleSchema = z.object({
  hex: z.string().describe("A colour measured from the images (#rrggbb), not a brand token."),
  role: z.string().nullable().describe("The job it does (background, headline, accent…); null when the analysis didn't name one."),
});

// detail_level=full adds these sections; summary leaves them out (one schema, no union, so
// every host's schema import copes)
export const AnalysisFullSchema = AnalysisSummarySchema.extend({
  narrative: z.object({ pattern: z.string().nullable(), arc: z.string().nullable() }).optional(),
  slides: z.array(SlideAnalysisSchema).optional(),
  visual: z.array(VisualSchema).optional().describe("The visual system, dimension by dimension."),
  colour_roles: z.array(ColourRoleSchema).optional().describe("The colours the post is built on, measured from the images, not brand tokens."),
  copywriting: z.string().nullable().optional().describe("How the words work: voice, length, what the headline does, what the caption adds."),
  brief_markdown: z
    .string()
    .nullable()
    .optional()
    .describe("The post page's copy brief: a Markdown prompt for any LLM to make an original post on this principle, with [brackets] for the reader's brand."),
  copy_strategy: z.unknown().optional(),
  attention_mechanisms: z.array(z.unknown()).optional(),
  adaptation_ideas: z.array(z.unknown()).optional(),
  constraints_or_uncertainties: z.array(z.unknown()).optional(),
});

export const PostOutput = z.object({
  post: z.object({
    post_id: z.string(),
    short_code: z.string(),
    source_url: z.string(),
    platform: z.literal("instagram"),
    brand: BrandSchema,
    industry: IndustrySchema.nullable().describe("The brand's main category."),
    categories: PostCategoriesSchema,
    format: FormatSchema,
    posted_at: z.string().nullable(),
    caption: z.object({ text: z.string(), truncated: z.boolean(), total_length: z.number().int() }),
    alt_text: z.string().nullable().describe("Instagram's accessibility caption for the post, when it has one."),
    hashtags: z.array(z.string()),
    metrics: MetricsSchema,
    media: z.array(MediaIndexItemSchema).describe("Every stored image in slide order; fetch any with curatit_get_media."),
    classification: ClassificationSchema.nullable(),
    analysis: AnalysisFullSchema.nullable().describe("The published analysis: summary fields always, the full sections at detail_level=full; null without one."),
    missing: z.array(z.string()).describe("Fields the catalog has no value for on this post, named rather than invented."),
  }),
});

// --- curatit_get_carousel -------------------------------------------------------------------

export const CarouselInput = z
  .object({
    post_id: PostIdSchema,
    start_slide: z.number().int().min(0).max(99).optional().meta({ default: 0 }).describe("Zero-based index of the first slide to return (default 0)."),
    limit: z.number().int().min(1).max(10).optional().meta({ default: 5 }).describe("Slides per page, 1 to 10, default 5."),
  })
  .strict();

export const CarouselSlideSchema = MediaIndexItemSchema.extend({
  public_url: z.string().describe("The stored image (WebP, at most 1080px wide). A URL the model hasn't opened is not an image it has seen."),
  original_width: z.number().int().nullable().describe("Instagram's original pixel size, not the stored file's."),
  original_height: z.number().int().nullable(),
  analysis: SlideAnalysisSchema.nullable().describe("The published analysis's record for this slide, when there is one."),
});

export const CarouselOutput = z.object({
  post_id: z.string(),
  short_code: z.string(),
  format: FormatSchema,
  total_slides: z.number().int(),
  slides: z.array(CarouselSlideSchema),
  next_start: z.number().int().nullable(),
  slides_analysed: z.number().int().describe("How many slides the published analysis covers; 0 without one."),
});

// --- curatit_get_media ----------------------------------------------------------------------

export const MediaInput = z
  .object({
    media_id: MediaIdSchema,
    delivery: z.enum(["link", "inline"]).optional().meta({ default: "link" }).describe("link (default): a URL and metadata. inline: the image bytes as an MCP image block (hosts that show images only), capped at 1 MiB."),
    max_edge: z.number().int().min(64).max(1024).optional().describe("Longest edge in pixels for inline delivery, at most 1024 (the default)."),
  })
  .strict();

export const MediaOutput = z.object({
  media_id: MediaIdSchema,
  post_id: z.string(),
  slide_index: z.number().int(),
  slide_label: z.string(),
  url: z.string().nullable().describe("The image's URL for link delivery (null when delivered inline)."),
  access: z.enum(["public", "signed"]),
  expires_at: z.string().nullable().describe("When a signed URL stops working; null for public URLs."),
  mime_type: z.string(),
  width: z.number().int().nullable().describe("The delivered image's pixel width, read from the file; null when it couldn't be read."),
  height: z.number().int().nullable(),
  bytes: z.number().int().nullable(),
  alt_text: z.string().nullable(),
  delivery: z.enum(["link", "inline"]),
  resized: z.boolean().describe("True when inline delivery returned a smaller derivative than the stored file."),
});

// --- curatit_create_brief -------------------------------------------------------------------

export const BriefInput = z
  .object({
    objective: text(z.string().trim().min(1).max(2000)).describe("What the new piece has to achieve."),
    audience: text(z.string().trim().min(1).max(1000)).describe("Who it is for."),
    reference_post_ids: z.array(PostIdSchema).min(1).max(8).describe("One to eight posts from the catalog to learn from."),
    brand_context: text(z.string().trim().max(4000)).optional().describe("Your brand, product, voice and constraints on identity."),
    constraints: text(z.string().trim().max(4000)).optional().describe("Format, aspect ratio, safe margins, legal or data constraints, deadlines."),
    output_format: z
      .enum(["markdown", "json", "text"])
      .optional()
      .meta({ default: "markdown" })
      .describe("How the brief text is rendered (default markdown). The structured brief is always returned, with a portable generation_prompt."),
  })
  .strict();

const bullet = z.array(z.string());

export const BriefSchema = z.object({
  objective: z.string(),
  audience: z.string(),
  references: z.array(
    z.object({
      post_id: z.string(),
      short_code: z.string(),
      source_url: z.string(),
      brand: z.string(),
      format: FormatSchema,
      analysis_available: z.boolean(),
    }),
  ),
  observations: z.array(
    z.object({
      post_id: z.string(),
      observed: bullet.describe("Seen or extracted: on-slide text, labels, slide roles."),
      inferred: bullet.describe("Interpretation of the evidence, from the published analysis."),
    }),
  ),
  concept: z.object({ proposal: z.string(), built_on: bullet }),
  copy_directions: z.object({ headline: bullet, supporting: bullet }),
  design_guidance: z.object({ layout: bullet, hierarchy: bullet, typography: bullet, colour: bullet, imagery: bullet, spacing: bullet }),
  production: z.object({ aspect_ratio: z.string().nullable(), safe_margins: z.string().nullable(), format: z.string(), slides: z.number().int().nullable() }),
  adapt: z.object({ take: bullet, do_not_copy: bullet }),
  limitations: z.object({ missing_evidence: bullet, confidence: z.string() }),
  watch_out: bullet.optional().describe("What the references' creative choices risk, and their data checks' potential concerns."),
  application: ApplicationSchema.optional().describe("When the references' ideas are worth using and when they aren't."),
  generation_prompt: z.string().describe("A portable prompt for a production or generation tool, free of the references' words, marks and colour codes."),
});

export const BriefOutput = z.object({
  brief: BriefSchema,
  text: z.string().describe("The brief rendered in the requested output_format."),
  output_format: z.enum(["markdown", "json", "text"]),
  method: z.literal("deterministic_template").describe("Assembled from stored, editor-approved analysis and a template; no model ran. Proposed choices are recommendations."),
});

export type TaxonomyInputT = z.infer<typeof TaxonomyInput>;
export type SearchInputT = z.infer<typeof SearchInput>;
export type PostInputT = z.infer<typeof PostInput>;
export type CarouselInputT = z.infer<typeof CarouselInput>;
export type MediaInputT = z.infer<typeof MediaInput>;
export type BriefInputT = z.infer<typeof BriefInput>;
export type TaxonomyOutputT = z.infer<typeof TaxonomyOutput>;
export type SearchOutputT = z.infer<typeof SearchOutput>;
export type SearchHit = z.infer<typeof SearchHitSchema>;
export type PostOutputT = z.infer<typeof PostOutput>;
export type CarouselOutputT = z.infer<typeof CarouselOutput>;
export type MediaOutputT = z.infer<typeof MediaOutput>;
export type BriefOutputT = z.infer<typeof BriefOutput>;
export type Classification = z.infer<typeof ClassificationSchema>;
export type PostCategory = z.infer<typeof PostCategorySchema>;
export type AnalysisSummary = z.infer<typeof AnalysisSummarySchema>;
export type AnalysisFull = z.infer<typeof AnalysisFullSchema>;
export type SlideAnalysis = z.infer<typeof SlideAnalysisSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type DataCheck = z.infer<typeof DataCheckSchema>;
export type Brief = z.infer<typeof BriefSchema>;

export const TOOLS = {
  curatit_get_taxonomy: { input: TaxonomyInput, output: TaxonomyOutput, scope: "curatit:read" },
  curatit_search_posts: { input: SearchInput, output: SearchOutput, scope: "curatit:read" },
  curatit_get_post: { input: PostInput, output: PostOutput, scope: "curatit:read" },
  curatit_get_carousel: { input: CarouselInput, output: CarouselOutput, scope: "curatit:read" },
  curatit_get_media: { input: MediaInput, output: MediaOutput, scope: "curatit:read" },
  curatit_create_brief: { input: BriefInput, output: BriefOutput, scope: "curatit:brief" },
} as const;
export type ToolName = keyof typeof TOOLS;
