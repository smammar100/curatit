import { describe, expect, it } from "vitest";
import { MemoryStore } from "./memoryStore";
import { fail, MockAdapter } from "./mock";
import { PIPELINE_VERSION } from "./pipeline";
import { makeManifest, storeWith } from "./testkit";
import { runWorker, type WorkerOptions } from "./worker";

function options(store: MemoryStore, adapter: MockAdapter, extra: Partial<WorkerOptions> = {}): WorkerOptions {
  return {
    store,
    adapter,
    worker: "worker-test",
    concurrency: 2,
    limit: 50,
    leaseSeconds: 600,
    maxUsdPerPost: 1,
    maxUsdPerRun: 10,
    slidesPerCall: 10,
    autoPublish: false,
    random: () => 1,
    ...extra,
  };
}

describe("runWorker", () => {
  it("analyses every queued post and saves it with its job", async () => {
    const store = await storeWith(makeManifest("a", 3), makeManifest("b", 1), makeManifest("c", 13));
    for (const id of ["a", "b", "c"]) store.enqueue(id, PIPELINE_VERSION);
    const report = await runWorker(options(store, new MockAdapter()));
    expect(report).toMatchObject({ processed: 3, succeeded: 3, failed: 0 });
    expect(store.jobs.every((job) => job.state === "succeeded" && job.result_version_id)).toBe(true);
    expect(store.versions.map((v) => [v.post_id, v.slides.length])).toEqual(expect.arrayContaining([["a", 3], ["b", 1], ["c", 13]]));
    expect([...store.current.values()].every((c) => c.review_status === "needs_review" && c.published_at === null)).toBe(true);
    expect(store.runs.filter((r) => r.status === "succeeded")).toHaveLength(3);
  });

  it("skips a post already analysed with the same input, without calling the model", async () => {
    const store = await storeWith(makeManifest("a", 3));
    store.enqueue("a", PIPELINE_VERSION);
    await runWorker(options(store, new MockAdapter()));
    // The same content queued again (as a re-import with a fresh job would)
    store.jobs.length = 0;
    store.enqueue("a", PIPELINE_VERSION);
    const adapter = new MockAdapter();
    const report = await runWorker(options(store, adapter));
    expect(report).toMatchObject({ skipped: 1, succeeded: 0 });
    expect(adapter.requests).toHaveLength(0);
    expect(store.versions).toHaveLength(1);
    expect(store.runs.at(-1)).toMatchObject({ status: "skipped", failure_kind: "unchanged", model_calls: 0 });
  });

  it("re-analyses on request (force) without overwriting reviewed work", async () => {
    const store = await storeWith(makeManifest("a", 2));
    store.enqueue("a", PIPELINE_VERSION);
    await runWorker(options(store, new MockAdapter()));
    store.current.set("a", { ...store.current.get("a")!, review_status: "approved", published_at: "2026-10-11T00:00:00Z" });
    store.enqueue("a", PIPELINE_VERSION, { force: true });
    const report = await runWorker(options(store, new MockAdapter()));
    expect(report.outcomes[0]).toMatchObject({ result: "succeeded", applied: false });
    expect(store.versions).toHaveLength(2);
    expect(store.current.get("a")).toMatchObject({ version_id: store.versions[0].id, review_status: "approved" });
  });

  it("retries a rate limit with backoff, then dead-letters it when attempts run out", async () => {
    const store = await storeWith(makeManifest("a", 2));
    const job = store.enqueue("a", PIPELINE_VERSION, { maxAttempts: 2 })!;
    let now = 0;
    store.now = () => now;
    const limited = () => new MockAdapter({ script: [fail("rate_limit", "429 Too many requests")] });

    let report = await runWorker(options(store, limited()));
    expect(report).toMatchObject({ retried: 1 });
    const stored = store.jobs.find((j) => j.id === job.id)!;
    expect(stored).toMatchObject({ state: "pending", attempts: 1, last_failure_kind: "rate_limit" });
    expect(stored.next_retry_at).toBeGreaterThan(Date.now() - 1000);

    // Not ready until its retry time
    report = await runWorker(options(store, limited()));
    expect(report.processed).toBe(0);

    now = stored.next_retry_at + 1;
    report = await runWorker(options(store, limited()));
    expect(report).toMatchObject({ failed: 1 });
    expect(stored).toMatchObject({ state: "failed", attempts: 2 });
  });

  it("dead-letters a corrupt image straight away, without a model call", async () => {
    const manifest = makeManifest("a", 3);
    const store = await storeWith(manifest);
    store.files.set(`library/${manifest.images[2].path}`, new Uint8Array([1, 2, 3, 4]));
    store.enqueue("a", PIPELINE_VERSION);
    const adapter = new MockAdapter();
    const report = await runWorker(options(store, adapter));
    expect(report).toMatchObject({ failed: 1 });
    expect(store.jobs[0]).toMatchObject({ state: "failed", last_failure_kind: "corrupt_media" });
    expect(adapter.requests).toHaveLength(0);
    expect(store.versions).toHaveLength(0);
  });

  it("puts a post whose images are still uploading back in the queue", async () => {
    const manifest = makeManifest("a", 3);
    const store = await storeWith(manifest);
    store.files.delete(`library/${manifest.images[1].path}`);
    store.enqueue("a", PIPELINE_VERSION);
    const report = await runWorker(options(store, new MockAdapter()));
    expect(report).toMatchObject({ retried: 1 });
    expect(store.jobs[0]).toMatchObject({ state: "pending", last_failure_kind: "missing_media" });
  });

  it("keeps invalid output for review instead of paying again", async () => {
    const store = await storeWith(makeManifest("a", 2));
    store.enqueue("a", PIPELINE_VERSION);
    const broken = () => ({ nope: true });
    const report = await runWorker(options(store, new MockAdapter({ script: [broken, broken] })));
    expect(report).toMatchObject({ failed: 1 });
    expect(store.runs.at(-1)).toMatchObject({ status: "invalid", failure_kind: "invalid_output", model_calls: 2 });
    expect(store.runs.at(-1)?.output).toEqual({ nope: true });
  });

  it("stops the whole run on a usage limit and retries in an hour", async () => {
    const store = await storeWith(makeManifest("a", 2), makeManifest("b", 2), makeManifest("c", 2));
    for (const id of ["a", "b", "c"]) store.enqueue(id, PIPELINE_VERSION);
    const adapter = new MockAdapter({ script: [fail("usage_limit", "You've hit your session limit")] });
    const report = await runWorker(options(store, adapter, { concurrency: 1 }));
    expect(report.stoppedBy).toBe("usage_limit");
    expect(report.processed).toBe(1);
    const job = store.jobs.find((j) => j.post_id === "a")!;
    expect(job.state).toBe("pending");
    expect(job.next_retry_at - Date.now()).toBeGreaterThan(50 * 60_000);
    expect(store.jobs.filter((j) => j.state === "pending" && j.attempts === 0)).toHaveLength(2);
  });

  it("stops when the run's budget is spent", async () => {
    const store = await storeWith(makeManifest("a", 2), makeManifest("b", 2), makeManifest("c", 2));
    for (const id of ["a", "b", "c"]) store.enqueue(id, PIPELINE_VERSION);
    const report = await runWorker(options(store, new MockAdapter({ costUsd: 0.2 }), { concurrency: 1, maxUsdPerRun: 0.5 }));
    // Two calls of $0.20 a post: under $0.50 after the first, over after the second
    expect(report.stoppedBy).toBe("budget");
    expect(report.succeeded).toBe(2);
    expect(report.costUsd).toBeCloseTo(0.8);
    expect(store.jobs.filter((j) => j.state === "pending")).toHaveLength(1);
  });

  it("skips a job queued for another pipeline version", async () => {
    const store = await storeWith(makeManifest("a", 2));
    store.enqueue("a", "1999.01.01-1+1999.01.01-1");
    const adapter = new MockAdapter();
    const report = await runWorker(options(store, adapter));
    expect(report.outcomes[0]).toMatchObject({ result: "skipped", kind: "pipeline_mismatch" });
    expect(adapter.requests).toHaveLength(0);
  });

  it("refuses an analysis of content that changed while it ran", async () => {
    const store = await storeWith(makeManifest("a", 2));
    store.enqueue("a", PIPELINE_VERSION);
    store.changed.add("a");
    const report = await runWorker(options(store, new MockAdapter()));
    expect(report).toMatchObject({ failed: 1 });
    expect(store.jobs[0]).toMatchObject({ state: "failed", last_failure_kind: "stale_input" });
    expect(store.versions).toHaveLength(0);
  });

  it("never processes a job twice when two workers run at once", async () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    const store = await storeWith(...ids.map((id) => makeManifest(id, 2)));
    for (const id of ids) store.enqueue(id, PIPELINE_VERSION);
    const [one, two] = await Promise.all([
      runWorker(options(store, new MockAdapter(), { worker: "one" })),
      runWorker(options(store, new MockAdapter(), { worker: "two" })),
    ]);
    expect(one.succeeded + two.succeeded).toBe(6);
    expect(store.versions).toHaveLength(6);
    expect(new Set(store.versions.map((v) => v.post_id)).size).toBe(6);
  });

  it("gives up a job whose lease another worker took over", async () => {
    const store = await storeWith(makeManifest("a", 2));
    store.enqueue("a", PIPELINE_VERSION);
    // Another worker takes the job as soon as the model is called
    const adapter = new MockAdapter({
      script: [
        (_r, answer) => {
          const job = store.jobs[0];
          job.lease_owner = "someone-else";
          return answer;
        },
      ],
    });
    const report = await runWorker(options(store, adapter));
    expect(report).toMatchObject({ lostLeases: 1, succeeded: 0 });
    expect(store.versions).toHaveLength(0);
  });

  it("only processes the posts it's asked to", async () => {
    const store = await storeWith(makeManifest("a", 2), makeManifest("b", 2));
    store.enqueue("a", PIPELINE_VERSION);
    store.enqueue("b", PIPELINE_VERSION);
    const report = await runWorker(options(store, new MockAdapter(), { postIds: ["b"] }));
    expect(report.outcomes.map((o) => o.post)).toEqual(["b"]);
    expect(store.jobs.find((j) => j.post_id === "a")?.state).toBe("pending");
  });

  it("auto-publishes only when the policy is on and the result is clean", async () => {
    const store = await storeWith(makeManifest("a", 2));
    store.enqueue("a", PIPELINE_VERSION);
    // The mock's DNA asks for review, so even with the policy on it isn't published
    await runWorker(options(store, new MockAdapter(), { autoPublish: true }));
    expect(store.current.get("a")?.published_at).toBeNull();

    const clean = await storeWith(makeManifest("b", 2));
    clean.enqueue("b", PIPELINE_VERSION);
    const confident = (_r: unknown, dna: unknown) => ({ ...(dna as object), quality: { ...(dna as { quality: object }).quality, needs_review: false } });
    await runWorker(options(clean, new MockAdapter({ script: [undefined, confident] }), { autoPublish: true }));
    expect(clean.current.get("b")).toMatchObject({ review_status: "approved" });
    expect(clean.current.get("b")?.published_at).not.toBeNull();

    const off = await storeWith(makeManifest("c", 2));
    off.enqueue("c", PIPELINE_VERSION);
    await runWorker(options(off, new MockAdapter({ script: [undefined, confident] }), { autoPublish: false }));
    expect(off.current.get("c")?.published_at).toBeNull();
  });
});
