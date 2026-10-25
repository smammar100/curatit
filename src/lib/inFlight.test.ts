import { describe, expect, it, vi } from "vitest";
import { shareInFlight } from "./inFlight";

describe("shareInFlight", () => {
  it("makes one read for calls that overlap, and a fresh one after it settles", async () => {
    let resolve!: (value: number) => void;
    const read = vi.fn(() => new Promise<number>((done) => (resolve = done)));
    const shared = shareInFlight(read);

    const first = shared();
    const second = shared();
    resolve(1);
    expect(await Promise.all([first, second])).toEqual([1, 1]);
    expect(read).toHaveBeenCalledTimes(1);

    const third = shared();
    resolve(2);
    expect(await third).toBe(2);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("lets the next call try again after a failed read", async () => {
    const read = vi.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce("ok");
    const shared = shareInFlight(read);
    await expect(shared()).rejects.toThrow("timeout");
    await expect(shared()).resolves.toBe("ok");
  });
});
