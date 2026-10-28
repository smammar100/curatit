// /api/search: the dashboard's search by meaning (handler.ts). POST ranks an interpreted request;
// GET loads the models in the background (the search box asks when it opens) and answers at once
import { cookies } from "next/headers";
import { after } from "next/server";
import { getRuntime } from "@/lib/mcp/runtime";
import { createClient } from "@/utils/supabase/server";
import { searchByMeaning, wantsWarmUp, type SearchDeps } from "./handler";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function deps(): SearchDeps {
  const { runtime } = getRuntime();
  return {
    userId: async () => {
      const { data } = await createClient(await cookies()).auth.getClaims();
      return data?.claims?.sub ?? null;
    },
    repo: runtime.repo,
    models: runtime.semantic ?? null,
    throttle: runtime.throttle,
    log: runtime.log,
  };
}

export const POST = (request: Request) => searchByMeaning(request, deps());

export async function GET(request: Request) {
  const d = deps();
  if (await wantsWarmUp(request, d)) {
    after(() => d.models!.embed(["warm up"]).catch((error) => d.log?.warn("dashboard_search_warm_failed", { reason: String(error) })));
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
