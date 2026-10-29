// The dashboard's search by meaning (2026-10-28, docs/natural-language-search.md). The browser
// interprets a request itself (interpret.ts: the chips, corrections and refinements stay as they
// were) and runs the keyword search with the publishable key; this ranks the same interpreted
// request by meaning with the two models only the server can run, through the MCP's own hybrid
// ranking (hybridOrder in services/search.ts), and answers the order as post ids. Signed-in members
// only, within the MCP's per-account read limit; catalog reads use the publishable key under RLS,
// so only published posts come back. Kept apart from route.ts so tests can hand it stand-ins.

import { z } from "zod";
import { FILTERS } from "@/lib/mcp/contracts";
import { runWithDeadline } from "@/lib/mcp/deadline";
import { CuratitError } from "@/lib/mcp/errors";
import { pseudonym, type Logger } from "@/lib/mcp/log";
import type { Throttle } from "@/lib/mcp/ratelimit";
import type { CatalogRepository, RawSearchRequest } from "@/lib/mcp/repo/types";
import { hybridOrder } from "@/lib/mcp/services/search";
import type { SemanticModels } from "@/lib/search/semantic/models";

export type SearchDeps = {
  // The signed-in member's id, from the session cookie; null when signed out
  userId(): Promise<string | null>;
  repo: CatalogRepository;
  // Null while CURATIT_HYBRID_SEARCH=off
  models: SemanticModels | null;
  throttle: Pick<Throttle, "acquire">;
  log?: Logger;
};

// A ranking past this answers 503 and the browser shows the keyword results; the browser itself
// stops waiting sooner (useLibrarySearch), and the models carry on loading for the next search
const BUDGET_MS = 15_000;

// The interpreted request, as curatit_mcp_search_v3 takes it: the words left after interpretation
// (required: with none there's nothing to rank by meaning) and the filters the chips show
const value = z.string().trim().min(1).max(100);
const labels = Object.fromEntries(
  Object.values(FILTERS)
    .filter((f) => !f.single)
    .map((f) => [f.dimension, z.union([value, z.array(value).min(1).max(20)]).optional()]),
);
const Body = z.strictObject({
  query: z.string().trim().min(1).max(300),
  request: z.strictObject({
    query: z.string().trim().min(1).max(300),
    category: value.optional(),
    brand: value.optional(),
    format: z.enum(["static", "carousel", "video"]).optional(),
    ...labels,
  }),
  // Saved: the saved posts the search keeps to
  post_ids: z.array(z.string().min(1).max(64)).max(2000).optional(),
});

const answer = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function searchByMeaning(request: Request, deps: SearchDeps): Promise<Response> {
  // Same origin only: the session cookie is the credential
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return answer(403, { error: "forbidden" });
  const user = await deps.userId();
  if (!user) return answer(401, { error: "signed_out" });
  if (!deps.models) return answer(503, { error: "off" });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return answer(400, { error: "invalid" });
  }

  let release: () => void;
  try {
    release = await deps.throttle.acquire(`dashboard:${user}`, "read");
  } catch (error) {
    if (error instanceof CuratitError && error.code === "RATE_LIMITED") {
      return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(error.retryAfterSeconds ?? 60) } });
    }
    throw error;
  }
  const models = deps.models;
  const started = Date.now();
  try {
    const searchRequest = { ...body.request, ...(body.post_ids ? { post_ids: body.post_ids } : {}) } as RawSearchRequest;
    const { ids } = await runWithDeadline(BUDGET_MS, request.signal, () => hybridOrder(deps.repo, models, searchRequest, body.query));
    deps.log?.info("dashboard_search", { account: await pseudonym(user), ms: Date.now() - started, results: ids.length, scoped: Boolean(body.post_ids) });
    return answer(200, { ids });
  } catch (error) {
    deps.log?.warn("dashboard_search_unavailable", { account: await pseudonym(user), ms: Date.now() - started, reason: error instanceof Error ? error.message : String(error) });
    return answer(503, { error: "unavailable" });
  } finally {
    release();
  }
}

// GET: load the models without searching, so the first search after the box opens isn't the one
// that waits for them. Signed-in members only; true when there's something to load
export async function wantsWarmUp(request: Request, deps: Pick<SearchDeps, "userId" | "models">) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return Boolean(deps.models && (await deps.userId()));
}
