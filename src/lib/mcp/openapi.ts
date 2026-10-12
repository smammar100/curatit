// The OpenAPI 3.1 document for /api/v1, generated from the same zod contracts the MCP tools
// use, so the two surfaces can't drift. Served at /api/v1/openapi.json.

import { z } from "zod";
import { SCOPES, SERVER_INFO, type McpConfig } from "./config";
import { ErrorBodySchema, ProvenanceSchema, SCHEMA_VERSION, TOOLS, type ToolName } from "./contracts";
import { TOOL_META } from "./tools";

export const REST_ROUTES: Record<ToolName, { method: "GET" | "POST"; path: string; operationId: string; pathParam?: string }> = {
  curatit_get_taxonomy: { method: "GET", path: "/api/v1/taxonomy", operationId: "getTaxonomy" },
  curatit_search_posts: { method: "POST", path: "/api/v1/posts/search", operationId: "searchPosts" },
  curatit_get_post: { method: "GET", path: "/api/v1/posts/{post_id}", operationId: "getPost", pathParam: "post_id" },
  curatit_get_carousel: { method: "GET", path: "/api/v1/posts/{post_id}/carousel", operationId: "getCarousel", pathParam: "post_id" },
  curatit_get_media: { method: "GET", path: "/api/v1/media/{media_id}", operationId: "getMedia", pathParam: "media_id" },
  curatit_create_brief: { method: "POST", path: "/api/v1/briefs", operationId: "createBrief" },
};

const json = (schema: z.ZodType) => z.toJSONSchema(schema, { target: "openapi-3.0", unrepresentable: "any" }) as Record<string, unknown>;

// Query parameters for GET routes come from the input schema's top-level fields
function queryParameters(input: z.ZodObject, pathParam?: string) {
  const shape = json(input) as { properties?: Record<string, Record<string, unknown>>; required?: string[] };
  return Object.entries(shape.properties ?? {}).map(([name, schema]) => ({
    name,
    in: name === pathParam ? "path" : "query",
    required: name === pathParam || (shape.required ?? []).includes(name),
    description: schema.description,
    schema: Object.fromEntries(Object.entries(schema).filter(([k]) => k !== "description")),
  }));
}

export function buildOpenApi(config: McpConfig) {
  const envelope = (data: z.ZodType) => ({
    type: "object",
    required: ["schema_version", "request_id", "warnings"],
    properties: {
      schema_version: { type: "string", const: SCHEMA_VERSION },
      request_id: { type: "string" },
      data: json(data),
      error: json(ErrorBodySchema),
      warnings: { type: "array", items: { type: "string" } },
      provenance: json(ProvenanceSchema),
    },
  });
  const errorResponse = (description: string) => ({ description, content: { "application/json": { schema: envelope(z.object({})) } } });

  const paths: Record<string, Record<string, unknown>> = {};
  for (const name of Object.keys(TOOLS) as ToolName[]) {
    const tool = TOOLS[name];
    const route = REST_ROUTES[name];
    const meta = TOOL_META[name];
    const operation: Record<string, unknown> = {
      operationId: route.operationId,
      summary: meta.title,
      description: meta.description,
      "x-mcp-tool": name,
      security: [{ bearerAuth: [tool.scope] }],
      responses: {
        "200": { description: "The result envelope.", content: { "application/json": { schema: envelope(tool.output) } } },
        "400": errorResponse("INVALID_ARGUMENT"),
        "401": errorResponse("UNAUTHENTICATED: missing or invalid token (see WWW-Authenticate)."),
        "403": errorResponse("FORBIDDEN: the token lacks the scope."),
        "404": errorResponse("NOT_FOUND"),
        "429": errorResponse("RATE_LIMITED or QUOTA_EXCEEDED (see Retry-After)."),
        "503": errorResponse("UPSTREAM_UNAVAILABLE"),
      },
    };
    if (route.method === "POST") {
      operation.requestBody = { required: true, content: { "application/json": { schema: json(tool.input) } } };
    } else {
      operation.parameters = queryParameters(tool.input as z.ZodObject, route.pathParam);
    }
    paths[route.path] = { [route.method.toLowerCase()]: operation };
  }
  paths["/api/v1/health/live"] = { get: { operationId: "healthLive", summary: "Liveness", security: [], responses: { "200": { description: "The process is up." } } } };
  paths["/api/v1/health/ready"] = { get: { operationId: "healthReady", summary: "Readiness", security: [], responses: { "200": { description: "Dependencies answer." }, "503": { description: "A dependency doesn't." } } } };

  return {
    openapi: "3.1.0",
    info: {
      title: "Curatit research API",
      version: SERVER_INFO.version,
      description: "Read-only access to Curatit's curated library of real Instagram posts and editor-approved creative analyses. The same operations are available over MCP at /mcp.",
    },
    servers: [{ url: config.publicBaseUrl.origin }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: `A Curatit personal access token (curatit_pat_…) or, where enabled, an OAuth access token. Scopes: ${SCOPES.join(", ")}.`,
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths,
  };
}
