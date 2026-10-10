// Downloads each brand's logo (its Instagram profile picture) and writes a
// compressed copy into data/storage/library/logos/<brand slug>.webp, laid out
// like the `library` storage bucket. Then prints the upload command.
//
// The profiles come from an apify/instagram-profile-scraper run on each brand's
// main account (the first entry in brandAccounts), saved with:
//
//   curl "https://api.apify.com/v2/datasets/<datasetId>/items?format=json&clean=true&fields=username,fullName,id,verified,profilePicUrlHD,profilePicUrl" -o data/instagram/profiles.json
//   node scripts/download-brand-logos.mjs
//
// Profile picture links expire within days, like post images. Logos already
// downloaded are skipped.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { sources } from "./library-sources.mjs";

// Profile pictures are 320px squares; keep them at that size, a touch higher quality than posts
const size = 320;
const quality = 90;

// Same fallback as the post images: some regional CDN hosts only have IPv6 addresses
const fetchImage = (url) =>
  fetch(url).catch(() => {
    const fallback = new URL(url);
    fallback.host = "scontent.cdninstagram.com";
    return fetch(fallback);
  });

const profiles = JSON.parse(fs.readFileSync("data/instagram/profiles.json", "utf8"));
const originals = path.join("data", "storage", "originals", "logos");
const root = path.join("data", "storage", "library", "logos");
fs.mkdirSync(originals, { recursive: true });
fs.mkdirSync(root, { recursive: true });

let saved = 0;
let failed = 0;
for (const { brand, brandAccounts } of sources) {
  const handle = brandAccounts[0];
  const profile = profiles.find((item) => item.username === handle);
  const original = path.join(originals, `${brand.slug}.jpg`);
  const file = path.join(root, `${brand.slug}.webp`);
  if (fs.existsSync(file)) continue;

  if (!fs.existsSync(original)) {
    const url = profile?.profilePicUrlHD ?? profile?.profilePicUrl;
    const response = url ? await fetchImage(url).catch((error) => error) : null;
    if (!response?.ok) {
      console.error(`${brand.slug}: no logo (${!profile ? `@${handle} not in profiles.json` : response?.status ?? response?.cause?.code ?? "fetch failed"})`);
      failed++;
      continue;
    }
    fs.writeFileSync(original, Buffer.from(await response.arrayBuffer()));
  }

  await sharp(original).resize(size, size, { fit: "cover" }).webp({ quality }).toFile(file);
  saved++;
}

console.log(`Saved ${saved} logos to ${root}${failed ? `, ${failed} failed` : ""}`);
if (failed) process.exitCode = 1;
console.log(
  `\nUpload (npx.cmd in PowerShell):\nnpx supabase storage cp -r data/storage/library/logos ss:///library --linked --experimental --content-type image/webp --cache-control "max-age=604800"`
);
