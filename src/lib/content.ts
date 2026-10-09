import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const contentDir = path.join(process.cwd(), "src/content");
const publicDir = path.join(process.cwd(), "public");

// Image fields hold a path under public/ (e.g. "/images/blog/1.jpg") and must point at a real file.
const image = () =>
  z.string().refine((url) => fs.existsSync(path.join(publicDir, url)), {
    error: "Image not found under public/",
  });

const legal = z.object({
  page: z.string(),
  pubDate: z.coerce.date(),
});

const store = z.object({
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
  image: z.object({
    url: image(),
    alt: z.string(),
  }),
  gallery: z
    .array(
      z.object({
        url: image(),
        alt: z.string(),
      })
    )
    .optional(),
});

const sites = z.object({
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
  thumbnail: z.object({
    url: image(),
    alt: z.string(),
  }),
  tags: z.array(z.string()).optional(),
});

const posts = z.object({
  title: z.string(),
  pubDate: z.coerce.date(),
  description: z.string(),
  image: z.object({
    url: image(),
    alt: z.string(),
  }),
  tags: z.array(z.string()),
});

const schemas = { legal, store, sites, posts };

export type CollectionName = keyof typeof schemas;

export type CollectionEntry<C extends CollectionName> = {
  // Filename without the extension, e.g. posts/1.md -> "1"
  id: string;
  data: z.infer<(typeof schemas)[C]>;
  // Markdown below the frontmatter
  body: string;
};

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const markdownFile = /\.mdx?$/;

// Entries come back sorted by filename, so "10.md" sorts before "2.md".
export const getCollection = cache(function getCollection<C extends CollectionName>(
  name: C
): CollectionEntry<C>[] {
  const dir = path.join(contentDir, name);
  // TypeScript can't relate schemas[name] back to C on its own
  const schema = schemas[name] as unknown as z.ZodType<CollectionEntry<C>["data"]>;

  return fs
    .readdirSync(dir)
    .filter((file) => markdownFile.test(file))
    .sort()
    .map((file) => {
      const source = fs.readFileSync(path.join(dir, file), "utf8");
      const match = frontmatterPattern.exec(source);
      const result = schema.safeParse(match ? parseYaml(match[1]) : {});
      if (!result.success) {
        throw new Error(
          `Invalid frontmatter in src/content/${name}/${file}\n${z.prettifyError(result.error)}`
        );
      }
      return {
        id: file.replace(markdownFile, ""),
        data: result.data,
        body: match ? source.slice(match[0].length) : source,
      };
    });
});

export function getEntry<C extends CollectionName>(name: C, id: string) {
  return getCollection(name).find((entry) => entry.id === id);
}

// Newest first.
export function sortByPubDate(entries: CollectionEntry<"posts">[]) {
  return entries.toSorted((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
