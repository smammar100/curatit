// curatit_get_media: a stored image by media id, as a link (default) or inline bytes. Only ids
// that resolve to a published post's own files are served; the tool never fetches a URL a
// caller supplies. The library keeps WebP at most 1080px wide, so the size is read from the
// file's own header (one small range request) rather than guessed, and inline delivery is
// capped at 1024px on the longest edge and 1 MiB, using Storage's resizer for anything larger.
// Both fetches end with the call's deadline. When the size can't be read, a link still goes out,
// with its size null and a warning: the link doesn't depend on the probe, the bytes do.

import type { MediaInputT, MediaOutputT } from "../contracts";
import { markStage, withDeadline } from "../deadline";
import { CuratitError, invalid, notFound, toCuratitError, upstreamFailure } from "../errors";
import type { CatalogRepository } from "../repo/types";
import { loadPost, parseMediaId, slideLabel } from "./shared";

export const INLINE_MAX_BYTES = 1024 * 1024;
export const INLINE_MAX_EDGE = 1024;
const FETCH_TIMEOUT_MS = 10_000;
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const TYPE_BY_EXTENSION: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

// A storage fetch, as a stage of the call: a request that never got an answer is tagged with the
// stage and becomes UPSTREAM_UNAVAILABLE or TIMEOUT
async function storageFetch(stage: string, fetchImpl: typeof fetch, url: string, init: RequestInit = {}) {
  markStage(stage);
  try {
    return await fetchImpl(url, { ...init, signal: withDeadline(FETCH_TIMEOUT_MS) });
  } catch (error) {
    throw toCuratitError(upstreamFailure(stage, error, 0));
  }
}

const storageDown = (stage: string, status: number) =>
  new CuratitError("UPSTREAM_UNAVAILABLE", "Image storage didn't answer. Try again shortly.", { cause: upstreamFailure(stage, { message: `Storage answered HTTP ${status}` }, status) });

export type ImageBytes = { bytes: Uint8Array<ArrayBuffer>; mimeType: string };

// Reads the pixel size from a WebP header (VP8, VP8L or VP8X), or null when it isn't one
export function webpDimensions(head: Uint8Array): { width: number; height: number } | null {
  if (head.length < 30) return null;
  const tag = (o: number) => String.fromCharCode(head[o], head[o + 1], head[o + 2], head[o + 3]);
  if (tag(0) !== "RIFF" || tag(8) !== "WEBP") return null;
  const chunk = tag(12);
  if (chunk === "VP8 ") {
    return { width: (head[26] | (head[27] << 8)) & 0x3fff, height: (head[28] | (head[29] << 8)) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const b = head;
    const width = (b[21] | ((b[22] & 0x3f) << 8)) + 1;
    const height = ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10)) + 1;
    return { width, height };
  }
  if (chunk === "VP8X") {
    return { width: (head[24] | (head[25] << 8) | (head[26] << 16)) + 1, height: (head[27] | (head[28] << 8) | (head[29] << 16)) + 1 };
  }
  return null;
}

type Probe = { width: number | null; height: number | null; bytes: number | null; mimeType: string };

// The file's size and pixel size from its first 30 bytes
export async function probeImage(url: string, fetchImpl: typeof fetch = fetch): Promise<Probe> {
  const res = await storageFetch("probe", fetchImpl, url, { headers: { Range: "bytes=0-29" } });
  if (res.status === 404) throw notFound("The image file isn't in storage any more.");
  if (!res.ok && res.status !== 206) throw storageDown("probe", res.status);
  const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream";
  const head = new Uint8Array(await res.arrayBuffer());
  const range = res.headers.get("content-range");
  const total = range ? Number(range.split("/")[1]) : Number(res.headers.get("content-length"));
  const dims = webpDimensions(head);
  return { width: dims?.width ?? null, height: dims?.height ?? null, bytes: Number.isFinite(total) ? total : null, mimeType };
}

export type MediaDeps = {
  fetch?: typeof fetch;
  // Storage's image resizer for a stored path, or null when the deployment has none
  resizedUrl?: (path: string, width: number, height: number) => string | null;
};

