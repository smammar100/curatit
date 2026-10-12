// GET /api/v1/taxonomy, the REST face of curatit_get_taxonomy
import { createRestHandler } from "@/lib/mcp/rest";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const GET = (request: Request) => createRestHandler(getRuntime(), "curatit_get_taxonomy")(request);
