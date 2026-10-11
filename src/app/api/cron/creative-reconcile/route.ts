// Creative Intelligence's daily reconcile (vercel.json crons): queues published posts that have no
// analysis yet, or whose caption or images changed since theirs. It never calls a model and never
// spends anything: analyses run only when someone runs `npm run creative -- work` on their own
// machine. Off unless CREATIVE_ANALYSIS_ENABLED=true; a dry run (reports, queues nothing) unless
// CREATIVE_RECONCILE_APPLY=true. Vercel sends `Authorization: Bearer $CRON_SECRET`.
import { PIPELINE_VERSION } from "@/lib/creative/pipeline";
import { createAdminClient } from "@/lib/creative/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (process.env.CREATIVE_ANALYSIS_ENABLED !== "true") {
    return Response.json({ skipped: "CREATIVE_ANALYSIS_ENABLED isn't true" });
  }

  const dryRun = process.env.CREATIVE_RECONCILE_APPLY !== "true";
  const { data, error } = await createAdminClient().rpc("creative_reconcile", {
    p_pipeline: PIPELINE_VERSION,
    p_dry_run: dryRun,
    p_include_stale: false,
    p_limit: 200,
  });
  if (error) {
    console.error("creative-reconcile", error.message);
    return Response.json({ error: "Reconcile failed" }, { status: 500 });
  }
  const due = (data?.due ?? []) as { post_id: string; why: string }[];
  const queued = data?.queued ?? null;
  console.log("creative-reconcile", JSON.stringify({ dryRun, due: due.length, queued }));
  return Response.json({ dryRun, pipeline: PIPELINE_VERSION, due: due.length, queued });
}
