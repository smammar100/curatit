// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashPost } from "./types";
import { loadLibrarySearch, useLibrarySearch } from "./useLibrarySearch";

const { rpc, searchReplies } = vi.hoisted(() => ({ rpc: vi.fn(), searchReplies: [] as Promise<unknown>[] }));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ rpc }) }));
const posts: DashPost[] = [];
const page = (codes: string[], next: number | null = null, more = next !== null) => ({ data: { posts: codes.map((short_code) => ({ short_code })), has_more: more, next_offset: next }, error: null });
function setup() {
  rpc.mockImplementation((name: string) => ({ abortSignal: () => name === "curatit_mcp_creative_terms" ? Promise.resolve({ data: { dimensions: {} }, error: null }) : searchReplies.shift() }));
}
afterEach(() => { searchReplies.length = 0; vi.clearAllMocks(); vi.useRealTimers(); });

describe("dashboard catalog search", () => {
  it("collects ranked pages without duplicates for Saved/Discover intersection", async () => {
    setup();
    searchReplies.push(Promise.resolve(page(["a", "b"], 50)), Promise.resolve(page(["b", "c"])));
    const result = await loadLibrarySearch("fintech carousels", posts, new AbortController().signal);
    expect(result.codes).toEqual(["a", "b", "c"]);
    expect(rpc.mock.calls.filter(([name]) => name === "curatit_mcp_search_v2").map(([, args]) => args.p_request)).toEqual([
      { category: "finance", format: "carousel", limit: 50, offset: 0 },
      { category: "finance", format: "carousel", limit: 50, offset: 50 },
    ]);
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
});
