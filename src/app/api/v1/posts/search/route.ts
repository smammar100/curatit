// POST /api/v1/posts/search, the REST face of curatit_search_posts
import { createRestHandler } from "@/lib/mcp/rest";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const POST = (request: Request) => createRestHandler(getRuntime(), "curatit_search_posts")(request);
