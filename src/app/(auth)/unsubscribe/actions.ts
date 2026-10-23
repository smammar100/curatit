"use server";

import { NOTE_MAX, readUnsubscribeToken, saveUnsubscribe, UNSUBSCRIBE_REASONS, type UnsubscribeReason } from "@/lib/unsubscribe";

export type UnsubscribeState = { done?: boolean; error?: string };

// The /unsubscribe form: checks the link's signature again (the hidden token could be edited),
// then stores the address with the reason, if one was picked. The reason is optional: nobody
// has to explain themselves to stop getting email.
export async function unsubscribe(_: UnsubscribeState, form: FormData): Promise<UnsubscribeState> {
  const email = readUnsubscribeToken(String(form.get("t") ?? ""));
  if (!email) return { error: "This link isn't complete. Open Unsubscribe from the email again." };
  const picked = String(form.get("reason") ?? "");
  const reason = picked in UNSUBSCRIBE_REASONS ? (picked as UnsubscribeReason) : null;
  const note = String(form.get("note") ?? "").slice(0, NOTE_MAX);
  const saved = await saveUnsubscribe({ email, reason, note, source: String(form.get("s") ?? "") || null });
  return saved ? { done: true } : { error: "That didn't go through. Try again in a moment." };
}
