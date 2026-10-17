// The bridge end to end, in process: a local MCP client talks to the bridge's server over an
// in-memory transport; the bridge forwards to the hosted handler (fixture catalog) through a
// fetch that never touches the network. Also the credential rules and the argument parsing.

import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { describe, expect, it } from "vitest";
import { toAuthInfo, type Principal } from "@/lib/mcp/auth/principal";
import { loadConfig, resetConfigCache } from "@/lib/mcp/config";
import { createMcpHttp } from "@/lib/mcp/http";
import { createLogger } from "@/lib/mcp/log";
import { createMemoryLimiter, Throttle } from "@/lib/mcp/ratelimit";
import { createFixtureCatalog, FIXTURE_IDS } from "@/lib/mcp/repo/fixture";
import { connectRemote, createBridgeServer, sanitize } from "./bridge.js";
import { parseArgs } from "./cli.js";
import { loadToken } from "./credentials.js";

const principal: Principal = { subjectId: "u", organizationId: null, scopes: ["curatit:read", "curatit:brief"], credentialKind: "personal_access_token", entitlementVersion: "t", credentialId: "tok" };

function hostedHttp() {
  resetConfigCache();
  const config = loadConfig({ NODE_ENV: "test", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk", SUPABASE_SECRET_KEY: "sk", CURATIT_PUBLIC_BASE_URL: "https://curatit.test" } as NodeJS.ProcessEnv);
  const log = createLogger("error", {}, () => {});
  return createMcpHttp({ config, repo: createFixtureCatalog(), throttle: new Throttle(createMemoryLimiter(), log), log, media: {} }, {
    async verifyAccessToken(token) {
      if (token !== "curatit_pat_good") throw new (await import("@modelcontextprotocol/server")).OAuthError("invalid_token", "no");
      return toAuthInfo(token, principal, Math.floor(Date.now() / 1000) + 60, config.mcpUrl);
    },
  });
}

describe("bridge", () => {
  it("mirrors the remote tools and forwards calls, results and errors as they are", async () => {
    const http = hostedHttp();
    const seen: string[] = [];
    const remote = await connectRemote({
      serverUrl: new URL("https://curatit.test/mcp"),
      token: "curatit_pat_good",
      fetch: (input, init) => {
        seen.push(new Headers(init?.headers).get("authorization") ?? "");
        return http.mcp(new Request(input, init));
      },
    });
    expect(remote.tools.map((t) => t.name)).toContain("curatit_search_posts");
    const bridge = createBridgeServer(remote.client, remote.tools);
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await bridge.connect(serverSide);
    const local = new Client({ name: "local-host", version: "1" });
    await local.connect(clientSide);
    const { tools } = await local.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(remote.tools.map((t) => t.name).sort());
    expect(tools.find((t) => t.name === "curatit_get_post")?.annotations?.readOnlyHint).toBe(true);
    const ok = await local.callTool({ name: "curatit_get_post", arguments: { post_id: FIXTURE_IDS.carouselShortCode } });
    expect(ok.isError).toBeFalsy();
    expect((ok.structuredContent as { data: { post: { short_code: string } } }).data.post.short_code).toBe(FIXTURE_IDS.carouselShortCode);
    const bad = await local.callTool({ name: "curatit_get_post", arguments: { post_id: "NOPE12345" } });
    expect(bad.isError).toBe(true);
    expect((bad.structuredContent as { error: { code: string } }).error.code).toBe("NOT_FOUND");
    expect(seen.every((h) => h === "Bearer curatit_pat_good")).toBe(true);
    await local.close();
    await remote.client.close();
  });

  it("refuses to start without a valid token and never prints one", async () => {
    const http = hostedHttp();
    await expect(connectRemote({ serverUrl: new URL("https://curatit.test/mcp"), token: "curatit_pat_wrong_token_value", fetch: (i, init) => http.mcp(new Request(i, init)) })).rejects.toThrow();
    await expect(connectRemote({ serverUrl: new URL("http://curatit.test/mcp"), token: "x" })).rejects.toThrow(/https/);
    expect(() => loadToken({})).toThrow(/CURATIT_ACCESS_TOKEN/);
    expect(() => loadToken({ CURATIT_ACCESS_TOKEN: "no spaces allowed here!" })).toThrow(/doesn't look like a token/);
    expect(loadToken({ CURATIT_ACCESS_TOKEN: "curatit_pat_" + "a".repeat(43) })).toMatch(/^curatit_pat_/);
    expect(sanitize("Bearer curatit_pat_abc failed with curatit_pat_xyz")).toBe("Bearer [redacted] failed with [redacted]");
  });

  it("parses arguments and never takes a token from them", () => {
    expect(parseArgs([])).toMatchObject({ server: "https://www.curatit.app/mcp", timeoutMs: 60_000 });
    expect(parseArgs(["--server", "https://staging.example/mcp", "--timeout", "5000"])).toMatchObject({ server: "https://staging.example/mcp", timeoutMs: 5000 });
    expect(() => parseArgs(["--token", "x"])).toThrow(/Unknown option/);
  });
});
