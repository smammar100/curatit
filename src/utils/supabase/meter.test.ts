import { afterEach, describe, expect, it, vi } from "vitest";
import { endpointOf, meteredFetch, resetSupabaseUsage, supabaseUsage } from "./meter";

afterEach(() => {
  vi.unstubAllEnvs();
  resetSupabaseUsage();
});

describe("Supabase meter", () => {
  it("counts a request under its table, function or bucket, never its query or file", () => {
    expect(endpointOf("https://x.supabase.co/rest/v1/instagram_posts?select=id&short_code=eq.abc")).toBe("GET /rest/v1/instagram_posts");
    expect(endpointOf("https://x.supabase.co/rest/v1/rpc/curatit_mcp_search_v2", "post")).toBe("POST /rest/v1/rpc/curatit_mcp_search_v2");
    expect(endpointOf("https://x.supabase.co/storage/v1/object/public/library/fintech/wise/static/abc/01.webp")).toBe("GET /storage/v1/object/public/library");
  });

  it("is the plain fetch while metering is off", () => {
    vi.stubEnv("CURATIT_SUPABASE_USAGE", "");
    const base = vi.fn() as unknown as typeof fetch;
    expect(meteredFetch(base)).toBe(base);
  });

  it("counts requests, response bytes and failures while it's on, and passes responses through", async () => {
    vi.stubEnv("CURATIT_SUPABASE_USAGE", "memory");
    const base = (async (input: RequestInfo | URL) =>
      String(input).includes("broken") ? new Response("{}", { status: 500 }) : new Response(JSON.stringify({ rows: [1, 2, 3] }))) as typeof fetch;
    const fetched = meteredFetch(base);
    const res = await fetched("https://x.supabase.co/rest/v1/posts?id=eq.1");
    expect(await res.json()).toEqual({ rows: [1, 2, 3] });
    await fetched("https://x.supabase.co/rest/v1/broken");
    await new Promise((resolve) => setTimeout(resolve, 20));
    const usage = supabaseUsage();
    expect(usage["GET /rest/v1/posts"]).toMatchObject({ requests: 1, bytes: 16, errors: 0 });
    expect(usage["GET /rest/v1/posts"].gzipBytes).toBeGreaterThan(0);
    expect(usage["GET /rest/v1/broken"]).toMatchObject({ requests: 1, errors: 1 });
  });
});
