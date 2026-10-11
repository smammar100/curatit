import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, prepareImage, prepareImages, sniff } from "./media";
import { makeImage, makeManifest } from "./testkit";

let workdir: string;
beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), "media-test-"));
});
afterEach(() => rm(workdir, { recursive: true, force: true }));

const image = makeManifest("p1", 3).images[1];
const source = (bytes: Uint8Array | null | Error) => ({
  download: async () => {
    if (bytes instanceof Error) throw bytes;
    return bytes;
  },
});

describe("sniff", () => {
  it("recognises WebP, JPEG and PNG by their bytes", async () => {
    expect(sniff(await makeImage("webp"))).toBe("image/webp");
    expect(sniff(await makeImage("jpeg"))).toBe("image/jpeg");
    expect(sniff(await makeImage("png"))).toBe("image/png");
    expect(sniff(new TextEncoder().encode("<html>not an image</html>"))).toBeNull();
    expect(sniff(new Uint8Array())).toBeNull();
  });
});

describe("prepareImage", () => {
  it("writes a valid image as slide-NN at its zero-based position", async () => {
    const prepared = await prepareImage(image, source(await makeImage("webp")), workdir);
    expect(prepared).toMatchObject({ position: 1, mimetype: "image/webp", wasVideo: false });
    expect(prepared.file.endsWith("slide-01.webp")).toBe(true);
  });

  it("trusts the bytes over the extension", async () => {
    const prepared = await prepareImage(image, source(await makeImage("png")), workdir);
    expect(prepared.mimetype).toBe("image/png");
    expect(prepared.file.endsWith("slide-01.png")).toBe(true);
  });

  it("treats a missing file as not uploaded yet", async () => {
    await expect(prepareImage(image, source(null), workdir)).rejects.toMatchObject({ kind: "missing_media" });
  });

  it("treats a download error as a network problem", async () => {
    await expect(prepareImage(image, source(new Error("fetch failed")), workdir)).rejects.toMatchObject({ kind: "network" });
  });

  it("refuses empty, non-image and truncated files as corrupt", async () => {
    await expect(prepareImage(image, source(new Uint8Array()), workdir)).rejects.toMatchObject({ kind: "corrupt_media" });
    await expect(prepareImage(image, source(new TextEncoder().encode("<html>404</html>")), workdir)).rejects.toMatchObject({ kind: "corrupt_media" });
    const webp = await makeImage("webp", "#123456", 400);
    await expect(prepareImage(image, source(webp.subarray(0, 40)), workdir)).rejects.toMatchObject({ kind: "corrupt_media" });
  });

  it("refuses files over the size limit", async () => {
    const huge = new Uint8Array(MAX_IMAGE_BYTES + 1);
    huge.set(await makeImage("webp"));
    await expect(prepareImage(image, source(huge), workdir)).rejects.toMatchObject({ kind: "unsupported" });
  });
});

describe("prepareImages", () => {
  it("prepares every slide in position order", async () => {
    const manifest = makeManifest("p2", 13);
    const bytes = await makeImage("webp");
    const prepared = await prepareImages([...manifest.images].reverse(), source(bytes), workdir);
    expect(prepared.map((p) => p.position)).toEqual([...Array(13).keys()]);
    expect((await readdir(workdir)).sort()).toEqual([...Array(13).keys()].map((n) => `slide-${String(n).padStart(2, "0")}.webp`));
  });

  it("stops at the first broken slide", async () => {
    const manifest = makeManifest("p3", 3);
    const good = await makeImage("webp");
    const store = { download: async (_bucket: string, path: string) => (path.endsWith("02.webp") ? new Uint8Array([1, 2, 3]) : good) };
    await expect(prepareImages(manifest.images, store, workdir)).rejects.toMatchObject({ kind: "corrupt_media" });
  });
});
