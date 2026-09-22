import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { removeItem, updateItemNote } from "@/lib/services/boards";

type Params = { id: string; itemId: string };

/** PATCH — private note with expectedVersion. */
export const PATCH = api<Params>(async (request, { params }) => {
  const viewer = await requireApiViewer();
  return updateItemNote(viewer, params.id, params.itemId, await readJson(request));
});

/** DELETE — remove this save only. */
export const DELETE = api<Params>(async (_request, { params }) => {
  const viewer = await requireApiViewer();
  removeItem(viewer, params.id, params.itemId);
});
