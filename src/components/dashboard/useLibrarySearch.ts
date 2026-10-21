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
let cachedTerms: { data: RawTerms; until: number } | undefined;
// Public catalog results only; per feed snapshot, bounded, and short-lived. Never cache a
// failure or a capped response. Repeated searches don't fetch every page again.
const cachedResults = new WeakMap<DashPost[], Map<string, { data: LibrarySearch; until: number }>>();

// The existing public RPC enforces published-only reads. Never import the server catalog
// repository here: it has a privileged client for unrelated metric-provenance lookups.
export async function loadLibrarySearch(query: string, posts: DashPost[], signal: AbortSignal): Promise<LibrarySearch> {
  signal.throwIfAborted();
  const cache = cachedResults.get(posts) ?? new Map();
  cachedResults.set(posts, cache);
  const cached = cache.get(query);
  if (cached && cached.until > Date.now()) return cached.data;
  const client = createClient();
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
  const codes: string[] = [];
  let offset = 0;
  // Fetch all pages within the catalog's existing cap so Saved and Discover can intersect
  // the complete ranked set, not accidentally report zero from an unrelated first page.
  while (offset < 500) {
    signal.throwIfAborted();
    const response = await client.rpc("curatit_mcp_search_v2", { p_request: { ...plan.filters, ...(plan.query ? { query: plan.query } : {}), limit: 50, offset } }).abortSignal(signal);
    if (response.error) throw response.error;
    const result = response.data as RawSearchResult;
    codes.push(...result.posts.map((post) => post.short_code));
    if (!result.has_more) {
      signal.throwIfAborted();
      const data = { ...base, codes: [...new Set(codes)] };
      cache.delete(query);
      cache.set(query, { data, until: Date.now() + 60_000 });
      if (cache.size > 16) cache.delete(cache.keys().next().value!);
      return data;
    }
    if (result.next_offset === null || result.next_offset <= offset || result.next_offset >= 500) return { ...base, codes: [...new Set(codes)], capped: true };
    offset = result.next_offset;
  }
  return { ...base, codes: [...new Set(codes)], capped: true };
}

export function useLibrarySearch(query: string, posts: DashPost[]) {
  const text = query.trim();
  const remote = Boolean(text && !brandNamed(posts, text) && !categoryNamed(text) && !typeNamed(posts, text) && !hookNamed(posts, text));
  const [result, setResult] = useState<LibrarySearch | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!remote) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]);
    const timer = setTimeout(() => {
      loadLibrarySearch(text, posts, signal).then((next) => {
        if (!controller.signal.aborted) setResult(next);
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ key: text, codes: [], labels: [], error: "Search couldn't load. Please try again." });
      });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [text, posts, remote, attempt]);
  const current = remote && result?.key === text ? result : null;
  const order = useMemo(() => new Map(current?.codes.map((code, i) => [code, i]) ?? []), [current]);
  return { remote, result: current, order, loading: remote && !current, retry: () => { setResult(null); setAttempt((n) => n + 1); } };
}
