import { cache } from "react";
import { createPublicClient } from "@/utils/supabase/public";

// A published library post as the site shows it, read from Supabase
export type LibraryPost = {
  shortCode: string;
  url: string;
  format: "static" | "carousel" | "video";
  // First sentence of the caption, for card titles
  hook: string;
  postedAt: string;
  width: number | null;
  height: number | null;
  // logo is the URL of the brand's mark in the `library` bucket (via /lib), if it has one
  brand: { name: string; slug: string; logo: string | null };
  category: { name: string; slug: string };
  // URLs of the post's files in the `library` bucket (via /lib), cover first, then each carousel slide
  images: string[];
};

type Row = {
  short_code: string;
  url: string;
  format: LibraryPost["format"];
  caption: string | null;
  posted_at: string;
  dimensions_width: number | null;
  dimensions_height: number | null;
  brands: { name: string; slug: string; logo_path: string | null; categories: { name: string; slug: string } | null } | null;
  post_images: { position: number; path: string }[];
};

function hookFrom(caption: string | null) {
  const text = (caption ?? "").replace(/\s+/g, " ").trim();
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  return sentence.length > 90 ? `${sentence.slice(0, 88).trimEnd()}…` : sentence;
}

// Every published post that has images, newest first. Runs at build time (and on revalidation).
export const getPublishedPosts = cache(async (): Promise<LibraryPost[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select(
      "short_code, url, format, caption, posted_at, dimensions_width, dimensions_height, brands(name, slug, logo_path, categories(name, slug)), post_images(position, path)"
    )
    .eq("is_published", true)
    .order("posted_at", { ascending: false })
    .returns<Row[]>();
  if (error) throw new Error(`Could not load library posts from Supabase: ${error.message}`);

  // /lib/<path> is rewritten to the public `library` bucket (next.config.ts)
  const libraryUrl = (path: string) => `/lib/${path}`;
  return data
    .filter((row) => row.brands?.categories && row.post_images.length)
    .map((row) => ({
      shortCode: row.short_code,
      url: row.url,
      format: row.format,
      hook: hookFrom(row.caption),
      postedAt: row.posted_at,
      width: row.dimensions_width,
      height: row.dimensions_height,
      brand: {
        name: row.brands!.name,
        slug: row.brands!.slug,
        logo: row.brands!.logo_path ? libraryUrl(row.brands!.logo_path) : null,
      },
      category: row.brands!.categories!,
      images: row.post_images
        .toSorted((a, b) => a.position - b.position)
        .map((image) => libraryUrl(image.path)),
    }));
});

// One post with everything its detail page shows: every slide, the full caption and the
// counts at scrape time (Instagram reports a hidden like count as -1, kept here as null)
export type PostDetail = LibraryPost & { caption: string; likes: number | null; comments: number | null };

export const getPostDetail = cache(async (shortCode: string): Promise<PostDetail | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select(
      "short_code, url, format, caption, posted_at, dimensions_width, dimensions_height, likes_count, comments_count, brands(name, slug, logo_path, categories(name, slug)), post_images(position, path)"
    )
    .eq("is_published", true)
    .eq("short_code", shortCode)
    .returns<(Row & { likes_count: number | null; comments_count: number | null })[]>()
    .maybeSingle();
  if (error) throw new Error(`Could not load post ${shortCode} from Supabase: ${error.message}`);
  if (!data?.brands?.categories || !data.post_images.length) return null;

  const libraryUrl = (path: string) => `/lib/${path}`;
  const count = (value: number | null) => (value == null || value < 0 ? null : value);
  return {
    shortCode: data.short_code,
    url: data.url,
    format: data.format,
    hook: hookFrom(data.caption),
    caption: (data.caption ?? "").trim(),
    postedAt: data.posted_at,
    width: data.dimensions_width,
    height: data.dimensions_height,
    likes: count(data.likes_count),
    comments: count(data.comments_count),
    brand: {
      name: data.brands.name,
      slug: data.brands.slug,
      logo: data.brands.logo_path ? libraryUrl(data.brands.logo_path) : null,
    },
    category: data.brands.categories,
    images: data.post_images.toSorted((a, b) => a.position - b.position).map((image) => libraryUrl(image.path)),
  };
});

// A URL from Next's image optimizer, for places that need a plain <img> src
export function optimizedImage(src: string, width = 640, quality = 75) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

// The newest posts in a category, taking one brand at a time so a set isn't all one brand
export function categoryPosts(posts: LibraryPost[], category: string, count: number) {
  const queues = Map.groupBy(
    posts.filter((post) => post.category.slug === category),
    (post) => post.brand.slug
  );
  const picked: LibraryPost[] = [];
  while (picked.length < count && [...queues.values()].some((queue) => queue.length)) {
    for (const queue of queues.values()) {
      const next = queue.shift();
      if (next && picked.length < count) picked.push(next);
    }
  }
  return picked;
}

// A post with only its cover, for places that never show the other slides. Keeps the
// data the page sends to the browser small.
export const withCoverOnly = (post: LibraryPost): LibraryPost => ({ ...post, images: post.images.slice(0, 1) });
