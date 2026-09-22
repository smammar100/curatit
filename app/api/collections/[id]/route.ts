import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { deleteBoard, getBoard, updateBoard } from "@/lib/services/boards";

type Params = { id: string };

export const GET = api<Params>(async (_request, { params }) => {
  const viewer = await requireApiViewer();
  return { collection: getBoard(viewer, params.id) };
});

/** PATCH — name/description with expectedVersion; 409 on stale writes. */
export const PATCH = api<Params>(async (request, { params }) => {
  const viewer = await requireApiViewer();
  return updateBoard(viewer, params.id, await readJson(request));
});

/** DELETE — board, its item relations and notes; invalidates all share links. */
export const DELETE = api<Params>(async (_request, { params }) => {
  const viewer = await requireApiViewer();
  deleteBoard(viewer, params.id);
});
