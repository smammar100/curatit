// What the catalog's database functions return, as they return it (curatit_mcp_search_v2,
// curatit_mcp_get_post_v2, curatit_mcp_creative_terms, curatit_mcp_taxonomy; the migrations in
// supabase/migrations/*curatit_mcp* and *creative_mcp_v2*). The services turn these into the
// public contracts; nothing else reads them. Slide positions here are zero-based, as the
// database counts them.

export type RawBrand = { name: string | null; slug: string | null };
export type RawCategory = { name: string; slug: string };
export type RawImageRef = { bucket: string; path: string; position: number };

export type RawEvidence = { ref: string; observation: string; quote: string | null; slide: RawImageRef | null };

export type RawCompactAnalysis = {
  verified_status: string;
  analysis_version: string;
  analysis_source: string;
  taxonomy_version: string | null;
  published_at: string | null;
  image_analysis_complete: boolean;
  slides_analysed: number;
  slides_total: number;
  primary_type: string | null;
  secondary_types: string[];
  objective: string | null;
  visual_styles: string[];
  typography_categories: string[];
  layout_tags: string[];
  palette: string[];
  narrative_pattern: string | null;
  hook_technique: string | null;
  concept: string | null;
  creative_summary: string | null;
  // Creative Intelligence 3.0 (…_creative_mcp_analysis_v3): the strategy line and the copy
  // strategy's labels, with 'unknown', 'none' and 'other' already left out. Absent from a database
  // without that migration, so read them with a fallback
  strategy_headline: string | null;
  strategy_summary: string | null;
  tones: string[];
  persuasion: string[];
  cta: string | null;
  why_it_might_work: { hypothesis: string; evidence: string[] }[];
  takeaways: string[];
  analysis_evidence: RawEvidence[];
  note: string;
};

export type RawSlideAnalysis = {
  position: number;
  role: string | null;
  headline: string | null;
  observation: string | null;
  typography: string[] | null;
  layout: string[] | null;
  imagery: string[] | null;
  palette: string[] | null;
  devices: string[] | null;
  image: { bucket: string; path: string } | null;
};

// One row of post_slide_analyses for the analysis's current version: the slide record as the
// pipeline validated it (src/lib/creative/schema.ts SlideObservation)
export type RawSlideRecord = { version_id: string; position: number; observation: unknown };

export type RawDetailAnalysis = RawCompactAnalysis & {
  hook: { technique: string | null; observed_text: string | null; location: string | null } | null;
  narrative: { pattern: string | null; arc: string | null; slides: RawSlideAnalysis[] } | null;
  copy_strategy: unknown;
  attention_mechanisms: unknown[];
  adaptation_ideas: unknown[];
  constraints_or_uncertainties: unknown[];
  // What the post page reads (src/lib/creative/display.ts), so services/post.ts can build the same
  // view with toPublicAnalysis: the Creative DNA whole and the current version's slide records
  dna: unknown;
  slide_records: RawSlideRecord[];
  current_version_id: string | null;
  expected_slides: number | null;
  processed_slides: number | null;
};

export type RawSearchHit = {
  id: string;
  short_code: string;
  source_url: string;
  format: "static" | "carousel" | "video";
  caption: string | null;
  posted_at: string | null;
  brand: RawBrand;
  categories: RawCategory[];
  cover: RawImageRef | null;
  score: number;
  reasons: string[];
  analysis: RawCompactAnalysis | null;
};

export type RawSearchResult = {
  posts: RawSearchHit[];
  has_more: boolean;
  next_offset: number | null;
  sort: "newest" | "relevance";
  search_mode: string;
  filters: Record<string, string[]>;
  // A short mark of the published catalog as it was for this page (…_mcp_search_v2_reasons);
  // a later page whose mark differs was taken from a changed library. Absent before that migration
  catalog_marker?: string | null;
};

// The request curatit_mcp_search_v2 takes
export type RawSearchRequest = {
  query?: string;
  category?: string;
  brand?: string;
  format?: string;
  analysed_only?: boolean;
  limit?: number;
  offset?: number;
} & Partial<Record<string, string | string[] | number | boolean>>;

export type RawPost = {
  id: string;
  short_code: string;
  source_url: string;
  format: "static" | "carousel" | "video";
  caption: string | null;
  alt: string | null;
  hashtags: string[] | null;
  owner_username: string | null;
  posted_at: string | null;
  updated_at: string | null;
  metrics: { likes: number | null; comments: number | null; video_views: number | null; observed_at: string | null; post_updated_at: string | null };
  brand: RawBrand;
  categories: RawCategory[];
  images: RawImageRef[];
  analysis: { summary: string | null; hook: string | null; why_it_works: string | null; takeaways: string[] | null; published_at: string | null } | null;
  // Null (no row found) or an empty object when the post has no published analysis
  creative: RawDetailAnalysis | Record<string, never> | null;
};

export type RawTerm = { slug: string; label: string; description: string | null; parent: string | null; synonyms: string[]; posts: number };
export type RawTerms = { taxonomy_version: string | null; dimensions: Record<string, RawTerm[]> };

// posts counts a category's published posts by main category or tag, main_posts by main category
// alone; a brand's categories are main first. Optional: only a curatit_mcp_taxonomy that counts
// them returns them
export type RawCategoryItem = { name: string; slug: string; description: string | null; posts?: number | null; main_posts?: number | null; synonyms?: string[] | null };
export type RawBrandItem = { name: string; slug: string; category: string | null; website?: string | null; posts?: number | null; categories?: RawCategory[] };

// curatit_mcp_search_v3's candidates: the keyword matches' top 20 fused with the 30 posts closest
// in meaning (within the same filters), the best 30 with their keyword rank (null when only the
// meaning matched), similarity, closest chunk and the description the reranker reads; then the
// other keyword matches in order, up to 50 keyword matches in all
export type RawHybridCandidate = { id: string; keyword_rank: number | null; similarity: number | null; kind: string | null; description: string | null };
export type RawHybridCandidates = {
  fused: RawHybridCandidate[];
  keyword_rest: string[];
  keyword_total: number;
  filters: Record<string, string[]>;
  catalog_marker?: string | null;
};

// A post's slides from instagram_post_media, with the post's own alt and size for a single image
export type RawSlide = { position: number; alt: string | null; was_video: boolean; width: number | null; height: number | null };

export type CatalogRepository = {
  search(request: RawSearchRequest): Promise<RawSearchResult>;
  // Hybrid search (curatit_mcp_search_v3). Optional: without them, or when they fail, search is
  // keyword search alone
  hybridCandidates?(request: RawSearchRequest, embedding: number[]): Promise<RawHybridCandidates>;
  // The page's posts, in the order given, in search's item shape, with the request's reasons
  hybridItems?(request: RawSearchRequest, ids: string[]): Promise<{ posts: RawSearchHit[]; catalog_marker?: string | null }>;
  getPost(postId: string): Promise<RawPost | null>;
  // A post's id and short code from either, published posts only
  resolvePost(idOrShortCode: string): Promise<{ id: string; short_code: string } | null>;
  terms(): Promise<RawTerms>;
  categories(): Promise<RawCategoryItem[]>;
  brands(): Promise<RawBrandItem[]>;
  resolveFilter(kind: "category" | "brand", value: string): Promise<string | null>;
  slides(postId: string): Promise<RawSlide[]>;
  // When a published post's counts were collected (scrape_runs.scraped_at)
  metricsObservedAt(postId: string): Promise<string | null>;
  // The public URL of a stored image
  publicUrl(path: string): string;
};
