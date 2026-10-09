// Picks a brand's library posts from an apify/instagram-post-scraper run
// (dataDetailLevel: detailedData, resultsLimit: 30, skipPinnedPosts: true) and
// saves them verbatim to data/instagram/<handle>.json. Reels are dropped and
// the newest 5 static images and carousels are kept.
//
//   node scripts/pick-library-posts.mjs <handle> <runId> <datasetId>
//
// Then add the brand to scripts/library-sources.mjs.

import fs from "node:fs";

const [handle, runId, datasetId] = process.argv.slice(2);
if (!handle || !runId || !datasetId) {
  console.error("Usage: node scripts/pick-library-posts.mjs <handle> <runId> <datasetId>");
  process.exit(1);
}

const keep = 5;
const api = `https://api.apify.com/v2/datasets/${datasetId}`;
const items = await (await fetch(`${api}/items?format=json&clean=true`)).json();
const { data: dataset } = await (await fetch(api)).json();

const picked = items
  .filter((item) => !item.isPinned && (item.type === "Image" || item.type === "Sidecar") && item.productType !== "clips")
  .toSorted((a, b) => b.timestamp.localeCompare(a.timestamp))
  .slice(0, keep);

const file = `data/instagram/${handle}.json`;
const output = {
  source: `https://www.instagram.com/${handle}/`,
  scrapedAt: new Date(dataset.modifiedAt).toISOString().replace(/\.\d+Z$/, "Z"),
  actor: "apify/instagram-post-scraper",
  runId,
  datasetId,
  dataDetailLevel: "detailedData",
  filter: `Latest ${items.length} posts, pinned skipped; reels (type Video / productType clips) removed; newest ${keep} static images and carousels kept`,
  note: `Verbatim Apify dataset items (detailed data) for the ${keep} library posts. Instagram CDN URLs expire within days.`,
  items: picked,
};
fs.writeFileSync(file, JSON.stringify(output, null, 2) + "\n");

const reels = items.filter((item) => item.productType === "clips" || item.type === "Video").length;
console.log(`${file}: ${picked.length} of ${items.length} posts (${reels} reels skipped)`);
for (const item of picked) {
  const slides = item.childPosts ?? [];
  const videos = slides.filter((slide) => slide.type === "Video").length;
  const coauthors = (item.coauthorProducers ?? []).map((account) => account.username);
  console.log(
    [
      item.timestamp.slice(0, 10),
      item.shortCode,
      item.type === "Sidecar" ? `carousel ${slides.length}${videos ? ` (${videos} video)` : ""}` : "static",
      `@${item.ownerUsername}`,
      coauthors.length ? `with @${coauthors.join(", @")}` : "",
    ].join("  ")
  );
}
