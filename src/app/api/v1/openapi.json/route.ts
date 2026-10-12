// GET /api/v1/openapi.json, generated from the shared contracts (no auth: it describes the API)
import { buildOpenApi } from "@/lib/mcp/openapi";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const GET = () => Response.json(buildOpenApi(getRuntime().runtime.config), { headers: { "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*" } });
