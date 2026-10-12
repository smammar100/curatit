import { describe, expect, it } from "vitest";
import { hashToken, mintToken, parseScopes, PAT_PREFIX } from "./auth/pat";
import { looksLikeJwt } from "./auth/oauth";
import { loadConfig, resetConfigCache } from "./config";
import { TOOLS } from "./contracts";
import { decodeCursor, encodeCursor } from "./cursor";
import { CuratitError, toCuratitError } from "./errors";
import { createLogger, redact } from "./log";
import { buildOpenApi, REST_ROUTES } from "./openapi";
import { createMemoryLimiter, Throttle } from "./ratelimit";
import { queryToInput } from "./rest";

const base = { NODE_ENV: "test", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk", SUPABASE_SECRET_KEY: "sk" } as NodeJS.ProcessEnv;

describe("config", () => {
  it("fails fast in production on missing or insecure settings, names only", () => {
    resetConfigCache();
    expect(() => loadConfig({ ...base, NODE_ENV: "production" })).toThrow(/CURATIT_PUBLIC_BASE_URL/);
    expect(() => loadConfig({ ...base, NODE_ENV: "production", CURATIT_PUBLIC_BASE_URL: "http://curatit.test", CURATIT_MCP_SIGNING_SECRET: "x".repeat(40) })).toThrow(/https/);
    expect(() => loadConfig({ ...base, NODE_ENV: "production", CURATIT_PUBLIC_BASE_URL: "https://curatit.test" })).toThrow(/CURATIT_MCP_SIGNING_SECRET/);
    expect(() => loadConfig({ ...base, NODE_ENV: "production", CURATIT_PUBLIC_BASE_URL: "https://curatit.test", CURATIT_MCP_SIGNING_SECRET: "short" })).toThrow(/32 bytes/);
    const ok = loadConfig({ ...base, NODE_ENV: "production", CURATIT_PUBLIC_BASE_URL: "https://curatit.test", CURATIT_MCP_SIGNING_SECRET: "a".repeat(64), CURATIT_OAUTH_ISSUER: "https://x.supabase.co/auth/v1/", CURATIT_ALLOWED_ORIGINS: "https://app.curatit.test" });
    expect(ok.mcpUrl.href).toBe("https://curatit.test/mcp");
    expect(ok.oauthIssuer?.href).toBe("https://x.supabase.co/auth/v1");
    expect(ok.allowedOriginHostnames).toEqual(["curatit.test", "app.curatit.test"]);
    expect(ok.signingSecret.byteLength).toBe(32);
  });

  it("defaults for development and never exposes values", () => {
    resetConfigCache();
    const dev = loadConfig(base);
    expect(dev.publicBaseUrl.href).toBe("http://localhost:3000/");
    expect(dev.allowedOriginHostnames).toContain("localhost");
    // The config carries the keys its clients need; the logger is what must never show them
    expect(redact({ config: dev }) as { config: { supabaseSecretKey: string } }).toBeTruthy();
    expect(JSON.stringify(redact({ supabaseSecretKey: dev.supabaseSecretKey, authorization: "Bearer sk" }))).not.toContain('"sk"');
  });
});

describe("cursor", () => {
  const secret = new Uint8Array(32).fill(1);
  it("round-trips and refuses tampering, other searches and other principals", async () => {
    const cursor = await encodeCursor(secret, { offset: 8, search: "s1", principal: "p1" });
    expect(await decodeCursor(secret, cursor, { search: "s1", principal: "p1" })).toBe(8);
    await expect(decodeCursor(secret, cursor, { search: "s2", principal: "p1" })).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(decodeCursor(secret, cursor, { search: "s1", principal: "p2" })).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(decodeCursor(new Uint8Array(32).fill(2), cursor, { search: "s1", principal: "p1" })).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    const [body] = cursor.split(".");
    await expect(decodeCursor(secret, `${body}.AAAA`, { search: "s1", principal: "p1" })).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(decodeCursor(secret, "garbage", { search: "s1", principal: "p1" })).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
  });
});

describe("errors", () => {
  it("maps database and transport failures to safe codes", () => {
    expect(toCuratitError({ code: "22023", message: "Unknown layout" })).toMatchObject({ code: "INVALID_ARGUMENT", message: "Unknown layout" });
    expect(toCuratitError({ code: "57014", message: "canceling statement" }).code).toBe("TIMEOUT");
    expect(toCuratitError(new Error("fetch failed")).code).toBe("UPSTREAM_UNAVAILABLE");
    const internal = toCuratitError(new Error("relation secret_table does not exist at host db.internal"));
    expect(internal.code).toBe("INTERNAL_ERROR");
    expect(internal.message).not.toMatch(/secret_table|db.internal/);
    expect(new CuratitError("RATE_LIMITED", "x", { retryAfterSeconds: 3 })).toMatchObject({ status: 429, retryable: true });
  });
});

describe("log", () => {
  it("redacts tokens, bearer headers, JWTs and signed URLs wherever they appear", () => {
    const out = redact({
      authorization: "Bearer abc",
      note: `token ${PAT_PREFIX}abcdefghijklmnop and Bearer xyz.123 and eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJlLXNpZ25hdHVyZQ and https://s/x?token=abc&y=1`,
      nested: [{ signature: "s" }, "curatit_pat_zzz"],
    }) as Record<string, unknown>;
    expect(out.authorization).toBe("[redacted]");
    expect(out.note).not.toMatch(/abcdefghijklmnop|xyz\.123|eyJ|token=abc/);
    expect(out.note).toMatch(/token=\[redacted\]&y=1/);
    expect(JSON.stringify(out.nested)).toBe('[{"signature":"[redacted]"},"[redacted]"]');
  });

  it("respects the level and writes JSON", () => {
    const lines: string[] = [];
    const log = createLogger("warn", { service: "t" }, (l) => lines.push(l));
    log.info("x");
    log.warn("y", { a: 1 });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ level: "warn", event: "y", a: 1, service: "t" });
  });
});

