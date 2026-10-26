// A monthly Supabase egress forecast for Curatit (2026-10-26, docs/performance/). Each line is a
// mutually exclusive kind of traffic: how often it reaches Supabase (an assumption, editable) times
// what it costs each time (measured, see MEASURED). Database traffic is all uncached; Storage
// traffic splits into Supabase CDN hits (cached egress) and misses (uncached). The Supabase
// dashboard's usage page is the billing truth; this is a diagnostic model, not a cap.
//
//   node scripts/perf/egress-estimate.mjs [--workload file.json] [--used-gb 1.2 --days-left 18] [--before]
//
// --workload overrides any assumption (same keys as SCENARIOS.expected); --before prices the same
// workload at the costs measured before the 2026-10-26 changes.
import { readFileSync } from "node:fs";

const KIB = 1024;
const GB = 1_000_000_000;

// What each thing costs, in bytes over the network (gzipped JSON, as Supabase sends it to clients
// that accept gzip; images as stored). Measured on 2026-10-26 against the live catalog (291
// published posts) with scripts/perf/measure-workflows.ts, replay-projections.ts and metered
// builds (scripts/perf/supabase-budget.mjs). "before" is the code on main at e9b85fd.
const MEASURED = {
  // [gzipped, raw] bytes, before and after
  build: { before: [3.27 * 1024, 15.6 * 1024], after: [1.03 * 1024, 5.65 * 1024], source: "cold metered `next build`, all 7 workers" },
  layoutRefresh: { before: [59.0 + 280.1, 297.2 + 1735.6], after: [59.0 + 27.5, 297.2 + 109.1], source: "catalog + Playbooks summaries, one hourly refresh of the dashboard" },
  agentsRefresh: { before: [21.0, 91.4], after: [1.3, 2.0], source: "the AI integration page's 4 example searches, one hourly refresh (after: with the migration)" },
  dashboardSearch: { before: [69.3 / 6, 329.4 / 6], after: [2.7 / 6, 5.4 / 6], source: "one dashboard search, every page of matches (after: with the migration)" },
  searchVocabulary: { before: [6.6, 31.5], after: [6.6, 31.5], source: "the taxonomy terms a browser reads once per 5 minutes of searching" },
  mcpSearch: { before: [(17.8 + 3.6) / 4, (77.7 + 9.4) / 4], after: [(7.3 + 3.6) / 4, (25.3 + 9.4) / 4], source: "one MCP/REST search, 8 results: its search and ranking reads (after: cards, with the migration); the vocabulary, read once per server instance every 5 minutes, isn't counted" },
  mcpRepeatOrPage: { before: [16.5 / 2, 60.0 / 2], after: [4.3 / 2, 14.4 / 2], source: "a next page or a repeat of a search: ranking and posts before; after, the kept ranking leaves only the posts, as cards" },
  mcpGetPost: { before: [13.2 / 3, 57.7 / 3], after: [13.2 / 3, 57.7 / 3], source: "curatit_get_post, unchanged" },
  postPageRender: { before: [20.4 / 5, 63.0 / 5], after: [20.7 / 5, 63.9 / 5], source: "one post page rendered at run time (a post published after the build, or an hourly refresh)" },
  imageOriginFetch: { before: [90.7, 90.7], after: [90.7, 90.7], source: "one library image as stored (mean of 1,654 objects), fetched by Vercel's optimizer on its own cache miss" },
};

