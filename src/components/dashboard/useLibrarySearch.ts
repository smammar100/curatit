"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { interpretSearch } from "@/lib/search/interpret";
import { searchRefinements, type SearchRefinement } from "@/lib/search/refine";
import type { RawSearchResult, RawTerms } from "@/lib/mcp/repo/types";
import { brandNamed, categoryNamed, typeNamed, hookNamed } from "./search";
import type { DashPost } from "./types";

export type LibrarySearch = { key: string; codes: string[]; labels: string[]; corrections?: { from: string; to: string }[]; refinements?: SearchRefinement[]; error?: string; invalid?: boolean; capped?: boolean };
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

// The existing public RPC enforces published-only reads. Never import the server catalog
// repository here: it has a privileged client for unrelated metric-provenance lookups.
// `client`: scripts/perf passes its own, metered one
export async function loadLibrarySearch(query: string, posts: DashPost[], signal: AbortSignal, scope: SearchScope = {}, client: ReturnType<typeof createClient> = createClient()): Promise<LibrarySearch> {
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

  const remember = (data: LibrarySearch) => {
    cache.delete(cacheKey);
    cache.set(cacheKey, { data, until: Date.now() + 60_000 });
    if (cache.size > 16) cache.delete(cache.keys().next().value!);
    return data;
  };
  const codes: string[] = [];
  let offset = 0;
  // Every page up to the cap, so Saved and Discover see the whole ranked set; past the cap the feed
  // says it shows the first 500
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
      return remember({ ...base, codes: [...new Set(codes)] });
    }
    if (result.next_offset === null || result.next_offset <= offset || result.next_offset >= PAGE_CAP) return { ...base, codes: [...new Set(codes)], capped: true };
    offset = result.next_offset;
  }
  return { ...base, codes: [...new Set(codes)], capped: true };
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