describe("personal access tokens", () => {
  it("mints a prefixed secret whose hash is stored and whose scopes are checked", async () => {
    const t = await mintToken();
    expect(t.secret).toMatch(/^curatit_pat_[A-Za-z0-9_-]{43}$/);
    expect(t.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(t.hash).toBe(await hashToken(t.secret));
    expect(t.prefix).toBe(t.secret.slice(0, 20));
    expect(parseScopes(["curatit:read", "curatit:read", "bogus"])).toEqual(["curatit:read"]);
    expect(() => parseScopes(["bogus"])).toThrow(/at least one scope/);
    expect(looksLikeJwt(t.secret)).toBe(false);
  });
});

describe("rate limiter", () => {
  it("counts per window and caps concurrency", async () => {
    let now = 0;
    const limiter = createMemoryLimiter(() => now);
    const lines: string[] = [];
    const throttle = new Throttle(limiter, createLogger("debug", {}, (l) => lines.push(l)), 2);
    const releases = [await throttle.acquire("a", "brief"), await throttle.acquire("a", "brief")];
    await expect(throttle.acquire("a", "brief")).rejects.toMatchObject({ code: "RATE_LIMITED", message: expect.stringMatching(/at once/) });
    releases.forEach((r) => r());
    for (let i = 0; i < 8; i++) (await throttle.acquire("a", "brief"))();
    await expect(throttle.acquire("a", "brief")).rejects.toMatchObject({ code: "RATE_LIMITED", retryAfterSeconds: 60 });
    (await throttle.acquire("b", "brief"))();
    now = 61_000;
    (await throttle.acquire("a", "brief"))();
  });

  it("fails open for reads and closed for briefs when the store is down", async () => {
    const broken = { hit: async () => { throw new Error("db down"); } };
    const throttle = new Throttle(broken, createLogger("error", {}, () => {}));
    (await throttle.acquire("a", "read"))();
    await expect(throttle.acquire("a", "brief")).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
  });
});

describe("REST adapter", () => {
  it("turns query strings into typed inputs", () => {
    const input = queryToInput(new URL("https://x/api/v1/posts/search?query=cash&limit=3&filters.layouts=framed-card,list-stack&filters.analysed_only=true&filters.goals=education&filters.goals=awareness"));
    expect(input).toEqual({ query: "cash", limit: 3, filters: { layouts: ["framed-card", "list-stack"], analysed_only: true, goals: ["education", "awareness"] } });
  });

  it("generates an OpenAPI document for every tool from the shared contracts", () => {
    resetConfigCache();
    const doc = buildOpenApi(loadConfig(base));
    expect(doc.openapi).toBe("3.1.0");
    for (const name of Object.keys(TOOLS) as (keyof typeof TOOLS)[]) {
      const route = REST_ROUTES[name];
      const op = (doc.paths[route.path] as Record<string, { "x-mcp-tool": string; security: unknown }>)[route.method.toLowerCase()];
      expect(op["x-mcp-tool"]).toBe(name);
      expect(op.security).toEqual([{ bearerAuth: [TOOLS[name].scope] }]);
    }
    const post = doc.paths["/api/v1/posts/{post_id}"] as { get: { parameters: { name: string; in: string; required: boolean }[] } };
    expect(post.get.parameters.find((p) => p.name === "post_id")).toMatchObject({ in: "path", required: true });
    expect(post.get.parameters.find((p) => p.name === "detail_level")).toMatchObject({ in: "query", required: false });
    expect(JSON.stringify(doc)).not.toMatch(/anyOf|oneOf/);
  });
});
