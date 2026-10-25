// The catalog repository over Supabase. Reads go through the publishable key, so Row Level
// Security decides what's visible (published posts, published analyses), and the curatit_mcp_*
// functions, which filter the same way themselves. One thing needs the secret key: when a post's
// counts were collected lives in scrape_runs, which only editors can read, so that one lookup
// runs as service_role and is filtered to published posts by hand. Every request has a timeout
// and ends with the call's deadline, and a failure names the stage it happened in.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { currentSignal, markStage, remainingMs, withDeadline } from "../deadline";
import { toCuratitError, upstreamFailure } from "../errors";
import type {
  CatalogRepository,
  RawBrandItem,
  RawCategoryItem,
  RawPost,
  RawSearchRequest,
  RawSearchResult,
  RawSlide,
  RawTerms,
} from "./types";

const READ_TIMEOUT_MS = 10_000;
// One quick retry of a read that met a gateway hiccup, after this pause (plus jitter)
const RETRY_PAUSE_MS = 150;
const RETRY_STATUS = new Set([503, 520]);

const isAbort = (error: unknown) => {
  const name = (error as { name?: unknown } | null)?.name;
  return name === "AbortError" || name === "TimeoutError";
};

function pause(ms: number, signal: AbortSignal | undefined) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(timer), reject(signal.reason)), { once: true });
  });
}

// supabase-js lets us swap fetch. This one gives every request its own timeout, joined with the
// call's deadline (deadline.ts) and any signal the caller passed, so nothing outlives the call.
// postgrest-js's own retries are off (catalogClient): they retried our timeouts too, up to three
// times with 1, 2 and 4 s pauses, which turned one hung read into 47 s. Instead a GET (a plain
// read) that failed fast, on a network error, 503 or 520, gets one more try when the deadline
// leaves room for it; a timeout or an abort is never retried, and nothing that writes is.
function fetchWithTimeout(ms: number, fetchImpl: typeof fetch = fetch): typeof fetch {
  const once = (input: Parameters<typeof fetch>[0], init?: RequestInit) => fetchImpl(input, { ...init, signal: withDeadline(ms, init?.signal) });
  return async (input, init) => {
    if ((init?.method ?? "GET").toUpperCase() !== "GET") return once(input, init);
    const delay = RETRY_PAUSE_MS + Math.floor(Math.random() * RETRY_PAUSE_MS);
    const roomToRetry = () => remainingMs() > delay + 2_000;
    try {
      const res = await once(input, init);
      if (!RETRY_STATUS.has(res.status) || !roomToRetry()) return res;
      await res.body?.cancel().catch(() => {});
    } catch (error) {
      if (isAbort(error) || init?.signal?.aborted || currentSignal()?.aborted || !roomToRetry()) throw error;
    }
    await pause(delay, currentSignal());
    return once(input, init);
  };
}

export function catalogClient(url: string, key: string, timeoutMs = READ_TIMEOUT_MS, fetchImpl?: typeof fetch): SupabaseClient<Database> {
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { retry: false },
    global: { fetch: fetchWithTimeout(timeoutMs, fetchImpl) },
  });
}

type Reply = { data: unknown; error: unknown; status: number };

// Awaits one database request as a named stage of the call. A failure keeps what supabase-js
// reports (the Postgres or PostgREST code, the HTTP status, the message) tagged with the stage,
// and becomes the CuratitError that code calls for (errors.ts)
async function query<R extends Reply>(stage: string, request: PromiseLike<R>): Promise<R["data"]> {
  markStage(stage);
  let result: R;
  try {
    result = await request;
  } catch (error) {
    throw toCuratitError(upstreamFailure(stage, error, 0));
  }
  if (result.error) throw toCuratitError(upstreamFailure(stage, result.error, result.status));
  return result.data;
}

const rpc = <T>(stage: string, request: PromiseLike<Reply>) => query(stage, request) as Promise<T>;

// The vocabulary (taxonomy terms, industries, brands) changes when an import or a migration lands,
// not between searches, yet every natural-language search read all three first: four round trips
// before the search itself. One read per server instance every few minutes; a failed read isn't
// kept, and the posts counts in curatit_get_taxonomy may be that much behind
export const VOCABULARY_TTL_MS = 5 * 60_000;
function recent<T>(load: () => Promise<T>): () => Promise<T> {
  let held: { at: number; value: Promise<T> } | null = null;
  return () => {
    if (!held || Date.now() - held.at > VOCABULARY_TTL_MS) {
      const value = load();
      held = { at: Date.now(), value };
      value.catch(() => {
        if (held?.value === value) held = null;
      });
    }
    return held.value;
  };
}

