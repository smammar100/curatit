// Next runs this before every page hydrates. It only schedules analytics: PostHog loads once the
// page has finished loading and the browser is idle, so it never competes with the first paint
// (the homepage's mobile LCP counts every byte requested before it; see AGENTS.md).
import { loadAnalytics } from "@/lib/analytics";

function start() {
  if ("requestIdleCallback" in window) requestIdleCallback(() => void loadAnalytics(), { timeout: 4000 });
  else setTimeout(() => void loadAnalytics(), 1500);
}

if (document.readyState === "complete") start();
else window.addEventListener("load", start, { once: true });
