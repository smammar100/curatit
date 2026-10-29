import { unstable_cache } from "next/cache";
import { cache } from "react";
import { CATEGORIES, categoryBySlug, inCategory, OLD_SLUGS } from "@/lib/categories";
import { batchLoader, chunks } from "@/lib/batch";
import { shareInFlight } from "@/lib/inFlight";
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
  // When it joined the library (instagram_posts.created_at): the feed leads with the newest imports
  addedAt: string;
  width: number | null;
  height: number | null;
  // logo is the URL of the brand's mark in the `library` bucket (via /lib), if it has one
  brand: { name: string; slug: string; logo: string | null };
  // The brand's main category
  category: { name: string; slug: string };
  // Every category the post is in: the main one first, then its extra tags (post_categories)
  categories: { name: string; slug: string }[];
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
  created_at: string;
  dimensions_width: number | null;
  dimensions_height: number | null;
  brands: { name: string; slug: string; logo_path: string | null; categories: { name: string; slug: string } | null } | null;
  post_images: { position: number; path: string }[];
  post_categories: { categories: { name: string; slug: string } | null }[];
};

// The main category, then the extra tags in the categories' own order. Slugs from before the
// 2026-10-13 categories read as today's, so the site shows the right ones whichever of the
// migration and the deploy lands first
const ORDER = new Map(CATEGORIES.map((category, index) => [category.slug, index]));
function current(category: { name: string; slug: string }) {
  const slug = OLD_SLUGS[category.slug] ?? category.slug;
  return { slug, name: categoryBySlug(slug)?.name ?? category.name };
}
function allCategories(main: { name: string; slug: string }, tags: Row["post_categories"]) {
  const first = current(main);
  const extra = tags.flatMap((tag) => (tag.categories ? [current(tag.categories)] : [])).filter((tag) => tag.slug !== first.slug);
  return [first, ...[...new Map(extra.map((tag) => [tag.slug, tag])).values()].toSorted((a, b) => (ORDER.get(a.slug) ?? 99) - (ORDER.get(b.slug) ?? 99))];
}

function hookFrom(caption: string | null) {
  const text = (caption ?? "").replace(/\s+/g, " ").trim();
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  return sentence.length > 90 ? `${sentence.slice(0, 88).trimEnd()}…` : sentence;
}

// Every published post that has images, newest first. Read once an hour and shared by every page
// and every build worker through Next's data cache (tag LIBRARY_TAG), not once per page: a build
// renders some 600 pages, and the read per page was most of the project's Supabase egress until
// 2026-10-25. cache() still dedupes the calls within one render.
export const LIBRARY_TAG = "library";
export const getPublishedPosts = cache(unstable_cache(shareInFlight(readPublishedPosts), ["published-posts"], { revalidate: 3600, tags: [LIBRARY_TAG] }));

export async function readPublishedPosts(): Promise<LibraryPost[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select(
      "id, short_code, url, format, caption, posted_at, created_at, dimensions_width, dimensions_height, brands(name, slug, logo_path, categories(name, slug)), post_images(position, path), post_categories(categories(name, slug))"
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
      addedAt: row.created_at,
      width: row.dimensions_width,
      height: row.dimensions_height,
      brand: {
        name: row.brands!.name,
        slug: row.brands!.slug,
        logo: row.brands!.logo_path ? libraryUrl(row.brands!.logo_path) : null,
      },
      category: current(row.brands!.categories!),
      categories: allCategories(row.brands!.categories!, row.post_categories ?? []),
      images: row.post_images
        .toSorted((a, b) => a.position - b.position)
        .map((image) => libraryUrl(image.path)),
    }));
}

