// Product analytics through PostHog, kept off the critical path. posthog-js is about 55 KB
// gzipped, so it's fetched only when something asks for it: the browser's first idle moment
// after load (src/instrumentation-client.ts) or the first event, whichever comes sooner. Every
// call waits for the same load, in the order it was made, so an identify made while PostHog
// is still loading isn't lost and still lands before the events that follow it. With no
// project token configured (a fork, a preview without the variables), everything here does
// nothing.
import type { PostHog } from "posthog-js";

type Properties = Record<string, unknown>;

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let loading: Promise<PostHog | null> | undefined;

export function loadAnalytics(): Promise<PostHog | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!loading) {
    if (!token || !host) {
      if (process.env.NODE_ENV === "development") {
        console.warn("PostHog is off: set NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST in .env.local to turn it on.");
      }
      loading = Promise.resolve(null);
    } else {
      loading = import("posthog-js")
        .then(({ default: posthog }) => {
          posthog.init(token, {
            api_host: host,
            defaults: "2026-01-30",
            capture_exceptions: true,
            debug: process.env.NODE_ENV === "development",
          });
          return posthog;
        })
        // A blocked or failed download (an ad blocker, a dropped connection) just means no analytics
        .catch(() => null);
    }
  }
  return loading;
}

export function track(event: string, properties?: Properties) {
  void loadAnalytics().then((posthog) => posthog?.capture(event, properties));
}

export function identify(id: string, properties?: Properties) {
  void loadAnalytics().then((posthog) => posthog?.identify(id, properties));
}

// After a sign-out, so the next person on this browser isn't counted as the last one
export function resetAnalytics() {
  void loadAnalytics().then((posthog) => posthog?.reset());
}

export function captureError(error: unknown) {
  void loadAnalytics().then((posthog) => posthog?.captureException(error));
}
