// The six research tools, as one registry both transports run: MCP registers them on a server,
// REST calls the same `executeTool`. A call checks the credential's scope, takes a rate-limit
// slot, runs the service inside one deadline (CALL_BUDGET_MS, cut short when the caller goes
// away), and wraps the outcome in the envelope; every failure becomes a CuratitError with a safe
// message. Tool descriptions are Curatit's own and never include anything scraped.

import type { ImageContent } from "@modelcontextprotocol/server";
import { TOOLS, type ToolName, envelopeSchema, type PostInputT } from "./contracts";
import type { McpConfig } from "./config";
import { CALL_BUDGET_MS, runWithDeadline } from "./deadline";
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
import { carouselText, postText, searchText, withWarnings } from "./text";

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
      "Find real Instagram posts using everyday descriptions such as 'fintech carousels that open with a stat', or explicit taxonomy filters. Natural mode maps supported phrases to filters and searches remaining keywords across captions, on-slide text and published analyses; applied reports the interpretation. Explicit filters win. Use all_words or any_word for literal keyword search. Returns compact matches with reasons; nothing is relaxed automatically. Empty results have suggestions. Page with next_cursor. Needs a query or a filter.",
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

// Runs a tool for a principal: the one path MCP and REST share. `signal` is the transport's own
// (the MCP request's cancellation, the HTTP request's), so a caller who hangs up stops the work
export async function executeTool(rt: Runtime, name: ToolName, rawArgs: unknown, principal: Principal, signal?: AbortSignal): Promise<ToolOutcome> {
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
    // The limiter's wait sits outside the budget, so a call that queued still gets all of it
    const outcome = await runWithDeadline(CALL_BUDGET_MS, signal, () => run(rt, name, parsed.data, principal));
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
      // Why, for the failures that are ours: a TIMEOUT's cause names the stage it stopped in
      ...((err.code === "INTERNAL_ERROR" || err.code === "TIMEOUT") && { cause: typeof err.cause === "object" && err.cause ? JSON.stringify(err.cause) : String(err.cause ?? err.message) }),
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
      return { data: r.data, warnings: r.warnings, taxonomyVersion: null, image: null, text: withWarnings(r.warnings, searchText(r.data)) };
    }
    case "curatit_get_post": {
      // The text a host reads when it ignores structured content: every category and the
      // published analysis as the post page reads it (text.ts), not just its concept
      const r = await getPost(rt.repo, args as never);
      return { data: r.data, warnings: [], taxonomyVersion: r.taxonomyVersion, image: null, text: postText(r.data.post, (args as PostInputT).detail_level === "full") };
    }
    case "curatit_get_carousel": {
      const r = await getCarousel(rt.repo, args as never);
      return { data: r.data, warnings: r.warnings, taxonomyVersion: r.taxonomyVersion, image: null, text: withWarnings(r.warnings, carouselText(r.data)) };
    }
    case "curatit_get_media": {
      const r = await getMedia(rt.repo, args as never, rt.media);
      const d = r.data;
      const text = d.delivery === "link" ? `${d.slide_label} of post ${d.post_id}: ${d.url} (${d.mime_type}, ${d.width ?? "?"}×${d.height ?? "?"}, ${d.bytes ?? "?"} bytes)` : `${d.slide_label} of post ${d.post_id}, delivered inline (${d.mime_type}, ${d.width ?? "?"}×${d.height ?? "?"}).`;
      return { data: r.data, warnings: r.warnings, taxonomyVersion: null, image: r.image, text: withWarnings(r.warnings, text) };
    }
    case "curatit_create_brief": {
      const r = await createBrief(rt.repo, args as never);
      return { data: r.data, warnings: r.warnings, taxonomyVersion: r.taxonomyVersion, image: null, text: withWarnings(r.warnings, r.data.text) };
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
