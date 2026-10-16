// Readiness: both database paths answer, the publishable key's catalog read and the secret
// key's token check (on a hash that matches nothing), each within its client's own timeout, so
// a rotated secret key or a broken grant shows here rather than only as 500s on /mcp. Minimal
// detail in public; operators have logs. The answer is kept for a few seconds, so the
// unauthenticated endpoint can't be used to run database calls at will.
import { after } from "next/server";
import { flushPostHogLogs, logPostHogIntegration } from "@/instrumentation";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";

const KEEP_MS = 5_000;
const NO_SUCH_TOKEN = "0".repeat(64);
let last: { at: number; ready: boolean } | null = null;

async function dependenciesAnswer(): Promise<boolean> {
  const { runtime, admin } = getRuntime();
  try {
    await runtime.repo.resolveFilter("category", "finance");
    const { error } = await admin.rpc("curatit_api_token_verify", { p_token_hash: NO_SUCH_TOKEN });
    if (error) throw new Error(`token check: ${error.message}`);
    return true;
  } catch (error) {
    runtime.log.error("health.not_ready", { error: String(error) });
    return false;
  }
}

export async function GET() {
  const now = Date.now();
  let ready: boolean;
  if (last && now - last.at < KEEP_MS) {
    ready = last.ready;
  } else {
    try {
      ready = await dependenciesAnswer();
    } catch (error) {
      // getRuntime itself failed (a setting is missing), so there is no logger to reach
      console.error("health.not_ready", String(error));
      ready = false;
    }
    last = { at: now, ready };
  }
  logPostHogIntegration(ready ? "posthog_log_capture_health_check_ready" : "posthog_log_capture_health_check_not_ready", { route: "/api/v1/health/ready" });
  after(flushPostHogLogs);
  return Response.json({ status: ready ? "ready" : "not_ready" }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
