// Creative Intelligence: fetching a post's images for the model. Each one comes from its exact
// post_images bucket and path (never a path rebuilt from the brand or position), is checked to be
// a real WebP, JPEG or PNG within the size limits, and is written to the run's private folder as
// slide-NN.<ext>, NN being its zero-based position. A missing file may still be uploading (retry);
// a broken one won't fix itself (dead letter), and no analysis goes ahead with a slide left out.
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ModelError, type ImageInput } from "./model";
import type { ManifestImage } from "./prompt";

export type ImageSource = {
  // Resolves null when the object doesn't exist
  download(bucket: string, path: string): Promise<Uint8Array | null>;
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 8000;

const EXTENSION: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

// What the bytes are, whatever the file claims
export function sniff(bytes: Uint8Array): keyof typeof EXTENSION | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  return null;
}

async function dimensions(bytes: Uint8Array) {
  // sharp only reads the header here; imported lazily so nothing else pays for it
  const { default: sharp } = await import("sharp");
  const meta = await sharp(bytes, { failOn: "error" }).metadata();
  // Decode a small version to catch a valid header over truncated data
  await sharp(bytes, { failOn: "error" }).resize(16).raw().toBuffer();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

export async function prepareImage(image: ManifestImage, source: ImageSource, workdir: string): Promise<ImageInput> {
  const where = `slide ${image.position} (${image.bucket}/${image.path})`;
  let bytes: Uint8Array | null;
  try {
    bytes = await source.download(image.bucket, image.path);
  } catch (error) {
    throw new ModelError("network", `Couldn't download ${where}: ${(error as Error).message}`);
  }
  if (!bytes) throw new ModelError("missing_media", `${where} isn't in Storage yet`);
  if (bytes.length === 0) throw new ModelError("corrupt_media", `${where} is empty`);
  if (bytes.length > MAX_IMAGE_BYTES) throw new ModelError("unsupported", `${where} is ${(bytes.length / 1048576).toFixed(1)} MB, over the 10 MB limit`);
  const type = sniff(bytes);
  if (!type) throw new ModelError("corrupt_media", `${where} isn't a WebP, JPEG or PNG image`);
  let size: { width: number; height: number };
  try {
    size = await dimensions(bytes);
  } catch (error) {
    throw new ModelError("corrupt_media", `${where} can't be decoded: ${(error as Error).message}`);
  }
  if (!size.width || !size.height) throw new ModelError("corrupt_media", `${where} has no dimensions`);
  if (size.width > MAX_IMAGE_SIDE || size.height > MAX_IMAGE_SIDE) throw new ModelError("unsupported", `${where} is ${size.width}×${size.height}, over ${MAX_IMAGE_SIDE}px`);

  const file = join(workdir, `slide-${String(image.position).padStart(2, "0")}.${EXTENSION[type]}`);
  await writeFile(file, bytes);
  return { position: image.position, file, mimetype: type, wasVideo: image.was_video };
}

// Every image, in position order; the first failure stops the post
export async function prepareImages(images: ManifestImage[], source: ImageSource, workdir: string, concurrency = 4): Promise<ImageInput[]> {
  const ordered = [...images].sort((a, b) => a.position - b.position);
  const prepared: ImageInput[] = new Array(ordered.length);
  let next = 0;
  async function lane() {
    while (next < ordered.length) {
      const i = next++;
      prepared[i] = await prepareImage(ordered[i], source, workdir);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ordered.length) }, lane));
  return prepared;
}
