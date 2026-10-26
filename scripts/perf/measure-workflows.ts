// What representative workflows ask of Supabase: HTTP requests, response bytes (raw UTF-8 JSON and
// gzipped, about what crosses the network) and wall time, through the app's own read code against
// the live catalog, read-only (2026-10-26, docs/performance/). A small, bounded run: about 300
// requests with the default --repeat 3, a fraction of what one build makes.
//
//   npx tsx scripts/perf/measure-workflows.ts [--repeat 3] [--out file.json] [--only name,name]
//
// The first run of each workflow is cold (no process cache); the later ones are warm, as a server
// that has already answered once. Latency samples are few: exploratory, not a load test.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

process.env.CURATIT_SUPABASE_USAGE ??= "memory";
process.loadEnvFile(".env.local");

const { meteringEnabled, resetSupabaseUsage, supabaseUsage } = await import("@/utils/supabase/meter");
const { readPublishedPosts, readPostDetail } = await import("@/lib/posts");
const { readBreakdownSummaries, readPublishedAnalysis } = await import("@/lib/creative/display");
const { createPublicClient } = await import("@/utils/supabase/public");
const { loadLibrarySearch } = await import("@/components/dashboard/useLibrarySearch");
const { runExampleSearches } = await import("@/components/mcp/searchExamples");
const { createSupabaseCatalog } = await import("@/lib/mcp/repo/supabase");
const { searchPosts } = await import("@/lib/mcp/services/search");
const { getPost } = await import("@/lib/mcp/services/post");
const { TOOLS } = await import("@/lib/mcp/contracts");
const { createLocalModels } = await import("@/lib/search/semantic/models");

const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const repeat = Number(flag("--repeat") ?? 3);
const only = flag("--only")?.split(",");
if (!meteringEnabled()) throw new Error("Metering is off");

const env = process.env;
const posts = await readPublishedPosts();
const dashPosts = posts.map((post) => ({ ...post, cover: post.images[0], breakdown: null }));
const sample = posts.filter((post) => post.format === "carousel").slice(0, 5);
const models = createLocalModels({ modelDir: join(process.cwd(), "models"), download: false });
// One repository for the whole run, as one server process keeps one (its vocabulary is cached)
const repo = createSupabaseCatalog({ url: env.NEXT_PUBLIC_SUPABASE_URL!, publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, secretKey: env.SUPABASE_SECRET_KEY! });
const ctx = { signingSecret: new Uint8Array(32).fill(9), principalKey: "perf-measure", semantic: models };
// Load the models before timing anything: their cold start is measured once, on its own
await models.embed(["warm up"]);
await models.rerank("warm up", ["warm up"]);

const DASHBOARD_QUERIES = ["minimalist finance carousel", "Black Friday promotion", "fintech posts announcing a new feature", "fintehc carousels", "carousels with app screens", "funny posts about saving money"];
const MCP_QUERIES = ["minimalist finance carousel", "Black Friday promotion", "fintech posts announcing a new feature", "fintehc carousels"];

