// Creative Intelligence: the worker. It leases jobs, analyses each post and saves the result in one
// transaction (creative_save_analysis), so a job only counts as done once its analysis is stored.
// Retries follow states.ts: temporary failures go back to the queue with exponential backoff and
// jitter until their attempts run out; everything else is a visible dead letter. A usage limit,
// an auth problem or the run's budget stops the worker cleanly; the queue keeps the rest.
// The lease is renewed while a post is being worked on, so a long carousel can't be taken over
// by a second worker; if this process dies, the lease runs out and the job is picked up again.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzePost, gate, inputFingerprint } from "./analyze";
import { prepareImages } from "./media";
import { ModelError, NO_USAGE, type ModelAdapter, type Usage } from "./model";
import { PIPELINE_VERSION, PROMPT_VERSION } from "./pipeline";
import { afterFailure, retryDelayMs, STOPS_WORKER, type FailureKind } from "./states";
import { LostLease, type CreativeStore, type Job, type RunRecord } from "./store";
import { TAXONOMY_VERSION } from "./taxonomy";
import { needsReview } from "./validate";

export type WorkerOptions = {
  store: CreativeStore;
  adapter: ModelAdapter;
  worker: string;
  // Posts processed at once, and in total
  concurrency: number;
  limit: number;
  leaseSeconds: number;
  maxUsdPerPost: number;
  maxUsdPerRun: number;
  slidesPerCall: number;
  // CREATIVE_ANALYSIS_AUTO_PUBLISH: publish clean results without review. Off unless an
  // evaluation has shown it's safe; see docs/creative-intelligence.md
  autoPublish: boolean;
  postIds?: string[];
  log?: (event: Record<string, unknown>) => void;
  random?: () => number;
  // Wait before retrying after a usage limit (the window resets in hours, not seconds)
  usageLimitRetryMs?: number;
};

export type Outcome = {
  job: string;
  post: string;
  result: "succeeded" | "skipped" | "retry" | "failed" | "lost_lease";
  kind?: FailureKind | "unchanged" | "pipeline_mismatch";
  applied?: boolean;
  costUsd: number;
};

export type WorkerReport = {
  processed: number;
  succeeded: number;
  skipped: number;
  retried: number;
  failed: number;
  lostLeases: number;
  costUsd: number;
  stoppedBy?: string;
  outcomes: Outcome[];
};

function run(options: WorkerOptions, started: Date, usage: Usage, extra: Partial<RunRecord>): RunRecord {
  return {
    worker: options.worker,
    provider: options.adapter.provider,
    model_id: options.adapter.model,
    prompt_version: PROMPT_VERSION,
    taxonomy_version: TAXONOMY_VERSION,
    model_calls: usage.calls,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cache_read_tokens: usage.cacheReadTokens,
    cache_write_tokens: usage.cacheWriteTokens,
    estimated_cost_usd: usage.costUsd,
    duration_ms: Date.now() - started.getTime(),
    started_at: started.toISOString(),
    ...extra,
  };
}

