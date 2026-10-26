import { describe, expect, it, vi } from "vitest";
import { batchLoader, chunks } from "./batch";

describe("batchLoader", () => {
  it("loads the keys asked for together in one read, each once, and answers each caller", async () => {
    const loadMany = vi.fn(async (keys: string[]) => new Map(keys.map((key) => [key, key.toUpperCase()])));
    const load = batchLoader(loadMany);
    expect(await Promise.all([load("a"), load("b"), load("a")])).toEqual(["A", "B", "A"]);
    expect(loadMany).toHaveBeenCalledTimes(1);
    expect(loadMany).toHaveBeenCalledWith(["a", "b"]);
  });

  it("answers null for a key the read didn't find", async () => {
    const load = batchLoader(async () => new Map([["a", 1]]));
    expect(await Promise.all([load("a"), load("missing")])).toEqual([1, null]);
  });

  it("sends a full batch at once, and a lone key after the wait", async () => {
    const loadMany = vi.fn(async (keys: number[]) => new Map(keys.map((key) => [key, key])));
    const load = batchLoader(loadMany, { max: 2, waitMs: 5 });
    await Promise.all([load(1), load(2), load(3)]);
    expect(loadMany.mock.calls).toEqual([[[1, 2]], [[3]]]);
  });

  it("rejects every caller of a failed read, and reads again on the next call", async () => {
    let fail = true;
    const load = batchLoader(async (keys: string[]) => {
      if (fail) throw new Error("offline");
      return new Map(keys.map((key) => [key, key]));
    });
    const results = await Promise.allSettled([load("a"), load("b")]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
    fail = false;
    expect(await load("a")).toBe("a");
  });
});

describe("chunks", () => {
  it("splits a list into runs of at most the size", () => {
    expect(chunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunks([], 2)).toEqual([]);
  });
});