export async function getMedia(
  repo: CatalogRepository,
  input: MediaInputT,
  deps: MediaDeps = {},
): Promise<{ data: MediaOutputT; image: ImageBytes | null; warnings: string[] }> {
  const fetchImpl = deps.fetch ?? fetch;
  const { post: postKey, index } = parseMediaId(input.media_id);
  const post = await loadPost(repo, postKey);
  const image = post.images.find((i) => i.position === index);
  if (!image) throw notFound(`Post ${post.short_code} has no slide ${index}. Its media index lists ${post.images.length} slide${post.images.length === 1 ? "" : "s"}.`);
  const slides = await repo.slides(post.id);
  const slide = slides.find((s) => s.position === index);
  const url = repo.publicUrl(image.path);
  const warnings: string[] = [];
  const link = (input.delivery ?? "link") === "link";
  let probe: Probe;
  try {
    probe = await probeImage(url, fetchImpl);
  } catch (error) {
    const err = toCuratitError(error);
    // Inline delivery needs the size; a missing file is missing either way
    if (!link || err.code === "NOT_FOUND") throw err;
    probe = { width: null, height: null, bytes: null, mimeType: TYPE_BY_EXTENSION[image.path.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream" };
    warnings.push("Image storage didn't say how large this image is just now, so width, height and bytes are null. The link itself should work.");
  }
  if (!ALLOWED_TYPES.has(probe.mimeType)) throw new CuratitError("UPSTREAM_UNAVAILABLE", "The stored file isn't an image type this tool serves.");

  const base = {
    media_id: input.media_id.replace(/^[^.]+/, post.id),
    post_id: post.id,
    slide_index: index,
    slide_label: slideLabel(index, post.images.length),
    access: "public" as const,
    expires_at: null,
    alt_text: slide?.alt ?? (index === 0 ? post.alt : null),
  };

  if (link) {
    warnings.push("A link is not an image the model has seen. Hosts that can show images may ask for delivery=inline.");
    return { data: { ...base, url, mime_type: probe.mimeType, width: probe.width, height: probe.height, bytes: probe.bytes, delivery: "link", resized: false }, image: null, warnings };
  }

  // Inline: the stored file when it fits the caps, else a resized derivative
  const maxEdge = Math.min(input.max_edge ?? INLINE_MAX_EDGE, INLINE_MAX_EDGE);
  const longest = Math.max(probe.width ?? 0, probe.height ?? 0);
  let fetchUrl = url;
  let width = probe.width;
  let height = probe.height;
  let resized = false;
  if (longest > maxEdge || (probe.bytes ?? 0) > INLINE_MAX_BYTES) {
    if (probe.width && probe.height) {
      const scale = maxEdge / longest;
      width = Math.max(1, Math.round(probe.width * scale));
      height = Math.max(1, Math.round(probe.height * scale));
    }
    const resizedUrl = deps.resizedUrl?.(image.path, width ?? maxEdge, height ?? maxEdge) ?? null;
    if (!resizedUrl) {
      throw invalid(`This image is ${longest}px on its longest edge, over the ${maxEdge}px inline cap, and no resizer is available. Use delivery=link.`);
    }
    fetchUrl = resizedUrl;
    resized = true;
  }
  const res = await storageFetch(resized ? "image_resize" : "image_fetch", fetchImpl, fetchUrl);
  if (!res.ok) throw storageDown(resized ? "image_resize" : "image_fetch", res.status);
  const mimeType = res.headers.get("content-type")?.split(";")[0] ?? probe.mimeType;
  if (!ALLOWED_TYPES.has(mimeType)) throw new CuratitError("UPSTREAM_UNAVAILABLE", "The image came back in a type this tool doesn't serve.");
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > INLINE_MAX_BYTES) throw invalid("The image is over the 1 MiB inline cap even after resizing. Use delivery=link or a smaller max_edge.");
  if (resized) warnings.push(`Resized to fit ${maxEdge}px; the stored file is ${probe.width}×${probe.height}.`);
  return {
    data: { ...base, url: null, mime_type: mimeType, width, height, bytes: bytes.byteLength, delivery: "inline", resized },
    image: { bytes, mimeType },
    warnings,
  };
}
