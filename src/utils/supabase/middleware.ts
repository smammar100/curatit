import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Pages only for people who are signed out; a signed-in visitor goes to the dashboard
const SIGNED_OUT_ONLY = ["/signin", "/signup", "/forgot-password"];

// Refreshes the auth session on each request and passes the new cookies on (used by
// src/proxy.ts), and keeps the dashboard for signed-in visitors. The dashboard's pages are
// static and hold nothing personal (who you are is read in the browser), so this check is the
// gate: signed out, /dashboard/… redirects to /signin?next=/dashboard/….
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // Don't run code between createServerClient and getClaims: this call is what refreshes the
  // session (and it verifies the token, unlike getSession, so it's safe to decide on)
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;
  const { pathname, search, searchParams } = request.nextUrl;

  // A redirect has to carry the refreshed session cookies too
  const redirectTo = (path: string, params: Record<string, string> = {}) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = new URLSearchParams(params).toString();
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  // When a link's redirect isn't on the project's allow list, Supabase falls back to the Site
  // URL, so a sign-in code can arrive at the homepage: finish it where it belongs
  if (pathname === "/" && searchParams.has("code")) {
    return redirectTo("/auth/callback", { code: searchParams.get("code")! });
  }
  if (!signedIn && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))) {
    return redirectTo("/signin", { next: pathname + search });
  }
  if (signedIn && SIGNED_OUT_ONLY.includes(pathname)) {
    return redirectTo("/dashboard");
  }

  return supabaseResponse;
};