// Every brand in the library with when its first post went live there, by name: the Roadmap puts
// each on its day. Published, not imported: Betterment and Airtasker were imported on 21 Oct and
// went live on 24 Oct
export type BrandJoined = { joinedAt: string; brand: LibraryPost["brand"] };
export const getBrandsJoined = cache(async (): Promise<BrandJoined[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select("published_at, brands(name, slug, logo_path)")
    .eq("is_published", true)
    .returns<{ published_at: string; brands: { name: string; slug: string; logo_path: string | null } | null }[]>();
  if (error) throw new Error(`Could not load the library's brands from Supabase: ${error.message}`);

  const joined = new Map<string, BrandJoined>();
  for (const { published_at, brands } of data) {
    if (!brands) continue;
    const seen = joined.get(brands.slug);
    if (!seen || Date.parse(published_at) < Date.parse(seen.joinedAt)) {
      joined.set(brands.slug, { joinedAt: published_at, brand: { name: brands.name, slug: brands.slug, logo: brands.logo_path ? `/lib/${brands.logo_path}` : null } });
    }
  }
  return [...joined.values()].toSorted((a, b) => a.brand.name.localeCompare(b.brand.name));
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

const DETAIL_COLUMNS =
  "id, short_code, url, format, caption, posted_at, created_at, dimensions_width, dimensions_height, likes_count, comments_count, owner_username, owner:instagram_accounts!instagram_posts_owner_id_fkey(is_verified), brands(name, slug, logo_path, categories(name, slug)), post_images(position, path), post_categories(categories(name, slug)), instagram_post_media!instagram_post_media_post_id_fkey(position, type)";

// A post page's post. Pages that render together share one read (batchLoader): a build renders
// every post page, and one read each was ~290 requests a build (2026-10-26, docs/performance/).
// Kept in Next's data cache like the library, so a post's page and its modal, rendered apart,
// read it once; no longer than the page itself is kept (the dashboard revalidates hourly)
const detailLoader = batchLoader(readPostDetails);
export const getPostDetail = cache(unstable_cache((shortCode: string) => detailLoader(shortCode), ["post-detail"], { revalidate: 3600, tags: [LIBRARY_TAG] }));

export async function readPostDetail(shortCode: string): Promise<PostDetail | null> {
  return (await readPostDetails([shortCode])).get(shortCode) ?? null;
}

// Published posts by short code, 50 to a request
export async function readPostDetails(shortCodes: string[]): Promise<Map<string, PostDetail>> {
  const supabase = createPublicClient();
  const found = new Map<string, PostDetail>();
  for (const codes of chunks(shortCodes, 50)) {
    const { data, error } = await supabase.from("instagram_posts").select(DETAIL_COLUMNS).eq("is_published", true).in("short_code", codes).returns<DetailRow[]>();
    if (error) throw new Error(`Could not load posts ${codes.slice(0, 3).join(", ")}… from Supabase: ${error.message}`);
    for (const row of data) {
      const detail = toPostDetail(row);
      if (detail) found.set(row.short_code, detail);
    }
  }
  return found;
}

function toPostDetail(data: DetailRow): PostDetail | null {
  if (!data?.brands?.categories || !data.post_images.length) return null;

  const category = current(data.brands.categories);
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
    addedAt: data.created_at,
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
    categories: allCategories(data.brands.categories, data.post_categories ?? []),
    images: images.map((image) => libraryUrl(image.path)),
    videos: images.map((image) => (data.format === "video" ? image.position === 0 : media.get(image.position) === "video")),
  };
}

// Whether Next's image optimizer is on: off since 2026-10-29 with `images.unoptimized` in
// next.config.ts (Vercel's allowance ran out and it answered 402); change the two together
const IMAGE_OPTIMIZER = false;

// A URL from Next's image optimizer, for places that need a plain <img> src; the stored file itself
// while the optimizer is off
export function optimizedImage(src: string, width = 640, quality = 75) {
  if (!IMAGE_OPTIMIZER) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

// The newest posts in a category (main or extra), taking one brand at a time so a set isn't all
// one brand
export function categoryPosts(posts: LibraryPost[], category: string, count: number) {
  const queues = Map.groupBy(
    posts.filter((post) => inCategory(post, category)),
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

// A post as a card draws it: its short code, its files and the brand's name and mark. Whatever a
// client component takes is written into the page's data, every field of every post, so the
// homepage hands its demos this rather than the whole post (2026-10-16: it was sending 109 full
// posts, ids, links, dates and categories included). `images` is the cover alone unless a demo
// shows the other slides.
export type PostCard = Pick<LibraryPost, "shortCode" | "images"> & { brand: Pick<LibraryPost["brand"], "name" | "logo"> };

export const toPostCard = (post: LibraryPost, images = post.images.slice(0, 1)): PostCard => ({
  shortCode: post.shortCode,
  images,
  brand: { name: post.brand.name, logo: post.brand.logo },
});
