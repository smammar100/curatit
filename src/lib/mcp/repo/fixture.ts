// An in-memory catalog with the shapes the database functions return, for tests and for running
// the server with no database. Three posts, clearly fixture data (the brands are "Fixture Co" and
// "Fixture Threads", not real library brands):
// - a carousel with a 3.0 analysis: decisions with watch-outs, a potential concern, visual notes,
//   placeholder colour roles, a slide the pipeline couldn't give a role and a blank video cover;
// - a single image with no analysis;
// - a single image with a 2.1 analysis (concern, unverified and sound checks, use_when and
//   avoid_when), whose brand's main category is Shopping and whose posts are tagged Lifestyle.
// The analyses are Creative DNA and slide records as the pipeline stores them; analysisFrom()
// projects them the way private.creative_mcp_analysis does, so the services read what the
// database would return.

import { CATEGORIES, OLD_SLUGS } from "@/lib/categories";
import type { CreativeDna, SlideObservation } from "@/lib/creative/schema";
import { familyOf } from "@/lib/creative/taxonomy";
import type { CatalogRepository, RawCategory, RawCompactAnalysis, RawDetailAnalysis, RawImageRef, RawPost, RawSearchRequest, RawSearchResult, RawTerm, RawTerms } from "./types";

const TAXONOMY_VERSION = "2026.10.11-1";
const SAYS_NOTHING = ["unknown", "none", "other"];
const known = (values: readonly string[] | undefined) => (values ?? []).filter((v) => !SAYS_NOTHING.includes(v));

const finance: RawCategory = { name: "Finance", slug: "finance" };
const shopping: RawCategory = { name: "Shopping", slug: "shopping" };
const lifestyle: RawCategory = { name: "Lifestyle", slug: "lifestyle" };

const images = (brand: string, format: string, code: string, count: number): RawImageRef[] =>
  Array.from({ length: count }, (_, position) => ({ bucket: "library", path: `fixture/${brand}/${format}/${code}/${String(position + 1).padStart(2, "0")}.webp`, position }));

// --- The carousel's 3.0 analysis -------------------------------------------------------------

