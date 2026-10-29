"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { interpretSearch } from "@/lib/search/interpret";
import { searchRefinements, type SearchRefinement } from "@/lib/search/refine";
import type { RawSearchResult, RawTerms } from "@/lib/mcp/repo/types";
import { brandNamed, categoryNamed, typeNamed, hookNamed } from "./search";
import type { DashPost } from "./types";

// `ranking`: "meaning" when the server's search by meaning ordered the results; `notice` when it
// was tried and failed, so they come from keyword search alone (never said silently)
export type LibrarySearch = { key: string; codes: string[]; labels: string[]; corrections?: { from: string; to: string }[]; refinements?: SearchRefinement[]; error?: string; invalid?: boolean; capped?: boolean; ranking?: "meaning" | "keyword"; notice?: string };
// What a search is limited to: Discover's category, or the saved posts. Sent with the search, so the
// database applies it before the pages are cut and a match ranked past the library's first 500 still
// counts; the feed still intersects with what it shows (2026-10-26, docs/performance/)
export type SearchScope = { category?: string | null; postIds?: string[] | null };
export const scopeKey = (scope: SearchScope) => `${scope.category ?? ""}|${scope.postIds ? [...scope.postIds].sort().join(",") : "*"}`;

let cachedTerms: { data: RawTerms; until: number } | undefined;
// Public catalog results only; per feed snapshot, bounded, and short-lived. Never cache a
// failure or a capped response. Repeated searches don't fetch every page again.
const cachedResults = new WeakMap<DashPost[], Map<string, { data: LibrarySearch; until: number }>>();
// Whether the database answers the compact search (fields "ids", 100 to a page, and post_ids:
// supabase/migrations/20261026070552_search_projections.sql). A database without that migration
// refuses the new fields; then the dashboard asks the way it did before, for the rest of the visit
let compact = true;
const PAGE_CAP = 500;

// Search by meaning (2026-10-28, docs/natural-language-search.md): when words are left after
// interpretation, the server ranks the same request by meaning (/api/search, the MCP's hybrid
// ranking) while the keyword pages load here. Its order goes first (the matches the reranker keeps,
// best first, then the first 50 keyword matches) and the keyword matches past those follow, so no
// keyword match is lost. The results wait for both, so tiles never reorder after they show. If it
// fails or hasn't answered in MEANING_WAIT_MS (a cold server still loading its models), the
// keyword results show with a notice, and aren't kept, so the next search tries again. 12 s since
// 2026-10-29: on Vercel a fresh ranking takes about 5 s end to end (laptop: about 2), so the first
// 6 s fell back on half the searches; the owner chose the wait over the word matches
export type MeaningRequest = { query: string; request: Record<string, unknown>; post_ids?: string[] };
export type Ranker = (body: MeaningRequest, signal: AbortSignal) => Promise<string[]>;
const MEANING_WAIT_MS = 12_000;
export const MEANING_NOTICE = "Searching by meaning isn’t working right now, so these results only match your words.";
// CURATIT_HYBRID_SEARCH=off: keyword search, as before, without a notice, for the rest of the visit
class MeaningOff extends Error {}
let meaningOff = false;

export const rankByMeaning: Ranker = async (body, signal) => {
  const response = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const reply = (await response.json().catch(() => null)) as { ids?: string[]; error?: string } | null;
  if (reply?.error === "off") throw new MeaningOff();
  if (!response.ok || !Array.isArray(reply?.ids)) throw new Error(`Search by meaning answered ${response.status}`);
  return reply.ids;
};

// Loads the models on the server while someone is still typing (the search box asks when it opens),
// at most every five minutes
let warmedAt = 0;
export function warmSearch() {
  if (meaningOff || Date.now() - warmedAt < 5 * 60_000) return;
  warmedAt = Date.now();
  fetch("/api/search", { method: "GET" }).catch(() => {});
}

