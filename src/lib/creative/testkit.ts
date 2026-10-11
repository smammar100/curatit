// Creative Intelligence: builders for the tests: a post manifest with any number of slides, real
// (tiny) images made with sharp, and a MemoryStore holding both.
import { MemoryStore } from "./memoryStore";
import type { Manifest } from "./prompt";

export async function makeImage(format: "webp" | "jpeg" | "png" = "webp", colour = "#1f7a4d", size = 48) {
  const { default: sharp } = await import("sharp");
  const image = sharp({ create: { width: size, height: Math.round(size * 1.25), channels: 3, background: colour } });
  const buffer = await (format === "webp" ? image.webp() : format === "jpeg" ? image.jpeg() : image.png()).toBuffer();
  return new Uint8Array(buffer);
}

export function makeManifest(id: string, slides: number, overrides: Partial<Manifest> = {}): Manifest {
  const format = slides === 1 ? "static" : "carousel";
  const folder = `fintech/example-bank/${format}/${id}`;
  return {
    id,
    short_code: id,
    source_url: `https://www.instagram.com/p/${id}/`,
    format,
    is_published: true,
    caption: "Your money, on autopilot. Set a rule once and every payday a slice goes straight to savings.",
    alt: "Photo by Example Bank",
    hashtags: [],
    mentions: [],
    paid_partnership: false,
    owner_username: "examplebank",
    posted_at: "2026-10-01T10:00:00Z",
    brand: { name: "Example Bank", slug: "example-bank" },
    category: { name: "Fintech", slug: "fintech" },
    scrape_run_id: null,
    media: { expected: slides, image_rows: slides, image_files: slides, complete: true },
    content_fingerprint: `fp-${id}`,
    images: Array.from({ length: slides }, (_, position) => ({
      position,
      bucket: "library",
      path: `${folder}/${String(position + 1).padStart(2, "0")}.webp`,
      etag: `"etag-${id}-${position}"`,
      size: 1000,
      mimetype: "image/webp",
      was_video: false,
    })),
    ...overrides,
  };
}

export async function storeWith(...manifests: Manifest[]) {
  const store = new MemoryStore();
  const image = await makeImage();
  for (const manifest of manifests) {
    store.manifests.set(manifest.id, manifest);
    for (const file of manifest.images) store.files.set(`${file.bucket}/${file.path}`, image);
  }
  return store;
}
