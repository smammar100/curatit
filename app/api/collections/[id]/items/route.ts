import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { parse, saveSchema, saveToBoards } from "@/lib/services/boards";

/** POST /api/collections/:id/items — save a post; idempotent. */
export const POST = api<{ id: string }>(async (request, { params }) => {
  const viewer = await requireApiViewer();
  const { postId } = parse(saveSchema, await readJson(request));
  const result = saveToBoards(viewer, postId, [params.id]);
  return { saved: true, alreadySaved: result.alreadySaved.length > 0 };
});