// `fetch` is for tests: a stand-in for the network
export function createSupabaseCatalog(options: { url: string; publishableKey: string; secretKey: string; fetch?: typeof fetch }): CatalogRepository {
  const reader = catalogClient(options.url, options.publishableKey, READ_TIMEOUT_MS, options.fetch);
  const admin = catalogClient(options.url, options.secretKey, READ_TIMEOUT_MS, options.fetch);
  const base = `${options.url.replace(/\/$/, "")}/storage/v1/object/public/library/`;

  // The taxonomy lists page by slug; collect every page
  async function listTaxonomy<T extends { slug: string }>(kind: "categories" | "brands"): Promise<T[]> {
    const items: T[] = [];
    let after = "";
    for (let i = 0; i < 20; i++) {
      const page = await rpc<{ items: T[]; next: string | null }>(`taxonomy_${kind}`, reader.rpc("curatit_mcp_taxonomy", { p_kind: kind, p_after: after, p_limit: 50 }));
      items.push(...(page.items ?? []));
      if (!page.next) break;
      after = page.next;
    }
    return items;
  }

  return {
    search: (request) => rpc<RawSearchResult>("search_v2", reader.rpc("curatit_mcp_search_v2", { p_request: request as RawSearchRequest as never })),

    getPost: async (postId) => {
      const post = await rpc<RawPost | null>("get_post_v2", reader.rpc("curatit_mcp_get_post_v2", { p_id: postId }));
      return post && post.id ? post : null;
    },

    resolvePost: async (idOrShortCode) => {
      const data = await query(
        "resolvePost",
        reader
          .from("instagram_posts")
          .select("id, short_code")
          .or(`id.eq.${idOrShortCode},short_code.eq.${idOrShortCode}`)
          .limit(1)
          .maybeSingle(),
      );
      return data ? { id: data.id, short_code: data.short_code } : null;
    },

    terms: recent(() => rpc<RawTerms>("creative_terms", reader.rpc("curatit_mcp_creative_terms", {}))),

    categories: recent(() => listTaxonomy<RawCategoryItem>("categories")),

    brands: recent(async () => {
      const [items, websites] = await Promise.all([
        listTaxonomy<RawBrandItem>("brands"),
        query("brand_websites", reader.from("brands").select("slug, website_url")).then((data) => new Map((data ?? []).map((row) => [row.slug, row.website_url]))),
      ]);
      return items.map((item) => ({ ...item, website: websites.get(item.slug) ?? null }));
    }),

    // The function names its kinds in the plural
    resolveFilter: (kind, value) => rpc<string | null>("resolve_filter", reader.rpc("curatit_mcp_resolve_filter", { p_kind: kind === "category" ? "categories" : "brands", p_value: value })),

    slides: async (postId) => {
      const [post, media] = await Promise.all([
        query("slides_post", reader.from("instagram_posts").select("alt, dimensions_width, dimensions_height, format").eq("id", postId).maybeSingle()),
        query("slides_media", reader.from("instagram_post_media").select("position, alt, type, dimensions_width, dimensions_height").eq("post_id", postId).order("position")),
      ]);
      if (!post) return [];
      if (media && media.length > 0) {
        return media.map((row) => ({
          position: row.position,
          alt: row.alt,
          was_video: row.type === "Video",
          width: row.dimensions_width,
          height: row.dimensions_height,
        }));
      }
      return [{ position: 0, alt: post.alt, was_video: post.format === "video", width: post.dimensions_width, height: post.dimensions_height }];
    },

    metricsObservedAt: async (postId) => {
      // service_role sees everything, so the published filter is explicit here
      const data = await query("metrics_observed_at", admin.from("instagram_posts").select("is_published, scrape_runs(scraped_at)").eq("id", postId).eq("is_published", true).maybeSingle());
      const run = data?.scrape_runs as { scraped_at: string } | { scraped_at: string }[] | null | undefined;
      const row = Array.isArray(run) ? run[0] : run;
      return row?.scraped_at ?? null;
    },

    publicUrl: (path) => base + path.split("/").map(encodeURIComponent).join("/"),
  };
}
