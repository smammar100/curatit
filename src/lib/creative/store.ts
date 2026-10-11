// Creative Intelligence: everything the worker reads and writes, behind one interface. The real
// one calls the creative_* functions with the project's secret key (service_role), which exists
// only in .env.local on the machine running the worker and in server-only environment variables;
// never in the browser, never NEXT_PUBLIC_. Tests use an in-memory store with the same rules.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ImageSource } from "./media";
import { ModelError } from "./model";
import type { Manifest } from "./prompt";

export type Job = {
  id: string;
  job_key: string;
  post_id: string;
  job_type: "analyze" | "reanalyze";
  reason: string;
  content_fingerprint: string;
  pipeline_version: string;
  state: "pending" | "leased" | "succeeded" | "skipped" | "failed";
  attempts: number;
  max_attempts: number;
  lease_owner: string | null;
};

export type RunRecord = {
  worker: string;
  provider: string;
  model_id: string;
  prompt_version: string;
  taxonomy_version: string;
  input_fingerprint?: string | null;
  status?: "succeeded" | "invalid" | "failed" | "skipped";
  failure_kind?: string | null;
  error?: string | null;
  expected_slides?: number | null;
  processed_slides?: number | null;
  model_calls: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  estimated_cost_usd: number;
  duration_ms: number;
  output?: unknown;
  validation?: unknown;
  started_at: string;
};

export type Saved = { version_id: string; version_no: number; applied: boolean; published: boolean };

// The lease was lost (another worker took over an expired one): nothing to record
export class LostLease extends Error {}

export interface CreativeStore extends ImageSource {
  claim(worker: string, limit: number, leaseSeconds: number, postIds?: string[]): Promise<Job[]>;
  heartbeat(jobId: string, worker: string, leaseSeconds: number): Promise<boolean>;
  finish(
    jobId: string,
    worker: string,
    state: "skipped" | "pending" | "failed",
    details: { kind?: string; error?: string; retryAt?: Date; run?: RunRecord },
  ): Promise<string>;
  save(jobId: string, worker: string, version: object, slides: object[], run: RunRecord, publish: boolean): Promise<Saved>;
  manifest(postId: string): Promise<Manifest | null>;
  hasVersion(postId: string, inputFingerprint: string): Promise<boolean>;
}

export function createAdminClient(env: NodeJS.ProcessEnv = process.env): SupabaseClient {
  if (typeof window !== "undefined") throw new Error("The admin client is server-only");
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_SECRET_KEY (Project Settings → API keys → Secret keys) in .env.local. It's server-only: never prefix it with NEXT_PUBLIC_.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export class SupabaseStore implements CreativeStore {
  constructor(private readonly client: SupabaseClient) {}

  async claim(worker: string, limit: number, leaseSeconds: number, postIds?: string[]) {
    const { data, error } = await this.client.rpc("creative_claim_jobs", {
      p_worker: worker,
      p_limit: limit,
      p_lease_seconds: leaseSeconds,
      p_post_ids: postIds?.length ? postIds : null,
    });
    if (error) throw new Error(`claim: ${error.message}`);
    return (data ?? []) as Job[];
  }

  async heartbeat(jobId: string, worker: string, leaseSeconds: number) {
    const { data, error } = await this.client.rpc("creative_heartbeat", { p_job: jobId, p_worker: worker, p_lease_seconds: leaseSeconds });
    if (error) throw new Error(`heartbeat: ${error.message}`);
    return Boolean(data);
  }

  async finish(jobId: string, worker: string, state: "skipped" | "pending" | "failed", details: { kind?: string; error?: string; retryAt?: Date; run?: RunRecord }) {
    const { data, error } = await this.client.rpc("creative_finish_job", {
      p_job: jobId,
      p_worker: worker,
      p_state: state,
      p_failure_kind: details.kind ?? null,
      p_error: details.error ?? null,
      p_retry_at: details.retryAt?.toISOString() ?? null,
      p_run: details.run ?? null,
    });
    if (error) throw new Error(`finish: ${error.message}`);
    if (data === "lost_lease") throw new LostLease(`Lost the lease on job ${jobId}`);
    return data as string;
  }

  async save(jobId: string, worker: string, version: object, slides: object[], run: RunRecord, publish: boolean) {
    const { data, error } = await this.client.rpc("creative_save_analysis", {
      p_job: jobId,
      p_worker: worker,
      p_version: version,
      p_slides: slides,
      p_run: run,
      p_publish: publish,
    });
    if (error) {
      if (error.code === "40001") throw new ModelError("stale_input", error.message);
      if (error.code === "55000") throw new LostLease(error.message);
      throw new Error(`save: ${error.message}`);
    }
    return data as Saved;
  }

  async manifest(postId: string) {
    const { data, error } = await this.client.rpc("creative_post_manifest", { p_post_id: postId });
    if (error) throw new Error(`manifest: ${error.message}`);
    return (data ?? null) as Manifest | null;
  }

  async hasVersion(postId: string, inputFingerprint: string) {
    const { data, error } = await this.client
      .from("post_analysis_versions")
      .select("id")
      .eq("post_id", postId)
      .eq("input_fingerprint", inputFingerprint)
      .limit(1);
    if (error) throw new Error(`hasVersion: ${error.message}`);
    return Boolean(data?.length);
  }

  async download(bucket: string, path: string) {
    const { data, error } = await this.client.storage.from(bucket).download(path);
    if (error) {
      const status = (error as { status?: number; statusCode?: string | number }).status ?? Number((error as { statusCode?: string }).statusCode);
      if (status === 400 || status === 404 || /not.?found/i.test(error.message)) return null;
      throw error;
    }
    return new Uint8Array(await data.arrayBuffer());
  }
}
