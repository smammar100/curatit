"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { BREAKDOWNS_TAG } from "@/lib/creative/display";
import { createClient } from "@/utils/supabase/server";

// After an editor publishes, unpublishes or edits an analysis, rebuild the post's page so its
// Creative breakdown shows the change now rather than at the dashboard's hourly revalidation:
// the cached analyses expire first (the next read waits for fresh data), then the page. Only for
// editors (the profile's role, read through the editor's own session); anyone else changes nothing.
export async function refreshPostPage(shortCode: string) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(shortCode)) return;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle();
  if (profile?.role !== "editor" && profile?.role !== "admin") return;
  updateTag(BREAKDOWNS_TAG);
  revalidatePath(`/dashboard/p/${shortCode}`);
}
