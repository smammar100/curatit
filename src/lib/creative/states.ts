// Creative Intelligence: the two state machines, as pure functions the worker, the review UI and
// the tests share.
//
// Jobs (public.classification_jobs): pending → leased → succeeded, or back to pending to retry
// after a temporary failure, or failed (dead letter) once retries run out or the error can't be
// retried. A lease that expires without a heartbeat means the worker died, and the job is
// pending again.
//
// Reviews (public.post_analyses.review_status): an AI run writes a draft or needs_review; only a
// person approves, rejects or publishes. An AI run never overwrites an approved, published or
// human-edited analysis: it files a new version for review instead.

export type JobState = "pending" | "leased" | "succeeded" | "failed";
export type JobEvent = "lease" | "succeed" | "retry" | "fail" | "expire" | "requeue";

const JOB_MOVES: Record<JobState, Partial<Record<JobEvent, JobState>>> = {
  pending: { lease: "leased" },
  leased: { succeed: "succeeded", retry: "pending", fail: "failed", expire: "pending" },
  succeeded: { requeue: "pending" },
  failed: { requeue: "pending" },
};

export function nextJobState(state: JobState, event: JobEvent): JobState {
  const next = JOB_MOVES[state][event];
  if (!next) throw new Error(`A ${state} job can't ${event}`);
  return next;
}

// What went wrong, as far as retrying is concerned
export type FailureKind =
  | "rate_limit"
  | "timeout"
  | "network"
  | "server"
  | "usage_limit"
  | "invalid_output"
  | "missing_media"
  | "corrupt_media"
  | "stale_input"
  | "budget"
  | "unsupported"
  | "auth"
  | "bug";

// Worth another go later; missing media may still be uploading. Invalid output already had a
// repair attempt in the same run, so it's a dead letter for a person to look at rather than a
// loop that pays again; so is anything over budget, corrupt, changed underneath, or unsupported
const RETRYABLE: ReadonlySet<FailureKind> = new Set(["rate_limit", "timeout", "network", "server", "usage_limit", "missing_media"]);

// Failures that mean no other job will get anywhere either: stop the worker. (A post over its own
// budget fails alone; the run's budget is the worker's to check.)
export const STOPS_WORKER: ReadonlySet<FailureKind> = new Set(["usage_limit", "auth"]);
export const isRetryable = (kind: FailureKind) => RETRYABLE.has(kind);

// The job's next state after a failure on attempt `attempts` (1-based) of `maxAttempts`
export function afterFailure(kind: FailureKind, attempts: number, maxAttempts: number): JobState {
  return isRetryable(kind) && attempts < maxAttempts ? nextJobState("leased", "retry") : nextJobState("leased", "fail");
}

// Exponential backoff with full jitter: a random wait up to base·2^(attempt-1), capped. `random`
// is injectable so tests are deterministic
export function retryDelayMs(attempt: number, { baseMs = 30_000, capMs = 3_600_000, random = Math.random } = {}) {
  const ceiling = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.round(ceiling * random());
}

export type ReviewStatus = "draft" | "needs_review" | "approved" | "rejected";
export type AnalysisSource = "ai" | "human" | "mixed";
export type ReviewAction = "submit" | "approve" | "reject" | "edit" | "reopen";

const REVIEW_MOVES: Record<ReviewStatus, Partial<Record<ReviewAction, ReviewStatus>>> = {
  draft: { submit: "needs_review", approve: "approved", reject: "rejected", edit: "draft" },
  needs_review: { approve: "approved", reject: "rejected", edit: "needs_review" },
  approved: { edit: "needs_review", reopen: "needs_review" },
  rejected: { reopen: "needs_review", edit: "needs_review" },
};

export function nextReviewStatus(status: ReviewStatus, action: ReviewAction): ReviewStatus {
  const next = REVIEW_MOVES[status][action];
  if (!next) throw new Error(`Can't ${action} an analysis that is ${status}`);
  return next;
}

// May an AI run replace the current analysis in place? Only an AI draft or one waiting for review
// that nobody has touched. Anything approved, published, rejected or edited by a person gets a
// new version beside it instead.
export function aiMayOverwrite(current: { review_status: ReviewStatus; analysis_source: AnalysisSource; published_at: string | null } | null) {
  if (!current) return true;
  if (current.published_at) return false;
  if (current.analysis_source !== "ai") return false;
  return current.review_status === "draft" || current.review_status === "needs_review";
}

// Publishing needs an approved analysis, unless a deliberately enabled auto-publish policy (off by
// default; see CREATIVE_ANALYSIS_AUTO_PUBLISH) vouches for an AI one
export function mayPublish(status: ReviewStatus, autoPublish: { enabled: boolean; passes: boolean } = { enabled: false, passes: false }) {
  return status === "approved" || (autoPublish.enabled && autoPublish.passes && status !== "rejected");
}