export async function processJob(job: Job, options: WorkerOptions): Promise<Outcome> {
  const { store, adapter, worker } = options;
  const log = options.log ?? (() => {});
  const started = new Date();
  const base = { job: job.id, post: job.post_id };
  let usage: Usage = NO_USAGE;
  let fingerprint: string | null = null;
  const beat = setInterval(() => {
    store.heartbeat(job.id, worker, options.leaseSeconds).catch(() => {});
  }, Math.max(5_000, (options.leaseSeconds * 1000) / 3));
  const workdir = await mkdtemp(join(tmpdir(), "curatit-creative-"));

  async function skip(kind: Outcome["kind"], reason: string): Promise<Outcome> {
    await store.finish(job.id, worker, "skipped", {
      run: run(options, started, usage, { status: "skipped", failure_kind: kind, error: reason, input_fingerprint: fingerprint }),
    });
    log({ event: "skipped", ...base, kind, reason });
    return { ...base, result: "skipped", kind, costUsd: 0 };
  }

  try {
    if (job.pipeline_version !== PIPELINE_VERSION) {
      return await skip("pipeline_mismatch", `Queued for pipeline ${job.pipeline_version}; this worker runs ${PIPELINE_VERSION}`);
    }
    const manifest = await store.manifest(job.post_id);
    if (!manifest) throw new ModelError("unsupported", "The post no longer exists");
    gate(manifest);
    fingerprint = inputFingerprint(manifest, adapter.model);
    if (job.job_type === "analyze" && (await store.hasVersion(job.post_id, fingerprint))) {
      return await skip("unchanged", "Already analysed with the same input, model, prompt and taxonomy");
    }

    const images = await prepareImages(manifest.images, store, workdir);
    const analysis = await analyzePost({ manifest, images, adapter, maxUsd: options.maxUsdPerPost, slidesPerCall: options.slidesPerCall, workdir });
    usage = analysis.usage;
    const publish = options.autoPublish && !needsReview(analysis.verdict, analysis.version.creative_dna);
    const saved = await store.save(
      job.id,
      worker,
      analysis.version,
      analysis.slides,
      run(options, started, usage, {
        input_fingerprint: fingerprint,
        expected_slides: analysis.version.expected_slides,
        processed_slides: analysis.version.processed_slides,
        output: analysis.outputs,
        validation: analysis.verdict,
      }),
      publish,
    );
    log({ event: "saved", ...base, version: saved.version_id, applied: saved.applied, published: saved.published, slides: analysis.version.processed_slides, costUsd: usage.costUsd, calls: usage.calls });
    return { ...base, result: "succeeded", applied: saved.applied, costUsd: usage.costUsd };
  } catch (error) {
    if (error instanceof LostLease) {
      log({ event: "lost_lease", ...base });
      return { ...base, result: "lost_lease", costUsd: usage.costUsd };
    }
    const kind: FailureKind = error instanceof ModelError ? error.kind : "bug";
    if (error instanceof ModelError) usage = error.usage.calls ? error.usage : usage;
    const message = (error as Error).message ?? String(error);
    const next = afterFailure(kind, job.attempts, job.max_attempts);
    const retryAt = new Date(Date.now() + (kind === "usage_limit" ? (options.usageLimitRetryMs ?? 3_600_000) : retryDelayMs(job.attempts, { random: options.random })));
    try {
      await store.finish(job.id, worker, next === "pending" ? "pending" : "failed", {
        kind,
        error: message,
        retryAt: next === "pending" ? retryAt : undefined,
        run: run(options, started, usage, {
          status: kind === "invalid_output" ? "invalid" : "failed",
          failure_kind: kind,
          error: message,
          input_fingerprint: fingerprint,
          output: error instanceof ModelError ? error.output : undefined,
        }),
      });
    } catch (finishError) {
      if (finishError instanceof LostLease) return { ...base, result: "lost_lease", costUsd: usage.costUsd };
      throw finishError;
    }
    log({ event: next === "pending" ? "retry" : "failed", ...base, kind, attempt: job.attempts, of: job.max_attempts, error: message.slice(0, 300), retryAt: next === "pending" ? retryAt.toISOString() : undefined });
    return { ...base, result: next === "pending" ? "retry" : "failed", kind, costUsd: usage.costUsd };
  } finally {
    clearInterval(beat);
    await rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function runWorker(options: WorkerOptions): Promise<WorkerReport> {
  const log = options.log ?? (() => {});
  const report: WorkerReport = { processed: 0, succeeded: 0, skipped: 0, retried: 0, failed: 0, lostLeases: 0, costUsd: 0, outcomes: [] };
  await options.adapter.preflight();
  log({ event: "start", worker: options.worker, provider: options.adapter.provider, model: options.adapter.model, pipeline: PIPELINE_VERSION, concurrency: options.concurrency, limit: options.limit, maxUsdPerRun: options.maxUsdPerRun });

  while (!report.stoppedBy && report.processed < options.limit) {
    if (report.costUsd >= options.maxUsdPerRun) {
      report.stoppedBy = "budget";
      break;
    }
    const jobs = await options.store.claim(options.worker, Math.min(options.concurrency, options.limit - report.processed), options.leaseSeconds, options.postIds);
    if (!jobs.length) break;
    const outcomes = await Promise.all(jobs.map((job) => processJob(job, options)));
    for (const outcome of outcomes) {
      report.outcomes.push(outcome);
      report.processed++;
      report.costUsd = Math.round((report.costUsd + outcome.costUsd) * 1e6) / 1e6;
      if (outcome.result === "succeeded") report.succeeded++;
      else if (outcome.result === "skipped") report.skipped++;
      else if (outcome.result === "retry") report.retried++;
      else if (outcome.result === "failed") report.failed++;
      else report.lostLeases++;
      if (outcome.kind && STOPS_WORKER.has(outcome.kind as FailureKind)) report.stoppedBy = outcome.kind;
    }
  }
  log({ event: "done", ...report, outcomes: undefined });
  return report;
}
