// GET /api/v1/posts/:post_id, the REST face of curatit_get_post
import { createRestHandler } from "@/lib/mcp/rest";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const GET = (request: Request, context: { params: Promise<{ post_id: string }> }) =>
  createRestHandler(getRuntime(), "curatit_get_post", { pathParam: "post_id" })(request, context);
