// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashPost } from "./types";
import { loadLibrarySearch, MEANING_NOTICE, useLibrarySearch, type Ranker } from "./useLibrarySearch";

const { rpc, searchReplies } = vi.hoisted(() => ({ rpc: vi.fn(), searchReplies: [] as Promise<unknown>[] }));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ rpc }) }));
const posts: DashPost[] = [];
const page = (codes: string[], next: number | null = null, more = next !== null) => ({ data: { posts: codes.map((short_code) => ({ short_code })), has_more: more, next_offset: next }, error: null });
// /api/search, the server's search by meaning: by default it ranks nothing, so the keyword order shows
const meaningReply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function setup() {
  vi.stubGlobal("fetch", vi.fn(async () => meaningReply({ ids: [] })));
  rpc.mockImplementation((name: string) => ({ abortSignal: () => name === "curatit_mcp_creative_terms" ? Promise.resolve({ data: { dimensions: {} }, error: null }) : searchReplies.shift() }));
}
afterEach(() => { searchReplies.length = 0; vi.clearAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("dashboard catalog search", () => {
  it("collects ranked pages without duplicates for Saved/Discover intersection", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a", "b"], 50)), Promise.resolve(page(["b", "c"])));
    const result = await loadLibrarySearch("fintech carousels", posts, new AbortController().signal);
    expect(result.codes).toEqual(["a", "b", "c"]);
    // Short codes only, 100 to a page
    expect(rpc.mock.calls.filter(([name]) => name === "curatit_mcp_search_v2").map(([, args]) => args.p_request)).toEqual([
      { category: "finance", format: "carousel", fields: "ids", limit: 100, offset: 0 },
      { category: "finance", format: "carousel", fields: "ids", limit: 100, offset: 50 },
    ]);
  });

  it("keeps a search to the view's category or saved posts, in the database", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a"])), Promise.resolve(page(["b"])));
    await loadLibrarySearch("cash", posts, new AbortController().signal, { category: "finance" });
    await loadLibrarySearch("cash", posts, new AbortController().signal, { postIds: ["p1", "p2"] });
    const requests = rpc.mock.calls.filter(([name]) => name === "curatit_mcp_search_v2").map(([, args]) => args.p_request);
    expect(requests).toEqual([
      { query: "cash", category: "finance", fields: "ids", limit: 100, offset: 0 },
      { query: "cash", post_ids: ["p1", "p2"], fields: "ids", limit: 100, offset: 0 },
    ]);
    // Nothing saved: nothing to ask
    expect((await loadLibrarySearch("cash", posts, new AbortController().signal, { postIds: [] })).codes).toEqual([]);
    expect(rpc.mock.calls.filter(([name]) => name === "curatit_mcp_search_v2")).toHaveLength(2);
  });

  it("reports the catalog cap and propagates failures instead of showing no matches", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a"], null, true)));
    expect((await loadLibrarySearch("cash", posts, new AbortController().signal)).capped).toBe(true);
    searchReplies.push(Promise.resolve({ data: null, error: new Error("offline") }));
    await expect(loadLibrarySearch("cash", posts, new AbortController().signal)).rejects.toThrow("offline");
  });

  it("reuses successful searches briefly, then refreshes expired entries", async () => {
    setup();
    vi.useFakeTimers();
    const signal = new AbortController().signal;
    searchReplies.push(Promise.resolve(page(["cached"])));
    expect((await loadLibrarySearch("cachetest", posts, signal)).codes).toEqual(["cached"]);
    expect((await loadLibrarySearch("cachetest", posts, signal)).codes).toEqual(["cached"]);
    expect(rpc.mock.calls.filter(([name]) => name === "curatit_mcp_search_v2")).toHaveLength(1);
    vi.setSystemTime(Date.now() + 60_001);
    searchReplies.push(Promise.resolve(page(["updated"])));
    expect((await loadLibrarySearch("cachetest", posts, signal)).codes).toEqual(["updated"]);
  });

  it("debounces typing and ignores late replies after a new query or clearing", async () => {
    setup();
    vi.useFakeTimers();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const host = document.createElement("div");
    const root = createRoot(host);
    let first!: (value: unknown) => void;
    let second!: (value: unknown) => void;
    searchReplies.push(new Promise((resolve) => { first = resolve; }), new Promise((resolve) => { second = resolve; }));
    function Harness({ query }: { query: string }) {
      const state = useLibrarySearch(query, posts);
      return <span>{state.loading ? "loading" : state.result?.codes.join(",") ?? "idle"}</span>;
    }
    try {
      await act(async () => { root.render(<Harness query="cash" />); });
      expect(rpc).not.toHaveBeenCalled();
      await act(async () => { await vi.advanceTimersByTimeAsync(301); });
      await act(async () => { root.render(<Harness query="pizza" />); });
      await act(async () => { await vi.advanceTimersByTimeAsync(301); });
      await act(async () => { second(page(["new"])); });
      expect(host.textContent).toBe("new");
      await act(async () => { first(page(["old"])); });
      expect(host.textContent).toBe("new");
      await act(async () => { root.render(<Harness query="" />); });
      expect(host.textContent).toBe("idle");
    } finally { await act(async () => root.unmount()); }
  });

  it("asks the old way when the database doesn't know the compact search yet", async () => {
    vi.resetModules();
    const fresh = await import("./useLibrarySearch");
    setup();
    searchReplies.push(
      Promise.resolve({ data: null, error: { code: "22023", message: 'Unknown search field "fields"' } }),
      Promise.resolve(page(["a"])),
      Promise.resolve(page(["b"])),
    );
    expect((await fresh.loadLibrarySearch("cash", posts, new AbortController().signal, { postIds: ["p1"] })).codes).toEqual(["a"]);
    expect((await fresh.loadLibrarySearch("cards", posts, new AbortController().signal)).codes).toEqual(["b"]);
    expect(rpc.mock.calls.filter(([name]) => name === "curatit_mcp_search_v2").map(([, args]) => args.p_request)).toEqual([
      { query: "cash", post_ids: ["p1"], fields: "ids", limit: 100, offset: 0 },
      { query: "cash", limit: 50, offset: 0 },
      { query: "cards", limit: 50, offset: 0 },
    ]);
  });
});

