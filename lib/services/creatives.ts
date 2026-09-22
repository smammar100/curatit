import "server-only";

import { z } from "zod";
import type { SQLInputValue } from "node:sqlite";
import { all, get, parseJson } from "../db";
import type { SlideArt } from "../art";
import { invalidInput, notFound } from "../errors";
import { sha256, signPayload, verifyPayload } from "../security";
import { interpretQuery, tokenize, type Interpretation } from "../search/interpret";
import {
  filterDimensions,
  isValidTerm,
  termName,
  type FilterDimension,
} from "../taxonomy";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CreativeSummary = {
  id: string;
  brand: { id: string; name: string; isDemo: boolean };
  categoryId: string;
  mediaType: "static" | "carousel";
  slideCount: number;
  cover: SlideArt;
  coverAlt: string;
  objectiveId: string;
  formatId: string;
  visualStyles: string[];
  narrativeId: string;
  textDensity: string;
  hook: string | null;
  publishedAt: string | null;
  capturedAt: string;
  sourceUrl: string;
  whyMatched: string[];
};

export type CreativeDetail = CreativeSummary & {
  caption: string | null;
  slides: { position: number; art: SlideArt; alt: string }[];
  summary: string;
  composition: string | null;
  narrativeSequence: string[];
  ctaType: string | null;
  dominantColors: string[];
  editorialReason: string | null;
  lastCheckedAt: string | null;
  referenceStatus: string;
  market: string;
  analysis: { humanReviewed: boolean; modelVersion: string; promptVersion: string; taxonomyVersion: string };
};

type Row = {
  id: string;
  brand_id: string;
  brand_name: string;
  is_demo: number;
  category_id: string;
  media_type: "static" | "carousel";
  caption: string | null;
  source_url: string;
  published_at: string | null;
  captured_at: string;
  objective_id: string;
  format_id: string;
  visual_styles: string;
  narrative_id: string;
  text_density: string;
  hook: string | null;
  summary: string;
  cover_art: string;
  cover_alt: string;
  slide_count: number;
};

/* -------------------------------------------------------------------------- */
/*  Input contract (plan §26)                                                  */
/* -------------------------------------------------------------------------- */

const dimensionKeys = Object.keys(filterDimensions) as [FilterDimension, ...FilterDimension[]];

const filtersSchema = z
  .object(
    Object.fromEntries(dimensionKeys.map((key) => [key, z.array(z.string()).max(20).optional()])) as Record<
      FilterDimension,
      z.ZodOptional<z.ZodArray<z.ZodString>>
    >
  )
  .extend({
    brand: z.array(z.string().max(80)).max(20).optional(),
    dateFrom: z.string().date().optional(),
    dateTo: z.string().date().optional(),
  })
  .strict();

export const searchInputSchema = z.object({
  query: z.string().max(1000).default(""),
  filters: filtersSchema.default({}),
  limit: z.number().int().min(1).max(24).default(24),
  cursor: z.string().max(500).optional(),
});

export type SearchInput = z.input<typeof searchInputSchema>;
export type SearchFilters = z.infer<typeof filtersSchema>;

export type SearchResult = {
  items: CreativeSummary[];
  total: number;
  appliedFilters: SearchFilters;
  interpretations: Interpretation[];
  nextCursor: string | null;
  mode: "browse" | "keyword+structured";
  degraded: boolean;
  notice: string | null;
};

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

const BASE_SELECT = `
  SELECT p.id, p.brand_id, b.name AS brand_name, b.is_demo, b.primary_category_id AS category_id,
         p.media_type, p.caption, p.source_url, p.published_at, p.captured_at,
         a.objective_id, a.format_id, a.visual_styles, a.narrative_id, a.text_density, a.hook, a.summary,
         s.art AS cover_art, s.alt_text AS cover_alt,
         (SELECT COUNT(*) FROM post_slides x WHERE x.post_id = p.id) AS slide_count
    FROM source_posts p
    JOIN brands b ON b.id = p.brand_id
    JOIN creative_analyses a ON a.post_id = p.id
    JOIN post_slides s ON s.post_id = p.id AND s.position = 0
`;

/** The only rows any public surface may serve (plan §25 publication invariant). */
const PUBLISHED = `p.publication_status = 'published' AND p.processing_status = 'ready'`;

