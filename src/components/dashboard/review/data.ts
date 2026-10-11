"use client";

// Creative Intelligence review: what the review pages read and do. Everything goes through the
// signed-in editor's own session, so RLS and the creative_* functions' editor checks decide what
// comes back and what's allowed; a member who finds these pages gets nothing.
import { PIPELINE_VERSION } from "@/lib/creative/pipeline";
import type { CreativeDna, Perception, SlideObservation } from "@/lib/creative/schema";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "../profile";

export type ReviewStatus = "draft" | "needs_review" | "approved" | "rejected";
export type Source = "ai" | "human" | "mixed";
export type Issue = { code: string; message: string; path?: string };

export type Version = {
  id: string;
  version_no: number;
  source: Source;
  based_on_id: string | null;
  summary: string;
  hook: string | null;
  why_it_works: string | null;
  takeaways: string[];
  creative_dna: CreativeDna;
  perception: Perception | null;
  model_id: string | null;
  prompt_version: string | null;
  taxonomy_version: string;
  validation: { errors?: Issue[]; warnings?: Issue[] };
  image_analysis_complete: boolean;
  expected_slides: number;
  processed_slides: number;
  review_decision: "approved" | "rejected" | null;
  reviewed_at: string | null;
  review_note: string | null;
  published_at: string | null;
  created_at: string;
};

export type SlideRow = { version_id: string; position: number; role: string; observation: SlideObservation };

export type Analysis = {
  current_version_id: string | null;
  review_status: ReviewStatus;
  analysis_source: Source;
  published_at: string | null;
  reviewed_at: string | null;
  updated_at: string;
};

export type Job = {
  id: string;
  post_id: string;
  job_type: string;
  reason: string;
  state: "pending" | "leased" | "succeeded" | "skipped" | "failed";
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  last_error: string | null;
  last_failure_kind: string | null;
  created_at: string;
  updated_at: string;
};

export type Run = {
  id: string;
  post_id: string;
  status: "succeeded" | "invalid" | "failed" | "skipped";
  failure_kind: string | null;
  error: string | null;
  provider: string;
  model_id: string | null;
  model_calls: number | null;
  expected_slides: number | null;
  processed_slides: number | null;
  estimated_cost_usd: number | null;
  duration_ms: number | null;
  started_at: string;
};

export type ReviewEvent = { id: string; version_id: string | null; action: string; note: string | null; created_at: string };

export type PostSummary = {
  id: string;
  short_code: string;
  url: string;
  caption: string | null;
  format: string;
  brand: string;
  category: string;
  images: string[];
};

const POST_COLUMNS = "id, short_code, url, caption, format, brands(name, categories(name)), post_images(position, path)";

type PostRow = {
  id: string;
  short_code: string;
  url: string;
  caption: string | null;
  format: string;
  brands: { name: string; categories: { name: string } | null } | null;
  post_images: { position: number; path: string }[];
};

function toPost(row: PostRow): PostSummary {
  return {
    id: row.id,
    short_code: row.short_code,
    url: row.url,
    caption: row.caption,
    format: row.format,
    brand: row.brands?.name ?? "Unknown brand",
    category: row.brands?.categories?.name ?? "",
    images: row.post_images.toSorted((a, b) => a.position - b.position).map((image) => `/lib/${image.path}`),
  };
}

// null while the profile loads, then whether the signed-in person is an editor (or admin). This
// only decides what the page shows; RLS and the functions decide what anyone can read or do
export function useIsEditor() {
  const { status, profile } = useProfile();
  return status === "loading" ? null : profile.editor;
}

export type QueueRow = { post: PostSummary; analysis: (Analysis & { creative_dna: CreativeDna | null; summary: string }) | null; proposals: number; job: Job | null };

export type Queue = {
  counts: Record<"pending" | "leased" | "failed" | "needs_review" | "approved" | "published" | "rejected", number>;
  review: QueueRow[];
  failed: QueueRow[];
  published: QueueRow[];
  runs: (Run & { post: PostSummary | null })[];
  oldestPending: string | null;
};

const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
};

