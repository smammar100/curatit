// The catalog asks for search cards, and falls back to full results on a database without the
// search projections (…_search_projections), once for the process
import { describe, expect, it, vi } from "vitest";

function postgrest(requests: { fields?: unknown }[], refuse: boolean): typeof fetch {
  return async (_input, init) => {
    const request = JSON.parse(String(init?.body ?? "{}")).p_request ?? {};
    requests.push(request);
    if (refuse && "fields" in request) {
      return new Response(JSON.stringify({ code: "22023", details: null, hint: null, message: 'Unknown search field "fields"' }), { status: 400, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ posts: [], has_more: false, next_offset: null, sort: "newest", search_mode: "keyword+taxonomy", filters: {} }), { status: 200, headers: { "content-type": "application/json" } });
  };
}

describe("catalog search projection", () => {
  it("asks for cards", async () => {
    vi.resetModules();
    const { createSupabaseCatalog } = await import("./supabase");
    const requests: { fields?: unknown }[] = [];
    const repo = createSupabaseCatalog({ url: "https://example.supabase.co", publishableKey: "k", secretKey: "s", fetch: postgrest(requests, false) });
    await repo.search({ format: "carousel" } as never);
    await repo.hybridItems!({ query: "cash" } as never, ["1"]);
    expect(requests.map((r) => r.fields)).toEqual(["card", "card"]);
  });

  it("falls back to full results when the database refuses the field, and stops asking", async () => {
    vi.resetModules();
    const { createSupabaseCatalog } = await import("./supabase");
    const requests: { fields?: unknown }[] = [];
    const repo = createSupabaseCatalog({ url: "https://example.supabase.co", publishableKey: "k", secretKey: "s", fetch: postgrest(requests, true) });
    expect((await repo.search({ format: "carousel" } as never)).posts).toEqual([]);
    await repo.search({ format: "static" } as never);
    expect(requests.map((r) => r.fields ?? null)).toEqual(["card", null, null]);
  });
});