const carouselDna: CreativeDna = {
  schema_version: "1.0",
  taxonomy_version: TAXONOMY_VERSION,
  primary_archetype: { slug: "explainer", evidence: ["slide:0", "caption"] },
  secondary_archetypes: [{ slug: "myth-busting", evidence: ["slide:1"] }],
  marketing_objective: { slug: "education", evidence: ["slide:0"] },
  concept: "A side-by-side that makes the better option obvious.",
  creative_summary: "Three slides: a question, the comparison, the answer.",
  content_intent: "Settle a money question people argue about, for anyone choosing how to pay.",
  hook: { technique: "question", observed_text: "Cash or card?", location: "image", evidence: ["slide:0"] },
  visual_system: {
    composition: ["centered", "framed-card"],
    typography: ["sans-serif"],
    imagery: ["typographic", "screenshot-ui"],
    palette: ["black", "white", "green"],
    text_hierarchy: "The question dominates; the comparison rows sit small under their column heads.",
    decorative_system: "Thin rules divide the columns.",
    brand_consistency: "The same dark field and wordmark frame each slide.",
  },
  narrative: {
    pattern: "q-and-a",
    slide_roles: [
      { position: 0, role: "hook" },
      { position: 1, role: "comparison" },
      { position: 2, role: "closing" },
    ],
    arc: "Question, comparison, answer.",
  },
  copy_strategy: { tone: ["educational", "unknown"], persuasion: ["comparison", "none"], cta: "unknown", complexity: "low", notes: "Short questions, one answer." },
  attention_mechanisms: [{ statement: "A question the reader wants answered", kind: "observation", evidence: ["slide:0"] }],
  creative_rationale: [
    { hypothesis: "A question hook invites a tap to the next slide.", evidence: ["slide:0"] },
    { hypothesis: "Both options in one frame make the comparison quick to read.", evidence: ["slide:1"] },
  ],
  takeaways: ["Ask the question the audience is already asking.", "Put the two options in one frame.", "Answer in as few words as the question took."],
  adaptation_ideas: ["Swap the options for your own two choices"],
  constraints_or_uncertainties: ["Comparison claims need a source"],
  evidence: [
    { ref: "slide:0", observation: "The cover asks a direct question", quote: "Cash or card?" },
    { ref: "slide:1", observation: "Two columns compare the options", quote: null },
  ],
  quality: { image_analysis_complete: true, expected_slides: 3, processed_slides: 3, needs_review: true, uncertainties: ["The last frame is a blank video cover, so nothing on it is described."] },
  creative_decisions: [
    {
      title: "Ask the question your audience already asks",
      explanation: "A plain question on the cover names the choice before any answer, so the reader wants the next frame.",
      observation: "The cover sets one large question over a dark field.",
      rationale: "An open question may create a small gap the reader swipes to close.",
      principle: "Open on the decision your audience is stuck on.",
      watch_out: "A question that's too broad reads as bait.",
      evidence: ["slide:0", "slide:1"],
      confidence: "high",
    },
    {
      title: "Compare both options in one frame",
      explanation: "Two framed columns put the options side by side, so the difference reads at a glance.",
      observation: "Two framed columns list the options line by line.",
      rationale: "Seeing both at once may make the verdict feel earned.",
      principle: "Show the options side by side, never on separate frames.",
      watch_out: null,
      evidence: ["slide:1", "caption"],
      confidence: "medium",
    },
  ],
  integrity_notes: [
    { aspect: "Sources", status: "cannot_verify", note: "The fees in the comparison cite no source.", evidence: ["slide:1"] },
    { aspect: "Comparison baseline", status: "potential_concern", note: "The columns don't say which card or which fees they compare.", evidence: ["slide:1"] },
  ],
  visual_notes: {
    composition: "One centred question, then two framed columns of equal width.",
    typography: "A bold sans-serif question over small regular rows.",
    colour: "A near-black ground with white type and one green accent for the winning column.",
    imagery: "Type and an interface crop; no photography.",
    devices: "Thin arrows lead from the question to the columns.",
    branding: "A small wordmark in the same corner of every frame.",
  },
  creative_formula: "Question → Side-by-side → Verdict",
  strategy_headline: "Settle a familiar money question with one side-by-side",
  strategy_summary: "The cover asks what people already argue about. The comparison answers it in one frame.",
  colour_roles: [
    { hex: "#111111", role: "Cover sample 1; not a brand token" },
    { hex: "#F4F4F2", role: "Headline on the dark ground" },
  ],
  copywriting: "Short questions and one-line answers; the caption only repeats the verdict.",
  application: { when_to_use: ["Your audience is choosing between two familiar options."], when_not_to_use: ["The honest answer depends on the reader's circumstances."] },
};

const carouselSlides: SlideObservation[] = [
  {
    position: 0,
    role: "hook",
    visible_text: { headline: "Cash or card?", body: "We settled it." },
    legibility: "clear",
    text_density: "low",
    typography: { classes: ["sans-serif"], weight: "bold" },
    layout: ["centered"],
    imagery: ["typographic"],
    palette: { families: ["black", "white"], hex: ["#111111", "#F4F4F2"] },
    devices: [],
    product_prominence: "none",
    people_prominence: "none",
    objects: [],
    brand_treatment: "Small wordmark in the bottom corner.",
    observation: "A large question set over a plain dark field.",
    confidence: "high",
  },
  {
    // Perception couldn't tell this slide's role or type, as on 237 of the library's slides
    position: 1,
    role: "unknown",
    visible_text: { headline: "Cash vs card", body: null },
    legibility: "partial",
    text_density: "medium",
    typography: { classes: ["unknown"], weight: "unknown" },
    layout: ["framed-card", "list-stack"],
    imagery: ["screenshot-ui"],
    palette: { families: ["white", "green"], hex: ["#F4F4F2", "#2E7D32"] },
    devices: [],
    product_prominence: "medium",
    people_prominence: "none",
    objects: ["phone"],
    brand_treatment: null,
    observation: "Two framed columns compare the options line by line.",
    confidence: "medium",
  },
  {
    // A video's black cover, the way the pipeline records every blank frame
    position: 2,
    role: "closing",
    visible_text: { headline: null, body: null },
    legibility: "no-text",
    text_density: "none",
    typography: { classes: ["none"], weight: "none" },
    layout: ["full-bleed"],
    imagery: ["video-frame"],
    palette: { families: ["black"], hex: ["#000000"] },
    devices: [],
    product_prominence: "none",
    people_prominence: "none",
    objects: [],
    brand_treatment: null,
    observation: "Blank: a black stored frame, the video's cover.",
    confidence: "low",
  },
];

