// Creative Intelligence: what identifies one analysis input. If the caption, the brand or
// category, any image (by its exact storage path and content tag), the model, the prompt or the
// taxonomy changes, the fingerprint changes and the post is due for a new analysis; if none did,
// a re-run is skipped, so imports and retries never pay twice for the same work.
import { createHash } from "node:crypto";

export type FingerprintInput = {
  postId: string;
  caption: string;
  brand: string;
  category: string;
  // In position order. `tag` is the object's ETag (or size+updated_at when there's none)
  images: { position: number; path: string; tag: string }[];
  model: string;
  promptVersion: string;
  taxonomyVersion: string;
};

// JSON with keys in a fixed order, so the same input always hashes the same
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function fingerprint(input: FingerprintInput): string {
  const images = [...input.images].sort((a, b) => a.position - b.position);
  // The caption's whitespace doesn't change what it says
  const caption = input.caption.replace(/\s+/g, " ").trim();
  return createHash("sha256").update(canonical({ ...input, caption, images })).digest("hex");
}
