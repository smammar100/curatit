// Re-scores Curatit MCP search against the judged test set in docs/search-eval/: runs every
// request through the search service the server runs (the live catalog, read-only, and the models
// in ./models), takes each top 10 and scores it against the judgments. Reads .env.local.
//
//   npm run search:eval                   hybrid search, as deployed
//   npm run search:eval -- --keyword      keyword search alone, for comparison
//   npm run search:eval -- --out <file>   also write every query's results as JSON
//   npm run search:eval -- --dashboard    the dashboard's search instead (useLibrarySearch: its own
//                                         interpretation, the exact brand and category shortcut,
//                                         keyword pages, and the order /api/search adds); with
//                                         --keyword, the dashboard's keyword search alone
//
// A result nobody has judged counts as not relevant and is listed at the end: judge those (the
// method is in docs/search-eval/README.md) and add them to judgments.json before trusting a change
// that surfaces many of them.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TOOLS } from "@/lib/mcp/contracts";
import { createSupabaseCatalog } from "@/lib/mcp/repo/supabase";
import { hybridOrder, searchPosts } from "@/lib/mcp/services/search";
import { createLocalModels } from "@/lib/search/semantic/models";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: use the environment as it is
}
const args = process.argv.slice(2);
const keywordOnly = args.includes("--keyword");
const dashboard = args.includes("--dashboard");
const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const env = process.env;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !env.SUPABASE_SECRET_KEY) {
  console.error("search:eval needs the Supabase URL, publishable key and secret key (in .env.local).");
  process.exit(1);
}

type Query = { id: string; group: "taxonomy" | "concept" | "brand" | "absent"; q: string };
type Judgment = { query: string; post: string; short_code: string; grade: 0 | 1 | 2 };
const queries = JSON.parse(readFileSync("docs/search-eval/queries.json", "utf8")) as Query[];
const judgments = JSON.parse(readFileSync("docs/search-eval/judgments.json", "utf8")) as Judgment[];
const grade = new Map(judgments.map((j) => [`${j.query}|${j.post}`, j.grade]));

const repo = createSupabaseCatalog({ url: env.NEXT_PUBLIC_SUPABASE_URL, publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, secretKey: env.SUPABASE_SECRET_KEY });
const semantic = keywordOnly ? null : createLocalModels({ modelDir: join(process.cwd(), "models"), download: false });
const ctx = { signingSecret: new Uint8Array(32).fill(7), principalKey: "search-eval", semantic };

// The dashboard's search, as the browser runs it, with the server's ranking called in place of
// /api/search (the same hybridOrder the route runs)
const dashboardSearch = dashboard ? await (async () => {
  const { readPublishedPosts } = await import("@/lib/posts");
  const { createPublicClient } = await import("@/utils/supabase/public");
  const { loadLibrarySearch } = await import("@/components/dashboard/useLibrarySearch");
  const { brandNamed, categoryNamed } = await import("@/components/dashboard/search");
  const { inCategory } = await import("@/lib/categories");
  const posts = await readPublishedPosts();
  const list = posts.map((post) => ({ ...post, cover: post.images[0], breakdown: null }));
  const idOf = new Map(posts.map((post) => [post.shortCode, post.id]));
  const rank = semantic ? (body: { query: string; request: Record<string, unknown>; post_ids?: string[] }) => hybridOrder(repo, semantic, { ...body.request, ...(body.post_ids ? { post_ids: body.post_ids } : {}) }, body.query).then((r) => r.ids) : null;
  return async (q: string) => {
    // Exact brand and category names are filtered in the browser, as the feed does
    const brand = brandNamed(list, q);
    const named = brand ? null : categoryNamed(q);
    if (brand || named) return { ids: list.filter((p) => (brand ? p.brand.slug === brand.slug : inCategory(p, named!.slug))).map((p) => p.id), ranking: "exact" };
    const result = await loadLibrarySearch(q, list, new AbortController().signal, {}, createPublicClient() as never, rank);
    if (result.error) throw new Error(result.error);
    return { ids: result.codes.map((code) => idOf.get(code)!).filter(Boolean), ranking: result.notice ? "fallback" : (result.ranking ?? "keyword") };
  };
})() : null;

