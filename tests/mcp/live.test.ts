// The services against the real catalog, read-only, through the Supabase repository: the shapes
// the database functions return are what the services expect, with real posts. Every input goes
// through its tool's own schema first, as a client's would, and every result is held to the
// tool's output schema. Needs the public keys and the secret key in the environment (.env.local);
// skipped without them. Run with `npm run test:mcp:live`.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOOLS, type ToolName } from "@/lib/mcp/contracts";
import { success } from "@/lib/mcp/envelope";
import { createSupabaseCatalog } from "@/lib/mcp/repo/supabase";
import type { CatalogRepository } from "@/lib/mcp/repo/types";
import { createBrief } from "@/lib/mcp/services/brief";
import { getMedia, probeImage } from "@/lib/mcp/services/media";
import { getCarousel, getPost } from "@/lib/mcp/services/post";
import { searchPosts } from "@/lib/mcp/services/search";
import { getTaxonomy } from "@/lib/mcp/services/taxonomy";
import { toolOutputSchema } from "@/lib/mcp/tools";

// .env.local, without a dependency: KEY=value lines, quotes stripped, never printed
function loadEnvLocal() {
  let text: string;
  try {
    text = readFileSync(".env.local", "utf8");
  } catch {
    return; // no file: the suite is skipped
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();
const env = process.env;
const ready = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SECRET_KEY);
const live = ready ? describe : describe.skip;

const repo: CatalogRepository | null = ready ? createSupabaseCatalog({ url: env.NEXT_PUBLIC_SUPABASE_URL!, publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, secretKey: env.SUPABASE_SECRET_KEY! }) : null;
const ctx = { signingSecret: new Uint8Array(32).fill(3), principalKey: "test:live" };

// A tool's input as a client would send it: parsed by the tool's own schema, which is what the
// MCP SDK and the REST routes do before any service runs
const input = <N extends ToolName>(name: N, args: unknown) => TOOLS[name].input.parse(args) as never;

// A service's result in the envelope the tool returns, checked against the tool's output schema
function schemaProblems(name: ToolName, data: unknown) {
  const parsed = toolOutputSchema(name).safeParse(success("live", data, [], null));
  return parsed.success ? [] : parsed.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

// Whether the catalog has …_creative_mcp_analysis_v3, which returns the Creative DNA and slide
// records the 3.0 fields are built from. Before it's applied those fields fall back (no decisions,
// the concept as the headline), so the checks that need it are skipped and say so
const MIGRATION = "20261016120200_creative_mcp_analysis_v3";
async function catalogHasV3() {
  if (!repo) return false;
  try {
    const { data } = await searchPosts(repo, input("curatit_search_posts", { filters: { analysed_only: true }, limit: 1 }), ctx);
    const post = await repo.getPost(data.posts[0].post_id);
    return Boolean(post?.creative && "dna" in post.creative && post.creative.dna);
  } catch {
    return false;
  }
}
const v3 = await catalogHasV3();

// Every published post, newest first, through the search tool a format at a time
async function everyPost() {
  const ids: string[] = [];
  for (const format of ["carousel", "static", "video"]) {
    let cursor: string | undefined;
    do {
      const { data } = await searchPosts(repo!, input("curatit_search_posts", { filters: { formats: [format] }, limit: 20, ...(cursor && { cursor }) }), ctx);
      ids.push(...data.posts.map((p) => p.post_id));
      cursor = data.next_cursor ?? undefined;
    } while (cursor);
  }
  return [...new Set(ids)];
}

async function pool<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) await work(items[next++]);
  }));
}

type Sweep = { posts: number; analysed: number; failures: string[]; withoutHeadline: string[]; withoutDecisions: string[]; sentinels: string[]; badStatuses: string[]; placeholderRoles: string[] };

const SAYS_NOTHING = ["unknown", "none", "other"];
const slideTags = (slide: { role: string | null; typography: string[]; layouts: string[]; imagery: string[]; palettes: string[]; devices: string[] }) => [slide.role ?? "", ...slide.typography, ...slide.layouts, ...slide.imagery, ...slide.palettes, ...slide.devices];

