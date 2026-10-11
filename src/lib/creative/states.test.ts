import { describe, expect, it } from "vitest";
import { afterFailure, aiMayOverwrite, isRetryable, mayPublish, nextJobState, nextReviewStatus, retryDelayMs } from "./states";

describe("job states", () => {
  it("runs pending → leased → succeeded", () => {
    expect(nextJobState("pending", "lease")).toBe("leased");
    expect(nextJobState("leased", "succeed")).toBe("succeeded");
  });

  it("puts an expired lease back in the queue", () => {
    expect(nextJobState("leased", "expire")).toBe("pending");
  });

  it("refuses moves that skip a step", () => {
    expect(() => nextJobState("pending", "succeed")).toThrow();
    expect(() => nextJobState("succeeded", "lease")).toThrow();
    expect(() => nextJobState("failed", "succeed")).toThrow();
  });

  it("only requeues finished jobs on purpose", () => {
    expect(nextJobState("failed", "requeue")).toBe("pending");
    expect(nextJobState("succeeded", "requeue")).toBe("pending");
  });

  it("retries temporary failures until attempts run out", () => {
    expect(afterFailure("rate_limit", 1, 3)).toBe("pending");
    expect(afterFailure("timeout", 2, 3)).toBe("pending");
    expect(afterFailure("timeout", 3, 3)).toBe("failed");
  });

  it("dead-letters failures that won't fix themselves", () => {
    for (const kind of ["corrupt_media", "budget", "unsupported", "bug", "invalid_output", "stale_input", "auth"] as const) {
      expect(isRetryable(kind)).toBe(false);
      expect(afterFailure(kind, 1, 5)).toBe("failed");
    }
  });

  it("backs off exponentially with jitter, capped", () => {
    expect(retryDelayMs(1, { random: () => 1 })).toBe(30_000);
    expect(retryDelayMs(2, { random: () => 1 })).toBe(60_000);
    expect(retryDelayMs(3, { random: () => 0.5 })).toBe(60_000);
    expect(retryDelayMs(30, { random: () => 1 })).toBe(3_600_000);
    expect(retryDelayMs(4, { random: () => 0 })).toBe(0);
  });
});

describe("review states", () => {
  it("only moves through allowed actions", () => {
    expect(nextReviewStatus("draft", "submit")).toBe("needs_review");
    expect(nextReviewStatus("needs_review", "approve")).toBe("approved");
    expect(nextReviewStatus("needs_review", "reject")).toBe("rejected");
    expect(nextReviewStatus("approved", "edit")).toBe("needs_review");
    expect(nextReviewStatus("rejected", "reopen")).toBe("needs_review");
    expect(() => nextReviewStatus("approved", "approve")).toThrow();
    expect(() => nextReviewStatus("rejected", "approve")).toThrow();
  });

  it("never lets an AI run overwrite reviewed or human work", () => {
    expect(aiMayOverwrite(null)).toBe(true);
    expect(aiMayOverwrite({ review_status: "draft", analysis_source: "ai", published_at: null })).toBe(true);
    expect(aiMayOverwrite({ review_status: "needs_review", analysis_source: "ai", published_at: null })).toBe(true);
    expect(aiMayOverwrite({ review_status: "approved", analysis_source: "ai", published_at: null })).toBe(false);
    expect(aiMayOverwrite({ review_status: "rejected", analysis_source: "ai", published_at: null })).toBe(false);
    expect(aiMayOverwrite({ review_status: "needs_review", analysis_source: "mixed", published_at: null })).toBe(false);
    expect(aiMayOverwrite({ review_status: "draft", analysis_source: "human", published_at: null })).toBe(false);
    expect(aiMayOverwrite({ review_status: "draft", analysis_source: "ai", published_at: "2026-10-11T00:00:00Z" })).toBe(false);
  });

  it("publishes only approved work unless auto-publish is deliberately on", () => {
    expect(mayPublish("approved")).toBe(true);
    expect(mayPublish("needs_review")).toBe(false);
    expect(mayPublish("needs_review", { enabled: false, passes: true })).toBe(false);
    expect(mayPublish("needs_review", { enabled: true, passes: false })).toBe(false);
    expect(mayPublish("needs_review", { enabled: true, passes: true })).toBe(true);
    expect(mayPublish("rejected", { enabled: true, passes: true })).toBe(false);
  });
});
