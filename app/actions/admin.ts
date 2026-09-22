"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { applyAction, type AdminAction } from "@/lib/services/admin";

const actions: AdminAction[] = ["shortlist", "reject", "publish", "remove", "restore"];
const views = ["review", "published", "rejected", "removed"];

export async function curateAction(form: FormData) {
  const viewer = await requireViewer("/admin");
  const action = String(form.get("action")) as AdminAction;
  const postId = String(form.get("postId") ?? "");
  const requestedView = String(form.get("view") ?? "review");
  const view = views.includes(requestedView) ? requestedView : "review";
  if (!actions.includes(action)) return;

  let result: string;
  try {
    applyAction(viewer, postId, action, String(form.get("reason") ?? ""));
    result = `ok:${action}`;
  } catch (error) {
    result = `error:${error instanceof AppError ? error.message : "Action failed."}`;
  }

  revalidatePath("/admin");
  redirect(`/admin?view=${view}&result=${encodeURIComponent(result)}`);
}
