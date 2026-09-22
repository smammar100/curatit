import type { MetadataRoute } from "next";
import { getCollection, getSortedPosts, uniqueTags } from "@/lib/content";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, sites, store, legal] = await Promise.all([
    getSortedPosts(),
    getCollection("sites"),
    getCollection("store"),
    getCollection("legal"),
  ]);

  const staticRoutes = [
    "",
    "/about",
    "/pricing",
    "/advertise",
    "/submit",
    "/signin",
    "/signup",
    "/blog",
    "/blog/tags",
    "/sites",
    "/sites/tags",
    "/store",
    "/system/overview",
    "/system/buttons",
    "/system/colors",
    "/system/links",
    "/system/typography",
  ];

  return [
    ...staticRoutes.map((route) => ({ url: `${SITE}${route}` })),
    ...posts.map((post) => ({
      url: `${SITE}/blog/posts/${post.id}`,
      lastModified: post.data.pubDate,
    })),
    ...uniqueTags(posts).map((tag) => ({ url: `${SITE}/blog/tags/${tag}` })),
    ...sites.map((site) => ({ url: `${SITE}/sites/site/${site.id}` })),
    ...uniqueTags(sites).map((tag) => ({ url: `${SITE}/sites/tags/${tag}` })),
    ...store.map((product) => ({ url: `${SITE}/store/${product.id}` })),
    ...legal.map((page) => ({ url: `${SITE}/legal/${page.id}` })),
  ];
}
