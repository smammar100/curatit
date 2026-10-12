// The MCP surface end to end, in process: the pinned SDK's own Client talks to the HTTP handler
// through a fetch that never touches the network, in both protocol eras, against the fixture
// catalog and a fake verifier. Also the HTTP boundary: challenges, origins, scopes.

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { beforeAll, describe, expect, it } from "vitest";
import type { Verifier } from "./auth/verifier";
import { toAuthInfo, type Principal } from "./auth/principal";
import { loadConfig, resetConfigCache } from "./config";
import { createMcpHttp } from "./http";
import { createLogger } from "./log";
import { createMemoryLimiter, Throttle } from "./ratelimit";
import { createFixtureCatalog, FIXTURE_IDS } from "./repo/fixture";
import type { Runtime } from "./tools";

const principals: Record<string, Principal> = {
  reader: { subjectId: "user-reader", organizationId: null, scopes: ["curatit:read"], credentialKind: "personal_access_token", entitlementVersion: "test", credentialId: "tok-1" },
  full: { subjectId: "user-full", organizationId: null, scopes: ["curatit:read", "curatit:brief"], credentialKind: "oauth", entitlementVersion: "test", credentialId: "client-1" },
};

function testRuntime(): { rt: Runtime; verifier: Verifier; lines: string[] } {
  resetConfigCache();
  const env = { NODE_ENV: "test", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk", SUPABASE_SECRET_KEY: "sk", CURATIT_PUBLIC_BASE_URL: "https://curatit.test" } as NodeJS.ProcessEnv;
  const config = loadConfig(env);
  const lines: string[] = [];
  const log = createLogger("debug", {}, (l) => lines.push(l));
  const rt: Runtime = { config, repo: createFixtureCatalog(), throttle: new Throttle(createMemoryLimiter(), log), log, media: {} };
  const verifier: Verifier = {
    async verifyAccessToken(token) {
      const principal = principals[token];
      if (!principal) throw new (await import("@modelcontextprotocol/server")).OAuthError("invalid_token", "bad token");
      return toAuthInfo(token, principal, Math.floor(Date.now() / 1000) + 3600, config.mcpUrl);
    },
  };
  return { rt, verifier, lines };
}

const url = "https://curatit.test/mcp";

async function connect(http: ReturnType<typeof createMcpHttp>, token: string, mode: "legacy" | "auto" = "legacy") {
  const client = new Client({ name: "test-client", version: "0.0.1" }, { versionNegotiation: { mode } });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    authProvider: { token: async () => token },
    fetch: (input, init) => http.mcp(new Request(input, init)),
  });
  await client.connect(transport);
  return client;
}

