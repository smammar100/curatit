import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { boardsForPost, saveToBoards } from "@/lib/services/boards";
import { z } from "zod";
import { invalidInput } from "@/lib/errors";

/** GET — the viewer's boards, marking those that already hold this post. */
export const GET = api<{ id: string }>(async (_request, { params }) => {
  const viewer = await requireApiViewer();
  return { boards: boardsForPost(viewer, params.id) };
});

const bodySchema = z.object({ boardIds: z.array(z.string()).min(1).max(20) });

/** POST — save to several boards at once; all-or-nothing, idempotent. */
export const POST = api<{ id: string }>(async (request, { params }) => {
  const viewer = await requireApiViewer();
  const body = bodySchema.safeParse(await readJson(request));
  if (!body.success) throw invalidInput("Choose at least one board.");
  return saveToBoards(viewer, params.id, body.data.boardIds);
});
