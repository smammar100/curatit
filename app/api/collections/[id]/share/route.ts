import { api, readJson } from "@/lib/api";
import { requireApiViewer } from "@/lib/auth";
import { rateLimit } from "@/lib/security";
import { createShare, revokeShare } from "@/lib/services/boards";

type Params = { id: string };

/** POST — create/rotate the read-only link. The URL is returned once. */
export const POST = api<Params>(async (request, { params }) => {
  const viewer = await requireApiViewer();
  rateLimit(`share:${viewer.userId}`, 10);
  const { token, expiresAt } = createShare(viewer, params.id, await readJson(request));
  return { shareUrl: `${new URL(request.url).origin}/s/${token}`, expiresAt };
});

/** DELETE — revoke the active link. */
export const DELETE = api<Params>(async (_request, { params }) => {
  const viewer = await requireApiViewer();
  return revokeShare(viewer, params.id);
});
