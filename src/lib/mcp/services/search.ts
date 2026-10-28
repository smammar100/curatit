// curatit_search_posts over the catalog's search function. The service owns the rules the
// schema can't express: a search needs a query or a filter; an industry or brand must exist
// (the database would quietly return nothing for an unknown one); `newest` only when nothing
// ranks; and nothing is ever relaxed behind the caller's back: an empty page comes back empty
// with suggestions. Pages are signed cursors over the function's offsets.
//
// Hybrid search (2026-10-25, docs/search-eval/): a natural-language search with words left after
// interpretation also looks for posts by meaning. The request is embedded, the database fuses the
// keyword matches with the posts closest in meaning (under the same filters), the reranker reads
// each candidate's description, and the page keeps every keyword match plus the meaning-only
// matches it scores RERANK_CUTOFF or more, best first. Filters are never loosened. If the models or
// the index fail, the first page answers with keyword search alone and says so.

import { FILTERS, type FilterKey, type SearchInputT, type SearchOutputT } from "../contracts";
import { decodeCursor, encodeCursor, fingerprint } from "../cursor";
import { markStage, remainingMs } from "../deadline";
import { invalid, toCuratitError } from "../errors";
import type { Logger } from "../log";
import type { CatalogRepository, RawSearchHit, RawSearchRequest } from "../repo/types";
import { brandOf, classification, excerpt, industryOf, mediaId, nameKey } from "./shared";
import { interpretSearch } from "@/lib/search/interpret";
import { searchRefinements } from "@/lib/search/refine";
import { meaningReason, RERANK_CUTOFF, settle } from "@/lib/search/semantic/hybrid";
import type { SemanticModels } from "@/lib/search/semantic/models";

export const SEARCH_DEFAULT_LIMIT = 8;
// Embedding and reranking take a second or two once the models are loaded, and loading them takes
// a few more on a cold server; with less time than this left, the search stays keyword-only
const HYBRID_MIN_BUDGET_MS = 8_000;

export type SearchContext = { signingSecret: Uint8Array<ArrayBuffer>; principalKey: string; semantic?: SemanticModels | null; log?: Logger };

