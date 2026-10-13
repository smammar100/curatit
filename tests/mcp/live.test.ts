// The services against the real catalog, read-only, through the Supabase repository: the shapes
// the database functions return are what the services expect, with real posts. Needs the
// public keys and the secret key in the environment (.env.local); skipped without them.
// Run with `npm run test:mcp:live`.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOOLS } from "@/lib/mcp/contracts";
import { createSupabaseCatalog } from "@/lib/mcp/repo/supabase";
import { createBrief } from "@/lib/mcp/services/brief";
import { getMedia, probeImage } from "@/lib/mcp/services/media";
import { getCarousel, getPost } from "@/lib/mcp/services/post";
import { searchPosts } from "@/lib/mcp/services/search";
import { getTaxonomy } from "@/lib/mcp/services/taxonomy";

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

live("live catalog", () => {
  const repo = createSupabaseCatalog({ url: env.NEXT_PUBLIC_SUPABASE_URL!, publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, secretKey: env.SUPABASE_SECRET_KEY! });
  const ctx = { signingSecret: new Uint8Array(32).fill(3), principalKey: "test:live" };

  it("reads the taxonomy", async () => {
    const { data } = await getTaxonomy(repo, {});
    expect(TOOLS.curatit_get_taxonomy.output.parse(data)).toBeTruthy();
    expect(data.dimensions.find((d) => d.dimension === "industry")!.values.length).toBeGreaterThanOrEqual(7);
    expect(data.dimensions.find((d) => d.dimension === "brand")!.values.length).toBeGreaterThanOrEqual(30);
    expect(data.taxonomy_version).toMatch(/^\d{4}\.\d{2}\.\d{2}/);
  }, 20_000);

  it("searches, pages and resolves aliases", async () => {
    const page1 = await searchPosts(repo, { filters: { industries: ["Finance"], formats: ["carousel"] }, limit: 3 }, ctx);
    expect(TOOLS.curatit_search_posts.output.parse(page1.data)).toBeTruthy();
    expect(page1.data.applied.filters).toEqual({ industries: ["finance"], formats: ["carousel"] });
    expect(page1.data.posts.length).toBe(3);
    expect(page1.data.next_cursor).toBeTruthy();
    const page2 = await searchPosts(repo, { filters: { industries: ["Finance"], formats: ["carousel"] }, limit: 3, cursor: page1.data.next_cursor! }, ctx);
    expect(page2.data.posts.map((p) => p.post_id)).not.toEqual(page1.data.posts.map((p) => p.post_id));
    const byText = await searchPosts(repo, { query: "launch", filters: { analysed_only: true } }, ctx);
    for (const hit of byText.data.posts) expect(hit.analysis_available).toBe(true);
  }, 30_000);

  it("reads a post, its carousel and probes a real image", async () => {
    const { data: s } = await searchPosts(repo, { filters: { formats: ["carousel"], analysed_only: true }, limit: 1 }, ctx);
    const id = s.posts[0].post_id;
    const { data } = await getPost(repo, { post_id: id, detail_level: "full" });
    expect(TOOLS.curatit_get_post.output.parse(data)).toBeTruthy();
    expect(data.post.metrics.observed_at).toMatch(/^\d{4}-/);
    expect(data.post.analysis?.status).toBe("published");
    const carousel = await getCarousel(repo, { post_id: data.post.short_code, limit: 2 });
    expect(carousel.data.slides[0].public_url).toMatch(/supabase\.co\/storage\/v1\/object\/public\/library\//);
    const probe = await probeImage(carousel.data.slides[0].public_url);
    expect(probe.mimeType).toBe("image/webp");
    expect(probe.width).toBeGreaterThan(100);
    const media = await getMedia(repo, { media_id: carousel.data.slides[0].media_id });
    expect(media.data.width).toBe(probe.width);
    const brief = await createBrief(repo, { objective: "Test objective", audience: "test audience", reference_post_ids: [id] });
    expect(brief.data.brief.references[0].analysis_available).toBe(true);
  }, 40_000);
});
