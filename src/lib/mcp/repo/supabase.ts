// The catalog repository over Supabase. Reads go through the publishable key, so Row Level
// Security decides what's visible (published posts, published analyses), and the curatit_mcp_*
// functions, which filter the same way themselves. One thing needs the secret key: when a post's
// counts were collected lives in scrape_runs, which only editors can read, so that one lookup
// runs as service_role and is filtered to published posts by hand. Every request has a timeout.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { toCuratitError } from "../errors";
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

// supabase-js lets us swap fetch; this one gives every request a deadline, joined with whatever
// signal the caller passed
function fetchWithTimeout(ms: number): typeof fetch {
  return (input, init) => {
    const signals = [AbortSignal.timeout(ms), ...(init?.signal ? [init.signal] : [])];
    return fetch(input, { ...init, signal: AbortSignal.any(signals) });
  };
}

export function catalogClient(url: string, key: string, timeoutMs = READ_TIMEOUT_MS): SupabaseClient<Database> {
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout(timeoutMs) },
  });
}

async function rpc<T>(call: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>): Promise<T> {
  try {
    const { data, error } = await call;
    if (error) throw toCuratitError(error);
    return data as T;
  } catch (error) {
    throw toCuratitError(error);
  }
}

export function createSupabaseCatalog(options: { url: string; publishableKey: string; secretKey: string }): CatalogRepository {
  const reader = catalogClient(options.url, options.publishableKey);
  const admin = catalogClient(options.url, options.secretKey);
  const base = `${options.url.replace(/\/$/, "")}/storage/v1/object/public/library/`;

  // The taxonomy lists page by slug; collect every page
  async function listTaxonomy<T extends { slug: string }>(kind: "categories" | "brands"): Promise<T[]> {
    const items: T[] = [];
    let after = "";
    for (let i = 0; i < 20; i++) {
      const page = await rpc<{ items: T[]; next: string | null }>(reader.rpc("curatit_mcp_taxonomy", { p_kind: kind, p_after: after, p_limit: 50 }));
      items.push(...(page.items ?? []));
      if (!page.next) break;
      after = page.next;
    }
    return items;
  }

  return {
    search: (request) => rpc<RawSearchResult>(reader.rpc("curatit_mcp_search_v2", { p_request: request as RawSearchRequest as never })),

    getPost: async (postId) => {
      const post = await rpc<RawPost | null>(reader.rpc("curatit_mcp_get_post_v2", { p_id: postId }));
      return post && post.id ? post : null;
    },

    resolvePost: async (idOrShortCode) => {
      const { data, error } = await reader
        .from("instagram_posts")
        .select("id, short_code")
        .or(`id.eq.${idOrShortCode},short_code.eq.${idOrShortCode}`)
        .limit(1)
        .maybeSingle();
      if (error) throw toCuratitError(error);
      return data ? { id: data.id, short_code: data.short_code } : null;
    },

    terms: () => rpc<RawTerms>(reader.rpc("curatit_mcp_creative_terms", {})),

    categories: () => listTaxonomy<RawCategoryItem>("categories"),

    brands: async () => {
      const [items, websites] = await Promise.all([
        listTaxonomy<RawBrandItem>("brands"),
        reader.from("brands").select("slug, website_url").then(({ data, error }) => {
          if (error) throw toCuratitError(error);
          return new Map((data ?? []).map((row) => [row.slug, row.website_url]));
        }),
      ]);
      return items.map((item) => ({ ...item, website: websites.get(item.slug) ?? null }));
    },

    // The function names its kinds in the plural
    resolveFilter: (kind, value) => rpc<string | null>(reader.rpc("curatit_mcp_resolve_filter", { p_kind: kind === "category" ? "categories" : "brands", p_value: value })),

    slides: async (postId) => {
      const [post, media] = await Promise.all([
        reader.from("instagram_posts").select("alt, dimensions_width, dimensions_height, format").eq("id", postId).maybeSingle(),
        reader.from("instagram_post_media").select("position, alt, type, dimensions_width, dimensions_height").eq("post_id", postId).order("position"),
      ]);
      if (post.error) throw toCuratitError(post.error);
      if (media.error) throw toCuratitError(media.error);
      if (!post.data) return [];
      if (media.data && media.data.length > 0) {
        return media.data.map((row) => ({
          position: row.position,
          alt: row.alt,
          was_video: row.type === "Video",
          width: row.dimensions_width,
          height: row.dimensions_height,
        }));
      }
      return [{ position: 0, alt: post.data.alt, was_video: post.data.format === "video", width: post.data.dimensions_width, height: post.data.dimensions_height }];
    },

    metricsObservedAt: async (postId) => {
      // service_role sees everything, so the published filter is explicit here
      const { data, error } = await admin
        .from("instagram_posts")
        .select("is_published, scrape_runs(scraped_at)")
        .eq("id", postId)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw toCuratitError(error);
      const run = data?.scrape_runs as { scraped_at: string } | { scraped_at: string }[] | null | undefined;
      const row = Array.isArray(run) ? run[0] : run;
      return row?.scraped_at ?? null;
    },

    publicUrl: (path) => base + path.split("/").map(encodeURIComponent).join("/"),
  };
}