// --- The tagged post's 2.1 analysis ----------------------------------------------------------

const taggedDna: CreativeDna = {
  schema_version: "1.0",
  taxonomy_version: TAXONOMY_VERSION,
  primary_archetype: { slug: "product-showcase", evidence: ["slide:0"] },
  secondary_archetypes: [],
  marketing_objective: { slug: "awareness", evidence: ["slide:0", "caption"] },
  concept: "One knit, three colours, shot flat on a plain ground.",
  creative_summary: "A single product image shows the knit in every colour it comes in.",
  content_intent: "Show the whole colour range of one knit.",
  hook: { technique: "visual-only", observed_text: null, location: "image", evidence: ["slide:0"] },
  visual_system: {
    composition: ["grid"],
    typography: ["none"],
    imagery: ["product-photography"],
    palette: ["beige", "green", "blue"],
    text_hierarchy: "No type on the image; the caption carries the words.",
    decorative_system: null,
    brand_consistency: null,
  },
  narrative: { pattern: "single-image", slide_roles: [{ position: 0, role: "product-detail" }], arc: "One frame." },
  copy_strategy: { tone: ["warm"], persuasion: ["aspiration"], cta: "shop", complexity: "low", notes: "The caption names the colours and points to the shop." },
  attention_mechanisms: [{ statement: "Three colours in one frame", kind: "observation", evidence: ["slide:0"] }],
  creative_rationale: [
    { hypothesis: "Seeing the range at once may help a reader pick a favourite.", evidence: ["slide:0"] },
    { hypothesis: "A plain ground keeps attention on the knit.", evidence: ["slide:0"] },
  ],
  takeaways: ["Let the range be the subject.", "Keep the ground plain.", "Name the colours in the caption."],
  adaptation_ideas: ["Lay out your own product's variants in one row"],
  constraints_or_uncertainties: [],
  evidence: [
    { ref: "slide:0", observation: "Three folded knits in a row", quote: null },
    { ref: "caption", observation: "The caption lists the colours", quote: "Soft knit in three colours." },
  ],
  quality: { image_analysis_complete: true, expected_slides: 1, processed_slides: 1, needs_review: false, uncertainties: [] },
  // 2.1: no explanation or watch-out; use_when and avoid_when instead
  creative_decisions: [
    {
      title: "Show every colour in one frame",
      observation: "The three colourways sit folded side by side.",
      rationale: "Seeing the range at once may help a reader pick a favourite.",
      principle: "Let the range be the subject.",
      use_when: "The product comes in a few colours worth comparing.",
      avoid_when: "There are too many variants to read at feed size.",
      evidence: ["slide:0"],
      confidence: "medium",
    },
  ],
  // 2.1's statuses: sound, concern, unverified
  integrity_notes: [
    { aspect: "Product shown", status: "sound", note: "The image shows the knit the caption names.", evidence: ["slide:0", "caption"] },
    { aspect: "Colour accuracy", status: "unverified", note: "Whether the colours match the real garments can't be told from a photo.", evidence: ["slide:0"] },
    { aspect: "Price", status: "concern", note: "The caption implies a sale without naming a price or an end date.", evidence: ["caption"] },
  ],
  visual_notes: { composition: "Three folded knits in a row on a plain ground.", colour: "Soft beige, sage and blue, close in value.", imagery: "Flat-lay product photography.", branding: null },
  creative_formula: "Range → Pick → Shop",
};

const taggedSlides: SlideObservation[] = [
  {
    position: 0,
    role: "product-detail",
    visible_text: { headline: null, body: null },
    legibility: "no-text",
    text_density: "none",
    typography: { classes: ["none"], weight: "none" },
    layout: ["grid"],
    imagery: ["product-photography"],
    palette: { families: ["beige", "green", "blue"], hex: ["#E8DCC8", "#9CAF88", "#7A9CC6"] },
    devices: [],
    product_prominence: "high",
    people_prominence: "none",
    objects: ["sweater"],
    brand_treatment: null,
    observation: "Three folded knits in beige, sage and blue on a plain ground.",
    confidence: "high",
  },
];

