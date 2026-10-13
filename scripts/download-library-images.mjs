// Downloads every library image from the Instagram CDN into data/storage/originals/
// and writes a compressed copy into data/storage/library/, laid out exactly like
// the `library` storage bucket. Then prints the commands that upload it (one per
// top-level folder, a brand's `folder` in library-sources.mjs: `cp -r` keeps the folder's name, so copying
// data/storage/library itself would nest a second library/ folder).
//
//   node scripts/download-library-images.mjs
//
// Instagram's links expire a few days after the scrape, so run this soon after
// a new Apify export. Files already downloaded or compressed are skipped, so
// changing the settings below means deleting data/storage/library first.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { postImages, sources } from "./library-sources.mjs";

// Instagram shows posts at 1080px wide; some originals are 2400px+ at high
// JPEG quality. WebP 80 at 1080px is ~77% smaller and hard to tell apart.
const maxWidth = 1080;
const quality = 80;

// Some regional CDN hosts (e.g. instagram.f*.fna.fbcdn.net) only have IPv6
// addresses; Instagram's main image host serves the same signed path.
const fetchImage = (url) =>
  fetch(url).catch(() => {
    const fallback = new URL(url);
    fallback.host = "scontent.cdninstagram.com";
    return fetch(fallback);
  });

const originals = path.join("data", "storage", "originals");
const root = path.join("data", "storage", "library");
let downloaded = 0;
let compressed = 0;
let failed = 0;

for (const source of sources) {
  const { items } = JSON.parse(fs.readFileSync(source.file, "utf8"));

  for (const item of items) {
    for (const image of postImages(source, item)) {
      const original = path.join(originals, image.original);
      const file = path.join(root, image.path);

      if (!fs.existsSync(original)) {
        // A network error skips this image; re-running the script retries it
        const response = await fetchImage(image.url).catch((error) => error);
        if (!response.ok) {
          const reason = response instanceof Error ? (response.cause?.code ?? response.message) : response.status;
          console.error(`${reason} ${image.path}${response.status === 403 ? " (link expired? re-run the scrape)" : ""}`);
          failed++;
          continue;
        }
        fs.mkdirSync(path.dirname(original), { recursive: true });
        fs.writeFileSync(original, Buffer.from(await response.arrayBuffer()));
        downloaded++;
      }

      if (!fs.existsSync(file)) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        await sharp(original)
          .rotate()
          .resize({ width: maxWidth, withoutEnlargement: true })
          .webp({ quality })
          .toFile(file);
        compressed++;
      }
    }
  }
}

console.log(`Downloaded ${downloaded} and compressed ${compressed} images into ${root}${failed ? `, ${failed} failed` : ""}`);
if (failed) process.exitCode = 1;

console.log("\nUpload (npx.cmd in PowerShell):");
for (const folder of new Set(sources.map((source) => source.folder))) {
  console.log(
    `npx supabase storage cp -r data/storage/library/${folder} ss:///library --linked --experimental --content-type image/webp --cache-control "max-age=604800"`
  );
}
