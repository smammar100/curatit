import { cache } from "react";
import { createPublicClient } from "@/utils/supabase/public";

// A published library post as the site shows it, read from Supabase
export type LibraryPost = {
  // instagram_posts.id, which board_posts refers to; the short code is what URLs use
  id: string;
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
  id: string;
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
      "id, short_code, url, format, caption, posted_at, dimensions_width, dimensions_height, brands(name, slug, logo_path, categories(name, slug)), post_images(position, path)"
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
      id: row.id,
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

// One post with everything its detail page shows: every slide (and which were videos on
// Instagram, where the library keeps only the cover frame), the full caption, the public counts
// as scraped (Instagram reports a hidden like count as -1, kept here as null) and the account
// that posted it. No comparison with the brand's or the category's other posts: a brand has
// about five posts here, of different ages and formats, too few for a fair benchmark, and the
// old "× the brand's average" read 0.0× for a quiet post (Creative Intelligence 2.0, 2026-10-11)
export type PostDetail = LibraryPost & {
  caption: string;
  likes: number | null;
  comments: number | null;
  handle: string | null;
  verified: boolean;
  // One per image, in the same order
  videos: boolean[];
};

type DetailRow = Row & {
  likes_count: number | null;
  comments_count: number | null;
  owner_username: string | null;
  owner: { is_verified: boolean | null } | null;
  instagram_post_media: { position: number; type: string | null }[];
};

export const getPostDetail = cache(async (shortCode: string): Promise<PostDetail | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select(
      "id, short_code, url, format, caption, posted_at, dimensions_width, dimensions_height, likes_count, comments_count, owner_username, owner:instagram_accounts!instagram_posts_owner_id_fkey(is_verified), brands(name, slug, logo_path, categories(name, slug)), post_images(position, path), instagram_post_media!instagram_post_media_post_id_fkey(position, type)"
    )
    .eq("is_published", true)
    .eq("short_code", shortCode)
    .returns<DetailRow[]>()
    .maybeSingle();
  if (error) throw new Error(`Could not load post ${shortCode} from Supabase: ${error.message}`);
  if (!data?.brands?.categories || !data.post_images.length) return null;

  const category = data.brands.categories;
  const libraryUrl = (path: string) => `/lib/${path}`;
  const count = (value: number | null) => (value == null || value < 0 ? null : value);
  const images = data.post_images.toSorted((a, b) => a.position - b.position);
  const media = new Map(data.instagram_post_media.map((m) => [m.position, m.type?.toLowerCase()]));

  return {
    id: data.id,
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
    handle: data.owner_username,
    verified: !!data.owner?.is_verified,
    brand: {
      name: data.brands.name,
      slug: data.brands.slug,
      logo: data.brands.logo_path ? libraryUrl(data.brands.logo_path) : null,
    },
    category,
    images: images.map((image) => libraryUrl(image.path)),
    videos: images.map((image) => (data.format === "video" ? image.position === 0 : media.get(image.position) === "video")),
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