const workflows: Record<string, () => Promise<unknown>> = {
  // A build's shared reads: the library and the Playbooks summaries
  catalog: () => readPublishedPosts(),
  summaries: () => readBreakdownSummaries(posts),
  // What one post page reads at build time today: its detail, then its analysis and slides
  "post page (5 posts)": async () => {
    for (const post of sample) {
      const detail = await readPostDetail(post.shortCode);
      await readPublishedAnalysis(createPublicClient(), post.id, detail!.images.length);
    }
  },
  // The dashboard's search, from the browser, for each query (no result cache: a new posts array)
  "dashboard search (6 queries)": async () => {
    const list = dashPosts.map((post) => ({ ...post }));
    for (const query of DASHBOARD_QUERIES) await loadLibrarySearch(query, list, new AbortController().signal, {}, createPublicClient() as never);
  },
  // Curatit MCP / REST search, natural language, 8 results each
  "mcp search (4 queries)": async () => {
    for (const query of MCP_QUERIES) await searchPosts(repo, TOOLS.curatit_search_posts.input.parse({ query }) as never, ctx);
  },
  // The same search three times in a row, as an assistant retrying or paging back
  "mcp search, same query x3": async () => {
    for (let i = 0; i < 3; i++) await searchPosts(repo, TOOLS.curatit_search_posts.input.parse({ query: "posts that make saving money feel fun" }) as never, ctx);
  },
  // Page 1 then page 2 of one search
  "mcp search, two pages": async () => {
    const first = await searchPosts(repo, TOOLS.curatit_search_posts.input.parse({ query: "carousels that teach something step by step" }) as never, ctx);
    if (first.data.next_cursor) await searchPosts(repo, TOOLS.curatit_search_posts.input.parse({ query: "carousels that teach something step by step", cursor: first.data.next_cursor }) as never, ctx);
  },
  "mcp get post (3 posts)": async () => {
    for (const post of sample.slice(0, 3)) await getPost(repo, TOOLS.curatit_get_post.input.parse({ post_id: post.id }) as never);
  },
  // The AI integration page's example searches, run when it renders (hourly)
  "agents page examples": () => runExampleSearches(posts),
};

type Sample = { requests: number; bytes: number; gzipBytes: number; ms: number; endpoints: Record<string, { requests: number; bytes: number; gzipBytes: number }> };
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
const results: Record<string, { cold: Sample; warm: Sample | null; wallMs: number[]; failures: number }> = {};

for (const [name, run] of Object.entries(workflows)) {
  if (only && !only.includes(name)) continue;
  const wallMs: number[] = [];
  let cold: Sample | null = null;
  let warm: Sample | null = null;
  let failures = 0;
  for (let i = 0; i < repeat; i++) {
    await settle();
    resetSupabaseUsage();
    const started = performance.now();
    try {
      await run();
    } catch (error) {
      failures++;
      console.error(`${name}: ${(error as Error).message}`);
    }
    wallMs.push(performance.now() - started);
    await settle();
    const usage = supabaseUsage();
    const endpoints = Object.fromEntries(Object.entries(usage).map(([key, u]) => [key, { requests: u.requests, bytes: u.bytes, gzipBytes: u.gzipBytes }]));
    const total = Object.values(usage).reduce((s, u) => ({ requests: s.requests + u.requests, bytes: s.bytes + u.bytes, gzipBytes: s.gzipBytes + u.gzipBytes, ms: s.ms + u.ms }), { requests: 0, bytes: 0, gzipBytes: 0, ms: 0 });
    const sampleNow = { ...total, endpoints };
    if (i === 0) cold = sampleNow;
    else warm = sampleNow;
  }
  results[name] = { cold: cold!, warm, wallMs, failures };
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} KiB`;
const pct = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor((xs.length - 1) * p))];
console.log(`\n${"workflow".padEnd(30)} ${"requests".padStart(9)} ${"raw".padStart(11)} ${"gzip".padStart(11)} ${"warm req".padStart(9)} ${"warm raw".padStart(11)} ${"p50 ms".padStart(7)} ${"p95 ms".padStart(7)}`);
for (const [name, r] of Object.entries(results)) {
  console.log(
    `${name.padEnd(30)} ${String(r.cold.requests).padStart(9)} ${kb(r.cold.bytes).padStart(11)} ${kb(r.cold.gzipBytes).padStart(11)} ${String(r.warm?.requests ?? "-").padStart(9)} ${(r.warm ? kb(r.warm.bytes) : "-").padStart(11)} ${pct(r.wallMs, 0.5).toFixed(0).padStart(7)} ${pct(r.wallMs, 0.95).toFixed(0).padStart(7)}${r.failures ? `  (${r.failures} failed)` : ""}`,
  );
  for (const [endpoint, e] of Object.entries(r.cold.endpoints)) console.log(`   ${endpoint.padEnd(52)} ${String(e.requests).padStart(4)} ${kb(e.bytes).padStart(11)} ${kb(e.gzipBytes).padStart(11)}`);
}
const out = flag("--out");
if (out) writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), repeat, results }, null, 2));