function toSummary(row: Row, whyMatched: string[] = []): CreativeSummary {
  return {
    id: row.id,
    brand: { id: row.brand_id, name: row.brand_name, isDemo: row.is_demo === 1 },
    categoryId: row.category_id,
    mediaType: row.media_type,
    slideCount: row.slide_count,
    cover: parseJson<SlideArt>(row.cover_art, {} as SlideArt),
    coverAlt: row.cover_alt,
    objectiveId: row.objective_id,
    formatId: row.format_id,
    visualStyles: parseJson<string[]>(row.visual_styles, []),
    narrativeId: row.narrative_id,
    textDensity: row.text_density,
    hook: row.hook,
    publishedAt: row.published_at,
    capturedAt: row.captured_at,
    sourceUrl: row.source_url,
    whyMatched,
  };
}

function filterClauses(filters: SearchFilters) {
  const clauses: string[] = [PUBLISHED];
  const params: SQLInputValue[] = [];
  const inList = (column: string, values: string[]) => {
    clauses.push(`${column} IN (${values.map(() => "?").join(", ")})`);
    params.push(...values);
  };

  if (filters.category?.length) inList("b.primary_category_id", filters.category);
  if (filters.objective?.length) inList("a.objective_id", filters.objective);
  if (filters.mediaType?.length) inList("p.media_type", filters.mediaType);
  if (filters.format?.length) inList("a.format_id", filters.format);
  if (filters.narrative?.length) inList("a.narrative_id", filters.narrative);
  if (filters.textDensity?.length) inList("a.text_density", filters.textDensity);
  if (filters.brand?.length) inList("b.id", filters.brand);
  if (filters.visualStyle?.length) {
    clauses.push(
      `EXISTS (SELECT 1 FROM json_each(a.visual_styles) j WHERE j.value IN (${filters.visualStyle
        .map(() => "?")
        .join(", ")}))`
    );
    params.push(...filters.visualStyle);
  }
  // Missing dates never satisfy a date constraint (plan §26.2).
  if (filters.dateFrom) {
    clauses.push("p.published_at IS NOT NULL AND p.published_at >= ?");
    params.push(`${filters.dateFrom}T00:00:00.000Z`);
  }
  if (filters.dateTo) {
    clauses.push("p.published_at IS NOT NULL AND p.published_at <= ?");
    params.push(`${filters.dateTo}T23:59:59.999Z`);
  }

  return { where: clauses.join(" AND "), params };
}

function validateFilters(filters: SearchFilters) {
  for (const dimension of dimensionKeys) {
    for (const id of filters[dimension] ?? []) {
      if (!isValidTerm(dimension, id)) {
        throw invalidInput(`Unknown ${filterDimensions[dimension].label.toLowerCase()} "${id}".`, {
          field: `filters.${dimension}`,
        });
      }
    }
  }
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    throw invalidInput("The start date must be before the end date.", { field: "filters.dateFrom" });
  }
}

/** Reciprocal-rank fusion constant (plan §26.4 proposes 60). */
const RRF_K = 60;
const CANDIDATES = 100;
const BRAND_CAP = 3;

function matchesInterpretation(row: Row, term: Interpretation) {
  switch (term.dimension) {
    case "category":
      return row.category_id === term.id;
    case "objective":
      return row.objective_id === term.id;
    case "mediaType":
      return row.media_type === term.id;
    case "format":
      return row.format_id === term.id;
    case "narrative":
      return row.narrative_id === term.id;
    case "textDensity":
      return row.text_density === term.id;
    case "visualStyle":
      return parseJson<string[]>(row.visual_styles, []).includes(term.id);
  }
}

/** Cap each brand at three of the first ten results (plan §26.5). */
function diversify(rows: Row[], hasBrandFilter: boolean) {
  if (hasBrandFilter || rows.length <= 10) return rows;
  const head: Row[] = [];
  const deferred: Row[] = [];
  const perBrand = new Map<string, number>();

  for (const row of rows) {
    const count = perBrand.get(row.brand_id) ?? 0;
    if (head.length < 10 && count >= BRAND_CAP) {
      deferred.push(row);
      continue;
    }
    if (head.length < 10) perBrand.set(row.brand_id, count + 1);
    head.push(row);
  }
  return [...head.slice(0, 10), ...deferred, ...head.slice(10)];
}

