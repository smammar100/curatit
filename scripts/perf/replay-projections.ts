// What the search projections (supabase/migrations/20261026070552_search_projections.sql) save on
// the searches the app really sends, before the migration is applied: the requests are built by
// the app's own code (the dashboard's interpretation, the MCP search service, the AI integration
// page's examples), then each is answered twice in one transaction that always rolls back, by
// today's functions and by the migration's (created in a scratch schema), as the anon role. Prints
// the requests and bytes of each workflow both ways, raw and gzipped, and whether every response
// kept the same posts in the same order. Read-only in effect: nothing is left behind.
//
//   npx tsx scripts/perf/replay-projections.ts [--workdir <linked supabase project dir>]
import { execSync as execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

process.env.CURATIT_SUPABASE_USAGE ??= "memory";
process.loadEnvFile(".env.local");
const { createSupabaseCatalog } = await import("@/lib/mcp/repo/supabase");
const { searchPosts, clearRankings } = await import("@/lib/mcp/services/search");
const { TOOLS } = await import("@/lib/mcp/contracts");
const { createLocalModels } = await import("@/lib/search/semantic/models");
const { interpretSearch } = await import("@/lib/search/interpret");
const { CATEGORIES } = await import("@/lib/categories");
const { SEARCHES } = await import("@/components/mcp/searchExamples");

const args = process.argv.slice(2);
const workdir = args.includes("--workdir") ? args[args.indexOf("--workdir") + 1] : process.cwd();
const env = process.env;

// The MCP's database calls, as it sends them on a database without the projections (each refused
// "fields" try is left out; what remains is today's request)
type Call = { fn: "v2" | "v3"; request: Record<string, unknown>; ids: string[] | null };
const calls: { workflow: string; call: Call }[] = [];
let workflow = "";
const capture: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const fn = url.includes("/rpc/curatit_mcp_search_v2") ? "v2" : url.includes("/rpc/curatit_mcp_search_v3") ? "v3" : null;
  if (fn && res.ok) {
    const body = JSON.parse(String(init?.body ?? "{}"));
    // v3's ranking stage (an embedding) isn't changed by the projections
    if (!(fn === "v3" && !body.p_ids)) calls.push({ workflow, call: { fn, request: body.p_request ?? {}, ids: body.p_ids ?? null } });
  }
  return res;
};
const repo = createSupabaseCatalog({ url: env.NEXT_PUBLIC_SUPABASE_URL!, publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, secretKey: env.SUPABASE_SECRET_KEY!, fetch: capture });
const models = createLocalModels({ modelDir: join(process.cwd(), "models"), download: false });
const ctx = { signingSecret: new Uint8Array(32).fill(9), principalKey: "perf-replay", semantic: models };

const MCP: Record<string, { query: string; pages?: number }[]> = {
  "mcp search (4 queries)": [{ query: "minimalist finance carousel" }, { query: "Black Friday promotion" }, { query: "fintech posts announcing a new feature" }, { query: "fintehc carousels" }],
  "mcp search, two pages": [{ query: "carousels that teach something step by step", pages: 2 }],
  "mcp search, 20 results": [{ query: "posts that make saving money feel fun" }, { query: "user generated content" }],
};
for (const [name, searches] of Object.entries(MCP)) {
  workflow = name;
  for (const { query, pages = 1 } of searches) {
    clearRankings();
    let cursor: string | undefined;
    for (let page = 0; page < pages; page++) {
      const limit = name.includes("20 results") ? 20 : undefined;
      const { data } = await searchPosts(repo, TOOLS.curatit_search_posts.input.parse({ query, ...(limit && { limit }), ...(cursor && { cursor }) }) as never, ctx);
      cursor = data.next_cursor ?? undefined;
      if (!cursor) break;
    }
  }
}

// The dashboard's searches, as its own interpretation builds them, no scope
const terms = await repo.terms();
const brands = await repo.brands();
const DASHBOARD = ["minimalist finance carousel", "Black Friday promotion", "fintech posts announcing a new feature", "fintehc carousels", "carousels with app screens", "funny posts about saving money"];
const dashboard = DASHBOARD.map((query) => {
  const plan = interpretSearch(query, { brands, categories: CATEGORIES, dimensions: terms.dimensions });
  return { ...plan.filters, ...(plan.query ? { query: plan.query } : {}) };
});

// Every response, today's and the projection's, from one transaction that rolls back
const migration = readFileSync(join("supabase", "migrations", readdirSync(join("supabase", "migrations")).find((f) => f.endsWith("_search_projections.sql"))!), "utf8");
const scratch = migration
  .replaceAll("FUNCTION public.curatit_mcp_search_v2(", "FUNCTION curatit_perf_test.curatit_mcp_search_v2(")
  .replaceAll("FUNCTION public.curatit_mcp_search_v3(", "FUNCTION curatit_perf_test.curatit_mcp_search_v3(")
  .replaceAll("function private.creative_mcp_card(", "function curatit_perf_test.creative_mcp_card(")
  .replaceAll("private.creative_mcp_card(pg.id)", "curatit_perf_test.creative_mcp_card(pg.id)");
