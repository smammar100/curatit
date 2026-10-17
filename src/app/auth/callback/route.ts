import { cookies } from "next/headers";
import { after, NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { captureServerEvent } from "@/lib/analytics-server";
import { safeNext } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { createClient } from "@/utils/supabase/server";

// Where Supabase sends people back to from the links in its emails (confirm sign-up, reset
// password), and from an OAuth provider if one is added. The default email templates bring a
// PKCE ?code= to exchange for a session; a customised template can send ?token_hash=&type=
// instead. Either way the session cookies are set on this response and the visitor goes on to
// ?next=. Failures (an expired link, one opened in another browser) go to sign-in with the
// error code.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const fail = (code: string) => NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(code)}`, request.url));

  const denied = params.get("error_code") ?? params.get("error");
  if (denied) return fail(denied);

  const supabase = createClient(await cookies());
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  let result;
  if (code) result = await supabase.auth.exchangeCodeForSession(code);
  else if (tokenHash && type) result = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  else return fail("access_denied");

  const { data, error } = result;
  if (error) return fail(error.code ?? "access_denied");
  // Analytics: this link confirmed the address just now (a password reset for an account
  // confirmed long ago doesn't count). The onboarding funnel's third step, after signed_up.
  const user = data.user;
  const confirmed = user?.email_confirmed_at ? Date.now() - new Date(user.email_confirmed_at).getTime() < 15 * 60_000 : false;
  // The same moment sends the welcome email (once per account, by its idempotency key).
  if (user && confirmed) {
    after(() => captureServerEvent(user.id, "email_confirmed", { via: code ? "code" : type }));
    after(() => sendWelcomeEmail(user));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
