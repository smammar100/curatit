// Analytics events for the steps of the sign-up journey that happen on the server: an account
// being created (the sign-up action) and an email address being confirmed (the auth callback).
// They're sent with the Supabase user id as the distinct id, the same id the browser identifies
// with (after sign-up, and on every dashboard visit), so PostHog puts them on the same person as
// the browser's own events. Call it inside after(), so the response never waits for PostHog;
// flushing waits at most 3 seconds. Off without a project token and host.
import { PostHog } from "posthog-node";

export async function captureServerEvent(distinctId: string, event: string, properties?: Record<string, unknown>) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host) return;
  const posthog = new PostHog(token, { host, flushAt: 1, flushInterval: 0 });
  posthog.capture({ distinctId, event, properties });
  await posthog.shutdown(3000).catch(() => {});
}
