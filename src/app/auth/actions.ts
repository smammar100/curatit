"use server";

// The auth flow's server actions (email and password; Google sign-in was taken out for now).
// Each runs with the per-request Supabase client, so the session cookies it sets travel back
// with the response. The links Supabase emails come back through /auth/callback, which
// exchanges the ?code= for a session (PKCE: it has to be the browser that started the flow).
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authMessage, safeNext } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/utils/supabase/server";

// What a form shows after an action: an error, the address an email went to, and the email
// typed (React clears a form after its action, so it comes back as the field's default)
export type AuthState = { error?: string; sent?: string; email?: string };

const supabase = async () => createClient(await cookies());
const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

// This site's origin, for the links in Supabase's emails and the OAuth redirect
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return h.get("origin") ?? (host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : SITE_URL);
}

const callback = async (next: string) => `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const { error } = await (await supabase()).auth.signInWithPassword({ email, password: String(form.get("password") ?? "") });
  if (error) return { error: authMessage(error.code), email };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const next = safeNext(form.get("next"));
  const { data, error } = await (await supabase()).auth.signUp({
    email,
    password: String(form.get("password") ?? ""),
    options: { emailRedirectTo: await callback(next) },
  });
  if (error) return { error: authMessage(error.code), email };
  // With email confirmation off there's a session already; otherwise the link finishes it.
  // An address that already has an account gets the same answer (Supabase doesn't say, so
  // nobody can find out who has an account by trying to sign up)
  if (data.session) redirect(next);
  return { sent: email };
}

export async function resendConfirmation(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const { error } = await (await supabase()).auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await callback(safeNext(form.get("next"))) },
  });
  return error ? { error: authMessage(error.code), sent: email } : { sent: email };
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const { error } = await (await supabase()).auth.resetPasswordForEmail(email, { redirectTo: await callback("/reset-password") });
  // Rate limits are worth saying; anything about the address itself isn't (same reason as sign-up)
  if (error && error.code?.startsWith("over_")) return { error: authMessage(error.code), email };
  return { sent: email };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const client = await supabase();
  const { data } = await client.auth.getUser();
  if (!data.user) return { error: authMessage("session_missing") };
  const { error } = await client.auth.updateUser({ password: String(form.get("password") ?? "") });
  if (error) return { error: authMessage(error.code) };
  redirect("/dashboard");
}

export async function signOut() {
  await (await supabase()).auth.signOut();
  redirect("/signin");
}
