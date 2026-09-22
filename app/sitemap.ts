import type { MetadataRoute } from "next";
import { getCollection, getSortedPosts, uniqueTags } from "@/lib/content";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

/**
 * Public marketing pages only. Product routes (library, boards, admin) need
 * auth, and share links (/s/...) must never be listed (plan §34.4).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, legal] = await Promise.all([getSortedPosts(), getCollection("legal")]);

  const staticRoutes = ["", "/about", "/pricing", "/blog", "/blog/tags"];

  return [
    ...staticRoutes.map((route) => ({ url: `${SITE}${route}` })),
    ...posts.map((post) => ({ url: `${SITE}/blog/posts/${post.id}`, lastModified: post.data.pubDate })),
    ...uniqueTags(posts).map((tag) => ({ url: `${SITE}/blog/tags/${tag}` })),
    ...legal.map((page) => ({ url: `${SITE}/legal/${page.id}` })),
  ];
}