// Workload assumptions: per day, how often each thing reaches Supabase
const SCENARIOS = {
  low: { builds: 2, layoutRefreshes: 6, agentsRefreshes: 6, searchers: 3, searchesPerSearcher: 5, mcpSearches: 10, mcpRepeatsOrPages: 5, mcpPosts: 10, postPageRenders: 20, imageOriginFetches: 100, storageCdnHitRate: 0.65 },
  expected: { builds: 8, layoutRefreshes: 24, agentsRefreshes: 24, searchers: 20, searchesPerSearcher: 8, mcpSearches: 60, mcpRepeatsOrPages: 30, mcpPosts: 60, postPageRenders: 150, imageOriginFetches: 300, storageCdnHitRate: 0.65 },
  high: { builds: 30, layoutRefreshes: 24, agentsRefreshes: 24, searchers: 150, searchesPerSearcher: 10, mcpSearches: 400, mcpRepeatsOrPages: 200, mcpPosts: 400, postPageRenders: 1000, imageOriginFetches: 1500, storageCdnHitRate: 0.65 },
};
// Where they come from: builds, a push to a pull request (GitHub CI + a Vercel preview) or a merge
// (CI on main + production); layout and agents refreshes, at most hourly while visited (ISR);
// searches and MCP from usage; image origin fetches, from Storage's edge logs: about 250 GETs a day
// on 25 Oct with a heavy test day, 65% of them Supabase CDN hits

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const phase = args.includes("--before") ? "before" : "after";
// Supabase's docs count the data sent; its API compresses for clients that accept gzip, as these do.
// --uncompressed prices every response at its raw size instead, an upper bound
const raw = args.includes("--uncompressed") ? 1 : 0;
const override = flag("--workload") ? JSON.parse(readFileSync(flag("--workload"), "utf8")) : {};
const usedGb = Number(flag("--used-gb") ?? 0);
const daysLeft = Number(flag("--days-left") ?? 30);
const cycleDays = 30;

function daily(w) {
  const c = (key) => MEASURED[key][phase][raw] * KIB;
  const db =
    w.builds * c("build") +
    w.layoutRefreshes * c("layoutRefresh") +
    w.agentsRefreshes * c("agentsRefresh") +
    w.searchers * (w.searchesPerSearcher * c("dashboardSearch") + c("searchVocabulary")) +
    w.mcpSearches * c("mcpSearch") +
    w.mcpRepeatsOrPages * c("mcpRepeatOrPage") +
    w.mcpPosts * c("mcpGetPost") +
    w.postPageRenders * c("postPageRender");
  const images = w.imageOriginFetches * c("imageOriginFetch");
  return { uncached: db + images * (1 - w.storageCdnHitRate), cached: images * w.storageCdnHitRate, db, images };
}

const fmt = (bytes) => `${(bytes / GB).toFixed(2)} GB`;
console.log(`Supabase egress forecast, ${raw ? "uncompressed (upper bound)" : "gzipped"} (${phase === "after" ? "after the 2026-10-26 changes, with the search migration applied" : "before the 2026-10-26 changes"}), ${cycleDays}-day cycle`);
console.log(`targets: uncached < 4 GB (Free plan allowance 5 GB); cached allowance 5 GB, separate\n`);
console.log(`${"scenario".padEnd(10)} ${"uncached/mo".padStart(12)} ${"cached/mo".padStart(10)} ${"combined".padStart(9)} ${"db".padStart(9)} ${"images".padStart(9)}  fits 4 GB?`);
for (const [name, base] of Object.entries(SCENARIOS)) {
  const d = daily({ ...base, ...override });
  console.log(`${name.padEnd(10)} ${fmt(d.uncached * cycleDays).padStart(12)} ${fmt(d.cached * cycleDays).padStart(10)} ${fmt((d.uncached + d.cached) * cycleDays).padStart(9)} ${fmt(d.db * cycleDays).padStart(9)} ${fmt(d.images * cycleDays).padStart(9)}  ${d.uncached * cycleDays < 4 * GB ? "yes" : "NO"}`);
}

// The rest of this cycle from what's already used
const expected = daily({ ...SCENARIOS.expected, ...override });
if (usedGb) {
  const forecast = usedGb * GB + expected.uncached * daysLeft;
  console.log(`\nthis cycle (expected workload): ${usedGb} GB used + ${fmt(expected.uncached * daysLeft)} over ${daysLeft} days = ${fmt(forecast)} uncached${forecast > 4 * GB ? " — over the 4 GB target" : ""}`);
}

// How much activity the 4 GB target allows: the expected workload scaled until it reaches it
const scale = (4 * GB) / (expected.uncached * cycleDays);
console.log(`\nthe 4 GB uncached target holds up to ${scale.toFixed(1)}x the expected workload; builds alone allow ${Math.floor((4 * GB) / (MEASURED.build[phase][raw] * KIB * cycleDays))} a day`);
console.log(`warning thresholds: 70% = ${fmt(0.7 * 5 * GB)}, 85% = ${fmt(0.85 * 5 * GB)}, 95% = ${fmt(0.95 * 5 * GB)} of the 5 GB allowance`);
console.log(`\nper unit (${phase}): ${Object.entries(MEASURED).map(([k, v]) => `${k} ${(v[phase] / KIB).toFixed(1)} KiB`).join(", ")}`);
