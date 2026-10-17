import { cookies } from "next/headers";
import { after, NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { captureServerEvent } from "@/lib/analytics-server";
import { safeNext } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { createClient } from "@/utils/supabase/server";

// Where Supabase's email links finish (confirm sign-up, reset password, change email), and an
// OAuth provider's if one is added. Two ways in:
// - GET with a PKCE ?code= (Supabase's default templates, and OAuth) or ?token_hash=&type=.
// - POST from /auth/confirm, the page Curatit's own templates link to: the token is only used
//   when the person clicks Confirm there, so a mail scanner that opens every link (Outlook's
//   Safe Links, for one) can't use it up first.
// Either way the session cookies are set on this response and the visitor goes on to next.
// Failures (an expired link, a used one) go to sign-in with the error code.
const OTP_TYPES: readonly string[] = ["signup", "email", "recovery", "email_change", "invite", "magiclink"] satisfies EmailOtpType[];

async function finish(
  request: NextRequest,
  link: { code: string | null; tokenHash: string | null; type: string | null; next: string | null; denied: string | null },
  // A POST's redirect is a 303, so the browser follows it with a GET
  status: 303 | 307,
) {
  const next = safeNext(link.next);
  const fail = (code: string) => NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(code)}`, request.url), status);
  if (link.denied) return fail(link.denied);

  const supabase = createClient(await cookies());
  const type = link.type && OTP_TYPES.includes(link.type) ? (link.type as EmailOtpType) : null;

  let result;
  if (link.code) result = await supabase.auth.exchangeCodeForSession(link.code);
  else if (link.tokenHash && type) result = await supabase.auth.verifyOtp({ type, token_hash: link.tokenHash });
  else return fail("access_denied");

  const { data, error } = result;
  if (error) return fail(error.code ?? "access_denied");
  // Analytics: this link confirmed the address just now (a password reset for an account
  // confirmed long ago doesn't count). The onboarding funnel's third step, after signed_up.
  const user = data.user;
  const confirmed = user?.email_confirmed_at ? Date.now() - new Date(user.email_confirmed_at).getTime() < 15 * 60_000 : false;
  // The same moment sends the welcome email (once per account, by its idempotency key).
  if (user && confirmed) {
    after(() => captureServerEvent(user.id, "email_confirmed", { via: link.code ? "code" : type }));
    after(() => sendWelcomeEmail(user));
  }
  return NextResponse.redirect(new URL(next, request.url), status);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return finish(
    request,
    {
      code: params.get("code"),
      tokenHash: params.get("token_hash"),
      type: params.get("type"),
      next: params.get("next"),
      denied: params.get("error_code") ?? params.get("error"),
    },
    307,
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" && value ? value : null;
  };
  // Only a token can be confirmed this way; a code belongs to a GET from Supabase
  return finish(request, { code: null, tokenHash: field("token_hash"), type: field("type"), next: field("next"), denied: null }, 303);
}