// get_post at summary and full, and every get_carousel page, for every published post
async function sweep(): Promise<Sweep> {
  const out: Sweep = { posts: 0, analysed: 0, failures: [], withoutHeadline: [], withoutDecisions: [], sentinels: [], badStatuses: [], placeholderRoles: [] };
  const ids = await everyPost();
  out.posts = ids.length;
  // Three at a time: six overran the catalog's 10 s reads on the older posts (2026-10-16)
  await pool(ids, 3, async (id) => {
    try {
      const summary = await getPost(repo!, input("curatit_get_post", { post_id: id }));
      out.failures.push(...schemaProblems("curatit_get_post", summary.data).map((p) => `${id} get_post summary: ${p}`));
      const full = await getPost(repo!, input("curatit_get_post", { post_id: id, detail_level: "full" }));
      out.failures.push(...schemaProblems("curatit_get_post", full.data).map((p) => `${id} get_post full: ${p}`));
      const analysis = full.data.post.analysis;
      if (analysis) {
        out.analysed++;
        if (!analysis.strategy_headline.trim()) out.withoutHeadline.push(id);
        if (!analysis.decisions.length) out.withoutDecisions.push(id);
        for (const check of analysis.data_checks) if (!["observed", "potential_concern", "cannot_verify"].includes(check.status)) out.badStatuses.push(`${id}: ${check.status}`);
        for (const slide of analysis.slides ?? []) if (slideTags(slide).some((t) => SAYS_NOTHING.includes(t))) out.sentinels.push(`${id} slide ${slide.slide_index}`);
        for (const colour of analysis.colour_roles ?? []) if (colour.role && /cover sample/i.test(colour.role)) out.placeholderRoles.push(id);
      }
      let start: number | null = 0;
      while (start !== null) {
        const page = await getCarousel(repo!, input("curatit_get_carousel", { post_id: id, start_slide: start, limit: 10 }));
        out.failures.push(...schemaProblems("curatit_get_carousel", page.data).map((p) => `${id} get_carousel ${start}: ${p}`));
        for (const slide of page.data.slides) if (slide.analysis && slideTags(slide.analysis).some((t) => SAYS_NOTHING.includes(t))) out.sentinels.push(`${id} carousel slide ${slide.slide_index}`);
        start = page.data.next_start;
      }
    } catch (error) {
      out.failures.push(`${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return out;
}
let swept: Promise<Sweep> | null = null;
const sweepOnce = () => (swept ??= sweep());

live("live catalog", () => {
  it("reads the taxonomy", async () => {
    const { data } = await getTaxonomy(repo!, input("curatit_get_taxonomy", {}));
    expect(TOOLS.curatit_get_taxonomy.output.parse(data)).toBeTruthy();
    expect(data.dimensions.find((d) => d.dimension === "industry")!.values.length).toBeGreaterThanOrEqual(7);
    expect(data.dimensions.find((d) => d.dimension === "brand")!.values.length).toBeGreaterThanOrEqual(30);
    expect(data.taxonomy_version).toMatch(/^\d{4}\.\d{2}\.\d{2}/);
  }, 20_000);

  it("searches, pages and resolves aliases", async () => {
    const page1 = await searchPosts(repo!, input("curatit_search_posts", { filters: { industries: ["Finance"], formats: ["carousel"] }, limit: 3 }), ctx);
    expect(TOOLS.curatit_search_posts.output.parse(page1.data)).toBeTruthy();
    expect(page1.data.applied.filters).toEqual({ industries: ["finance"], formats: ["carousel"] });
    expect(page1.data.posts.length).toBe(3);
    expect(page1.data.next_cursor).toBeTruthy();
    const page2 = await searchPosts(repo!, input("curatit_search_posts", { filters: { industries: ["Finance"], formats: ["carousel"] }, limit: 3, cursor: page1.data.next_cursor! }), ctx);
    expect(page2.data.posts.map((p) => p.post_id)).not.toEqual(page1.data.posts.map((p) => p.post_id));
    const byText = await searchPosts(repo!, input("curatit_search_posts", { query: "launch", filters: { analysed_only: true } }), ctx);
    for (const hit of byText.data.posts) expect(hit.analysis_available).toBe(true);
    // A tag category finds posts whose brand is filed elsewhere, and they say so
    const tagged = await searchPosts(repo!, input("curatit_search_posts", { filters: { industries: ["lifestyle"] }, limit: 20 }), ctx);
    expect(tagged.data.posts.length).toBeGreaterThan(0);
    for (const hit of tagged.data.posts) {
      const { data } = await getPost(repo!, input("curatit_get_post", { post_id: hit.post_id }));
      expect(data.post.categories.map((c) => c.slug)).toContain("lifestyle");
      expect(data.post.categories[0]).toMatchObject({ slug: data.post.industry?.slug, main: true });
    }
  }, 60_000);

  it("reads a post, its carousel and probes a real image", async () => {
    const { data: s } = await searchPosts(repo!, input("curatit_search_posts", { filters: { formats: ["carousel"], analysed_only: true }, limit: 1 }), ctx);
    const id = s.posts[0].post_id;
    const { data } = await getPost(repo!, input("curatit_get_post", { post_id: id, detail_level: "full" }));
    expect(TOOLS.curatit_get_post.output.parse(data)).toBeTruthy();
    expect(data.post.metrics.observed_at).toMatch(/^\d{4}-/);
    expect(data.post.analysis?.status).toBe("published");
    const carousel = await getCarousel(repo!, input("curatit_get_carousel", { post_id: data.post.short_code, limit: 2 }));
    expect(carousel.data.slides[0].public_url).toMatch(/supabase\.co\/storage\/v1\/object\/public\/library\//);
    const probe = await probeImage(carousel.data.slides[0].public_url);
    expect(probe.mimeType).toBe("image/webp");
    expect(probe.width).toBeGreaterThan(100);
    const media = await getMedia(repo!, input("curatit_get_media", { media_id: carousel.data.slides[0].media_id }));
    expect(media.data.width).toBe(probe.width);
    const brief = await createBrief(repo!, input("curatit_create_brief", { objective: "Test objective", audience: "test audience", reference_post_ids: [id] }));
    expect(brief.data.brief.references[0].analysis_available).toBe(true);
  }, 40_000);

  it("holds every published post's get_post and get_carousel to the contract", async () => {
    const result = await sweepOnce();
    expect(result.posts).toBeGreaterThanOrEqual(150);
    expect(result.failures).toEqual([]);
    expect(result.withoutHeadline).toEqual([]);
    expect(result.sentinels).toEqual([]);
    expect(result.badStatuses).toEqual([]);
    expect(result.placeholderRoles).toEqual([]);
  }, 600_000);

  it.runIf(v3)(`gives every analysis its creative decisions (needs ${MIGRATION})`, async () => {
    const result = await sweepOnce();
    expect(result.analysed).toBeGreaterThan(0);
    expect(result.withoutDecisions).toEqual([]);
  }, 600_000);

  it.runIf(v3)(`returns the 3.0 analysis with the website's brief (needs ${MIGRATION})`, async () => {
    const { data: s } = await searchPosts(repo!, input("curatit_search_posts", { query: "money", filters: { analysed_only: true }, limit: 1 }), ctx);
    const { data } = await getPost(repo!, input("curatit_get_post", { post_id: s.posts[0].post_id, detail_level: "full" }));
    const analysis = data.post.analysis!;
    expect(analysis.decisions[0].title.length).toBeGreaterThan(0);
    expect(analysis.decisions[0].slides_label ?? "Caption").toMatch(/^(Slides? \d|Cover|Caption)/);
    expect(analysis.application.when_to_use.length).toBeGreaterThan(0);
    expect(analysis.visual?.length).toBeGreaterThan(0);
    // The post page's 1:1 replica brief, every stored slide linked from Storage
    expect(analysis.brief_markdown).toMatch(/^# Instagram post — 1:1 replica brief/);
    expect(analysis.brief_markdown).not.toMatch(/cover sample/i);
    const slideLinks = analysis.brief_markdown!.match(/^Source image: <https:\/\/[^>]+\/storage\/v1\/object\/public\/library\/[^>]+>$/gm) ?? [];
    expect(slideLinks).toHaveLength(data.post.media.length);
  }, 40_000);
});
