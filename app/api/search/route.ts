import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { rateLimit } from "@/lib/security";
import { searchCreatives } from "@/lib/services/creatives";
import { track } from "@/lib/services/events";

/** POST /api/search — shared retrieval for web and (later) MCP. */
export const POST = api(async (request, { requestId }) => {
  const viewer = await requireApiViewer();
  rateLimit(`search:${viewer.userId}`, 20);

  const result = searchCreatives((await readJson(request)) as never);
  track("search_completed", {
    viewer,
    requestId,
    properties: { results: result.total, degraded: result.degraded, hasQuery: result.mode !== "browse" },
  });
  return result;
});
