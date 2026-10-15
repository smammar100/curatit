// The example searches on the MCP landing page (2026-10-15, after the "one search" section of
// Mobbin's homepage, at the person's request). Each is a question a person might put to their
// assistant, with the filters curatit_search_posts would send for it. The results are not picked by
// hand: the page runs each request through curatit_mcp_search_v2, the same database function the
// MCP tool calls, when it renders (hourly), so what's shown is what an assistant would get.
// Every filter value is a real taxonomy slug (curatit_mcp_creative_terms lists them); an unknown
// one makes the function throw, and that example is simply left out.

import { createPublicClient } from "@/utils/supabase/public";
import type { LibraryPost } from "@/lib/posts";

export const SEARCHES = [
  { query: "Fintech carousels that launch a feature", request: { category: "finance", format: "carousel", archetype: ["feature-launch"] } },
  { query: "Posts that teach something", request: { objective: ["education"] } },
  { query: "Side-by-side comparisons", request: { narrative_pattern: ["comparison-series"] } },
  { query: "Brand collaborations", request: { archetype: ["collaboration"] } },
];

// What the row shows per search
const PER_SEARCH = 6;

export type ExampleResult = { shortCode: string; url: string; brand: string; logo: string | null; cover: string };
export type ExampleSearch = { query: string; results: ExampleResult[] };

export async function runExampleSearches(posts: LibraryPost[]): Promise<ExampleSearch[]> {
  const client = createPublicClient();
  const byShortCode = new Map(posts.map((post) => [post.shortCode, post]));
  const searches = await Promise.all(
    SEARCHES.map(async ({ query, request }) => {
      const { data, error } = await client.rpc("curatit_mcp_search_v2", { p_request: { ...request, limit: PER_SEARCH } });
      if (error || !data) return null;
      const results = ((data as { posts?: { short_code: string }[] }).posts ?? []).flatMap(({ short_code }) => {
        const post = byShortCode.get(short_code);
        return post?.images[0] ? [{ shortCode: post.shortCode, url: post.url, brand: post.brand.name, logo: post.brand.logo, cover: post.images[0] }] : [];
      });
      return results.length >= 3 ? { query, results } : null;
    }),
  );
  return searches.flatMap((search) => (search ? [search] : []));
}