export async function searchPosts(repo: CatalogRepository, input: SearchInputT, ctx: SearchContext): Promise<{ data: SearchOutputT; warnings: string[] }> {
  const originalQuery = input.query?.trim() || null;
  let query = originalQuery;
  const queryMode = input.query_mode ?? "natural";
  const filters = { ...input.filters };
  const limit = input.limit ?? SEARCH_DEFAULT_LIMIT;
  const warnings: string[] = [];
  if (query && queryMode === "natural") {
    const [terms, categories, brands] = await Promise.all([repo.terms(), repo.categories(), repo.brands()]);
    const interpreted = interpretSearch(query, { dimensions: terms.dimensions, categories, brands });
    if (interpreted.error) throw invalid(interpreted.error);
    for (const correction of interpreted.corrections ?? []) warnings.push(`Read "${correction.from}" as "${correction.to}". Quote the original phrase to search it literally.`);
    warnings.push(...(interpreted.notes ?? []));
    query = interpreted.query || null;
    for (const [key, { dimension }] of Object.entries(FILTERS)) {
      const inferred = interpreted.filters[dimension];
      if (!inferred) continue;
      const filterKey = key as FilterKey;
      if (filters[filterKey]?.length) {
        warnings.push(`The explicit ${key} filter takes precedence over the natural query's ${JSON.stringify(inferred)}.`);
      } else filters[filterKey] = Array.isArray(inferred) ? inferred : [inferred];
    }
  }

  // analysed_only narrows only when true: `false` is the default and filters nothing
  const activeKeys = (Object.keys(filters) as (keyof typeof filters)[]).filter((k) => {
    const v = filters[k];
    if (k === "analysed_only") return v === true;
    return Array.isArray(v) ? v.length > 0 : v !== undefined;
  });
  if (!query && !activeKeys.some((k) => k !== "platforms")) {
    throw invalid("Give a query or at least one filter. curatit_get_taxonomy lists the filters and their values.");
  }

  // Resolve the single-value filters the database doesn't validate
  const request: RawSearchRequest = {};
  const applied: Record<string, string[]> = {};
  for (const key of activeKeys) {
    if (key === "platforms" || key === "analysed_only") continue;
    const values = filters[key as FilterKey] ?? [];
    const { dimension } = FILTERS[key as FilterKey];
    if (dimension === "category" || dimension === "brand") {
      const resolved = await repo.resolveFilter(dimension, values[0]);
      if (!resolved) {
        throw invalid(`Unknown ${dimension === "category" ? "industry" : "brand"} "${values[0]}". curatit_get_taxonomy lists the ones there are.`, { filter: key, value: values[0] });
      }
      request[dimension] = resolved;
      applied[key] = [resolved];
      // The database reads names loosely ("fashion" lands on shopping, "fintech" on finance);
      // when that changes the value, the caller is told, so nothing is remapped behind their back
      if (nameKey(resolved) !== nameKey(values[0])) {
        warnings.push(`${key} "${values[0]}" was read as "${resolved}". Pass the slug itself to search exactly that; curatit_get_taxonomy lists them.`);
      }
    } else if (dimension === "format") {
      request.format = values[0];
      applied[key] = [values[0]];
    } else {
      request[dimension] = values;
      applied[key] = values;
    }
  }
  if (filters.analysed_only) {
    request.analysed_only = true;
    applied.analysed_only = ["true"];
  }

  const taxonomyFilters = Object.keys(applied).filter((k) => !["industries", "brands", "formats", "analysed_only"].includes(k));
  const ranks = Boolean(query) || taxonomyFilters.length > 0;
  let sort: "relevance" | "newest" = ranks ? "relevance" : "newest";
  if (input.sort === "newest" && ranks) {
    throw invalid("sort=newest is available when the search has no query and no creative filters (industry, brand, format and analysed_only are fine). Drop the sort to rank by relevance.");
  }
  if (input.sort === "relevance" && !ranks) {
    warnings.push("Nothing to rank by (no query or creative filter), so results are newest first.");
    sort = "newest";
  }

  if (query) request.query = queryMode === "any_word" ? anyWord(query) : query;

  // What every answer ends with: when nothing matched on the first page, ways to widen the search
  // the caller can choose (never run for them)
  const finish = (posts: SearchOutputT["posts"], nextCursor: string | null, ranking: "keyword" | "hybrid") => {
    const suggestions = posts.length === 0 && !input.cursor ? relaxations(query, queryMode, applied) : [];
    const suggestedQueries = posts.length === 0 && !input.cursor && queryMode === "natural" && !filters.analysed_only
      ? searchRefinements(Object.fromEntries(Object.entries(FILTERS).flatMap(([key, { dimension }]) => applied[key] ? [[dimension, applied[key]]] : [])), query ?? "") : [];
    return {
      data: {
        posts,
        next_cursor: nextCursor,
        applied: { query, original_query: originalQuery, query_mode: queryMode, filters: applied, sort, limit, ranking },
        suggestions,
        suggested_queries: suggestedQueries,
      },
      warnings,
    };
  };

  // Hybrid search, for a natural-language request with words left to search. A cursor from a
  // keyword-only page (an earlier fallback) carries on below as keyword search
  const models = ctx.semantic;
  if (models && repo.hybridCandidates && repo.hybridItems && queryMode === "natural" && query && originalQuery && sort === "relevance") {
    const search = await fingerprint({ originalQuery, query, queryMode, applied: canonical(applied), sort, ranking: "hybrid" });
    const scope = { search, principal: ctx.principalKey };
    const page = input.cursor ? await decodeCursor(ctx.signingSecret, input.cursor, scope).catch(() => null) : null;
    if (!input.cursor || page) {
      try {
        if (remainingMs() < HYBRID_MIN_BUDGET_MS) throw new Error("Not enough time left in the call to rank by meaning");
        const { posts, next } = await hybridPage(repo, models, request, originalQuery, search, limit, page?.offset ?? 0, warnings, !input.cursor);
        const marker = next.marker ?? page?.marker ?? null;
        if (page?.marker && next.marker && page.marker !== next.marker) {
          warnings.push("The library changed since this search's first page (posts were added or removed), so this page may repeat or skip a post. Start the search again for one consistent set.");
        }
        const nextCursor = next.offset !== null ? await encodeCursor(ctx.signingSecret, { offset: next.offset, marker, ...scope }) : null;
        return finish(posts.map((p) => toHit(repo, p.hit, p.extra)), nextCursor, "hybrid");
      } catch (error) {
        if (page) throw invalid("Ranking by meaning isn't available right now, so this search can't continue in the same order. Start the search again.");
        ctx.log?.warn("search_hybrid_unavailable", { reason: error instanceof Error ? error.message : String(error) });
        warnings.push("Ranking by meaning isn't available right now, so these results come from keyword search alone.");
      }
    }
  }

  request.limit = limit;
  // The same search sent with its filters in another order is the same search, so the
  // fingerprint sees them sorted
  const search = await fingerprint({ originalQuery, query, queryMode, applied: canonical(applied), sort });
  const cursorScope = { search, principal: ctx.principalKey };
  const page = input.cursor ? await decodeCursor(ctx.signingSecret, input.cursor, cursorScope) : null;
  request.offset = page?.offset ?? 0;

  const result = await repo.search(request).catch((error) => {
    throw toCuratitError(error);
  });

  // The first page's cursor carries the catalog's marker; a later page from a changed library
  // (posts published or unpublished in between) is still served, with a warning, since the
  // offsets are still valid, only shifted
  const marker = result.catalog_marker ?? page?.marker ?? null;
  if (page?.marker && result.catalog_marker && page.marker !== result.catalog_marker) {
    warnings.push("The library changed since this search's first page (posts were added or removed), so this page may repeat or skip a post. Start the search again for one consistent set.");
  }

  const posts = result.posts.map((hit) => toHit(repo, hit));
  const nextCursor = result.has_more && result.next_offset !== null ? await encodeCursor(ctx.signingSecret, { offset: result.next_offset, marker, ...cursorScope }) : null;
  if (result.has_more && result.next_offset === null) warnings.push("The catalog's search stops at 500 results per query. Narrow the search to go further.");
  return finish(posts, nextCursor, "keyword");
}

