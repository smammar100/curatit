import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

// Where Supabase sends people back to: from Google, and from the links in its emails (confirm
// sign-up, reset password). The default email templates and OAuth both bring a PKCE ?code= to
// exchange for a session; a customised template can send ?token_hash=&type= instead. Either
// way the session cookies are set on this response and the visitor goes on to ?next=. Failures
// (an expired link, one opened in another browser) go to sign-in with the error code.
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

  let error;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  else return fail("access_denied");

  if (error) return fail(error.code ?? "access_denied");
  return NextResponse.redirect(new URL(next, request.url));
}
