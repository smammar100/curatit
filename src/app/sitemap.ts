import type { MetadataRoute } from "next";
import { getCollection } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const staticRoutes = [
  "/",
  "/library",
  "/sites",
  "/about",
  "/advertise",
  "/pricing",
  "/submit",
  "/signin",
  "/signup",
  "/blog",
  "/blog/tags",
  "/store",
  "/sites/tags",
  "/system/overview",
  "/system/colors",
  "/system/typography",
  "/system/buttons",
  "/system/links",
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
