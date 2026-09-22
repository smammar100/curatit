import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { reorderItems } from "@/lib/services/boards";

/** PUT — full ordered item-ID list plus the expected board version. */
export const PUT = api<{ id: string }>(async (request, { params }) => {
  const viewer = await requireApiViewer();
  return reorderItems(viewer, params.id, await readJson(request));
});
