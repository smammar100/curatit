import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const CONTENT_DIR = path.join(process.cwd(), "content");

/* -------------------------------------------------------------------------- */
/*  Schemas — ported from the Astro `src/content.config.ts` collections        */
/* -------------------------------------------------------------------------- */

const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
});

export const legalSchema = z.object({
  page: z.string(),
  pubDate: z.coerce.date(),
});

export const storeSchema = z.object({
  price: z.string(),
  title: z.string(),
  preview: z.string(),
  checkout: z.string(),
  license: z.string(),
  highlights: z.array(z.string()),
  description: z.string(),
  features: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  image: imageSchema,
  gallery: z.array(imageSchema).optional(),
});

export const sitesSchema = z.object({
  live: z.string(),
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  isNew: z.boolean().optional(),
  details: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  thumbnail: imageSchema,
  tags: z.array(z.string()).optional(),
});

export const postsSchema = z.object({
  title: z.string(),
  pubDate: z.coerce.date(),
  description: z.string(),
  image: imageSchema,
  tags: z.array(z.string()),
});

const schemas = {
  legal: legalSchema,
  store: storeSchema,
  sites: sitesSchema,
  posts: postsSchema,
} as const;

export type CollectionName = keyof typeof schemas;

export type Entry<C extends CollectionName> = {
  id: string;
  data: z.infer<(typeof schemas)[C]>;
  body: string;
};

/* -------------------------------------------------------------------------- */
/*  Loading                                                                    */
/* -------------------------------------------------------------------------- */

const cache = new Map<CollectionName, Promise<Entry<CollectionName>[]>>();

// Cache only in production builds, so editing a markdown file during `next dev`
// shows up on the next request instead of needing a server restart.
const useCache = process.env.NODE_ENV === "production";

async function load<C extends CollectionName>(collection: C): Promise<Entry<C>[]> {
  if (!useCache || !cache.has(collection)) {
    cache.set(
      collection,
      (async () => {
        const dir = path.join(CONTENT_DIR, collection);
        const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".md"));

        return Promise.all(
          files.map(async (file) => {
            const raw = await fs.readFile(path.join(dir, file), "utf8");
            const { data, content } = matter(raw);
            const parsed = schemas[collection].safeParse(data);

            if (!parsed.success) {
              throw new Error(
                `Invalid frontmatter in content/${collection}/${file}: ${parsed.error.message}`
              );
            }

            return {
              id: file.replace(/\.mdx?$/, ""),
              data: parsed.data,
              body: content,
            };
          })
        );
      })()
    );
  }

  return cache.get(collection)! as Promise<Entry<C>[]>;
}

/** Equivalent of Astro's `getCollection(...)`. */
export async function getCollection<C extends CollectionName>(
  collection: C
): Promise<Entry<C>[]> {
  const entries = await load(collection);
  // Stable, human order: 1, 2, 10 — not 1, 10, 2.
  return [...entries].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}

export async function getEntry<C extends CollectionName>(
  collection: C,
  id: string
): Promise<Entry<C> | undefined> {
  const entries = await load(collection);
  return entries.find((entry) => entry.id === id);
}

/** Posts, newest first. */
export async function getSortedPosts() {
  const posts = await getCollection("posts");
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/* -------------------------------------------------------------------------- */
/*  Markdown rendering                                                         */
/* -------------------------------------------------------------------------- */

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function uniqueTags(entries: { data: { tags?: (string | undefined)[] } }[]) {
  const tags = entries.flatMap((entry) => entry.data.tags ?? []).filter(Boolean) as string[];
  return [...new Set(tags)].sort((a, b) => a.localeCompare(b));
}

/** `2026-01-01` — matches the Astro templates' `.toString().slice(0, 10)` intent. */
export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
