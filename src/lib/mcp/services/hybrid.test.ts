// Hybrid search in the search service, over the fixture catalog with stand-ins for
// curatit_mcp_search_v3 and for the two models (scores set per description)
import { describe, expect, it } from "vitest";
import { CuratitError } from "../errors";
import { createFixtureCatalog, FIXTURE_IDS, FIXTURE_TAGGED } from "../repo/fixture";
import type { RawHybridCandidate, RawSearchHit } from "../repo/types";
import { searchPosts } from "./search";
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
// Scores per description, the same for every reading of the request, or per reading
function models(scores: Record<string, number> | ((reading: string) => Record<string, number>), options: { fail?: boolean } = {}): SemanticModels & { reranked: string[] } {
  const reranked: string[] = [];
  return {
    reranked,
    async embed(texts) {
      if (options.fail) throw new Error("no model files");
      return texts.map(() => new Array(384).fill(0.01));
    },
    async rerank(query, documents) {
      reranked.push(query);
      const forReading = typeof scores === "function" ? scores(query) : scores;
      return documents.map((d) => forReading[d] ?? 0);
    },
  };
}
const ctxWith = (semantic: SemanticModels) => ({ signingSecret: secret, principalKey: "personal_access_token:user-a", semantic });

describe("hybrid search", () => {
  it("keeps every keyword match and the meaning-only matches scored 0.02 or more, best first", async () => {
    const repo = hybridRepo([candidate(single, 1, "S"), candidate(carousel, null, "C"), candidate(tagged, null, "T")]);
    const m = models({ S: 0.001, C: 0.9, T: 0.01 });
    const { data, warnings } = await searchPosts(repo, { query: "cash posts" }, ctxWith(m));
    expect(data.applied.ranking).toBe("hybrid");
    expect(data.posts.map((p) => p.post_id)).toEqual([carousel, single]);
    expect(data.posts[0].score).toBe(0.9);
    expect(data.posts[0].match_reasons.at(-1)).toMatch(/^Close in meaning to the request \(its strategy\)/);
    expect(data.posts[1].match_reasons.join(" ")).not.toMatch(/Close in meaning/);
    // The whole sentence is embedded; the reranker reads it as written and as the words left
    // after interpretation
    expect(repo.seen[0].embeddingLength).toBe(384);
    expect(m.reranked).toEqual(["cash posts", "cash"]);
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

  // 2026-10-26: 'funny posts from fintech brands' scored the crypto memes about 0.0001 as written
  // (their descriptions say "Crypto & Web3, Finance"), 0.02 to 0.54 as the word left, "funny"
  it("reads the request as written and as the words the filters left, and keeps each post's better score", async () => {
    const repo = hybridRepo([candidate(carousel, null, "C"), candidate(tagged, null, "T"), candidate(single, null, "S")]);
    const m = models((reading) => (reading === "cash" ? { C: 0.3, T: 0.001, S: 0.01 } : { C: 0.001, T: 0.5, S: 0.01 }));
    const { data } = await searchPosts(repo, { query: "carousels about cash" }, ctxWith(m));
    expect(m.reranked).toEqual(["carousels about cash", "cash"]);
    expect(data.posts.map((p) => [p.post_id, p.score])).toEqual([[tagged, 0.5], [carousel, 0.3]]);
  });

  it("reads a request once when nothing was left out of it", async () => {
    const m = models({ C: 0.5 });
    await searchPosts(hybridRepo([candidate(carousel, null, "C")]), { query: "cash" }, ctxWith(m));
    expect(m.reranked).toEqual(["cash"]);
  });

  it("says when more posts match the words than it ranks", async () => {
    const repo = hybridRepo([candidate(single, 1, "S")], { keywordTotal: 64 });
    const { warnings } = await searchPosts(repo, { query: "cash" }, ctxWith(models({ S: 0.5 })));
    expect(warnings[0]).toMatch(/^64 posts match the words; this search ranks the first 50/);
  });
});
