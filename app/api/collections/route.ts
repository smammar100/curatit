import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { createBoard, listBoards } from "@/lib/services/boards";

/** GET /api/collections — the viewer's own boards. */
export const GET = api(async () => {
  const viewer = await requireApiViewer();
  return { collections: listBoards(viewer) };
});

/** POST /api/collections — name, optional description and post IDs. */
export const POST = api(async (request) => {
  const viewer = await requireApiViewer();
  return createBoard(viewer, await readJson(request));
});