// The existing public RPC enforces published-only reads. Never import the server catalog
// repository here: it has a privileged client for unrelated metric-provenance lookups.
// `client`: scripts/perf passes its own, metered one; `rank`: the search eval passes the server's
// ranking itself, null leaves search by meaning out
export async function loadLibrarySearch(query: string, posts: DashPost[], signal: AbortSignal, scope: SearchScope = {}, client: ReturnType<typeof createClient> = createClient(), rank: Ranker | null = rankByMeaning): Promise<LibrarySearch> {
  signal.throwIfAborted();
  const cache = cachedResults.get(posts) ?? new Map();
  cachedResults.set(posts, cache);
  const cacheKey = `${query}|${scopeKey(scope)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.data;

  let terms = cachedTerms?.until && cachedTerms.until > Date.now() ? cachedTerms.data : undefined;
  if (!terms) {
    const response = await client.rpc("curatit_mcp_creative_terms", {}).abortSignal(signal);
    if (response.error) throw response.error;
    terms = response.data as RawTerms;
    cachedTerms = { data: terms, until: Date.now() + 5 * 60_000 };
  }
  const brands = [...new Map(posts.map((post) => [post.brand.slug, post.brand])).values()];
  const plan = interpretSearch(query, { brands, categories: CATEGORIES, dimensions: terms.dimensions });
  const base = { key: query, codes: [], labels: plan.labels, corrections: plan.corrections, refinements: searchRefinements(plan.filters, plan.query) };
  if (plan.error) return { ...base, error: plan.error, invalid: true };
  // Nothing saved yet: nothing to find
  if (scope.postIds && !scope.postIds.length) return base;
  // An industry named in the search wins over Discover's; the feed still keeps to Discover's
  const scoped = { ...plan.filters, ...(plan.query ? { query: plan.query } : {}), ...(scope.category && !plan.filters.category ? { category: scope.category } : {}) };

  // Kept a minute unless capped or answered without the meaning it asked for
  const remember = (data: LibrarySearch) => {
    if (data.capped || data.notice) return data;
    cache.delete(cacheKey);
    cache.set(cacheKey, { data, until: Date.now() + 60_000 });
    if (cache.size > 16) cache.delete(cache.keys().next().value!);
    return data;
  };
  // Started first, so it runs while the keyword pages load. With no words left (a search that's all
  // filters) there's nothing to rank by meaning, as in MCP search
  const stop = new AbortController();
  const meaning = rank && plan.query && !meaningOff
    ? rank({ query, request: scoped, ...(scope.postIds ? { post_ids: scope.postIds } : {}) }, AbortSignal.any([signal, stop.signal, AbortSignal.timeout(MEANING_WAIT_MS)])).then(
        (ids) => ({ ids }),
        (error: unknown) => ({ error }),
      )
    : null;
  try {
    const keyword = await keywordCodes(client, scoped, scope, signal);
    if (!meaning) return remember({ ...base, ...keyword });
    const ranked = await meaning;
    signal.throwIfAborted();
    if ("error" in ranked) {
      if (!(ranked.error instanceof MeaningOff)) return { ...base, ...keyword, ranking: "keyword", notice: MEANING_NOTICE };
      meaningOff = true;
      return remember({ ...base, ...keyword });
    }
    const codeOf = new Map(posts.map((post) => [post.id, post.shortCode]));
    const head = ranked.ids.flatMap((id) => codeOf.get(id) ?? []);
    return remember({ ...base, ...keyword, codes: [...new Set([...head, ...keyword.codes])], ranking: "meaning" });
  } finally {
    stop.abort();
  }
}

// Every keyword page up to the cap, so Saved and Discover see the whole ranked set; past the cap the
// feed says it shows the first 500
async function keywordCodes(client: ReturnType<typeof createClient>, scoped: Record<string, unknown>, scope: SearchScope, signal: AbortSignal): Promise<{ codes: string[]; capped?: boolean }> {
  const codes: string[] = [];
  let offset = 0;
  while (offset < PAGE_CAP) {
    signal.throwIfAborted();
    const request = compact ? { ...scoped, ...(scope.postIds ? { post_ids: scope.postIds } : {}), fields: "ids", limit: 100, offset } : { ...scoped, limit: 50, offset };
    const response = await client.rpc("curatit_mcp_search_v2", { p_request: request }).abortSignal(signal);
    if (response.error && compact && offset === 0 && response.error.code === "22023") {
      compact = false;
      continue;
    }
    if (response.error) throw response.error;
    const result = response.data as RawSearchResult;
    codes.push(...result.posts.map((post) => post.short_code));
    if (!result.has_more) {
      signal.throwIfAborted();
      return { codes: [...new Set(codes)] };
    }
    if (result.next_offset === null || result.next_offset <= offset || result.next_offset >= PAGE_CAP) return { codes: [...new Set(codes)], capped: true };
    offset = result.next_offset;
  }
  return { codes: [...new Set(codes)], capped: true };
}

export function useLibrarySearch(query: string, posts: DashPost[], scope: SearchScope = {}) {
  const text = query.trim();
  const remote = Boolean(text && !brandNamed(posts, text) && !categoryNamed(text) && !typeNamed(posts, text) && !hookNamed(posts, text));
  const scoping = scopeKey(scope);
  const [result, setResult] = useState<(LibrarySearch & { scope: string }) | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!remote) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]);
    const timer = setTimeout(() => {
      loadLibrarySearch(text, posts, signal, scope).then((next) => {
        if (!controller.signal.aborted) setResult({ ...next, scope: scoping });
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ key: text, scope: scoping, codes: [], labels: [], error: "Search couldn't load. Please try again." });
      });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
    // scope is read through its key: a new object with the same posts is the same search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, posts, remote, attempt, scoping]);
  const current = remote && result?.key === text && result.scope === scoping ? result : null;
  const order = useMemo(() => new Map(current?.codes.map((code, i) => [code, i]) ?? []), [current]);
  return { remote, result: current, order, loading: remote && !current, retry: () => { setResult(null); setAttempt((n) => n + 1); } };
}
