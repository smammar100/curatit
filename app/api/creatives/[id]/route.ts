import { api } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { getCreative } from "@/lib/services/creatives";

/** GET /api/creatives/:id — published post, ordered slides, analysis, source. */
export const GET = api<{ id: string }>(async (_request, { params }) => {
  await requireApiViewer();
  return { creative: getCreative(params.id) };
});