// The analysis as private.creative_mcp_analysis(id, true) returns it (…_creative_mcp_analysis_v3)
function analysisFrom(dna: CreativeDna, slides: SlideObservation[], postImages: RawImageRef[], versionId: string, publishedAt: string): RawDetailAnalysis {
  const imageAt = (position: number) => postImages.find((image) => image.position === position) ?? null;
  return {
    verified_status: "approved",
    analysis_version: versionId,
    analysis_source: "ai",
    taxonomy_version: dna.taxonomy_version,
    published_at: publishedAt,
    image_analysis_complete: dna.quality.image_analysis_complete,
    slides_analysed: dna.quality.processed_slides,
    slides_total: dna.quality.expected_slides,
    primary_type: dna.primary_archetype.slug,
    secondary_types: dna.secondary_archetypes.map((a) => a.slug),
    objective: dna.marketing_objective.slug,
    visual_styles: dna.visual_system.imagery,
    typography_categories: dna.visual_system.typography,
    layout_tags: dna.visual_system.composition,
    palette: dna.visual_system.palette,
    narrative_pattern: dna.narrative.pattern,
    hook_technique: dna.hook.technique,
    concept: dna.concept,
    creative_summary: dna.creative_summary,
    strategy_headline: dna.strategy_headline ?? null,
    strategy_summary: dna.strategy_summary ?? null,
    tones: known(dna.copy_strategy.tone),
    persuasion: known(dna.copy_strategy.persuasion),
    cta: SAYS_NOTHING.includes(dna.copy_strategy.cta) ? null : dna.copy_strategy.cta,
    why_it_might_work: dna.creative_rationale.map((r) => ({ hypothesis: r.hypothesis, evidence: r.evidence })),
    takeaways: dna.takeaways.slice(0, 5),
    analysis_evidence: dna.evidence.slice(0, 20).map((e) => {
      const position = /^slide:(\d+)$/.exec(e.ref)?.[1];
      const image = position === undefined ? null : imageAt(Number(position));
      return { ref: e.ref, observation: e.observation, quote: e.quote, slide: image };
    }),
    note: "AI-drafted analysis, approved for publication by Curatit. Rationale is hypothesis, not measured performance.",
    hook: { technique: dna.hook.technique, observed_text: dna.hook.observed_text, location: dna.hook.location },
    narrative: {
      pattern: dna.narrative.pattern,
      arc: dna.narrative.arc,
      slides: slides.map((s) => ({
        position: s.position,
        role: SAYS_NOTHING.includes(s.role) ? null : s.role,
        headline: s.visible_text.headline,
        observation: s.observation,
        typography: known(s.typography.classes),
        layout: known(s.layout),
        imagery: known(s.imagery),
        palette: known(s.palette.families),
        devices: known(s.devices),
        image: imageAt(s.position) && { bucket: "library", path: imageAt(s.position)!.path },
      })),
    },
    copy_strategy: dna.copy_strategy,
    attention_mechanisms: dna.attention_mechanisms,
    adaptation_ideas: dna.adaptation_ideas,
    constraints_or_uncertainties: dna.constraints_or_uncertainties,
    dna,
    slide_records: slides.map((observation) => ({ version_id: versionId, position: observation.position, observation })),
    current_version_id: versionId,
    expected_slides: dna.quality.expected_slides,
    processed_slides: dna.quality.processed_slides,
  };
}

// --- Posts -----------------------------------------------------------------------------------

const carouselImages = images("fixture-co", "carousel", "FIX00001", 3);
const analysis = analysisFrom(carouselDna, carouselSlides, carouselImages, "00000000-0000-4000-8000-000000000001", "2026-10-11T10:00:00+00:00");

const carousel: RawPost = {
  id: "1000000000000000001",
  short_code: "FIX00001",
  source_url: "https://www.instagram.com/p/FIX00001/",
  format: "carousel",
  caption: "Cash or card? We settled it. #money #fixture",
  alt: "A carousel comparing cash and card",
  hashtags: ["money", "fixture"],
  owner_username: "fixtureco",
  posted_at: "2026-10-01T09:00:00+00:00",
  updated_at: "2026-10-10T09:00:00+00:00",
  metrics: { likes: 1200, comments: 34, video_views: null, observed_at: null, post_updated_at: "2026-10-10T09:00:00Z" },
  brand: { name: "Fixture Co", slug: "fixture-co" },
  categories: [finance],
  images: carouselImages,
  analysis: { summary: "A comparison carousel.", hook: "A question.", why_it_works: "It answers it.", takeaways: analysis.takeaways, published_at: analysis.published_at },
  creative: analysis,
};

