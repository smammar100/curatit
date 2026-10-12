// The six research tools, as one registry both transports run: MCP registers them on a server,
// REST calls the same `executeTool`. A call checks the credential's scope, takes a rate-limit
// slot, runs the service, and wraps the outcome in the envelope; every failure becomes a
// CuratitError with a safe message. Tool descriptions are Curatit's own and never include
// anything scraped.

import type { ImageContent } from "@modelcontextprotocol/server";
import { TOOLS, type ToolName, envelopeSchema } from "./contracts";
import type { McpConfig } from "./config";
import { failure, newRequestId, success, type Envelope } from "./envelope";
import { CuratitError, toCuratitError } from "./errors";
import type { Logger } from "./log";
import { principalKey, requireScope, type Principal } from "./auth/principal";
import type { CatalogRepository } from "./repo/types";
import { pseudonym } from "./log";
import type { Throttle } from "./ratelimit";
import { createBrief } from "./services/brief";
import { getMedia, type ImageBytes, type MediaDeps } from "./services/media";
import { getCarousel, getPost } from "./services/post";
import { searchPosts } from "./services/search";
import { getTaxonomy } from "./services/taxonomy";

export type Runtime = {
  config: McpConfig;
  repo: CatalogRepository;
  throttle: Throttle;
  log: Logger;
  media: MediaDeps;
};

export const TOOL_META: Record<ToolName, { title: string; description: string; readOnly: boolean; idempotent: boolean }> = {
  curatit_get_taxonomy: {
    title: "Curatit taxonomy",
    description:
      "List the values every search filter accepts: industries, brands, formats, goals, creative approaches and the visual dimensions, with counts. Call this before filtering; values are slugs from here, never guesses. Also names the dimensions the catalog doesn't have (no theme or occasion labels).",
    readOnly: true,
    idempotent: true,
  },
  curatit_search_posts: {
    title: "Search Curatit posts",
    description:
      "Find real Instagram posts in Curatit's curated library by free text (captions, on-slide text, published analyses) and/or taxonomy filters. Returns compact matches with why each matched; nothing is relaxed for you, an empty result comes with suggestions. Page with next_cursor. Needs a query or a filter.",
    readOnly: true,
    idempotent: true,
  },
  curatit_get_post: {
    title: "Get a Curatit post",
    description:
      "One post in full: caption, counts as collected, every stored image (media ids for curatit_get_media), editor-approved classification and the published creative analysis when there is one (detail_level=full for every section). Fields with no value are named under `missing`.",
    readOnly: true,
    idempotent: true,
  },
  curatit_get_carousel: {
    title: "Get carousel slides",
    description:
      "A carousel's slides in stored order, a page at a time (default 5, at most 10): image URL, alt text, which slides were videos, and the analysis record for each slide when the post has a published analysis. Slide indexes are zero-based; labels count from 1.",
    readOnly: true,
    idempotent: true,
  },
  curatit_get_media: {
    title: "Get a post image",
    description:
      "A stored image by media id (from a post's media index or a carousel page): a public link with its size (default), or the bytes inline as an image block for hosts that can show images (delivery=inline, at most 1024px and 1 MiB). Only catalog images are served; never a URL you supply.",
    readOnly: true,
    idempotent: true,
  },
  curatit_create_brief: {
    title: "Create a grounded creative brief",
    description:
      "An original creative brief built from 1 to 8 reference posts: what each visibly does, what the published analysis infers, a proposed concept, copy and design directions, what to adapt and what never to copy, missing evidence, and a portable generation prompt. Assembled from editor-approved analysis, no model runs. Needs the curatit:brief scope.",
    readOnly: true,
    idempotent: false,
  },
};

export type ToolOutcome = {
  envelope: Envelope<unknown>;
  status: number;
  // For curatit_get_media with inline delivery
  image: ImageBytes | null;
  text: string;
};

