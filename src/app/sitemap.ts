import type { MetadataRoute } from "next";
import { getCollection } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// The styleguide (/system) is a working reference, not a page for search engines, so it's left out
// (2026-10-28, from a QA run)
const staticRoutes = [
  "/",
  "/library",
  "/sites",
  "/vision",
  "/roadmap",
  "/agents",
  "/advertise",
  "/pricing",
  "/submit",
  "/signin",
  "/signup",
  "/blog",
  "/blog/tags",
  "/store",
  "/sites/tags",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getCollection("posts");
  const sites = getCollection("sites");
  const routes = [
    ...staticRoutes,
    ...posts.map((post) => `/blog/posts/${post.id}`),
    ...[...new Set(posts.flatMap((post) => post.data.tags))].map((tag) => `/blog/tags/${tag}`),
    ...getCollection("store").map((product) => `/store/${product.id}`),
    ...sites.map((site) => `/sites/site/${site.id}`),
    ...[...new Set(sites.flatMap((site) => site.data.tags ?? []))].map((tag) => `/sites/tags/${tag}`),
    ...getCollection("legal").map((page) => `/legal/${page.id}`),
  ];
  return routes.map((route) => ({ url: new URL(route, SITE_URL).toString() }));
}
