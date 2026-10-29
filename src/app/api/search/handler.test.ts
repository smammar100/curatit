// The dashboard's search by meaning (/api/search) over the fixture catalog, with stand-ins for the
// session, the models, curatit_mcp_search_v3 and the rate limiter
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuratitError } from "@/lib/mcp/errors";
import { createFixtureCatalog, FIXTURE_IDS } from "@/lib/mcp/repo/fixture";
import type { RawSearchRequest } from "@/lib/mcp/repo/types";
import { clearRankings } from "@/lib/mcp/services/search";
import type { SemanticModels } from "@/lib/search/semantic/models";
import { searchByMeaning, wantsWarmUp, type SearchDeps } from "./handler";

const { carousel, single } = FIXTURE_IDS;
const ORIGIN = "https://www.curatit.app";

function deps(overrides: Partial<SearchDeps> & { fail?: boolean } = {}) {
  const seen: RawSearchRequest[] = [];
  const released = vi.fn();
  const repo = Object.assign(createFixtureCatalog(), {
    async hybridCandidates(request: RawSearchRequest) {
      seen.push(request);
      return {
        fused: [
          { id: single, keyword_rank: 1, similarity: null, kind: null, description: "S" },
          { id: carousel, keyword_rank: null, similarity: 0.9, kind: "strategy", description: "C" },
        ],
        keyword_rest: [],
        keyword_total: 1,
        filters: {},
      };
    },
  });
  const models: SemanticModels = {
    async embed(texts) {
      if (overrides.fail) throw new Error("no model files");
      return texts.map(() => new Array(384).fill(0.01));
    },
    async rerank(_query, documents) {
      return documents.map((d) => (d === "C" ? 0.8 : 0.1));
    },
  };
  const d: SearchDeps = {
    userId: async () => "user-1",
    repo,
    models,
    throttle: { acquire: vi.fn(async () => released) },
    ...overrides,
  };
  return { d, seen, released };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request(`${ORIGIN}/api/search`, { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers }, body: JSON.stringify(body) });
const valid = { query: "carousels about saving money", request: { query: "saving money", format: "carousel" } };

describe("the dashboard's search by meaning", () => {
  beforeEach(() => clearRankings());

  it("answers the order as post ids: the meaning matches the reranker keeps, best first", async () => {
    const { d, seen, released } = deps();
    const response = await searchByMeaning(post(valid), d);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ ids: [carousel, single] });
    expect(seen).toEqual([{ query: "saving money", format: "carousel" }]);
    expect(released).toHaveBeenCalledOnce();
  });

  it("keeps a Saved search to the saved posts", async () => {
    const { d, seen } = deps();
    await searchByMeaning(post({ ...valid, post_ids: ["p1", "p2"] }), d);
    expect(seen[0]).toEqual({ query: "saving money", format: "carousel", post_ids: ["p1", "p2"] });
  });

  it("counts against the member's read limit, and says so when it's used up", async () => {
    const { d } = deps({
      throttle: {
        acquire: vi.fn(async () => {
          throw new CuratitError("RATE_LIMITED", "Request limit reached", { retryAfterSeconds: 12 });
        }),
      },
    });
    const response = await searchByMeaning(post(valid), d);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
    expect(d.throttle.acquire).toHaveBeenCalledWith("dashboard:user-1", "read");
  });

  it("is for signed-in members on this site only", async () => {
    expect((await searchByMeaning(post(valid), deps({ userId: async () => null }).d)).status).toBe(401);
    expect((await searchByMeaning(post(valid, { Origin: "https://evil.example" }), deps().d)).status).toBe(403);
  });

  it("refuses a request that isn't an interpreted search", async () => {
    for (const body of [
      { query: "cash" },
      // Nothing left to rank by meaning
      { query: "carousels", request: { format: "carousel" } },
      { query: "cash", request: { query: "cash", analysed_only: true } },
      { query: "cash", request: { query: "cash", format: "reel" } },
      { query: "cash", request: { query: "cash" }, post_ids: new Array(2001).fill("p") },
      { query: "x".repeat(301), request: { query: "cash" } },
    ]) {
      expect((await searchByMeaning(post(body), deps().d)).status).toBe(400);
    }
    const bad = new Request(`${ORIGIN}/api/search`, { method: "POST", body: "{" });
    expect((await searchByMeaning(bad, deps().d)).status).toBe(400);
  });

  it("answers 503 when the models fail, so the dashboard shows the keyword results and says why", async () => {
    const { d, released } = deps({ fail: true });
    const response = await searchByMeaning(post(valid), d);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
    expect(released).toHaveBeenCalledOnce();
  });

  it("answers 503 off while CURATIT_HYBRID_SEARCH=off, before reading the request", async () => {
    const response = await searchByMeaning(post(valid), deps({ models: null }).d);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "off" });
  });

  it("warms the models only for a signed-in member, when there are models to warm", async () => {
    const get = (headers: Record<string, string> = {}) => new Request(`${ORIGIN}/api/search`, { headers });
    expect(await wantsWarmUp(get(), deps().d)).toBe(true);
    expect(await wantsWarmUp(get(), deps({ userId: async () => null }).d)).toBe(false);
    expect(await wantsWarmUp(get(), deps({ models: null }).d)).toBe(false);
    expect(await wantsWarmUp(get({ Origin: "https://evil.example" }), deps().d)).toBe(false);
  });
});
