// The REST adapter: /api/v1 routes that run the same tool registry as MCP. A route checks the
// bearer token with the same verifier, reads its input from the path, query or JSON body,
// executes the tool, and answers with the envelope at the matching HTTP status. For
// curatit_get_media with delivery=inline, the image bytes come back as the body instead.

import { bearerAuthChallengeResponse, getOAuthProtectedResourceMetadataUrl, OAuthError, OAuthErrorCode, verifyBearerToken } from "@modelcontextprotocol/server";
import type { ToolName } from "./contracts";
import { principalOf } from "./auth/principal";
import type { Verifier } from "./auth/verifier";
import { failure, newRequestId } from "./envelope";
import { CuratitError } from "./errors";
import { advertisedScopes, withChallengeScope } from "./http";
import { executeTool, type Runtime } from "./tools";

const MAX_BODY_BYTES = 64 * 1024;

// The inline image's metadata (the envelope's data) travels in a response header. Headers are
// byte strings, and alt text is scraped Instagram text with emoji and curly quotes in it, so
// the JSON is percent-encoded: decodeURIComponent(header) gives it back
export function mediaHeader(data: unknown) {
  return encodeURIComponent(JSON.stringify(data));
}

export type RestDeps = { runtime: Runtime; verifier: Verifier };

// Query strings carry strings; the contracts want numbers, booleans and arrays where the schema
// says so. Repeated keys and comma lists both make arrays.
export function queryToInput(url: URL): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const filters: Record<string, unknown> = {};
  for (const [key, value] of url.searchParams) {
    const target = key.startsWith("filters.") ? filters : out;
    const name = key.replace(/^filters\./, "");
    const coerced = /^-?\d+$/.test(value) ? Number(value) : value === "true" ? true : value === "false" ? false : value;
    const list = typeof coerced === "string" && coerced.includes(",") ? coerced.split(",").map((s) => s.trim()) : coerced;
    if (name in target) {
      const prev = target[name];
      target[name] = [...(Array.isArray(prev) ? prev : [prev]), ...(Array.isArray(list) ? list : [list])];
    } else {
      target[name] = list;
    }
  }
  if (Object.keys(filters).length) out.filters = filters;
  return out;
}

export function createRestHandler(deps: RestDeps, tool: ToolName, options: { pathParam?: string } = {}) {
  const { runtime, verifier } = deps;
  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(runtime.config.mcpUrl);

  return async (request: Request, context?: { params: Promise<Record<string, string>> }): Promise<Response> => {
    let principal;
    try {
      const auth = await verifyBearerToken(request.headers.get("authorization"), { verifier, resourceMetadataUrl, expectedResource: runtime.config.mcpUrl });
      principal = principalOf(auth);
    } catch (error) {
      const challenge = bearerAuthChallengeResponse(error instanceof OAuthError ? error : new OAuthError(OAuthErrorCode.InvalidToken, "A bearer token is required."), { resourceMetadataUrl });
      const body = failure(newRequestId(), new CuratitError(challenge.status === 403 ? "FORBIDDEN" : challenge.status === 401 ? "UNAUTHENTICATED" : "UPSTREAM_UNAVAILABLE", challenge.status === 401 ? "A valid bearer token is required. See the WWW-Authenticate header." : "The token can't be checked right now."));
      return withChallengeScope(Response.json(body, { status: challenge.status, headers: challenge.headers }), resourceMetadataUrl, advertisedScopes(runtime.config));
    }

    let input: Record<string, unknown>;
    try {
      input = request.method === "POST" ? await readJson(request) : queryToInput(new URL(request.url));
    } catch (error) {
      const err = error instanceof CuratitError ? error : new CuratitError("INVALID_ARGUMENT", "The body must be a JSON object.");
      return Response.json(failure(newRequestId(), err), { status: err.status });
    }
    if (options.pathParam && context) {
      const params = await context.params;
      input[options.pathParam] = decodeURIComponent(params[options.pathParam] ?? "");
    }

    const outcome = await executeTool(runtime, tool, input, principal, request.signal);
    const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Request-Id": outcome.envelope.request_id };
    if (outcome.envelope.error?.retry_after_seconds) headers["Retry-After"] = String(outcome.envelope.error.retry_after_seconds);
    if (outcome.image) {
      return new Response(outcome.image.bytes, { status: 200, headers: { ...headers, "Content-Type": outcome.image.mimeType, "X-Curatit-Media": mediaHeader(outcome.envelope.data) } });
    }
    return Response.json(outcome.envelope, { status: outcome.status, headers });
  };
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(type)) throw new CuratitError("INVALID_ARGUMENT", "Send a JSON body with Content-Type: application/json.");
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new CuratitError("INVALID_ARGUMENT", "The body is too large (64 KiB at most).");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new CuratitError("INVALID_ARGUMENT", "The body is too large (64 KiB at most).");
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new CuratitError("INVALID_ARGUMENT", "The body isn't valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new CuratitError("INVALID_ARGUMENT", "The body must be a JSON object.");
  return parsed as Record<string, unknown>;
}
