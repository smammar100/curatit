// Hybrid search in the search service, over the fixture catalog with stand-ins for
// curatit_mcp_search_v3 and for the two models (scores set per description)
import { beforeEach, describe, expect, it } from "vitest";
import { CuratitError } from "../errors";
import { createFixtureCatalog, FIXTURE_IDS, FIXTURE_TAGGED } from "../repo/fixture";
import type { RawHybridCandidate, RawSearchHit } from "../repo/types";
import { clearRankings, searchPosts } from "./search";
import { rerankQuery } from "@/lib/search/semantic/hybrid";
import type { SemanticModels } from "@/lib/search/semantic/models";

const secret = new Uint8Array(32).fill(5);
const { carousel, single } = { carousel: FIXTURE_IDS.carousel, single: FIXTURE_IDS.single };
const tagged = FIXTURE_TAGGED.id;

function hybridRepo(fused: RawHybridCandidate[], options: { keywordRest?: string[]; keywordTotal?: number } = {}) {
  const repo = createFixtureCatalog();
  const seen: { embeddingLength: number; request: unknown }[] = [];
  let all: RawSearchHit[] | null = null;
  return Object.assign(repo, {
    seen,
    async hybridCandidates(request: unknown, embedding: number[]) {
      seen.push({ embeddingLength: embedding.length, request });
      return { fused, keyword_rest: options.keywordRest ?? [], keyword_total: options.keywordTotal ?? fused.filter((c) => c.keyword_rank !== null).length, filters: {}, catalog_marker: "m1" };
    },
    async hybridItems(_request: unknown, ids: string[]) {
      all ??= (await repo.search({ limit: 20 })).posts;
      return { posts: ids.flatMap((id) => all!.filter((hit) => hit.id === id)), catalog_marker: "m1" };
    },
  });
}
const candidate = (id: string, keywordRank: number | null, description: string): RawHybridCandidate => ({ id, keyword_rank: keywordRank, similarity: keywordRank === null ? 0.9 : null, kind: "strategy", description });
function models(scores: Record<string, number>, options: { fail?: boolean } = {}): SemanticModels & { reranked: string[] } {
  const reranked: string[] = [];
  return {
    reranked,
    async embed(texts) {
      if (options.fail) throw new Error("no model files");
      return texts.map(() => new Array(384).fill(0.01));
    },
    async rerank(query, documents) {
      reranked.push(query);
      return documents.map((d) => scores[d] ?? 0);
    },
  };
}
const ctxWith = (semantic: SemanticModels) => ({ signingSecret: secret, principalKey: "personal_access_token:user-a", semantic });

