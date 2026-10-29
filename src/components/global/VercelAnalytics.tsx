"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";
import { analyticsUrl } from "@/lib/analytics-url";

// Vercel Web Analytics (2026-10-29, at the owner's request, with the move to Vercel Pro): page views
// on every page, counted without cookies, beside PostHog. Its script is a few KB, injected after
// hydration and loaded deferred from this site's own origin. Every address goes through
// analyticsUrl() first, so share tokens, sign-in tokens, unsubscribe links and search words never
// reach it. It's a client component of its own because `beforeSend` is a function, which the root
// layout, a server component, can't hand over. In development the package loads Vercel's debug
// script, which logs page views to the console and sends nothing; a local `next start` asks for
// /_vercel/insights/script.js, which only Vercel serves, and logs the 404.
const beforeSend: BeforeSend = (event) => ({ ...event, url: analyticsUrl(event.url) });

export default function VercelAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