const single: RawPost = {
  id: "1000000000000000002",
  short_code: "FIX00002",
  source_url: "https://www.instagram.com/p/FIX00002/",
  format: "static",
  caption: "Launch day. " + "Long caption ".repeat(200),
  alt: null,
  hashtags: ["launch"],
  owner_username: "fixtureco",
  posted_at: "2026-10-05T09:00:00+00:00",
  updated_at: "2026-10-10T09:00:00+00:00",
  metrics: { likes: null, comments: 3, video_views: null, observed_at: null, post_updated_at: "2026-10-10T09:00:00Z" },
  brand: { name: "Fixture Co", slug: "fixture-co" },
  categories: [finance],
  images: images("fixture-co", "static", "FIX00002", 1),
  analysis: null,
  // Null, as the catalog function returns it for a post with no published analysis
  creative: null,
};

const taggedImages = images("fixture-threads", "static", "FIX00003", 1);
const taggedAnalysis = analysisFrom(taggedDna, taggedSlides, taggedImages, "00000000-0000-4000-8000-000000000003", "2026-10-12T10:00:00+00:00");

const tagged: RawPost = {
  id: "1000000000000000003",
  short_code: "FIX00003",
  source_url: "https://www.instagram.com/p/FIX00003/",
  format: "static",
  caption: "Soft knit in three colours. Tap to shop. #knitwear",
  alt: "Three folded knits in beige, sage and blue",
  hashtags: ["knitwear"],
  owner_username: "fixturethreads",
  posted_at: "2026-09-20T09:00:00+00:00",
  updated_at: "2026-10-10T09:00:00+00:00",
  metrics: { likes: 310, comments: 12, video_views: null, observed_at: null, post_updated_at: "2026-10-10T09:00:00Z" },
  brand: { name: "Fixture Threads", slug: "fixture-threads" },
  // Main category first, then the brand's tag, as the catalog lists them
  categories: [shopping, lifestyle],
  images: taggedImages,
  analysis: { summary: taggedDna.creative_summary, hook: null, why_it_works: null, takeaways: taggedDna.takeaways, published_at: taggedAnalysis.published_at },
  creative: taggedAnalysis,
};

// --- Vocabulary ------------------------------------------------------------------------------

const term = (slug: string, label: string, posts: number, parent: string | null = null): RawTerm => ({ slug, label, description: null, parent, synonyms: [], posts });

// The terms the catalog lists, sorted by slug as curatit_mcp_creative_terms sorts them. Like the
// live catalog, the vocabulary includes terms nothing is labelled with (unknown, none, other,
// and every visual device: perception hasn't recorded devices on any slide)
const terms: RawTerms = {
  taxonomy_version: TAXONOMY_VERSION,
  dimensions: {
    archetype: [
      { slug: "explainer", label: "Explainer", description: "Explains a concept or how something works.", parent: "education", synonyms: ["breakdown"], posts: 1 },
      term("myth-busting", "Myth-busting", 1, "education"),
      { slug: "product-showcase", label: "Product showcase", description: "Shows the product as the hero.", parent: "product", synonyms: ["product shot", "hero product", "packshot"], posts: 1 },
    ],
    archetype_family: [term("education", "Education", 1), term("product", "Product", 1)],
    objective: [
      term("awareness", "Awareness", 1),
      { slug: "education", label: "Education", description: "Teaches something.", parent: null, synonyms: [], posts: 1 },
    ],
    hook_technique: [term("question", "Question", 1), term("visual-only", "Visual only", 1)],
    narrative_pattern: [term("q-and-a", "Q&A", 1), term("single-image", "Single image", 1)],
    typography: [term("none", "None", 0), term("sans-serif", "Sans-serif", 1), term("unknown", "Unknown", 0)],
    layout: [term("centered", "Centered", 1), term("framed-card", "Framed card", 1), term("grid", "Grid", 1), term("list-stack", "List stack", 0)],
    imagery: [term("product-photography", "Product photography", 1), term("screenshot-ui", "Screenshot UI", 1), term("typographic", "Typographic", 1)],
    palette: [term("beige", "Beige", 1), term("black", "Black", 1), term("blue", "Blue", 1), term("green", "Green", 2), term("white", "White", 1)],
    visual_device: [term("arrows", "Arrows or pointers", 0), term("charts", "Charts", 0), term("none", "None", 0)],
    tone: [term("educational", "Educational", 1), term("playful", "Playful", 0), term("unknown", "Unknown", 0), term("warm", "Warm", 1)],
    persuasion: [term("aspiration", "Aspiration", 1), term("comparison", "Comparison", 1), term("none", "None", 0)],
    cta: [term("link-in-bio", "Link in bio", 0), term("shop", "Shop", 1), term("unknown", "Unknown", 0)],
  },
};