describe("hybrid search", () => {
  // Each test is a fresh process: no order kept from another
  beforeEach(() => clearRankings());

  it("keeps every keyword match and the meaning-only matches scored 0.02 or more, best first", async () => {
    const repo = hybridRepo([candidate(single, 1, "S"), candidate(carousel, null, "C"), candidate(tagged, null, "T")]);
    const m = models({ S: 0.001, C: 0.9, T: 0.01 });
    const { data, warnings } = await searchPosts(repo, { query: "cash posts" }, ctxWith(m));
    expect(data.applied.ranking).toBe("hybrid");
    expect(data.posts.map((p) => p.post_id)).toEqual([carousel, single]);
    expect(data.posts[0].score).toBe(0.9);
    expect(data.posts[0].match_reasons.at(-1)).toMatch(/^Close in meaning to the request \(its strategy\)/);
    expect(data.posts[1].match_reasons.join(" ")).not.toMatch(/Close in meaning/);
    // The whole sentence is embedded and reranked, not just the words left after interpretation,
    // though the reranker reads it without the words that only frame it
    expect(repo.seen[0].embeddingLength).toBe(384);
    expect(m.reranked).toEqual(["cash"]);
    expect(warnings).toEqual([]);
  });

  it("follows the reranked posts with the other keyword matches, in keyword order", async () => {
    const repo = hybridRepo([candidate(carousel, null, "C")], { keywordRest: [single, tagged] });
    const { data } = await searchPosts(repo, { query: "cash" }, ctxWith(models({ C: 0.5 })));
    expect(data.posts.map((p) => p.post_id)).toEqual([carousel, single, tagged]);
    expect(data.posts.slice(1).map((p) => p.score)).toEqual([null, null]);
  });

  it("pages through the same order, and won't continue it in another", async () => {
    const fused = [candidate(single, 1, "S"), candidate(carousel, 2, "C"), candidate(tagged, 3, "T")];
    const m = models({ S: 0.3, C: 0.2, T: 0.1 });
    const first = await searchPosts(hybridRepo(fused), { query: "cash", limit: 2 }, ctxWith(m));
    expect(first.data.posts.map((p) => p.post_id)).toEqual([single, carousel]);
    expect(first.data.next_cursor).toBeTruthy();
    const second = await searchPosts(hybridRepo(fused), { query: "cash", limit: 2, cursor: first.data.next_cursor! }, ctxWith(m));
    expect(second.data.posts.map((p) => p.post_id)).toEqual([tagged]);
    expect(second.data.next_cursor).toBeNull();
    // On an instance that no longer holds the order, a failing model can't carry the search on
    clearRankings();
    const broken = searchPosts(hybridRepo(fused), { query: "cash", limit: 2, cursor: first.data.next_cursor! }, ctxWith(models({}, { fail: true })));
    await expect(broken).rejects.toBeInstanceOf(CuratitError);
    await expect(broken).rejects.toMatchObject({ code: "INVALID_ARGUMENT", message: expect.stringMatching(/Start the search again/) });
  });

  it("answers with keyword search alone, and says so, when ranking by meaning fails", async () => {
    const repo = hybridRepo([candidate(carousel, null, "C")]);
    const { data, warnings } = await searchPosts(repo, { query: "cash" }, ctxWith(models({}, { fail: true })));
    expect(data.applied.ranking).toBe("keyword");
    expect(warnings).toContain("Ranking by meaning isn't available right now, so these results come from keyword search alone.");
    expect(data.posts.length).toBeGreaterThan(0);
  });

  it("stays keyword-only for literal modes and for requests that are all filters", async () => {
    for (const input of [{ query: "cash", query_mode: "all_words" as const }, { query: "cash", query_mode: "any_word" as const }, { query: "carousels" }]) {
      const repo = hybridRepo([candidate(carousel, null, "C")]);
      const { data } = await searchPosts(repo, input, ctxWith(models({ C: 1 })));
      expect(data.applied.ranking).toBe("keyword");
      expect(repo.seen).toHaveLength(0);
    }
  });

  it("reranks the request without the words that frame it, and keeps a request that's only framing", () => {
    expect(rerankQuery("posts that make saving money feel fun")).toBe("make saving money feel fun");
    expect(rerankQuery("Show me some examples of carousels with charts or data")).toBe("some of carousels with charts or data");
    expect(rerankQuery('posts about "Black Friday"')).toBe('about "Black Friday"');
    expect(rerankQuery("inspiration posts")).toBe("inspiration posts");
  });

  it("keeps a search's order for its next page and for the same search again, reading every page's posts fresh", async () => {
    const repo = hybridRepo([candidate(single, 1, "S"), candidate(carousel, 2, "C"), candidate(tagged, 3, "T")]);
    let items = 0;
    const hydrate = repo.hybridItems.bind(repo);
    repo.hybridItems = (request, ids) => (items++, hydrate(request, ids));
    const m = models({ S: 0.3, C: 0.2, T: 0.1 });
    const first = await searchPosts(repo, { query: "cash", limit: 2 }, ctxWith(m));
    await searchPosts(repo, { query: "cash", limit: 2, cursor: first.data.next_cursor! }, ctxWith(m));
    await searchPosts(repo, { query: "cash", limit: 2 }, ctxWith(m));
    expect(repo.seen).toHaveLength(1);
    expect(m.reranked).toHaveLength(1);
    expect(items).toBe(3);
    // Another search is ranked on its own
    await searchPosts(repo, { query: "cards", limit: 2 }, ctxWith(m));
    expect(repo.seen).toHaveLength(2);
  });

  it("doesn't keep a failed ranking", async () => {
    const repo = hybridRepo([candidate(carousel, null, "C")]);
    const failed = await searchPosts(repo, { query: "cash" }, ctxWith(models({}, { fail: true })));
    expect(failed.data.applied.ranking).toBe("keyword");
    const next = await searchPosts(repo, { query: "cash" }, ctxWith(models({ C: 0.5 })));
    expect(next.data.applied.ranking).toBe("hybrid");
  });

  it("says when more posts match the words than it ranks", async () => {
    const repo = hybridRepo([candidate(single, 1, "S")], { keywordTotal: 64 });
    const { warnings } = await searchPosts(repo, { query: "cash" }, ctxWith(models({ S: 0.5 })));
    expect(warnings[0]).toMatch(/^64 posts match the words; this search ranks the first 50/);
  });
});
