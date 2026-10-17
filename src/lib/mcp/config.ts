// The MCP server's configuration, read once from the environment and checked up front, so a
// missing setting fails at the first request with a clear message instead of a confusing one
// deep in a tool. Names only are ever logged; values never are.
//
// Required in production:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  the catalog (reads, under RLS)
//   SUPABASE_SECRET_KEY            token verification and rate limits (service_role; never
//                                  reaches a browser or the bridge)
//   CURATIT_PUBLIC_BASE_URL        this deployment's canonical origin, e.g. https://www.curatit.app
//   CURATIT_MCP_SIGNING_SECRET     signs search cursors (32+ random bytes, base64 or hex)
// Optional:
//   CURATIT_OAUTH_ISSUER           Supabase Auth's issuer, https://<ref>.supabase.co/auth/v1, once
//                                  the project's OAuth 2.1 server is on; unset keeps OAuth off and
//                                  leaves personal access tokens as the only credential
//   CURATIT_ALLOWED_ORIGINS        extra browser origins (comma-separated) allowed to call /mcp
//   CURATIT_LOG_LEVEL              debug | info | warn | error (default info)

import { SITE_URL } from "@/lib/site";

export type McpConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseSecretKey: string;
  publicBaseUrl: URL;
  mcpUrl: URL;
  signingSecret: Uint8Array<ArrayBuffer>;
  oauthIssuer: URL | null;
  allowedOriginHostnames: string[];
  logLevel: "debug" | "info" | "warn" | "error";
  production: boolean;
};

export const MCP_PATH = "/mcp";
export const PROTECTED_RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";
export const SCOPES = ["curatit:read", "curatit:brief"] as const;
export type Scope = (typeof SCOPES)[number];
export const SERVER_INFO = { name: "curatit", version: "1.0.0" } as const;

let cached: McpConfig | null = null;

function required(env: NodeJS.ProcessEnv, name: string, production: boolean, fallback?: string) {
  const value = env[name]?.trim();
  if (value) return value;
  if (!production && fallback !== undefined) return fallback;
  throw new Error(`Missing ${name}. Set it in the deployment's environment (see docs/mcp/operations.md).`);
}

function decodeSecret(value: string): Uint8Array<ArrayBuffer> {
  const bytes = /^[0-9a-f]{64,}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (bytes.length >= 32) return new Uint8Array(bytes);
  // A plain passphrase: use its bytes, but insist on real length
  const raw = Buffer.from(value, "utf8");
  if (raw.length < 32) throw new Error("CURATIT_MCP_SIGNING_SECRET must be at least 32 bytes (hex, base64 or a long passphrase).");
  return new Uint8Array(raw);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  if (cached && env === process.env) return cached;
  const production = env.NODE_ENV === "production";
  const supabaseUrl = required(env, "NEXT_PUBLIC_SUPABASE_URL", production);
  const supabasePublishableKey = required(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", production);
  const supabaseSecretKey = required(env, "SUPABASE_SECRET_KEY", production);
  const baseUrl = required(env, "CURATIT_PUBLIC_BASE_URL", production, "http://localhost:3000");
  let publicBaseUrl: URL;
  try {
    publicBaseUrl = new URL(baseUrl);
  } catch {
    throw new Error("CURATIT_PUBLIC_BASE_URL must be an absolute URL such as https://www.curatit.app");
  }
  if (production && publicBaseUrl.protocol !== "https:") throw new Error("CURATIT_PUBLIC_BASE_URL must use https in production.");
  if (publicBaseUrl.pathname !== "/") throw new Error("CURATIT_PUBLIC_BASE_URL must be an origin with no path.");

  // Outside production a missing signing secret gets a random one for the process: cursors then
  // last until the next restart, which is fine for development and makes tests self-contained
  const secretValue = env.CURATIT_MCP_SIGNING_SECRET?.trim();
  if (production && !secretValue) throw new Error("Missing CURATIT_MCP_SIGNING_SECRET (32+ random bytes).");
  const signingSecret = secretValue ? decodeSecret(secretValue) : crypto.getRandomValues(new Uint8Array(32));

  let oauthIssuer: URL | null = null;
  const issuer = env.CURATIT_OAUTH_ISSUER?.trim();
  if (issuer) {
    oauthIssuer = new URL(issuer.replace(/\/$/, ""));
    if (oauthIssuer.protocol !== "https:") throw new Error("CURATIT_OAUTH_ISSUER must use https.");
  }

  const extraOrigins = (env.CURATIT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new URL(s).hostname);
  const allowedOriginHostnames = [...new Set([publicBaseUrl.hostname, ...extraOrigins, ...(production ? [] : ["localhost", "127.0.0.1"])])];

  const level = env.CURATIT_LOG_LEVEL?.trim();
  const logLevel = level === "debug" || level === "warn" || level === "error" ? level : "info";

  const config: McpConfig = {
    supabaseUrl,
    supabasePublishableKey,
    supabaseSecretKey,
    publicBaseUrl,
    mcpUrl: new URL(MCP_PATH, publicBaseUrl),
    signingSecret,
    oauthIssuer,
    allowedOriginHostnames,
    logLevel,
    production,
  };
  if (env === process.env) cached = config;
  return config;
}

// For tests
export function resetConfigCache() {
  cached = null;
}

// The site a visitor reads about tokens on: the base URL, or the production site for a local run
export const docsUrl = (config: McpConfig) => new URL("/docs/mcp", config.publicBaseUrl.href === "http://localhost:3000/" ? SITE_URL : config.publicBaseUrl);