// A hybrid search's order, kept a few minutes per process (2026-10-26, docs/performance/): an
// assistant paging through results, or asking the same thing again, had it embedded, ranked and
// reranked from scratch every time (a database call and about a second of reranking a page). Only
// the order is kept; every page reads its posts fresh, so one unpublished since is left out, and a
// post published since joins once the order expires. Bounded, keyed by everything the order
// depends on, and searches asked at the same time share one ranking
type Ranking = { ranked: ReturnType<typeof settle>; keywordTotal: number; marker: string | null };
const RANKING_TTL_MS = 5 * 60_000;
const RANKINGS_KEPT = 200;
const RANKING_VERSION = `${RERANK_CUTOFF}`;
const rankings = new Map<string, { at: number; value: Promise<Ranking> }>();

function rankingOnce(key: string, compute: () => Promise<Ranking>) {
  const held = rankings.get(key);
  if (held && Date.now() - held.at < RANKING_TTL_MS) return held.value;
  const value = compute();
  rankings.delete(key);
  rankings.set(key, { at: Date.now(), value });
  while (rankings.size > RANKINGS_KEPT) rankings.delete(rankings.keys().next().value!);
  // A failed ranking isn't kept
  value.catch(() => {
    if (rankings.get(key)?.value === value) rankings.delete(key);
  });
  return value;
}

async function rankHybrid(repo: CatalogRepository, models: SemanticModels, request: RawSearchRequest, originalQuery: string): Promise<Ranking> {
  markStage("embed");
  const [embedding] = await models.embed([originalQuery]);
  const candidates = await repo.hybridCandidates!(request, embedding);
  markStage("rerank");
  const described = candidates.fused.map((c, i) => ({ i, text: c.description }));
  const scored = described.filter((d) => d.text);
  const scores = new Array<number | null>(candidates.fused.length).fill(null);
  // The reranker reads the request twice, as written and as the words the interpreter left (no
  // framing, no filter words: every candidate already meets the filters, and a description says
  // "Crypto & Web3, Finance" where the request said "fintech brands"), and each post keeps its
  // better score. Either reading alone loses posts the other finds (docs/search-eval/, 26 October)
  const readings = [...new Set([originalQuery.trim(), request.query].filter((r): r is string => Boolean(r)))];
  for (const reading of readings) {
    (await models.rerank(reading, scored.map((d) => d.text!))).forEach((score, j) => (scores[scored[j].i] = Math.max(scores[scored[j].i] ?? 0, score)));
  }
  const ranked = settle(
    candidates.fused.map((c) => ({ id: c.id, keywordRank: c.keyword_rank, similarity: c.similarity, kind: c.kind, description: c.description })),
    scores,
    candidates.keyword_rest,
  );
  return { ranked, keywordTotal: candidates.keyword_total, marker: candidates.catalog_marker ?? null };
}

