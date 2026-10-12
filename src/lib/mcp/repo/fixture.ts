// An in-memory catalog with the shapes the database functions return, for tests and for running
// the server with no database. Two posts: a carousel with a published analysis and a single
// image without one. Clearly fixture data: the brand is "Fixture Co", not a real library brand.

import type { CatalogRepository, RawCompactAnalysis, RawDetailAnalysis, RawPost, RawSearchRequest, RawSearchResult, RawTerms } from "./types";

const analysis: RawDetailAnalysis = {
  verified_status: "approved",
  analysis_version: "00000000-0000-4000-8000-000000000001",
  analysis_source: "ai",
  taxonomy_version: "2026.10.11-1",
  published_at: "2026-10-11T10:00:00+00:00",
  image_analysis_complete: true,
  slides_analysed: 3,
  slides_total: 3,
  primary_type: "this-or-that",
  secondary_types: ["myth-busting"],
  objective: "education",
  visual_styles: ["screenshot-ui"],
  typography_categories: ["sans-serif"],
  layout_tags: ["framed-card", "list-stack"],
  palette: ["monochrome"],
  narrative_pattern: "setup-payoff",
  hook_technique: "question",
  concept: "A side-by-side that makes the better option obvious.",
  creative_summary: "Three slides: a question, the comparison, the answer.",
  why_it_might_work: [{ hypothesis: "A question hook invites a tap to the next slide.", evidence: ["slide:0 asks a question"] }],
  takeaways: ["Ask the question the audience is already asking.", "Put the two options in one frame."],
  analysis_evidence: [
    { ref: "slide:0", observation: "The cover asks a direct question", quote: "Cash or card?", slide: { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/01.webp", position: 0 } },
    { ref: "slide:1", observation: "Two columns compare the options", quote: null, slide: { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/02.webp", position: 1 } },
  ],
  note: "AI-assisted analysis, reviewed and approved by a Curatit editor. Rationale is hypothesis, not measured performance.",
  hook: { technique: "question", observed_text: "Cash or card?", location: "slide:0" },
  narrative: {
    pattern: "setup-payoff",
    arc: "Question, comparison, answer.",
    slides: [
      { position: 0, role: "hook", headline: "Cash or card?", observation: "Large question over a plain field", typography: ["sans-serif"], layout: ["centered"], imagery: [], palette: ["monochrome"], devices: [], image: { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/01.webp" } },
      { position: 1, role: "comparison", headline: "Cash vs card", observation: "Two columns", typography: ["sans-serif"], layout: ["framed-card"], imagery: ["screenshot-ui"], palette: ["monochrome"], devices: ["arrow"], image: { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/02.webp" } },
      { position: 2, role: "payoff", headline: "Card, every time", observation: "The answer, with a CTA", typography: ["sans-serif"], layout: ["list-stack"], imagery: [], palette: ["monochrome"], devices: [], image: { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/03.webp" } },
    ],
  },
  copy_strategy: "Short questions, one answer.",
  attention_mechanisms: ["A question the reader wants answered"],
  adaptation_ideas: ["Swap the options for your own two choices"],
  constraints_or_uncertainties: ["Comparison claims need a source"],
};

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
  categories: [{ name: "Fintech", slug: "fintech" }],
  images: [
    { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/01.webp", position: 0 },
    { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/02.webp", position: 1 },
    { bucket: "library", path: "fixture/fixture-co/carousel/FIX00001/03.webp", position: 2 },
  ],
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
  categories: [{ name: "Fintech", slug: "fintech" }],
  images: [{ bucket: "library", path: "fixture/fixture-co/static/FIX00002/01.webp", position: 0 }],
  analysis: null,
  creative: {},
};

const terms: RawTerms = {
  taxonomy_version: "2026.10.11-1",
  dimensions: {
    archetype: [{ slug: "this-or-that", label: "This or that", description: "Two options compared.", parent: "comparison", synonyms: ["comparison"], posts: 1 }],
    archetype_family: [{ slug: "comparison", label: "Comparison", description: null, parent: null, synonyms: [], posts: 1 }],
    objective: [{ slug: "education", label: "Education", description: "Teaches something.", parent: null, synonyms: [], posts: 1 }],
    hook_technique: [{ slug: "question", label: "Question", description: null, parent: null, synonyms: [], posts: 1 }],
    narrative_pattern: [{ slug: "setup-payoff", label: "Setup, payoff", description: null, parent: null, synonyms: [], posts: 1 }],
    typography: [{ slug: "sans-serif", label: "Sans-serif", description: null, parent: null, synonyms: [], posts: 1 }],
    layout: [
      { slug: "framed-card", label: "Framed card", description: null, parent: null, synonyms: [], posts: 1 },
      { slug: "list-stack", label: "List stack", description: null, parent: null, synonyms: [], posts: 1 },
    ],
    imagery: [{ slug: "screenshot-ui", label: "Screenshot UI", description: null, parent: null, synonyms: [], posts: 1 }],
    palette: [{ slug: "monochrome", label: "Monochrome", description: null, parent: null, synonyms: [], posts: 1 }],
    visual_device: [{ slug: "arrow", label: "Arrow", description: null, parent: null, synonyms: [], posts: 1 }],
    tone: [],
    persuasion: [],
    cta: [],
  },
};

const posts = [carousel, single];

export function createFixtureCatalog(): CatalogRepository & { calls: string[] } {
  const calls: string[] = [];
  const compact = (post: RawPost): RawCompactAnalysis | null => {
    const creative = post.creative as RawDetailAnalysis;
    if (!creative.analysis_version) return null;
    const { hook: _h, narrative: _n, copy_strategy: _c, attention_mechanisms: _a, adaptation_ideas: _i, constraints_or_uncertainties: _u, ...rest } = creative;
    return rest;
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
        if (request.category && post.categories[0]?.slug !== request.category) return false;
        if (request.brand && post.brand.slug !== request.brand) return false;
        if (request.format && post.format !== request.format) return false;
        if (request.analysed_only && !("analysis_version" in post.creative)) return false;
        const c = compact(post);
        for (const [dim, values] of filterDims) {
          const wanted = Array.isArray(values) ? values : [String(values)];
          for (const v of wanted) if (!terms.dimensions[dim]?.some((t) => t.slug === v)) throw Object.assign(new Error(`Unknown ${dim} "${v}"; curatit_mcp_creative_terms lists them`), { code: "22023" });
          if (!c) return false;
          const have: string[] = dim === "archetype" ? [c.primary_type ?? ""] : dim === "objective" ? [c.objective ?? ""] : dim === "typography" ? c.typography_categories : dim === "layout" ? c.layout_tags : dim === "imagery" ? c.visual_styles : dim === "palette" ? c.palette : dim === "hook_technique" ? [c.hook_technique ?? ""] : dim === "narrative_pattern" ? [c.narrative_pattern ?? ""] : [];
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
      return [{ name: "Fintech", slug: "fintech", description: "Money apps." }];
    },
    async brands() {
      return [{ name: "Fixture Co", slug: "fixture-co", category: "fintech", website: "https://fixture.example" }];
    },
    async resolveFilter(kind, value) {
      const v = value.toLowerCase();
      if (kind === "category") return v === "fintech" || v === "finance" ? "fintech" : null;
      return v === "fixture-co" || v === "fixture co" ? "fixture-co" : null;
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