const posts = [carousel, single, tagged];

// Names compared the way curatit_mcp_resolve_filter tolerates them: case, spacing and
// punctuation ignored, "&" read as "and"
const normalise = (value: string) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "");

export function createFixtureCatalog(): CatalogRepository & { calls: string[] } {
  const calls: string[] = [];
  const compact = (post: RawPost): RawCompactAnalysis | null => {
    const creative = post.creative as RawDetailAnalysis | null;
    if (!creative?.analysis_version) return null;
    const {
      hook: _h,
      narrative: _n,
      copy_strategy: _c,
      attention_mechanisms: _a,
      adaptation_ideas: _i,
      constraints_or_uncertainties: _u,
      dna: _d,
      slide_records: _r,
      current_version_id: _v,
      expected_slides: _e,
      processed_slides: _p,
      ...rest
    } = creative;
    return rest;
  };
  // A post's labels on a dimension, as post_creative_labels holds them (creative_write_labels)
  const labels = (post: RawPost, dimension: string): string[] => {
    const c = compact(post);
    if (!c) return [];
    const archetypes = known([c.primary_type ?? "", ...c.secondary_types]);
    const byDimension: Record<string, string[]> = {
      archetype: archetypes,
      archetype_family: archetypes.map((a) => familyOf(a) ?? "").filter(Boolean),
      objective: [c.objective ?? ""],
      hook_technique: [c.hook_technique ?? ""],
      narrative_pattern: [c.narrative_pattern ?? ""],
      typography: c.typography_categories,
      layout: c.layout_tags,
      imagery: c.visual_styles,
      palette: c.palette,
      tone: c.tones,
      persuasion: c.persuasion,
      cta: c.cta ? [c.cta] : [],
      visual_device: (post.creative as RawDetailAnalysis).narrative?.slides.flatMap((s) => s.devices ?? []) ?? [],
    };
    return known(byDimension[dimension] ?? []);
  };
  return {
    calls,
    async search(request: RawSearchRequest): Promise<RawSearchResult> {
      calls.push(`search:${JSON.stringify(request)}`);
      for (const key of Object.keys(request)) {
        if (!["query", "category", "brand", "format", "analysed_only", "limit", "offset", "archetype", "archetype_family", "objective", "hook_technique", "narrative_pattern", "typography", "layout", "imagery", "palette", "visual_device", "tone", "persuasion", "cta"].includes(key)) {
          throw Object.assign(new Error(`Unknown search field "${key}"`), { code: "22023" });
        }
      }
      const limit = request.limit ?? 20;
      const offset = request.offset ?? 0;
      const q = typeof request.query === "string" ? request.query.toLowerCase() : null;
      const matchQuery = (post: RawPost) => {
        if (!q) return true;
        const text = `${post.caption} ${post.alt} ${JSON.stringify(post.creative)}`.toLowerCase();
        const groups = q.split(/\s+or\s+/);
        return groups.some((g) => g.split(/\s+/).every((w) => text.includes(w.replace(/"/g, ""))));
      };
      const filterDims = Object.entries(request).filter(([k]) => terms.dimensions[k]);
      const matchFilters = (post: RawPost) => {
        // A category matches the brand's main category or any tag, as curatit_mcp_search_v2 does
        if (request.category && !post.categories.some((category) => category.slug === request.category)) return false;
        if (request.brand && post.brand.slug !== request.brand) return false;
        if (request.format && post.format !== request.format) return false;
        if (request.analysed_only && !(post.creative && "analysis_version" in post.creative)) return false;
        for (const [dim, values] of filterDims) {
          const wanted = Array.isArray(values) ? values : [String(values)];
          for (const v of wanted) if (!terms.dimensions[dim]?.some((t) => t.slug === v)) throw Object.assign(new Error(`Unknown ${dim} "${v}"; curatit_mcp_creative_terms lists them`), { code: "22023" });
          if (!compact(post)) return false;
          const have = labels(post, dim);
          if (!wanted.some((v) => have.includes(v))) return false;
        }
        return true;
      };
      const all = posts.filter((p) => matchQuery(p) && matchFilters(p));
      const page = all.slice(offset, offset + limit);
      const ranks = Boolean(q) || filterDims.length > 0;
      return {
        posts: page.map((post) => ({
          id: post.id,
          short_code: post.short_code,
          source_url: post.source_url,
          format: post.format,
          caption: (post.caption ?? "").slice(0, 400),
          posted_at: post.posted_at,
          brand: post.brand,
          categories: post.categories,
          cover: post.images[0] ?? null,
          score: ranks ? 1 : 0,
          reasons: [...(q ? ["The query matches the caption"] : []), ...filterDims.map(([dim]) => `${dim}: match — seen on slide 0, 1`)],
          analysis: compact(post),
        })),
        has_more: all.length > offset + limit,
        next_offset: all.length > offset + limit ? offset + limit : null,
        sort: ranks ? "relevance" : "newest",
        search_mode: "keyword+taxonomy",
        filters: Object.fromEntries(filterDims.map(([k, v]) => [k, Array.isArray(v) ? v : [String(v)]])),
      };
    },
    async getPost(postId) {
      calls.push(`getPost:${postId}`);
      return posts.find((p) => p.id === postId) ?? null;
    },
    async resolvePost(key) {
      const post = posts.find((p) => p.id === key || p.short_code === key);
      return post ? { id: post.id, short_code: post.short_code } : null;
    },
    async terms() {
      return terms;
    },
    async categories() {
      return [
        { name: "Finance", slug: "finance", description: "Money apps.", posts: 2, main_posts: 2 },
        { name: "Lifestyle", slug: "lifestyle", description: "Life around the product.", posts: 1, main_posts: 0 },
        { name: "Shopping", slug: "shopping", description: "Stores and shopping apps.", posts: 1, main_posts: 1 },
      ];
    },
    async brands() {
      return [
        { name: "Fixture Co", slug: "fixture-co", category: "finance", website: "https://fixture.example", posts: 2, categories: [finance] },
        { name: "Fixture Threads", slug: "fixture-threads", category: "shopping", website: "https://threads.fixture.example", posts: 1, categories: [shopping, lifestyle] },
      ];
    },
    // Any of the 28 categories by slug, name or a loose spelling of either, and the original
    // seven's slugs mapped on to what they became; a brand by slug or name
    async resolveFilter(kind, value) {
      const wanted = normalise(value);
      if (!wanted) return null;
      if (kind === "category") {
        const old = OLD_SLUGS[value.trim().toLowerCase()];
        if (old) return old;
        return CATEGORIES.find((c) => normalise(c.slug) === wanted || normalise(c.name) === wanted)?.slug ?? null;
      }
      return posts.map((p) => p.brand).find((b) => normalise(b.slug ?? "") === wanted || normalise(b.name ?? "") === wanted)?.slug ?? null;
    },
    async slides(postId) {
      const post = posts.find((p) => p.id === postId);
      if (!post) return [];
      if (post.format === "carousel") return post.images.map((i) => ({ position: i.position, alt: `Slide ${i.position + 1} alt`, was_video: i.position === 2, width: 1080, height: 1350 }));
      return [{ position: 0, alt: post.alt, was_video: false, width: 1080, height: 1080 }];
    },
    async metricsObservedAt(postId) {
      return posts.some((p) => p.id === postId) ? "2026-10-09T08:00:00+00:00" : null;
    },
    publicUrl: (path) => `https://storage.example/library/${path}`,
  };
}

export const FIXTURE_IDS = { carousel: carousel.id, carouselShortCode: carousel.short_code, single: single.id, singleShortCode: single.short_code };

// The single image with a 2.1 analysis, in Shopping (its brand's main category) and tagged Lifestyle
export const FIXTURE_TAGGED = { id: tagged.id, shortCode: tagged.short_code };
