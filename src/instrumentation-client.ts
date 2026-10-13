// Next runs this before every page hydrates. It only schedules analytics: PostHog starts after the
// page has loaded, at the first sign of a person (a tap, a key, a scroll) or after five quiet
// seconds, whichever comes first. Its script is a few hundred milliseconds of main-thread work on a
// slow phone, and starting it straight after load showed up as blocking time on the homepage
// (Lighthouse mobile, 2026-10-13: median 82 against 85 without it; with this start, 86 against
// 83, the page's bytes unchanged in the window Lighthouse measures). The cost of waiting: a visit
// that leaves within five seconds without touching the page records no pageview. Anything that
// tracks or identifies earlier (the dashboard does, as soon as it knows who's signed in) starts it
// at once.
import { loadAnalytics } from "@/lib/analytics";

const SIGNS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

function start() {
  let timer = 0;
  const go = () => {
    window.clearTimeout(timer);
    for (const sign of SIGNS) window.removeEventListener(sign, go);
    void loadAnalytics();
  };
  for (const sign of SIGNS) window.addEventListener(sign, go, { once: true, passive: true });
  timer = window.setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 2000 }) : go()), 5000);
}

if (document.readyState === "complete") start();
else window.addEventListener("load", start, { once: true });
