import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next 16 renamed middleware to proxy. Keeps Supabase auth sessions fresh.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and metadata routes
  matcher: ["/((?!_next/static|_next/image|images/|icon.svg|favicon.ico|rss.xml|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
