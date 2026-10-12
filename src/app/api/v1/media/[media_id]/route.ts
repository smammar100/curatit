// GET /api/v1/media/:media_id, the REST face of curatit_get_media (delivery=inline answers with
// the image bytes and the metadata in X-Curatit-Media)
import { createRestHandler } from "@/lib/mcp/rest";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const GET = (request: Request, context: { params: Promise<{ media_id: string }> }) =>
  createRestHandler(getRuntime(), "curatit_get_media", { pathParam: "media_id" })(request, context);