// One page of a hybrid search: the order (above), then the page's posts read in order
async function hybridPage(repo: CatalogRepository, models: SemanticModels, request: RawSearchRequest, originalQuery: string, search: string, limit: number, offset: number, warnings: string[], firstPage: boolean) {
  const { ranked, keywordTotal, marker } = await rankingOnce(`${RANKING_VERSION}|${search}`, () => rankHybrid(repo, models, request, originalQuery));
  if (firstPage && keywordTotal > 50) {
    warnings.push(`${keywordTotal} posts match the words; this search ranks the first 50 of them with the meaning-based matches. Narrow the search to reach the others.`);
  }
  const slice = ranked.slice(offset, offset + limit);
  const items = slice.length ? await repo.hybridItems!(request, slice.map((r) => r.id)) : { posts: [], catalog_marker: marker };
  const byId = new Map(items.posts.map((hit) => [hit.id, hit]));
  // A post unpublished between the two reads is left out
  const posts = slice.flatMap((r) => {
    const hit = byId.get(r.id);
    return hit ? [{ hit, extra: { reasons: r.meaningOnly ? [meaningReason(r.kind)] : [], score: r.rerank === null ? null : Math.round(r.rerank * 1e4) / 1e4 } }] : [];
  });
  return { posts, next: { offset: offset + limit < ranked.length ? offset + limit : null, marker: marker ?? items.catalog_marker ?? null } };
}

// The dashboard's search by meaning (/api/search, 2026-10-28): the same order for a request the
// browser has already interpreted, kept the same way. Every post id in order: the matches the
// reranker keeps, best first, then the rest of the first 50 keyword matches; the browser appends
// the keyword matches past those from its own keyword search
export async function hybridOrder(repo: CatalogRepository, models: SemanticModels, request: RawSearchRequest, originalQuery: string) {
  const search = await fingerprint({ originalQuery, request: canonical(request as Record<string, unknown>), ranking: "dashboard" });
  const { ranked } = await rankingOnce(`${RANKING_VERSION}|${search}`, () => rankHybrid(repo, models, request, originalQuery));
  return { ids: ranked.map((r) => r.id) };
}

// Forget every kept order (tests)
export function clearRankings() {
  rankings.clear();
}

function toHit(repo: CatalogRepository, hit: RawSearchHit, extra?: { reasons: string[]; score: number | null }): SearchOutputT["posts"][number] {
  return {
    post_id: hit.id,
    short_code: hit.short_code,
    source_url: hit.source_url,
    brand: brandOf(hit),
    industry: industryOf(hit),
    format: hit.format,
    posted_at: hit.posted_at,
    caption_excerpt: excerpt(hit.caption, 240),
    thumbnail: {
      available: Boolean(hit.cover),
      media_id: hit.cover ? mediaId(hit.id, hit.cover.position) : null,
      url: hit.cover ? repo.publicUrl(hit.cover.path) : null,
    },
    classification: classification(hit.analysis),
    analysis_available: Boolean(hit.analysis),
    match_reasons: [...(hit.reasons ?? []), ...(extra?.reasons ?? [])].map(oneBasedSlides),
    score: extra ? extra.score : typeof hit.score === "number" ? hit.score : null,
  };
}

// The applied filters (or a request) with keys and list values in one order, for a fingerprint
function canonical(applied: Record<string, unknown>) {
  return Object.fromEntries(
    Object.keys(applied)
      .sort()
      .map((k) => {
        const value = applied[k];
        return [k, Array.isArray(value) ? [...value].sort() : value];
      }),
  );
}

// The function's reasons count slides from zero ("seen on slide 0, 1"); people count from 1
function oneBasedSlides(reason: string) {
  return reason.replace(/seen on slide ([\d, ]+)/, (_, list: string) => `seen on slide ${list.split(",").map((n) => String(Number(n.trim()) + 1)).join(", ")}`);
}

// websearch syntax: "a or b or c" matches any word; quoted phrases are kept whole
function anyWord(query: string) {
  const parts = query.match(/"[^"]+"|\S+/g) ?? [];
  const words = parts.filter((p) => p.toLowerCase() !== "or");
  return words.length > 1 ? words.join(" or ") : query;
}

function relaxations(query: string | null, queryMode: "natural" | "all_words" | "any_word", applied: Record<string, string[]>) {
  const out: string[] = [];
  if (query && queryMode !== "any_word" && query.split(/\s+/).length > 1) {
    out.push('Every word has to match. Try query_mode "any_word", or fewer, more specific words.');
  }
  if (query && Object.keys(applied).length) out.push("Try the query alone, without filters, or the filters alone.");
  for (const key of Object.keys(applied)) {
    if (key === "analysed_only") out.push("Drop analysed_only: only a small part of the library has a published analysis so far.");
    else out.push(`Drop or widen the ${key} filter (${applied[key].join(", ")}).`);
  }
  if (!out.length) out.push("Try different words; the search matches captions, on-slide text and published analyses.");
  return out;
}
