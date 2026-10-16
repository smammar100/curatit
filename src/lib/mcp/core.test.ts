import { describe, expect, it } from "vitest";
import { hashToken, mintToken, parseScopes, PAT_PREFIX } from "./auth/pat";
import { isTokenProblem, looksLikeJwt } from "./auth/oauth";
import { loadConfig, resetConfigCache } from "./config";
import { TOOLS } from "./contracts";
import { decodeCursor, encodeCursor } from "./cursor";
import { runWithDeadline } from "./deadline";
import { CuratitError, toCuratitError } from "./errors";
import { createLogger, redact } from "./log";
import { buildOpenApi, REST_ROUTES } from "./openapi";
import { createMemoryLimiter, Throttle } from "./ratelimit";
import { mediaHeader, queryToInput } from "./rest";

describe("deadline", () => {
  it("stops a call that outlives its budget, or whose caller hung up, with TIMEOUT", async () => {
    const never = () => new Promise<never>(() => {});
    await expect(runWithDeadline(20, null, never)).rejects.toMatchObject({ code: "TIMEOUT", status: 504, message: expect.stringMatching(/longer than/) });
    const gone = AbortSignal.abort();
    await expect(runWithDeadline(10_000, gone, never)).rejects.toMatchObject({ code: "TIMEOUT", message: expect.stringMatching(/cancelled/) });
    await expect(runWithDeadline(10_000, null, async () => 7)).resolves.toBe(7);
  });
});

describe("OAuth outages", () => {
  it("tells a bad token from a sign-in service that didn't answer", () => {
    const named = (name: string, message = "") => Object.assign(new Error(message), { name });
    expect(isTokenProblem(named("JWTExpired"))).toBe(true);
    expect(isTokenProblem(named("JWSSignatureVerificationFailed"))).toBe(true);
    expect(isTokenProblem(named("JWKSNoMatchingKey", "no applicable key found in the JSON Web Key Set"))).toBe(true);
    expect(isTokenProblem(named("JWKSTimeout"))).toBe(false);
    expect(isTokenProblem(named("JWKSInvalid"))).toBe(false);
    expect(isTokenProblem(new TypeError("fetch failed"))).toBe(false);
  });
});

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
    expect(await decodeCursor(secret, cursor, { search: "s1", principal: "p1" })).toEqual({ offset: 8, marker: null });
    // The catalog marker rides along when the first page had one
    const marked = await encodeCursor(secret, { offset: 8, search: "s1", principal: "p1", marker: "abc123" });
    expect(await decodeCursor(secret, marked, { search: "s1", principal: "p1" })).toEqual({ offset: 8, marker: "abc123" });
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
  it("carries inline media metadata in a header that survives any alt text", () => {
    const header = mediaHeader({ alt_text: "Café ☕ “quotes” — dash", width: 3 });
    // Headers are byte strings: nothing above U+00FF may remain
    expect(() => new Response("x", { headers: { "X-Curatit-Media": header } })).not.toThrow();
    expect(JSON.parse(decodeURIComponent(header))).toEqual({ alt_text: "Café ☕ “quotes” — dash", width: 3 });
  });

  it("turns query strings into typed inputs", () => {
    const input = queryToInput(new URL("https://x/api/v1/posts/search?query=cash&limit=3&filters.layouts=framed-card,list-stack&filters.analysed_only=true&filters.goals=education&filters.goals=awareness"));
    expect(input).toEqual({ query: "cash", limit: 3, filters: { layouts: ["framed-card", "list-stack"], analysed_only: true, goals: ["education", "awareness"] } });
  });

  it("generates an OpenAPI document for every tool from the shared contracts", () => {
    resetConfigCache();
    const doc = buildOpenApi(loadConfig(base));
    // 3.0.3, because the schemas are emitted with `nullable: true`, which 3.1 doesn't have
    expect(doc.openapi).toBe("3.0.3");
    const media = doc.paths["/api/v1/media/{media_id}"] as { get: { responses: Record<string, { content?: Record<string, unknown>; headers?: Record<string, unknown> }> } };
    expect(Object.keys(media.get.responses["200"].content ?? {})).toEqual(expect.arrayContaining(["application/json", "image/webp"]));
    expect(media.get.responses["200"].headers).toHaveProperty("X-Curatit-Media");
    expect(Object.keys(media.get.responses)).toEqual(expect.arrayContaining(["500", "504"]));
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
