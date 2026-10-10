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
  // logo is the public URL of the brand's mark in the `library` bucket, if it has one
  brand: { name: string; slug: string; logo: string | null };
  category: { name: string; slug: string };
  // Public URLs in the `library` bucket, cover first, then each carousel slide
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

  const bucket = supabase.storage.from("library");
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
        logo: row.brands!.logo_path ? bucket.getPublicUrl(row.brands!.logo_path).data.publicUrl : null,
      },
      category: row.brands!.categories!,
      images: row.post_images
        .toSorted((a, b) => a.position - b.position)
        .map((image) => bucket.getPublicUrl(image.path).data.publicUrl),
    }));
});

// A URL from Next's image optimizer, for places that need a plain <img> src
export function optimizedImage(src: string, width = 640) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
