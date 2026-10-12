// The HTTP face of the MCP server, as web-standard handlers the Next route files export:
// /mcp (Origin check, bearer gate, then the SDK's stateless Streamable HTTP handler for both
// the 2025 and 2026-07-28 protocol eras) and the RFC 9728 Protected Resource Metadata at
// /.well-known/oauth-protected-resource[/mcp]. Auth happens here, at the HTTP boundary; the
// SDK entry trusts the AuthInfo it's handed and never reads headers itself.

import { createMcpHandler, getOAuthProtectedResourceMetadataUrl, originValidationResponse, requireBearerAuth, type McpHttpHandler } from "@modelcontextprotocol/server";
import { SCOPES, SERVER_INFO } from "./config";
import type { Verifier } from "./auth/verifier";
import { createCuratitServer } from "./server";
import type { Runtime } from "./tools";

export type McpHttp = {
  mcp: (request: Request) => Promise<Response>;
  protectedResourceMetadata: (request: Request) => Response;
  // The document itself, for tests and docs
  metadataDocument: () => Record<string, unknown>;
};

export function createMcpHttp(rt: Runtime, verifier: Verifier): McpHttp {
  const { config } = rt;
  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(config.mcpUrl);
  const gate = requireBearerAuth({ verifier, resourceMetadataUrl, expectedResource: config.mcpUrl });
  let handler: McpHttpHandler | null = null;
  const entry = () => (handler ??= createMcpHandler(() => createCuratitServer(rt), { legacy: "stateless", onerror: (error) => rt.log.warn("mcp.transport", { error: error.message }) }));

  const metadataDocument = () => ({
    resource: config.mcpUrl.href,
    ...(config.oauthIssuer ? { authorization_servers: [config.oauthIssuer.href] } : {}),
    scopes_supported: [...SCOPES],
    bearer_methods_supported: ["header"],
    resource_name: "Curatit",
    resource_documentation: new URL("/docs/mcp", config.publicBaseUrl).href,
  });

  const cors = (origin: string | null) => ({
    "Access-Control-Allow-Origin": origin && config.allowedOriginHostnames.includes(safeHostname(origin)) ? origin : config.publicBaseUrl.origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id",
    "Access-Control-Expose-Headers": "WWW-Authenticate, MCP-Protocol-Version",
    Vary: "Origin",
  });

  return {
    metadataDocument,

    protectedResourceMetadata(request) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
      if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET, OPTIONS" } });
      return Response.json(metadataDocument(), { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } });
    },

    async mcp(request) {
      // A present but foreign Origin is refused (403); server-side clients send none
      const rejected = originValidationResponse(request, config.allowedOriginHostnames);
      if (rejected) return rejected;
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request.headers.get("origin")) });

      const auth = await gate(request);
      if (auth instanceof Response) return withChallengeScope(auth, resourceMetadataUrl);

      const response = await entry().fetch(request, { authInfo: auth });
      const headers = new Headers(response.headers);
      headers.set("X-Curatit-Server", `${SERVER_INFO.name}/${SERVER_INFO.version}`);
      for (const [k, v] of Object.entries(cors(request.headers.get("origin")))) headers.set(k, v);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
  };
}

function safeHostname(origin: string) {
  try {
    return new URL(origin).hostname;
  } catch {
    return "";
  }
}

// The SDK's challenge names the metadata URL; the spec also asks for the scopes the server
// understands, so a client knows what to request
function withChallengeScope(response: Response, resourceMetadataUrl: string) {
  if (response.status !== 401) return response;
  const headers = new Headers(response.headers);
  const existing = headers.get("WWW-Authenticate") ?? `Bearer resource_metadata="${resourceMetadataUrl}"`;
  if (!/\bscope=/.test(existing)) headers.set("WWW-Authenticate", `${existing}, scope="${SCOPES.join(" ")}"`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