const runs: { query: Query; ids: string[]; ranking: string; error: string | null; ms: number }[] = [];
for (const query of queries) {
  const started = Date.now();
  try {
    if (dashboardSearch) {
      const { ids, ranking } = await dashboardSearch(query.q);
      runs.push({ query, ids: ids.slice(0, 10), ranking, error: null, ms: Date.now() - started });
    } else {
      const { data } = await searchPosts(repo, TOOLS.curatit_search_posts.input.parse({ query: query.q, limit: 10 }) as never, ctx);
      runs.push({ query, ids: data.posts.map((p) => p.post_id), ranking: data.applied.ranking ?? "keyword", error: null, ms: Date.now() - started });
    }
  } catch (error) {
    runs.push({ query, ids: [], ranking: "refused", error: (error as Error).message, ms: Date.now() - started });
  }
  process.stdout.write(".");
}
console.log("");

const unjudged: string[] = [];
function score(run: (typeof runs)[number]) {
  const gains = run.ids.map((id) => {
    const g = grade.get(`${run.query.id}|${id}`);
    if (g === undefined) unjudged.push(`${run.query.id} "${run.query.q}" → post ${id}`);
    return g ?? 0;
  });
  const ideal = judgments.filter((j) => j.query === run.query.id).map((j) => j.grade).sort((a, b) => b - a).slice(0, 10);
  const dcg = (xs: number[]) => xs.reduce((s, x, i) => s + (2 ** x - 1) / Math.log2(i + 2), 0);
  const relevantAll = ideal.filter((x) => x > 0).length;
  return {
    returned: gains.length,
    relevant: gains.filter((x) => x > 0).length,
    junk: gains.filter((x) => x === 0).length,
    ndcg: dcg(ideal) ? dcg(gains) / dcg(ideal) : gains.length ? 0 : 1,
    recall: relevantAll ? gains.filter((x) => x > 0).length / relevantAll : null,
  };
}
const scored = runs.map((run) => ({ run, m: score(run) }));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
// The held-out half: every second request of each kind, as in the original test
const heldOut = new Set(["taxonomy", "concept", "brand", "absent"].flatMap((g) => queries.filter((q) => q.group === g).filter((_, i) => i % 2).map((q) => q.id)));
function summary(rows: typeof scored) {
  const present = rows.filter((x) => x.run.query.group !== "absent");
  const absent = rows.filter((x) => x.run.query.group === "absent");
  const returned = present.reduce((n, x) => n + x.m.returned, 0);
  return {
    ndcg: mean(present.map((x) => x.m.ndcg)),
    recall: mean(present.map((x) => x.m.recall).filter((x): x is number => x !== null)),
    precision: returned ? present.reduce((n, x) => n + x.m.relevant, 0) / returned : NaN,
    junk: returned ? present.reduce((n, x) => n + x.m.junk, 0) / returned : NaN,
    emptyButRelevant: present.filter((x) => !x.m.returned && x.m.recall !== null).length,
    absentJunk: absent.reduce((n, x) => n + x.m.junk, 0),
    absentEmpty: absent.filter((x) => !x.m.returned).length,
    absentTotal: absent.length,
  };
}
const line = (label: string, s: ReturnType<typeof summary>) =>
  `${label.padEnd(22)} nDCG@10 ${s.ndcg.toFixed(3)}  recall ${s.recall.toFixed(3)}  precision ${s.precision.toFixed(3)}  junk ${(s.junk * 100).toFixed(0)}%  empty-but-relevant ${s.emptyButRelevant}  absent topics: ${s.absentJunk} junk, ${s.absentEmpty} of ${s.absentTotal} empty`;

const rankings = [...new Set(runs.map((r) => r.ranking))].map((r) => `${r} ${runs.filter((x) => x.ranking === r).length}`).join(", ");
console.log(`${dashboard ? "Dashboard search" : "MCP search"}, ${keywordOnly ? "keyword alone" : "as deployed"} (rankings: ${rankings}; median ${[...runs.map((r) => r.ms)].sort((a, b) => a - b)[Math.floor(runs.length / 2)]} ms a search)`);
console.log(line(`All ${queries.length} requests`, summary(scored)));
console.log(line("Held-out half", summary(scored.filter((x) => heldOut.has(x.run.query.id)))));
for (const group of ["taxonomy", "concept", "brand"] as const) console.log(`  ${group.padEnd(9)} nDCG@10 ${mean(scored.filter((x) => x.run.query.group === group).map((x) => x.m.ndcg)).toFixed(3)}`);
for (const r of runs.filter((r) => r.error)) console.log(`refused: ${r.query.id} "${r.query.q}": ${r.error}`);
console.log(unjudged.length ? `\n${unjudged.length} results nobody has judged (counted as not relevant):\n  ${unjudged.join("\n  ")}` : "\nEvery result was judged.");
if (out) writeFileSync(out, JSON.stringify(runs, null, 2));
