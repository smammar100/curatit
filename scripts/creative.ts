// Creative Intelligence from the command line. Reads .env.local; everything that touches the
// database needs SUPABASE_SECRET_KEY there (server-only, never NEXT_PUBLIC_).
//
//   npm run creative -- status                         queue, analyses, recent runs and dead letters
//   npm run creative -- enqueue --post <id> [<id>…]    queue posts (also --scrape-run <uuid>, --all; --force re-analyses)
//   npm run creative -- reconcile [--apply]            find posts due (dry run unless --apply; --include-stale, --limit)
//   npm run creative -- work [--limit 10]              analyse queued posts with the local Claude Code subscription
//        [--concurrency 2] [--budget 2] [--post-budget 0.5] [--model sonnet] [--post <id>…] [--dry-run]
//   npm run creative -- preview --post <id>            analyse one post and print it; saves nothing
//   npm run -s creative -- eval-sample [--size 30]     a stratified set of posts for people to label
//   npm run creative -- eval --labels <file> [--queries <file>]   score the AI against those labels
//   npm run -s creative -- taxonomy-sql                the SQL that seeds the taxonomy, for a new migration
//
// Model calls happen only in `work` and `preview`, only on this machine, and only within the
// budgets above. See docs/creative-intelligence.md.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";
import { analyzePost, gate } from "@/lib/creative/analyze";
import { ClaudeCliAdapter } from "@/lib/creative/claudeCli";
import { prepareImages } from "@/lib/creative/media";
import { MockAdapter } from "@/lib/creative/mock";
import type { ModelAdapter } from "@/lib/creative/model";
import { PIPELINE_VERSION } from "@/lib/creative/pipeline";
import { evaluate, type HumanLabel, type Prediction, type SearchJudgement } from "@/lib/creative/evaluate";
import type { CreativeDna } from "@/lib/creative/schema";
import { createAdminClient, SupabaseStore } from "@/lib/creative/store";
import { taxonomySql } from "@/lib/creative/taxonomySql";
import { runWorker } from "@/lib/creative/worker";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: use the environment as it is
}

const [command, ...rest] = process.argv.slice(2);

// --flag value, --flag (true), --flag a b c (several values until the next flag)
function parse(argv: string[]) {
  const flags = new Map<string, string[]>();
  let current: string | null = null;
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      current = arg.slice(2);
      flags.set(current, []);
    } else if (current) {
      flags.get(current)!.push(arg);
    }
  }
  return {
    has: (name: string) => flags.has(name),
    list: (name: string) => flags.get(name) ?? [],
    text: (name: string, fallback?: string) => flags.get(name)?.[0] ?? fallback,
    number: (name: string, fallback: number) => {
      const value = flags.get(name)?.[0];
      const number = value === undefined ? fallback : Number(value);
      if (!Number.isFinite(number) || number < 0) throw new Error(`--${name} must be a number`);
      return number;
    },
  };
}

const flags = parse(rest);
const env = process.env;
const log = (event: Record<string, unknown>) => console.error(JSON.stringify({ at: new Date().toISOString(), ...event }));

function adapter(): ModelAdapter {
  const provider = flags.text("provider", env.CREATIVE_ANALYSIS_PROVIDER ?? "claude-cli");
  const model = flags.text("model", env.CREATIVE_ANALYSIS_MODEL ?? "sonnet")!;
  if (provider === "mock") return new MockAdapter();
  if (provider === "claude-cli") {
    return new ClaudeCliAdapter({ model, timeoutMs: Number(env.CREATIVE_MODEL_TIMEOUT_MS ?? 300_000) });
  }
  throw new Error(`Unknown provider ${provider} (claude-cli or mock)`);
}

async function publishedIds(client: ReturnType<typeof createAdminClient>, scrapeRun?: string) {
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    let query = client.from("instagram_posts").select("id").eq("is_published", true).order("id").range(from, from + 999);
    if (scrapeRun) query = query.eq("scrape_run_id", scrapeRun);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    ids.push(...(data ?? []).map((row) => row.id as string));
    if (!data || data.length < 1000) return ids;
  }
}

