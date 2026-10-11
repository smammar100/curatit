"use server";

// The auth flow's server actions (email and password; Google sign-in was taken out for now).
// Each runs with the per-request Supabase client, so the session cookies it sets travel back
// with the response. The links Supabase emails come back through /auth/callback, which
// exchanges the ?code= for a session (PKCE: it has to be the browser that started the flow).
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthWeakPasswordError, type AuthError } from "@supabase/supabase-js";
import { authMessage, emailProblem, passwordProblem, safeNext } from "@/lib/auth";
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

// Supabase turns a password down with one code (weak_password) whether it's too short, misses a
// required kind of character or has turned up in a breach; its reasons say which, and the
// password itself says exactly what's missing
function errorFor(error: AuthError, password: string) {
  if (!isAuthWeakPasswordError(error)) return authMessage(error.code);
  if (error.reasons.includes("pwned")) return authMessage("pwned_password");
  return passwordProblem(password) ?? authMessage("weak_password");
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const password = String(form.get("password") ?? "");
  // The form checks these first; this covers a submit without JavaScript
  const problem = emailProblem(email) ?? (password ? null : "Enter your password.");
  if (problem) return { error: problem, email };
  const { error } = await (await supabase()).auth.signInWithPassword({ email, password });
  if (error) return { error: authMessage(error.code), email };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));
  // The form checks these first; this covers a submit without JavaScript
  const problem = emailProblem(email) ?? passwordProblem(password);
  if (problem) return { error: problem, email };
  const { data, error } = await (await supabase()).auth.signUp({
    email,
    password,
    options: { emailRedirectTo: await callback(next) },
  });
  if (error) return { error: errorFor(error, password), email };
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
  const problem = emailProblem(email);
  if (problem) return { error: problem, email };
  const { error } = await (await supabase()).auth.resetPasswordForEmail(email, { redirectTo: await callback("/reset-password") });
  // Rate limits are worth saying; anything about the address itself isn't (same reason as sign-up)
  if (error && error.code?.startsWith("over_")) return { error: authMessage(error.code), email };
  return { sent: email };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const client = await supabase();
  const { data } = await client.auth.getUser();
  if (!data.user) return { error: authMessage("session_missing") };
  const password = String(form.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  const { error } = await client.auth.updateUser({ password });
  if (error) return { error: errorFor(error, password) };
  redirect("/dashboard");
}

export async function signOut() {
  await (await supabase()).auth.signOut();
  redirect("/signin");
}
