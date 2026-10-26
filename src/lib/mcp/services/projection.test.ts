// The search projections (…_search_projections) must not change what an assistant gets: the same
// tool output whether the database sends each result's analysis whole or as a card
import { beforeEach, describe, expect, it } from "vitest";
import { createFixtureCatalog } from "../repo/fixture";
import { CARD_ANALYSIS_KEYS, type RawSearchHit } from "../repo/types";
import { clearRankings, searchPosts } from "./search";
import type { SemanticModels } from "@/lib/search/semantic/models";

const ctx = { signingSecret: new Uint8Array(32).fill(3), principalKey: "personal_access_token:user-a" };
const asCard = (hit: RawSearchHit): RawSearchHit => ({
  ...hit,
  analysis: hit.analysis && (Object.fromEntries(Object.entries(hit.analysis).filter(([key]) => (CARD_ANALYSIS_KEYS as readonly string[]).includes(key))) as RawSearchHit["analysis"]),
});

// The fixture catalog, answering every search with cards
function cardCatalog() {
  const repo = createFixtureCatalog();
  const search = repo.search.bind(repo);
  return Object.assign(repo, { search: async (request: Parameters<typeof search>[0]) => {
    const result = await search(request);
    return { ...result, posts: result.posts.map(asCard) };
  } });
}

describe("search cards", () => {
  beforeEach(() => clearRankings());

  it.each([
    [{ query: "cash" }],
    [{ filters: { formats: ["carousel"] } }],
    [{ query: "fintech carousels that open with a question", limit: 2 }],
    [{ filters: { industries: ["finance"] }, sort: "newest" as const }],
    [{ query: "nothing like this anywhere" }],
  ])("give the same tool output as full results: %j", async (input) => {
    const full = await searchPosts(createFixtureCatalog(), input as never, ctx);
    const cards = await searchPosts(cardCatalog(), input as never, ctx);
    expect(cards).toEqual(full);
  });

  it("give the same hybrid output as full results", async () => {
    const models: SemanticModels = { embed: async (texts) => texts.map(() => new Array(384).fill(0.01)), rerank: async (_q, docs) => docs.map(() => 0.5) };
    const hybrid = (cards: boolean) => {
      const repo = createFixtureCatalog();
      const all = repo.search({ limit: 20 });
      return Object.assign(repo, {
        hybridCandidates: async () => ({ fused: (await all).posts.map((p, i) => ({ id: p.id, keyword_rank: i + 1, similarity: null, kind: null, description: p.caption })), keyword_rest: [], keyword_total: 2, filters: {}, catalog_marker: "m" }),
        hybridItems: async (_request: unknown, ids: string[]) => ({ posts: (await all).posts.filter((p) => ids.includes(p.id)).map((p) => (cards ? asCard(p) : p)), catalog_marker: "m" }),
      });
    };
    const full = await searchPosts(hybrid(false), { query: "cash" }, { ...ctx, semantic: models });
    clearRankings();
    const cards = await searchPosts(hybrid(true), { query: "cash" }, { ...ctx, semantic: models });
    expect(full.data.applied.ranking).toBe("hybrid");
    expect(cards).toEqual(full);
  });
});
