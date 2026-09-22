import { filterDimensions, type FilterDimension } from "../taxonomy";
import type { SearchFilters } from "../services/creatives";

export type RawParams = Record<string, string | string[] | undefined>;

const dimensions = Object.keys(filterDimensions) as FilterDimension[];

function list(value: string | string[] | undefined) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

/** URL search params → search input. Unknown terms are dropped, not errors. */
export function parseSearchParams(params: RawParams) {
  const filters: SearchFilters = {};
  for (const dimension of dimensions) {
    const known = new Set<string>(filterDimensions[dimension].terms.map((term) => term.id));
    const values = [...new Set(list(params[dimension]).filter((value) => known.has(value)))];
    if (values.length) filters[dimension] = values;
  }
  const brands = list(params.brand).filter((value) => /^[a-z0-9-]{1,80}$/.test(value));
  if (brands.length) filters.brand = [...new Set(brands)];

  const isDate = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);
  const from = isDate(list(params.from)[0]);
  const to = isDate(list(params.to)[0]);
  if (from) filters.dateFrom = from;
  if (to) filters.dateTo = to;

  const query = (list(params.q)[0] ?? "").slice(0, 1000);
  const cursor = list(params.cursor)[0];
  return { query, filters, cursor };
}

/** Search input → `/library?...` deep link. */
export function libraryHref(query: string, filters: SearchFilters, cursor?: string | null) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  for (const dimension of dimensions) {
    for (const value of filters[dimension] ?? []) params.append(dimension, value);
  }
  for (const brand of filters.brand ?? []) params.append("brand", brand);
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (cursor) params.set("cursor", cursor);
  const search = params.toString();
  return search ? `/library?${search}` : "/library";
}

export function withFilter(filters: SearchFilters, dimension: FilterDimension, id: string): SearchFilters {
  const current = filters[dimension] ?? [];
  return current.includes(id) ? filters : { ...filters, [dimension]: [...current, id] };
}

export function withoutFilter(filters: SearchFilters, key: FilterDimension | "brand", id: string): SearchFilters {
  const next = { ...filters, [key]: (filters[key] ?? []).filter((value) => value !== id) };
  if (!next[key]?.length) delete next[key];
  return next;
}
