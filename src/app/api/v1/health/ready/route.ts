// Readiness: the catalog answers a cheap read. Minimal detail in public; operators have logs.
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { runtime } = getRuntime();
    await runtime.repo.resolveFilter("category", "finance");
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    getRuntime().runtime.log.error("health.not_ready", { error: String(error) });
    return Response.json({ status: "not_ready" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
