"use server";

// The auth flow's server actions (email and password; Google sign-in was taken out for now).
// Each runs with the per-request Supabase client, so the session cookies it sets travel back
// with the response. The links Supabase emails come back through /auth/callback, which
// exchanges the ?code= for a session (PKCE: it has to be the browser that started the flow).
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { isAuthWeakPasswordError, type AuthError } from "@supabase/supabase-js";
import { captureServerEvent } from "@/lib/analytics-server";
import { authMessage, emailProblem, passwordProblem, safeNext } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/utils/supabase/server";

// What a form shows after an action: an error for the whole form, problems with particular
// fields (shown under them, like the form's own checks), the address an email went to, and the
// email typed (React clears a form after its action, so it comes back as the field's default)
export type AuthFields = Partial<Record<"email" | "password", string>>;
// userId comes back only from a sign-up that created a new account, so the browser can identify
// with it at once (the person who just made the account is the one holding this browser)
export type AuthState = { error?: string; fields?: AuthFields; sent?: string; email?: string; userId?: string };

// The fields that have a problem, or null when none do
function invalid(fields: Record<keyof AuthFields, string | null | undefined>): AuthFields | null {
  const found = Object.fromEntries(Object.entries(fields).filter(([, message]) => message)) as AuthFields;
  return Object.keys(found).length ? found : null;
}

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
// password itself says exactly what's missing. Null for any other error.
function weakPassword(error: AuthError, password: string) {
  if (!isAuthWeakPasswordError(error)) return null;
  if (error.reasons.includes("pwned")) return authMessage("pwned_password");
  return passwordProblem(password) ?? authMessage("weak_password");
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const password = String(form.get("password") ?? "");
  // The form checks these first; this covers a submit without JavaScript
  const fields = invalid({ email: emailProblem(email), password: password ? null : "Enter your password." });
  if (fields) return { fields, email };
  const { error } = await (await supabase()).auth.signInWithPassword({ email, password });
  if (error) return { error: authMessage(error.code), email };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));
  // The form checks these first; this covers a submit without JavaScript
  const fields = invalid({ email: emailProblem(email), password: passwordProblem(password) });
  if (fields) return { fields, email };
  const { data, error } = await (await supabase()).auth.signUp({
    email,
    password,
    options: { emailRedirectTo: await callback(next) },
  });
  const taken = { fields: { email: authMessage("email_exists") }, email };
  if (error) {
    // With email confirmation off, Supabase says outright that the address is taken
    if (error.code === "user_already_exists" || error.code === "email_exists") return taken;
    const weak = weakPassword(error, password);
    return weak ? { fields: { password: weak }, email } : { error: authMessage(error.code), email };
  }
  // With it on, Supabase hides an existing account: it answers as if it had signed up, with a
  // stand-in user that has no identities, and sends no email. Curatit says the address is in use
  // instead (chosen 2026-10-11: being clear beats hiding who has an account). An existing account
  // that was never confirmed comes back with its identity, and Supabase sends the link again.
  if (data.user && !data.user.identities?.length) return taken;
  // Analytics: a new account, as opposed to Supabase resending an unconfirmed one's link (that
  // account was made earlier). It's the onboarding funnel's second step, after the sign-up page.
  const user = data.user;
  const created = user && Date.now() - new Date(user.created_at).getTime() < 2 * 60_000 ? user : null;
  if (created) after(() => captureServerEvent(created.id, "signed_up", { confirmation_required: !data.session }));
  // With confirmation off there's a session already, so the account is ready and gets its
  // welcome now; otherwise the link finishes it, and /auth/callback sends the welcome
  if (data.session) {
    if (created) after(() => sendWelcomeEmail(created));
    redirect(next);
  }
  return { sent: email, userId: created?.id };
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
  if (problem) return { fields: { email: problem }, email };
  const { error } = await (await supabase()).auth.resetPasswordForEmail(email, { redirectTo: await callback("/reset-password") });
  // Rate limits are worth saying; whether the address has an account isn't, so this answers the
  // same for any address (sign-up does say, as it has to refuse the address anyway)
  if (error && error.code?.startsWith("over_")) return { error: authMessage(error.code), email };
  return { sent: email };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const client = await supabase();
  const { data } = await client.auth.getUser();
  if (!data.user) return { error: authMessage("session_missing") };
  const password = String(form.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { fields: { password: problem } };
  const { error } = await client.auth.updateUser({ password });
  if (error) {
    const weak = weakPassword(error, password);
    return weak ? { fields: { password: weak } } : { error: authMessage(error.code) };
  }
  redirect("/dashboard");
}

export async function signOut() {
  await (await supabase()).auth.signOut();
  redirect("/signin");
}