describe("MCP over HTTP with the SDK client", () => {
  let http: ReturnType<typeof createMcpHttp>;
  let lines: string[];
  beforeAll(() => {
    const t = testRuntime();
    http = createMcpHttp(t.rt, t.verifier);
    lines = t.lines;
  });

  for (const mode of ["legacy", "auto"] as const) {
    it(`initializes, lists six tools and runs a real search (${mode} negotiation)`, async () => {
      const client = await connect(http, "full", mode);
      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name).sort()).toEqual(["curatit_create_brief", "curatit_get_carousel", "curatit_get_media", "curatit_get_post", "curatit_get_taxonomy", "curatit_search_posts"]);
      const search = tools.find((t) => t.name === "curatit_search_posts")!;
      expect(search.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
      expect(search.outputSchema).toBeTruthy();
      expect((search._meta as { ui?: { resourceUri?: string } } | undefined)?.ui?.resourceUri).toBe("ui://curatit/search-results");
      const resources = await client.listResources();
      expect(resources.resources.some((r) => r.uri === "ui://curatit/search-results")).toBe(true);
      const widget = await client.readResource({ uri: "ui://curatit/search-results" });
      expect(widget.contents[0]).toMatchObject({ uri: "ui://curatit/search-results", mimeType: "text/html;profile=mcp-app" });
      const result = await client.callTool({ name: "curatit_search_posts", arguments: { query: "cash" } });
      expect(result.isError).toBeFalsy();
      const envelope = result.structuredContent as { data: { posts: { short_code: string }[] }; request_id: string; provenance: unknown };
      expect(envelope.data.posts[0].short_code).toBe(FIXTURE_IDS.carouselShortCode);
      expect(envelope.request_id).toMatch(/[0-9a-f-]{36}/);
      expect((result.content as { type: string; text?: string }[])[0].text).toMatch(/^1 post/);
      await client.close();
    });
  }

  it("returns tool errors as isError with the error envelope, never a protocol error", async () => {
    const client = await connect(http, "full");
    const bad = await client.callTool({ name: "curatit_get_post", arguments: { post_id: "NOPE12345" } });
    expect(bad.isError).toBe(true);
    expect((bad.structuredContent as { error: { code: string } }).error.code).toBe("NOT_FOUND");
    const invalid = await client.callTool({ name: "curatit_search_posts", arguments: { query: "x", filters: { themes: ["halloween"] } } });
    expect(invalid.isError).toBe(true);
    expect(JSON.stringify(invalid.structuredContent ?? invalid.content)).toMatch(/INVALID_ARGUMENT|unrecognized|Unrecognized/i);
    await client.close();
  });

  it("refuses a tool outside the credential's scope with FORBIDDEN", async () => {
    const client = await connect(http, "reader");
    const ok = await client.callTool({ name: "curatit_get_taxonomy", arguments: {} });
    expect(ok.isError).toBeFalsy();
    const brief = await client.callTool({ name: "curatit_create_brief", arguments: { objective: "x", audience: "y", reference_post_ids: [FIXTURE_IDS.carousel] } });
    expect(brief.isError).toBe(true);
    expect((brief.structuredContent as { error: { code: string; message: string } }).error).toMatchObject({ code: "FORBIDDEN", message: expect.stringMatching(/curatit:brief/) });
    await client.close();
  });

  it("delivers an image inline as an image content block", async () => {
    const t = testRuntime();
    const head = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x10, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0, 0, 0, 0, 0x9d, 0x01, 0x2a, 0x02, 0x00, 0x03, 0x00]);
    t.rt.media = {
      fetch: async (_input, init) =>
        new Headers(init?.headers).get("range")
          ? new Response(head, { status: 206, headers: { "content-type": "image/webp", "content-range": "bytes 0-29/400" } })
          : new Response(new Uint8Array(400), { status: 200, headers: { "content-type": "image/webp" } }),
    };
    const client = await connect(createMcpHttp(t.rt, t.verifier), "full");
    const result = await client.callTool({ name: "curatit_get_media", arguments: { media_id: `${FIXTURE_IDS.single}.0`, delivery: "inline" } });
    const content = result.content as { type: string; mimeType?: string; data?: string }[];
    expect(content[0]).toMatchObject({ type: "image", mimeType: "image/webp" });
    expect(Buffer.from(content[0].data!, "base64").byteLength).toBe(400);
    await client.close();
  });

  it("challenges a missing or bad token with 401 and the metadata URL", async () => {
    for (const headers of [{}, { Authorization: "Bearer nope" }]) {
      const res = await http.mcp(new Request(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...(headers as Record<string, string>) }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "x", version: "1" } } }) }));
      expect(res.status).toBe(401);
      const challenge = res.headers.get("WWW-Authenticate")!;
      expect(challenge).toMatch(/^Bearer /);
      expect(challenge).toContain('resource_metadata="https://curatit.test/.well-known/oauth-protected-resource/mcp"');
      expect(challenge).toContain('scope="curatit:read curatit:brief"');
    }
  });

  it("serves the protected resource metadata and answers GET on /mcp with 405", async () => {
    const meta = await http.protectedResourceMetadata(new Request("https://curatit.test/.well-known/oauth-protected-resource/mcp"));
    expect(meta.status).toBe(200);
    const doc = await meta.json();
    expect(doc).toMatchObject({ resource: url, scopes_supported: ["curatit:read", "curatit:brief"], bearer_methods_supported: ["header"] });
    expect(doc.authorization_servers).toBeUndefined();
    const get = await http.mcp(new Request(url, { headers: { Authorization: "Bearer full", accept: "text/event-stream" } }));
    expect(get.status).toBe(405);
  });

  it("advertises the authorization server's own scope once an issuer is configured", async () => {
    const t = testRuntime();
    resetConfigCache();
    t.rt.config = loadConfig({ NODE_ENV: "test", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk", SUPABASE_SECRET_KEY: "sk", CURATIT_PUBLIC_BASE_URL: "https://curatit.test", CURATIT_OAUTH_ISSUER: "https://x.supabase.co/auth/v1" } as NodeJS.ProcessEnv);
    const withIssuer = createMcpHttp(t.rt, t.verifier);
    const doc = await (await withIssuer.protectedResourceMetadata(new Request("https://curatit.test/.well-known/oauth-protected-resource/mcp"))).json();
    expect(doc.authorization_servers).toEqual(["https://x.supabase.co/auth/v1"]);
    expect(doc.scopes_supported).toEqual(["email"]);
    const res = await withIssuer.mcp(new Request(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: "{}" }));
    expect(res.headers.get("WWW-Authenticate")).toContain('scope="email"');
  });

  it("refuses a foreign Origin with 403 and allows the site's own or none", async () => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" });
    const make = (origin?: string) => new Request(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", Authorization: "Bearer full", ...(origin ? { Origin: origin } : {}) }, body });
    expect((await http.mcp(make("https://evil.example"))).status).toBe(403);
    expect((await http.mcp(make("https://curatit.test"))).status).toBe(200);
    expect((await http.mcp(make())).status).toBe(200);
  });

  it("rate limits per account and logs without credentials", async () => {
    const t = testRuntime();
    t.rt.throttle = new Throttle(createMemoryLimiter(), t.rt.log);
    const client = await connect(createMcpHttp(t.rt, t.verifier), "full");
    let limited = 0;
    for (let i = 0; i < 62; i++) {
      const r = await client.callTool({ name: "curatit_get_taxonomy", arguments: {} });
      if (r.isError && (r.structuredContent as { error: { code: string } }).error.code === "RATE_LIMITED") limited++;
    }
    expect(limited).toBe(2);
    expect(t.lines.join("\n")).not.toMatch(/Bearer full|"token"/);
    expect(t.lines.join("\n")).toMatch(/"event":"tool.error","request_id":"[^"]+","tool":"curatit_get_taxonomy","code":"RATE_LIMITED"/);
    await client.close();
  });

  it("writes a log line per call with a pseudonymous account", () => {
    expect(lines.some((l) => /"event":"tool.ok"/.test(l) && /"account":"[0-9a-f]{12}"/.test(l) && !/user-full/.test(l))).toBe(true);
  });
});
