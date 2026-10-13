import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next 16 renamed middleware to proxy. Keeps Supabase auth sessions fresh.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and metadata routes, and the MCP / research API surfaces, which
  // carry their own bearer credentials and never use the cookie session
  matcher: ["/((?!_next/static|_next/image|images/|icon.svg|favicon.ico|rss.xml|sitemap.xml|mcp$|api/v1/|api/webhooks/paddle$|\\.well-known/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