const literal = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const ids = (list: string[] | null) => (list ? `array[${list.map((id) => `'${id.replaceAll("'", "''")}'`).join(",")}]::text[]` : "null::text[]");
const rows: string[] = [];
calls.forEach(({ workflow: name, call }, i) => {
  const before = call.fn === "v2" ? `public.curatit_mcp_search_v2(${literal(call.request)})` : `public.curatit_mcp_search_v3(${literal(call.request)}, null, ${ids(call.ids)})`;
  const after = call.fn === "v2" ? `curatit_perf_test.curatit_mcp_search_v2(${literal({ ...call.request, fields: "card" })})` : `curatit_perf_test.curatit_mcp_search_v3(${literal({ ...call.request, fields: "card" })}, null, ${ids(call.ids)})`;
  rows.push(`select ${i} as n, '${name.replaceAll("'", "''")}' as workflow, 'single' as kind, ${before}::text as before, ${after}::text as after`);
});
// The dashboard pages through every match: 50 a page before, 100 short codes a page after
const paged = (request: object, compact: boolean) =>
  `(select jsonb_agg(page order by o) from generate_series(0, 450, ${compact ? 100 : 50}) o, lateral (select ${compact ? "curatit_perf_test" : "public"}.curatit_mcp_search_v2(${literal(request)} || jsonb_build_object(${compact ? `'fields', 'ids', 'limit', 100` : `'limit', 50`}, 'offset', o)) as page) p
     where o = 0 or (select (prev ->> 'has_more')::boolean from (select ${compact ? "curatit_perf_test" : "public"}.curatit_mcp_search_v2(${literal(request)} || jsonb_build_object(${compact ? `'fields', 'ids', 'limit', 100` : `'limit', 50`}, 'offset', o - ${compact ? 100 : 50})) as prev) x))::text`;
dashboard.forEach((request, i) => rows.push(`select ${1000 + i}, 'dashboard search (6 queries)', 'paged', ${paged(request, false)}, ${paged(request, true)}`));
SEARCHES.forEach(({ request }, i) =>
  rows.push(`select ${2000 + i}, 'agents page examples', 'single', public.curatit_mcp_search_v2(${literal({ ...request, limit: 6 })})::text, curatit_perf_test.curatit_mcp_search_v2(${literal({ ...request, limit: 6, fields: "ids" })})::text`),
);
const sql = `begin;
set local statement_timeout = '120s';
create schema curatit_perf_test;
${scratch}
grant usage on schema curatit_perf_test to anon;
grant execute on all functions in schema curatit_perf_test to anon;
set local role anon;
${rows.join("\nunion all\n")}
order by n;
rollback;
`;
const dir = mkdtempSync(join(tmpdir(), "curatit-replay-"));
writeFileSync(join(dir, "replay.sql"), sql);
const out = execFileSync(`npx supabase db query --linked --workdir "${workdir}" -f "${join(dir, "replay.sql")}" -o json`, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: true, stdio: ["ignore", "pipe", "inherit"] } as never) as unknown as string;
const result = JSON.parse(out.slice(out.indexOf("{"))) as { rows: { workflow: string; kind: string; before: string; after: string }[] };

// The posts each response names, in order, to check nothing but their size changed
const order = (text: string, kind: string): string[] => {
  const pages = kind === "paged" ? (JSON.parse(text) as { posts: { short_code: string }[] }[]) : [JSON.parse(text) as { posts: { short_code: string }[] }];
  return pages.flatMap((page) => page.posts.map((post) => post.short_code));
};
const bytes = (text: string, kind: string) => {
  const parts = kind === "paged" ? (JSON.parse(text) as unknown[]).map((page) => JSON.stringify(page)) : [text];
  return { requests: parts.length, raw: parts.reduce((n, p) => n + Buffer.byteLength(p), 0), gzip: parts.reduce((n, p) => n + gzipSync(p).byteLength, 0) };
};
const totals = new Map<string, { before: ReturnType<typeof bytes>; after: ReturnType<typeof bytes>; same: boolean }>();
for (const row of result.rows) {
  const before = bytes(row.before, row.kind);
  const after = bytes(row.after, row.kind);
  const same = JSON.stringify(order(row.before, row.kind)) === JSON.stringify(order(row.after, row.kind));
  const t = totals.get(row.workflow) ?? { before: { requests: 0, raw: 0, gzip: 0 }, after: { requests: 0, raw: 0, gzip: 0 }, same: true };
  for (const k of ["requests", "raw", "gzip"] as const) {
    t.before[k] += before[k];
    t.after[k] += after[k];
  }
  t.same &&= same;
  totals.set(row.workflow, t);
}
const kib = (n: number) => `${(n / 1024).toFixed(1)} KiB`;
const cut = (a: number, b: number) => `${a ? Math.round((100 * (a - b)) / a) : 0}%`;
console.log(`${"workflow".padEnd(30)} ${"requests".padStart(9)} ${"raw before".padStart(11)} ${"raw after".padStart(11)} ${"cut".padStart(5)} ${"gzip before".padStart(12)} ${"gzip after".padStart(11)} ${"cut".padStart(5)}  same posts, same order`);
for (const [name, t] of totals) {
  console.log(`${name.padEnd(30)} ${`${t.before.requests}→${t.after.requests}`.padStart(9)} ${kib(t.before.raw).padStart(11)} ${kib(t.after.raw).padStart(11)} ${cut(t.before.raw, t.after.raw).padStart(5)} ${kib(t.before.gzip).padStart(12)} ${kib(t.after.gzip).padStart(11)} ${cut(t.before.gzip, t.after.gzip).padStart(5)}  ${t.same ? "yes" : "NO"}`);
}
