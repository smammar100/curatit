// POST /api/v1/briefs, the REST face of curatit_create_brief
import { createRestHandler } from "@/lib/mcp/rest";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const POST = (request: Request) => createRestHandler(getRuntime(), "curatit_create_brief")(request);
