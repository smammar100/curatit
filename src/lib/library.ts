import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";

const libraryDir = path.join(process.cwd(), "src/content/library");
const publicDir = path.join(process.cwd(), "public");

const post = z.object({
  shortCode: z.string(),
  url: z.url(),
  format: z.enum(["static", "carousel"]),
  postedAt: z.coerce.date(),
  caption: z.string(),
  likes: z.number().int(),
  comments: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
  // Path under public/. Library images are kept out of git, so a fresh checkout won't have them.
  image: z.string(),
});

// One JSON file per brand in src/content/library/
const brandFile = z.object({
  brand: z.string(),
  handle: z.string(),
  profileUrl: z.url(),
  scrapedAt: z.coerce.date(),
  posts: z.array(post),
});

export type LibraryPost = z.infer<typeof post> & {
  brand: string;
  handle: string;
  // False when the image file isn't on disk, e.g. on a deploy built from git
  hasImage: boolean;
};

// Every library post across brands, newest first
export const getLibrary = cache((): LibraryPost[] =>
  fs
    .readdirSync(libraryDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .flatMap((file) => {
      const result = brandFile.safeParse(JSON.parse(fs.readFileSync(path.join(libraryDir, file), "utf8")));
      if (!result.success) {
        throw new Error(`Invalid library file src/content/library/${file}\n${z.prettifyError(result.error)}`);
      }
      const { brand, handle, posts } = result.data;
      return posts.map((entry) => ({
        ...entry,
        brand,
        handle,
        hasImage: fs.existsSync(path.join(publicDir, entry.image)),
      }));
    })
    .toSorted((a, b) => b.postedAt.valueOf() - a.postedAt.valueOf())
);