export async function loadQueue(): Promise<Queue> {
  const supabase = createClient();
  const head = { count: "exact" as const, head: true };
  const [pending, leased, failedCount, needsReview, approved, published, rejected] = await Promise.all([
    count(supabase.from("classification_jobs").select("id", head).eq("state", "pending")),
    count(supabase.from("classification_jobs").select("id", head).eq("state", "leased")),
    count(supabase.from("classification_jobs").select("id", head).eq("state", "failed")),
    count(supabase.from("post_analyses").select("id", head).eq("review_status", "needs_review")),
    count(supabase.from("post_analyses").select("id", head).eq("review_status", "approved").is("published_at", null)),
    count(supabase.from("post_analyses").select("id", head).not("published_at", "is", null)),
    count(supabase.from("post_analyses").select("id", head).eq("review_status", "rejected")),
  ]);

  const [{ data: analyses }, { data: proposals }, { data: failedJobs }, { data: runs }, { data: oldest }] = await Promise.all([
    supabase
      .from("post_analyses")
      .select("post_id, current_version_id, review_status, analysis_source, published_at, reviewed_at, updated_at, creative_dna, summary")
      .order("updated_at", { ascending: false })
      .limit(300),
    // Newer analyses waiting beside a reviewed one
    supabase.from("post_analysis_versions").select("id, post_id").is("review_decision", null).order("created_at", { ascending: false }).limit(300),
    supabase.from("classification_jobs").select("*").eq("state", "failed").order("updated_at", { ascending: false }).limit(50),
    supabase.from("creative_analysis_runs").select("*").order("started_at", { ascending: false }).limit(30),
    supabase.from("classification_jobs").select("created_at").eq("state", "pending").order("created_at").limit(1),
  ]);

  type AnalysisRow = Analysis & { post_id: string; creative_dna: CreativeDna | null; summary: string };
  const byPost = new Map<string, AnalysisRow>(((analyses ?? []) as AnalysisRow[]).map((row) => [row.post_id, row]));
  const proposalCount = new Map<string, number>();
  for (const row of (proposals ?? []) as { id: string; post_id: string }[]) {
    if (byPost.get(row.post_id)?.current_version_id === row.id) continue;
    proposalCount.set(row.post_id, (proposalCount.get(row.post_id) ?? 0) + 1);
  }
  const jobByPost = new Map<string, Job>(((failedJobs ?? []) as Job[]).map((job) => [job.post_id, job]));
  const ids = [...new Set([...byPost.keys(), ...jobByPost.keys(), ...((runs ?? []) as Run[]).map((run) => run.post_id)])];
  const { data: posts } = ids.length ? await supabase.from("instagram_posts").select(POST_COLUMNS).in("id", ids) : { data: [] };
  const postById = new Map(((posts ?? []) as unknown as PostRow[]).map((row) => [row.id, toPost(row)]));

  const row = (postId: string): QueueRow | null => {
    const post = postById.get(postId);
    if (!post) return null;
    return { post, analysis: byPost.get(postId) ?? null, proposals: proposalCount.get(postId) ?? 0, job: jobByPost.get(postId) ?? null };
  };
  const rows = (list: string[]) => list.map(row).filter((r): r is QueueRow => r !== null);
  const analysed = [...byPost.values()];

  return {
    counts: { pending, leased, failed: failedCount, needs_review: needsReview, approved, published, rejected },
    review: rows([
      ...analysed.filter((a) => a.review_status === "needs_review" || a.review_status === "draft").map((a) => a.post_id),
      ...[...proposalCount.keys()].filter((id) => !["needs_review", "draft"].includes(byPost.get(id)?.review_status ?? "")),
    ]),
    failed: rows([...jobByPost.keys()]),
    published: rows(analysed.filter((a) => a.published_at).map((a) => a.post_id)),
    runs: ((runs ?? []) as Run[]).map((run) => ({ ...run, post: postById.get(run.post_id) ?? null })),
    oldestPending: (oldest?.[0] as { created_at: string } | undefined)?.created_at ?? null,
  };
}

export type PostReview = {
  post: PostSummary;
  analysis: Analysis | null;
  versions: Version[];
  slides: SlideRow[];
  jobs: Job[];
  runs: Run[];
  events: ReviewEvent[];
};

export async function loadPostReview(postId: string): Promise<PostReview | null> {
  const supabase = createClient();
  const [{ data: post }, { data: analysis }, { data: versions }, { data: slides }, { data: jobs }, { data: runs }, { data: events }] = await Promise.all([
    supabase.from("instagram_posts").select(POST_COLUMNS).eq("id", postId).maybeSingle(),
    supabase.from("post_analyses").select("current_version_id, review_status, analysis_source, published_at, reviewed_at, updated_at").eq("post_id", postId).maybeSingle(),
    supabase.from("post_analysis_versions").select("*").eq("post_id", postId).order("version_no", { ascending: false }),
    supabase.from("post_slide_analyses").select("version_id, position, role, observation").eq("post_id", postId).order("position"),
    supabase.from("classification_jobs").select("*").eq("post_id", postId).order("created_at", { ascending: false }).limit(20),
    supabase.from("creative_analysis_runs").select("*").eq("post_id", postId).order("started_at", { ascending: false }).limit(20),
    supabase.from("creative_review_events").select("id, version_id, action, note, created_at").eq("post_id", postId).order("created_at", { ascending: false }).limit(50),
  ]);
  if (!post) return null;
  return {
    post: toPost(post as unknown as PostRow),
    analysis: (analysis as Analysis | null) ?? null,
    versions: (versions ?? []) as Version[],
    slides: (slides ?? []) as SlideRow[],
    jobs: (jobs ?? []) as Job[],
    runs: (runs ?? []) as Run[],
    events: (events ?? []) as ReviewEvent[],
  };
}

async function rpc<T>(name: string, args: Record<string, unknown>) {
  const { data, error } = await createClient().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const review = (versionId: string, action: "approve" | "reject" | "reopen" | "unpublish", options: { publish?: boolean; note?: string } = {}) =>
  rpc<{ published: boolean }>("creative_review", { p_version: versionId, p_action: action, p_publish: options.publish ?? false, p_note: options.note || null });

export const saveEdit = (postId: string, basedOn: string | null, version: object, slides: object[] | null, options: { approve: boolean; publish: boolean }) =>
  rpc<{ version_id: string; version_no: number }>("creative_save_edit", {
    p_post_id: postId,
    p_based_on: basedOn,
    p_version: version,
    p_slides: slides,
    p_approve: options.approve,
    p_publish: options.publish,
  });

// Queue a fresh analysis (a new job even if the content hasn't changed); it runs the next time
// someone runs the worker, and lands as a proposal beside anything already reviewed
export const reprocess = (postId: string) =>
  rpc<{ enqueued: string[]; incomplete: string[] }>("creative_enqueue", {
    p_post_ids: [postId],
    p_pipeline: PIPELINE_VERSION,
    p_scrape_run: null,
    p_reason: "manual",
    p_force: true,
    p_priority: 5,
  });