// Search by meaning (2026-10-28): the server ranks the interpreted request while the keyword pages
// load; its order goes first, the other keyword matches follow
describe("dashboard search by meaning", () => {
  const dash = (id: string, shortCode: string) => ({ id, shortCode, brand: { slug: "brand", name: "Brand" } }) as unknown as DashPost;
  const library = [dash("p1", "a"), dash("p2", "b"), dash("p3", "c")];
  const signal = () => new AbortController().signal;

  it("puts the server's order first and the keyword matches it left out after it", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a", "b"])));
    // A post the feed doesn't have (published since it loaded) is left out
    const rank = vi.fn<Ranker>(async () => ["p3", "p1", "not-in-the-feed"]);
    const result = await loadLibrarySearch("cash", library, signal(), {}, undefined, rank);
    expect(result).toMatchObject({ codes: ["c", "a", "b"], ranking: "meaning" });
    expect(result.notice).toBeUndefined();
    expect(rank).toHaveBeenCalledWith({ query: "cash", request: { query: "cash" } }, expect.any(AbortSignal));
  });

  it("sends the view's scope with the interpreted request", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a"])), Promise.resolve(page(["a"])));
    const rank = vi.fn<Ranker>(async () => ["p1"]);
    await loadLibrarySearch("cards", library, signal(), { category: "finance" }, undefined, rank);
    await loadLibrarySearch("cards", library, signal(), { postIds: ["p1", "p2"] }, undefined, rank);
    expect(rank.mock.calls.map(([body]) => body)).toEqual([
      { query: "cards", request: { query: "cards", category: "finance" } },
      { query: "cards", request: { query: "cards" }, post_ids: ["p1", "p2"] },
    ]);
  });

  it("leaves a search that's all filters to keyword search, as MCP does", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a"])));
    const rank = vi.fn<Ranker>(async () => ["p3"]);
    const result = await loadLibrarySearch("fintech carousels", library, signal(), {}, undefined, rank);
    expect(rank).not.toHaveBeenCalled();
    expect(result.codes).toEqual(["a"]);
    expect(result.ranking).toBeUndefined();
  });

  it("shows the keyword results with a notice when it fails or is too slow, and tries again next time", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a", "b"])), Promise.resolve(page(["a", "b"])));
    const rank = vi.fn<Ranker>().mockRejectedValueOnce(new DOMException("timed out", "TimeoutError")).mockResolvedValueOnce(["p2"]);
    const failed = await loadLibrarySearch("savings", library, signal(), {}, undefined, rank);
    expect(failed).toMatchObject({ codes: ["a", "b"], ranking: "keyword", notice: MEANING_NOTICE });
    // Not kept: the same search asks again
    const again = await loadLibrarySearch("savings", library, signal(), {}, undefined, rank);
    expect(again).toMatchObject({ codes: ["b", "a"], ranking: "meaning" });
    expect(rank).toHaveBeenCalledTimes(2);
  });

  it("asks /api/search, and an error answer counts as a failure", async () => {
    setup();
    const fetch = vi.fn(async () => meaningReply({ error: "unavailable" }, 503));
    vi.stubGlobal("fetch", fetch);
    searchReplies.push(Promise.resolve(page(["a"])));
    const result = await loadLibrarySearch("budget", library, signal());
    expect(result.notice).toBe(MEANING_NOTICE);
    expect(fetch).toHaveBeenCalledWith("/api/search", expect.objectContaining({ method: "POST", body: JSON.stringify({ query: "budget", request: { query: "budget" } }) }));
  });

  it("goes quietly back to keyword search for the visit when it's switched off", async () => {
    vi.resetModules();
    const fresh = await import("./useLibrarySearch");
    setup();
    const fetch = vi.fn(async () => meaningReply({ error: "off" }, 503));
    vi.stubGlobal("fetch", fetch);
    searchReplies.push(Promise.resolve(page(["a"])), Promise.resolve(page(["b"])));
    const first = await fresh.loadLibrarySearch("wallet", library, signal());
    expect(first.notice).toBeUndefined();
    expect(first.codes).toEqual(["a"]);
    await fresh.loadLibrarySearch("purse", library, signal());
    expect(fetch).toHaveBeenCalledTimes(1);
    // Nor warms the models
    fresh.warmSearch();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("warms the models when the box opens, at most every five minutes", async () => {
    vi.resetModules();
    const fresh = await import("./useLibrarySearch");
    vi.useFakeTimers();
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    fresh.warmSearch();
    fresh.warmSearch();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/search", { method: "GET" });
    vi.setSystemTime(Date.now() + 5 * 60_000 + 1);
    fresh.warmSearch();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