export function searchCreatives(rawInput: SearchInput): SearchResult {
  const parsed = searchInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw invalidInput("Invalid search request.", { issues: parsed.error.issues.map((i) => i.path.join(".")) });
  }
  const input = parsed.data;
  validateFilters(input.filters);

  const query = input.query.trim();
  const context = sha256(JSON.stringify({ q: query, f: input.filters }));
  let offset = 0;
  if (input.cursor) {
    const decoded = verifyPayload<{ o: number }>(input.cursor, context);
    if (!decoded || !Number.isInteger(decoded.o) || decoded.o < 0) {
      throw invalidInput("This page link is no longer valid. Run the search again.", { field: "cursor" });
    }
    offset = decoded.o;
  }

  const { where, params } = filterClauses(input.filters);
  const eligible = all<Row>(`${BASE_SELECT} WHERE ${where} ORDER BY p.published_at DESC, p.id`, ...params);
  const interpretations = query ? interpretQuery(query) : [];

  let ranked: { row: Row; why: string[] }[];

  if (!query) {
    ranked = eligible.map((row) => ({ row, why: [] }));
  } else {
    const tokens = tokenize(query).slice(0, 12);
    const eligibleIds = new Set(eligible.map((row) => row.id));

    // 1. Keyword list: FTS5 bm25 over brand, caption, OCR, and reviewed analysis.
    const keywordRank = new Map<string, number>();
    if (tokens.length) {
      const ftsQuery = tokens.map((token) => `"${token}"*`).join(" OR ");
      const hits = all<{ post_id: string }>(
        "SELECT post_id FROM post_search WHERE post_search MATCH ? ORDER BY bm25(post_search, 0, 4.0, 1.0, 1.5, 2.0) LIMIT ?",
        ftsQuery,
        CANDIDATES * 3
      );
      for (const hit of hits) {
        if (eligibleIds.has(hit.post_id) && !keywordRank.has(hit.post_id)) {
          keywordRank.set(hit.post_id, keywordRank.size + 1);
          if (keywordRank.size >= CANDIDATES) break;
        }
      }
    }

    // 2. Structured list: posts whose controlled labels match interpreted terms.
    const structuredRank = new Map<string, number>();
    if (interpretations.length) {
      eligible
        .map((row) => ({ row, score: interpretations.filter((term) => matchesInterpretation(row, term)).length }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, CANDIDATES)
        .forEach((entry, index) => structuredRank.set(entry.row.id, index + 1));
    }

    // 3. Fuse with sum(1 / (60 + rank)), equal weights.
    const scored = eligible
      .map((row) => {
        const k = keywordRank.get(row.id);
        const s = structuredRank.get(row.id);
        const score = (k ? 1 / (RRF_K + k) : 0) + (s ? 1 / (RRF_K + s) : 0);
        return { row, score, k, s };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || (b.row.published_at ?? "").localeCompare(a.row.published_at ?? ""));

    ranked = scored.map(({ row, k }) => ({ row, why: explain(row, interpretations, k ? tokens : []) }));
  }

  const ordered = diversify(
    ranked.map((entry) => entry.row),
    Boolean(input.filters.brand?.length)
  );
  const whyById = new Map(ranked.map((entry) => [entry.row.id, entry.why]));
  const page = ordered.slice(offset, offset + input.limit);
  const nextOffset = offset + input.limit;

  return {
    items: page.map((row) => toSummary(row, whyById.get(row.id) ?? [])),
    total: ordered.length,
    appliedFilters: input.filters,
    interpretations,
    nextCursor: nextOffset < ordered.length ? signPayload({ o: nextOffset }, context) : null,
    mode: query ? "keyword+structured" : "browse",
    degraded: Boolean(query),
    notice: query
      ? "Semantic (embedding) search isn't connected yet. Results combine keyword matching with Curatit's creative labels."
      : null,
  };
}

/** Evidence-based match reasons built from real fields only (plan §26.6). */
function explain(row: Row, interpretations: Interpretation[], tokens: string[]) {
  const reasons: string[] = [];

  for (const term of interpretations) {
    if (matchesInterpretation(row, term)) {
      reasons.push(`${filterDimensions[term.dimension].label}: ${term.name}`);
    }
  }

  if (tokens.length) {
    const fields: Array<[string, string | null]> = [
      ["hook", row.hook],
      ["caption", row.caption],
      ["analysis", row.summary],
      ["brand", row.brand_name],
    ];
    const hitFields = fields
      .filter(([, value]) => value && tokens.some((token) => value.toLowerCase().includes(token)))
      .map(([field]) => field);
    if (hitFields.length) reasons.push(`Keyword match in ${hitFields.join(", ")}`);
    else if (!reasons.length) reasons.push("Keyword match in slide text");
  }

  return reasons.slice(0, 3);
}

/* -------------------------------------------------------------------------- */
/*  Single creative                                                            */
/* -------------------------------------------------------------------------- */

export function getCreative(id: string): CreativeDetail {
  if (!z.string().uuid().safeParse(id).success) throw notFound("Creative");

  const row = get<
    Row & {
      composition: string | null;
      narrative_sequence: string;
      cta_type: string | null;
      dominant_colors: string;
      editorial_reason: string | null;
      last_checked_at: string | null;
      reference_status: string;
      market: string;
      human_reviewed: number;
      model_version: string;
      prompt_version: string;
      taxonomy_version: string;
    }
  >(
    `SELECT base.*, a.composition, a.narrative_sequence, a.cta_type, a.dominant_colors, a.editorial_reason,
            a.human_reviewed, a.model_version, a.prompt_version, a.taxonomy_version,
            p.last_checked_at, p.reference_status, b.market
       FROM (${BASE_SELECT} WHERE ${PUBLISHED} AND p.id = ?) base
       JOIN creative_analyses a ON a.post_id = base.id
       JOIN source_posts p ON p.id = base.id
       JOIN brands b ON b.id = base.brand_id`,
    id
  );
  if (!row) throw notFound("Creative");

  const slides = all<{ position: number; art: string; alt_text: string }>(
    "SELECT position, art, alt_text FROM post_slides WHERE post_id = ? ORDER BY position",
    id
  );

  return {
    ...toSummary(row),
    caption: row.caption,
    slides: slides.map((slide) => ({
      position: slide.position,
      art: parseJson<SlideArt>(slide.art, {} as SlideArt),
      alt: slide.alt_text,
    })),
    summary: row.summary,
    composition: row.composition,
    narrativeSequence: parseJson<string[]>(row.narrative_sequence, []),
    ctaType: row.cta_type,
    dominantColors: parseJson<string[]>(row.dominant_colors, []),
    editorialReason: row.editorial_reason,
    lastCheckedAt: row.last_checked_at,
    referenceStatus: row.reference_status,
    market: row.market,
    analysis: {
      humanReviewed: row.human_reviewed === 1,
      modelVersion: row.model_version,
      promptVersion: row.prompt_version,
      taxonomyVersion: row.taxonomy_version,
    },
  };
}

/** "Related" (should-have scope): same objective or a shared visual style. */
export function relatedCreatives(creative: CreativeDetail, limit = 4): CreativeSummary[] {
  const rows = all<Row>(
    `${BASE_SELECT} WHERE ${PUBLISHED} AND p.id != ? ORDER BY p.published_at DESC`,
    creative.id
  );
  return rows
    .map((row) => {
      const styles = parseJson<string[]>(row.visual_styles, []);
      const sharedStyles = styles.filter((style) => creative.visualStyles.includes(style));
      const score = (row.objective_id === creative.objectiveId ? 2 : 0) + sharedStyles.length;
      const why: string[] = [];
      if (row.objective_id === creative.objectiveId) why.push(`Same objective: ${termName("objective", row.objective_id)}`);
      if (sharedStyles.length) why.push(`Shared style: ${sharedStyles.map((s) => termName("visualStyle", s)).join(", ")}`);
      return { row, score, why };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => toSummary(entry.row, entry.why));
}

/* -------------------------------------------------------------------------- */
/*  Facets and brands                                                          */
/* -------------------------------------------------------------------------- */

/** Published counts per term, so empty categories/values are never offered. */
export function libraryFacets(): Record<FilterDimension, Record<string, number>> {
  const rows = all<Row>(`${BASE_SELECT} WHERE ${PUBLISHED}`);
  const facets = Object.fromEntries(dimensionKeys.map((key) => [key, {}])) as Record<
    FilterDimension,
    Record<string, number>
  >;
  const bump = (dimension: FilterDimension, id: string) => {
    facets[dimension][id] = (facets[dimension][id] ?? 0) + 1;
  };

  for (const row of rows) {
    bump("category", row.category_id);
    bump("objective", row.objective_id);
    bump("mediaType", row.media_type);
    bump("format", row.format_id);
    bump("narrative", row.narrative_id);
    bump("textDensity", row.text_density);
    for (const style of parseJson<string[]>(row.visual_styles, [])) bump("visualStyle", style);
  }
  return facets;
}

export function listBrands() {
  return all<{ id: string; name: string; category_id: string; count: number; is_demo: number }>(
    `SELECT b.id, b.name, b.primary_category_id AS category_id, b.is_demo, COUNT(p.id) AS count
       FROM brands b
       JOIN source_posts p ON p.brand_id = b.id AND ${PUBLISHED}
      GROUP BY b.id
      ORDER BY b.name`
  );
}

export function libraryStats() {
  return get<{ posts: number; brands: number; categories: number }>(
    `SELECT COUNT(*) AS posts, COUNT(DISTINCT p.brand_id) AS brands,
            COUNT(DISTINCT b.primary_category_id) AS categories
       FROM source_posts p JOIN brands b ON b.id = p.brand_id
      WHERE ${PUBLISHED}`
  )!;
}
