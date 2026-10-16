// curatit_search_posts over the catalog's search function. The service owns the rules the
// schema can't express: a search needs a query or a filter; an industry or brand must exist
// (the database would quietly return nothing for an unknown one); `newest` only when nothing
// ranks; and nothing is ever relaxed behind the caller's back: an empty page comes back empty
// with suggestions. Pages are signed cursors over the function's offsets.

import { FILTERS, type FilterKey, type SearchInputT, type SearchOutputT } from "../contracts";
import { decodeCursor, encodeCursor, fingerprint } from "../cursor";
import { invalid, toCuratitError } from "../errors";
import type { CatalogRepository, RawSearchRequest } from "../repo/types";
import { brandOf, classification, excerpt, industryOf, mediaId, nameKey } from "./shared";

export const SEARCH_DEFAULT_LIMIT = 8;

export type SearchContext = { signingSecret: Uint8Array<ArrayBuffer>; principalKey: string };

export async function searchPosts(repo: CatalogRepository, input: SearchInputT, ctx: SearchContext): Promise<{ data: SearchOutputT; warnings: string[] }> {
  const query = input.query?.trim() || null;
  const queryMode = input.query_mode ?? "all_words";
  const filters = input.filters ?? {};
  const limit = input.limit ?? SEARCH_DEFAULT_LIMIT;
  const warnings: string[] = [];

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
  request.limit = limit;

  // The same search sent with its filters in another order is the same search, so the
  // fingerprint sees them sorted
  const search = await fingerprint({ query, queryMode, applied: canonical(applied), sort });
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

  const posts = result.posts.map((hit) => ({
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
    match_reasons: (hit.reasons ?? []).map(oneBasedSlides),
    score: typeof hit.score === "number" ? hit.score : null,
  }));

  const nextCursor = result.has_more && result.next_offset !== null ? await encodeCursor(ctx.signingSecret, { offset: result.next_offset, marker, ...cursorScope }) : null;
  if (result.has_more && result.next_offset === null) warnings.push("The catalog's search stops at 500 results per query. Narrow the search to go further.");

  const suggestions = posts.length === 0 && !input.cursor ? relaxations(query, queryMode, applied) : [];

  return {
    data: {
      posts,
      next_cursor: nextCursor,
      applied: { query, query_mode: queryMode, filters: applied, sort, limit },
      suggestions,
    },
    warnings,
  };
}

// The applied filters with keys and values in one order, for the cursor's fingerprint
function canonical(applied: Record<string, string[]>) {
  return Object.fromEntries(
    Object.keys(applied)
      .sort()
      .map((k) => [k, [...applied[k]].sort()]),
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

function relaxations(query: string | null, queryMode: "all_words" | "any_word", applied: Record<string, string[]>) {
  const out: string[] = [];
  if (query && queryMode === "all_words" && query.split(/\s+/).length > 1) {
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
