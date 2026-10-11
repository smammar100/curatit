import { describe, expect, it } from "vitest";
import { fingerprint, type FingerprintInput } from "./fingerprint";

const base: FingerprintInput = {
  postId: "123",
  caption: "Hello there",
  brand: "monzo",
  category: "fintech",
  images: [
    { position: 0, path: "fintech/monzo/carousel/ABC/01.webp", tag: "etag-a" },
    { position: 1, path: "fintech/monzo/carousel/ABC/02.webp", tag: "etag-b" },
  ],
  model: "sonnet",
  promptVersion: "p1",
  taxonomyVersion: "t1",
};

describe("fingerprint", () => {
  it("is a stable sha256", () => {
    expect(fingerprint(base)).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprint(base)).toBe(fingerprint(structuredClone(base)));
  });

  it("ignores the order images and keys arrive in", () => {
    const shuffled = { ...base, images: [...base.images].reverse() };
    const reordered = Object.fromEntries(Object.entries(base).reverse()) as FingerprintInput;
    expect(fingerprint(shuffled)).toBe(fingerprint(base));
    expect(fingerprint(reordered)).toBe(fingerprint(base));
  });

  it("ignores caption whitespace", () => {
    expect(fingerprint({ ...base, caption: "  Hello\n\nthere " })).toBe(fingerprint(base));
  });

  it("changes when anything that affects the analysis changes", () => {
    const changes: Partial<FingerprintInput>[] = [
      { caption: "Hello there!" },
      { brand: "revolut" },
      { category: "finance" },
      { images: [base.images[0], { ...base.images[1], tag: "etag-c" }] },
      { images: [base.images[0], { ...base.images[1], path: "fintech/monzo/carousel/ABC/03.webp" }] },
      { images: [base.images[0]] },
      { model: "opus" },
      { promptVersion: "p2" },
      { taxonomyVersion: "t2" },
    ];
    const seen = new Set([fingerprint(base)]);
    for (const change of changes) {
      const value = fingerprint({ ...base, ...change });
      expect(seen.has(value), JSON.stringify(change)).toBe(false);
      seen.add(value);
    }
  });

  it("tells a swapped slide order apart", () => {
    const swapped = {
      ...base,
      images: [
        { ...base.images[0], tag: "etag-b" },
        { ...base.images[1], tag: "etag-a" },
      ],
    };
    expect(fingerprint(swapped)).not.toBe(fingerprint(base));
  });
});
