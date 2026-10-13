// Readiness: the catalog answers a cheap read. Minimal detail in public; operators have logs.
import { after } from "next/server";
import { flushPostHogLogs, logPostHogIntegration } from "@/instrumentation";
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { runtime } = getRuntime();
    await runtime.repo.resolveFilter("category", "finance");
    logPostHogIntegration("posthog_log_capture_health_check_ready", { route: "/api/v1/health/ready" });
    after(flushPostHogLogs);
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logPostHogIntegration("posthog_log_capture_health_check_not_ready", { route: "/api/v1/health/ready" });
    after(flushPostHogLogs);
    getRuntime().runtime.log.error("health.not_ready", { error: String(error) });
    return Response.json({ status: "not_ready" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