// Runs a tool for a principal: the one path MCP and REST share
export async function executeTool(rt: Runtime, name: ToolName, rawArgs: unknown, principal: Principal): Promise<ToolOutcome> {
  const requestId = newRequestId();
  const started = Date.now();
  const tool = TOOLS[name];
  let release: (() => void) | null = null;
  try {
    requireScope(principal, tool.scope);
    const parsed = tool.input.safeParse(rawArgs ?? {});
    if (!parsed.success) {
      throw new CuratitError("INVALID_ARGUMENT", `Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}`, {
        details: { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      });
    }
    release = await rt.throttle.acquire(principalKey(principal), name === "curatit_create_brief" ? "brief" : "read");
    const outcome = await run(rt, name, parsed.data, principal);
    const envelope = success(requestId, outcome.data, outcome.warnings, outcome.taxonomyVersion);
    rt.log.info("tool.ok", { request_id: requestId, tool: name, ms: Date.now() - started, account: await pseudonym(principal.subjectId), credential: principal.credentialKind });
    return { envelope, status: 200, image: outcome.image, text: outcome.text };
  } catch (error) {
    const err = toCuratitError(error);
    const level = err.code === "INTERNAL_ERROR" || err.code === "UPSTREAM_UNAVAILABLE" ? "error" : "info";
    rt.log[level]("tool.error", {
      request_id: requestId,
      tool: name,
      code: err.code,
      ms: Date.now() - started,
      account: await pseudonym(principal.subjectId),
      ...(err.code === "INTERNAL_ERROR" && { cause: String(err.cause ?? err.message) }),
    });
    return { envelope: failure(requestId, err), status: err.status, image: null, text: `${err.code}: ${err.message}` };
  } finally {
    release?.();
  }
}

type ServiceOutcome = { data: unknown; warnings: string[]; taxonomyVersion: string | null; image: ImageBytes | null; text: string };

async function run(rt: Runtime, name: ToolName, args: unknown, principal: Principal): Promise<ServiceOutcome> {
  switch (name) {
    case "curatit_get_taxonomy": {
      const r = await getTaxonomy(rt.repo, args as never);
      const text = r.data.dimensions.map((d) => `${d.dimension} (filter ${d.filter}${d.single_value ? ", one value" : ""}): ${d.values.map((v) => v.slug).join(", ") || "none yet"}`).join("\n");
      return { data: r.data, warnings: [], taxonomyVersion: r.taxonomyVersion, image: null, text: `Taxonomy ${r.taxonomyVersion ?? ""}\n${text}\nNot available: ${r.data.not_available.join(" ")}` };
    }
    case "curatit_search_posts": {
      const r = await searchPosts(rt.repo, args as never, { signingSecret: rt.config.signingSecret, principalKey: principalKey(principal) });
      const lines = r.data.posts.map((p, i) => `${i + 1}. ${p.brand.name} (${p.industry?.name ?? "no industry"}), ${p.format}, ${p.posted_at?.slice(0, 10) ?? "undated"}: "${p.caption_excerpt.slice(0, 90)}" [post_id ${p.post_id}${p.analysis_available ? ", analysed" : ""}]${p.match_reasons.length ? ` — ${p.match_reasons[0]}` : ""}`);
      const head = r.data.posts.length ? `${r.data.posts.length} post${r.data.posts.length === 1 ? "" : "s"}${r.data.next_cursor ? " (more with next_cursor)" : ""}:` : "No posts matched.";
      const tail = r.data.suggestions.length ? `\nSuggestions: ${r.data.suggestions.join(" ")}` : "";
      return { data: r.data, warnings: r.warnings, taxonomyVersion: null, image: null, text: `${head}\n${lines.join("\n")}${tail}`.trim() };
    }
    case "curatit_get_post": {
      const r = await getPost(rt.repo, args as never);
      const p = r.data.post;
      const text = [
        `${p.brand.name} (${p.industry?.name ?? "no industry"}), ${p.format}, posted ${p.posted_at?.slice(0, 10) ?? "undated"}: ${p.source_url}`,
        `Caption: ${p.caption.text.slice(0, 300)}${p.caption.truncated || p.caption.text.length > 300 ? "…" : ""}`,
        `Counts: ${p.metrics.likes ?? "not available"} likes, ${p.metrics.comments ?? "not available"} comments, collected ${p.metrics.observed_at?.slice(0, 10) ?? "at an unknown time"}.`,
        `Media: ${p.media.length} slide${p.media.length === 1 ? "" : "s"} (${p.media.map((m) => m.media_id).join(", ")}).`,
        p.analysis ? `Analysis: ${p.analysis.concept ?? p.analysis.summary ?? "published"}` : "No published analysis yet.",
        p.missing.length ? `Missing: ${p.missing.join("; ")}` : "",
      ].join("\n");
      return { data: r.data, warnings: [], taxonomyVersion: r.taxonomyVersion, image: null, text };
    }
    case "curatit_get_carousel": {
      const r = await getCarousel(rt.repo, args as never);
      const lines = r.data.slides.map((s) => `${s.slide_label}${s.was_video ? " (video cover)" : ""}: ${s.analysis?.headline ? `"${s.analysis.headline}"` : s.alt_text ?? "no text recorded"}${s.analysis?.role ? ` — ${s.analysis.role}` : ""} [${s.media_id}]`);
      return { data: r.data, warnings: r.warnings, taxonomyVersion: r.taxonomyVersion, image: null, text: `${r.data.short_code}: ${r.data.total_slides} slides, ${r.data.slides_analysed} analysed.\n${lines.join("\n")}${r.data.next_start !== null ? `\nNext page: start_slide ${r.data.next_start}` : ""}` };
    }
    case "curatit_get_media": {
      const r = await getMedia(rt.repo, args as never, rt.media);
      const d = r.data;
      const text = d.delivery === "link" ? `${d.slide_label} of post ${d.post_id}: ${d.url} (${d.mime_type}, ${d.width ?? "?"}×${d.height ?? "?"}, ${d.bytes ?? "?"} bytes)` : `${d.slide_label} of post ${d.post_id}, delivered inline (${d.mime_type}, ${d.width ?? "?"}×${d.height ?? "?"}).`;
      return { data: r.data, warnings: r.warnings, taxonomyVersion: null, image: r.image, text };
    }
    case "curatit_create_brief": {
      const r = await createBrief(rt.repo, args as never);
      return { data: r.data, warnings: r.warnings, taxonomyVersion: r.taxonomyVersion, image: null, text: r.data.text };
    }
  }
}

// What an MCP tool returns: the text, the structured envelope and, for inline media, the image
export function toCallToolResult(outcome: ToolOutcome) {
  const content: ({ type: "text"; text: string } | ImageContent)[] = [];
  if (outcome.image) content.push({ type: "image", data: Buffer.from(outcome.image.bytes).toString("base64"), mimeType: outcome.image.mimeType });
  content.push({ type: "text", text: outcome.text });
  return { content, structuredContent: outcome.envelope as Record<string, unknown>, isError: outcome.envelope.error ? true : undefined };
}

export const toolOutputSchema = (name: ToolName) => envelopeSchema(TOOLS[name].output);