async function status() {
  const client = createAdminClient();
  const count = async (table: string, column: string, value: string | boolean | null) => {
    let query = client.from(table).select("*", { count: "exact", head: true });
    query = value === null ? query.not(column, "is", null) : query.eq(column, value);
    const { count, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    return count ?? 0;
  };
  const jobs = Object.fromEntries(
    await Promise.all(["pending", "leased", "succeeded", "skipped", "failed"].map(async (state) => [state, await count("classification_jobs", "state", state)])),
  );
  const analyses = Object.fromEntries(
    await Promise.all(["draft", "needs_review", "approved", "rejected"].map(async (state) => [state, await count("post_analyses", "review_status", state)])),
  );
  const published = await count("post_analyses", "published_at", null);
  const { data: oldest } = await client.from("classification_jobs").select("created_at").eq("state", "pending").order("created_at").limit(1);
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { data: runs } = await client.from("creative_analysis_runs").select("status, failure_kind, estimated_cost_usd, duration_ms, model_calls").gte("started_at", since);
  const { data: dead } = await client.from("classification_jobs").select("post_id, last_failure_kind, last_error, attempts").eq("state", "failed").order("updated_at", { ascending: false }).limit(10);
  const day = (runs ?? []).reduce(
    (sum, run) => ({
      runs: sum.runs + 1,
      calls: sum.calls + (run.model_calls ?? 0),
      costUsd: sum.costUsd + Number(run.estimated_cost_usd ?? 0),
      failed: sum.failed + (run.status === "failed" || run.status === "invalid" ? 1 : 0),
    }),
    { runs: 0, calls: 0, costUsd: 0, failed: 0 },
  );
  console.log(
    JSON.stringify(
      {
        pipeline: PIPELINE_VERSION,
        jobs,
        oldestPending: oldest?.[0]?.created_at ?? null,
        analyses: { ...analyses, published },
        last24h: { ...day, costUsd: Math.round(day.costUsd * 10000) / 10000 },
        deadLetters: dead ?? [],
      },
      null,
      2,
    ),
  );
}

async function enqueue() {
  const client = createAdminClient();
  const ids = flags.has("all") ? await publishedIds(client) : flags.has("scrape-run") ? await publishedIds(client, flags.text("scrape-run")) : flags.list("post");
  if (!ids.length) throw new Error("Nothing to queue: give --post <id>…, --scrape-run <uuid> or --all");
  const results = [];
  for (let i = 0; i < ids.length; i += 1000) {
    const { data, error } = await client.rpc("creative_enqueue", {
      p_post_ids: ids.slice(i, i + 1000),
      p_pipeline: PIPELINE_VERSION,
      p_scrape_run: flags.text("scrape-run") ?? null,
      p_reason: "manual",
      p_force: flags.has("force"),
      p_priority: flags.number("priority", 0),
    });
    if (error) throw new Error(error.message);
    results.push(data);
  }
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
}

async function reconcile() {
  const { data, error } = await createAdminClient().rpc("creative_reconcile", {
    p_pipeline: PIPELINE_VERSION,
    p_dry_run: !flags.has("apply"),
    p_include_stale: flags.has("include-stale"),
    p_limit: flags.number("limit", 200),
  });
  if (error) throw new Error(error.message);
  console.log(JSON.stringify(data, null, 2));
}

async function work() {
  if (env.CREATIVE_ANALYSIS_ENABLED === "false") throw new Error("CREATIVE_ANALYSIS_ENABLED is false: the worker is switched off");
  const model = adapter();
  if (model.provider === "mock" && env.CREATIVE_ALLOW_MOCK_WRITES !== "true") {
    throw new Error("The mock provider would save made-up analyses. Use preview, or set CREATIVE_ALLOW_MOCK_WRITES=true on a staging project.");
  }
  const client = createAdminClient();
  const postIds = flags.list("post");
  if (flags.has("dry-run")) {
    let query = client.from("classification_jobs").select("id, post_id, job_type, attempts, priority, next_retry_at").eq("state", "pending").lte("next_retry_at", new Date().toISOString()).order("priority", { ascending: false }).order("created_at").limit(flags.number("limit", 10));
    if (postIds.length) query = query.in("post_id", postIds);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    console.log(JSON.stringify({ dryRun: true, wouldProcess: data }, null, 2));
    return;
  }
  const autoPublish = flags.has("auto-publish") && env.CREATIVE_ANALYSIS_AUTO_PUBLISH === "true";
  if (flags.has("auto-publish") && !autoPublish) log({ event: "notice", message: "--auto-publish ignored: CREATIVE_ANALYSIS_AUTO_PUBLISH isn't true" });
  const report = await runWorker({
    store: new SupabaseStore(client),
    adapter: model,
    worker: `${hostname()}-${process.pid}`,
    concurrency: Math.max(1, Math.min(8, flags.number("concurrency", Number(env.CLASSIFIER_CONCURRENCY ?? 2)))),
    limit: flags.number("limit", 10),
    leaseSeconds: flags.number("lease", 900),
    maxUsdPerPost: flags.number("post-budget", Number(env.CREATIVE_MAX_USD_PER_POST ?? 0.5)),
    maxUsdPerRun: flags.number("budget", Number(env.CREATIVE_MAX_USD_PER_RUN ?? 2)),
    slidesPerCall: Math.max(1, flags.number("slides-per-call", Number(env.CREATIVE_SLIDES_PER_CALL ?? 10))),
    autoPublish,
    postIds: postIds.length ? postIds : undefined,
    log,
  });
  console.log(JSON.stringify({ ...report, outcomes: report.outcomes }, null, 2));
  if (report.failed || report.stoppedBy) process.exitCode = 2;
}

async function preview() {
  const postId = flags.text("post");
  if (!postId) throw new Error("preview needs --post <id>");
  const store = new SupabaseStore(createAdminClient());
  const manifest = await store.manifest(postId);
  if (!manifest) throw new Error(`No post ${postId}`);
  gate(manifest);
  const model = adapter();
  await model.preflight();
  const workdir = await mkdtemp(join(tmpdir(), "curatit-preview-"));
  try {
    const images = await prepareImages(manifest.images, store, workdir);
    const analysis = await analyzePost({
      manifest,
      images,
      adapter: model,
      maxUsd: flags.number("post-budget", Number(env.CREATIVE_MAX_USD_PER_POST ?? 0.5)),
      slidesPerCall: Math.max(1, flags.number("slides-per-call", Number(env.CREATIVE_SLIDES_PER_CALL ?? 10))),
      workdir,
    });
    const file = join(tmpdir(), `curatit-preview-${postId}.json`);
    await writeFile(file, JSON.stringify(analysis, null, 2));
    const dna = analysis.version.creative_dna;
    console.log(
      JSON.stringify(
        {
          post: postId,
          slides: `${analysis.version.processed_slides}/${analysis.version.expected_slides}`,
          primary: dna.primary_archetype.slug,
          objective: dna.marketing_objective.slug,
          concept: dna.concept,
          summary: dna.creative_summary,
          takeaways: dna.takeaways,
          warnings: analysis.verdict.warnings.map((w) => w.message),
          usage: analysis.usage,
          saved: "nothing (preview)",
          full: file,
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

// Posts to label by hand, spread across industries, formats, carousel lengths and caption lengths
// (including the awkward ones: single images, two slides, ten or more, captions under 40 characters)
async function evalSample() {
  const size = flags.number("size", 30);
  const { data, error } = await createAdminClient()
    .from("instagram_posts")
    .select("id, short_code, url, format, caption, brands(slug, categories(slug)), post_images(position)")
    .eq("is_published", true);
  if (error) throw new Error(error.message);
  type Row = { id: string; short_code: string; url: string; format: string; caption: string | null; brands: { slug: string; categories: { slug: string } | null } | null; post_images: { position: number }[] };
  const posts = ((data ?? []) as unknown as Row[]).map((row) => {
    const slides = row.post_images.length;
    const captionLength = (row.caption ?? "").trim().length;
    return {
      row,
      slides,
      captionLength,
      group: [row.brands?.categories?.slug ?? "none", row.format, slides >= 10 ? "10+" : slides <= 2 ? "1-2" : "3-9", captionLength < 40 ? "short" : "long"].join("|"),
    };
  });
  // A stable shuffle, so the same library gives the same sample
  const hash = (text: string) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
  const groups = [...Map.groupBy(posts.toSorted((a, b) => hash(a.row.id) - hash(b.row.id)), (p) => p.group).values()];
  const picked: typeof posts = [];
  for (let round = 0; picked.length < size && groups.some((g) => g.length > round); round++) {
    for (const group of groups) if (group[round] && picked.length < size) picked.push(group[round]);
  }
  const template = picked.map(({ row, slides, captionLength }) => ({
    post_id: row.id,
    url: row.url,
    category: row.brands?.categories?.slug ?? null,
    format: row.format,
    slides,
    caption_length: captionLength,
    primary_archetype: "",
    secondary_archetypes: [],
    objective: "",
    narrative_pattern: "",
    hook_technique: "",
    typography: [],
    layout: [],
    imagery: [],
    slide_roles: [],
  }));
  console.log(JSON.stringify(template, null, 2));
}

// The latest AI version of each labelled post against the person's label, and search queries
// (each with the search_v2 request and the ids a designer judged relevant) for Precision@5
async function evalRun() {
  const labelsFile = flags.text("labels");
  if (!labelsFile) throw new Error("eval needs --labels <file> (from eval-sample, filled in by a person)");
  const labels = (JSON.parse(await readFile(labelsFile, "utf8")) as HumanLabel[]).filter((label) => label.primary_archetype);
  const client = createAdminClient();
  const ids = labels.map((label) => label.post_id);
  const [{ data: versions, error }, { data: posts }] = await Promise.all([
    client.from("post_analysis_versions").select("post_id, version_no, creative_dna, expected_slides, processed_slides").eq("source", "ai").in("post_id", ids).order("version_no", { ascending: false }),
    client.from("instagram_posts").select("id, caption").in("id", ids),
  ]);
  if (error) throw new Error(error.message);
  const captions = new Map(((posts ?? []) as { id: string; caption: string | null }[]).map((p) => [p.id, p.caption ?? ""]));
  const latest = new Map<string, Prediction>();
  for (const v of (versions ?? []) as { post_id: string; creative_dna: CreativeDna; expected_slides: number; processed_slides: number }[]) {
    if (!latest.has(v.post_id)) latest.set(v.post_id, { post_id: v.post_id, dna: v.creative_dna, caption: captions.get(v.post_id) ?? "", expectedSlides: v.expected_slides, slidesRecorded: v.processed_slides });
  }
  const searches: SearchJudgement[] = [];
  const queriesFile = flags.text("queries");
  if (queriesFile) {
    for (const q of JSON.parse(await readFile(queriesFile, "utf8")) as { query: string; request: object; relevant: string[] }[]) {
      const { data, error: searchError } = await client.rpc("curatit_mcp_search_v2", { p_request: { ...q.request, limit: 5 } });
      if (searchError) throw new Error(`${q.query}: ${searchError.message}`);
      searches.push({ query: q.query, relevant: q.relevant, results: ((data?.posts ?? []) as { id: string }[]).map((p) => p.id) });
    }
  }
  console.log(JSON.stringify(evaluate(labels, [...latest.values()], searches), null, 2));
}

const commands: Record<string, () => Promise<void> | void> = {
  status,
  enqueue,
  reconcile,
  work,
  preview,
  "eval-sample": evalSample,
  eval: evalRun,
  "taxonomy-sql": () => void process.stdout.write(taxonomySql()),
};

const run = command ? commands[command] : undefined;
if (!run) {
  console.error(`Usage: npm run creative -- <${Object.keys(commands).join(" | ")}> [options]  (see scripts/creative.ts)`);
  process.exit(1);
}
Promise.resolve(run()).catch((error) => {
  console.error(`creative ${command}: ${(error as Error).message}`);
  process.exit(1);
});
