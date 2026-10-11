// Creative Intelligence: an in-memory CreativeStore with the same rules as the database functions
// (leases, fencing, retries, dead letters, never overwriting reviewed work), for the worker's
// tests. The SQL itself is tested against the real schema by supabase/tests/creative_intelligence.sql.
import type { Manifest } from "./prompt";
import { aiMayOverwrite, type AnalysisSource, type ReviewStatus } from "./states";
import { LostLease, type CreativeStore, type Job, type RunRecord, type Saved } from "./store";

type Version = { id: string; post_id: string; version_no: number; input_fingerprint: string; payload: Record<string, unknown>; slides: object[] };
type Current = { version_id: string; review_status: ReviewStatus; analysis_source: AnalysisSource; published_at: string | null };
type StoredJob = Job & { next_retry_at: number; lease_expires_at: number | null; last_failure_kind: string | null; last_error: string | null; result_version_id: string | null };

export class MemoryStore implements CreativeStore {
  readonly jobs: StoredJob[] = [];
  readonly versions: Version[] = [];
  readonly current = new Map<string, Current>();
  readonly runs: (RunRecord & { job_id: string })[] = [];
  readonly manifests = new Map<string, Manifest>();
  readonly files = new Map<string, Uint8Array>();
  // Fault injection: content that changes while a post is analysed
  readonly changed = new Set<string>();
  now = () => Date.now();
  private sequence = 0;

  enqueue(postId: string, pipeline: string, options: { force?: boolean; maxAttempts?: number; priority?: number } = {}) {
    const manifest = this.manifests.get(postId);
    if (!manifest) throw new Error(`No manifest for ${postId}`);
    const key = `${postId}:${pipeline}:${manifest.content_fingerprint}${options.force ? `:force:${++this.sequence}` : ""}`;
    if (this.jobs.some((job) => job.job_key === key)) return null;
    const job: StoredJob = {
      id: `job-${++this.sequence}`,
      job_key: key,
      post_id: postId,
      job_type: options.force ? "reanalyze" : "analyze",
      reason: "manual",
      content_fingerprint: manifest.content_fingerprint,
      pipeline_version: pipeline,
      state: "pending",
      attempts: 0,
      max_attempts: options.maxAttempts ?? 3,
      lease_owner: null,
      next_retry_at: 0,
      lease_expires_at: null,
      last_failure_kind: null,
      last_error: null,
      result_version_id: null,
    };
    this.jobs.push(job);
    return job;
  }

  async claim(worker: string, limit: number, leaseSeconds: number, postIds?: string[]) {
    const now = this.now();
    for (const job of this.jobs) {
      if (job.state === "leased" && job.lease_expires_at! < now && job.attempts >= job.max_attempts) {
        Object.assign(job, { state: "failed", lease_owner: null, lease_expires_at: null, last_failure_kind: "lease_expired" });
      }
    }
    const ready = this.jobs.filter(
      (job) =>
        ((job.state === "pending" && job.next_retry_at <= now) || (job.state === "leased" && job.lease_expires_at! < now)) &&
        (!postIds || postIds.includes(job.post_id)),
    );
    return ready.slice(0, limit).map((job) => {
      Object.assign(job, { state: "leased", lease_owner: worker, lease_expires_at: now + leaseSeconds * 1000, attempts: job.attempts + 1 });
      return { ...job };
    });
  }

  private held(jobId: string, worker: string) {
    return this.jobs.find((job) => job.id === jobId && job.state === "leased" && job.lease_owner === worker);
  }

  async heartbeat(jobId: string, worker: string, leaseSeconds: number) {
    const job = this.held(jobId, worker);
    if (job) job.lease_expires_at = this.now() + leaseSeconds * 1000;
    return Boolean(job);
  }

  async finish(jobId: string, worker: string, state: "skipped" | "pending" | "failed", details: { kind?: string; error?: string; retryAt?: Date; run?: RunRecord }) {
    const job = this.held(jobId, worker);
    if (!job) throw new LostLease(`Lost the lease on ${jobId}`);
    if (state === "pending" && !details.retryAt) throw new Error("A retry needs a time");
    Object.assign(job, {
      state,
      lease_owner: null,
      lease_expires_at: null,
      next_retry_at: state === "pending" ? details.retryAt!.getTime() : job.next_retry_at,
      last_failure_kind: state === "skipped" ? job.last_failure_kind : (details.kind ?? null),
      last_error: state === "skipped" ? job.last_error : (details.error ?? null),
    });
    if (details.run) this.runs.push({ ...details.run, job_id: jobId });
    return state;
  }

  async save(jobId: string, worker: string, version: object, slides: object[], run: RunRecord, publish: boolean): Promise<Saved> {
    const job = this.held(jobId, worker);
    if (!job) throw new LostLease(`Job ${jobId} is not leased by ${worker}`);
    if (this.changed.has(job.post_id)) {
      const { ModelError } = await import("./model");
      throw new ModelError("stale_input", `Post ${job.post_id} changed while it was being analysed`);
    }
    const payload = version as Record<string, unknown>;
    const versionNo = this.versions.filter((v) => v.post_id === job.post_id).length + 1;
    const saved: Version = { id: `version-${++this.sequence}`, post_id: job.post_id, version_no: versionNo, input_fingerprint: String(payload.input_fingerprint), payload, slides };
    this.versions.push(saved);
    const current = this.current.get(job.post_id) ?? null;
    const applied = aiMayOverwrite(current);
    if (applied) {
      this.current.set(job.post_id, {
        version_id: saved.id,
        review_status: publish ? "approved" : "needs_review",
        analysis_source: "ai",
        published_at: publish ? new Date(this.now()).toISOString() : null,
      });
    }
    this.runs.push({ ...run, status: "succeeded", job_id: jobId });
    Object.assign(job, { state: "succeeded", lease_owner: null, lease_expires_at: null, result_version_id: saved.id });
    return { version_id: saved.id, version_no: versionNo, applied, published: applied && publish };
  }

  async manifest(postId: string) {
    return this.manifests.get(postId) ?? null;
  }

  async hasVersion(postId: string, inputFingerprint: string) {
    return this.versions.some((v) => v.post_id === postId && v.input_fingerprint === inputFingerprint);
  }

  async download(bucket: string, path: string) {
    return this.files.get(`${bucket}/${path}`) ?? null;
  }
}
