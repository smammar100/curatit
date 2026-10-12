// curatit_get_post and curatit_get_carousel: one post with its caption, counts, media index and
// published analysis; and a carousel's slides, page by page, in stored order with each slide's
// analysis record. Nothing is invented: fields the catalog has no value for are null and named
// in `missing`.

import type { AnalysisFull, AnalysisSummary, CarouselInputT, CarouselOutputT, PostInputT, PostOutputT, SlideAnalysis } from "../contracts";
import type { CatalogRepository, RawDetailAnalysis, RawPost, RawSlide } from "../repo/types";
import { brandOf, classification, hasAnalysis, industryOf, loadPost, mediaId, slideLabel } from "./shared";

const CAPTION_SUMMARY = 1500;
const CAPTION_FULL = 12000;

function slideRecord(slide: NonNullable<RawDetailAnalysis["narrative"]>["slides"][number], total: number): SlideAnalysis {
  return {
    slide_index: slide.position,
    slide_label: slideLabel(slide.position, total),
    role: slide.role ?? null,
    headline: slide.headline ?? null,
    observation: slide.observation ?? null,
    typography: slide.typography ?? [],
    layouts: slide.layout ?? [],
    imagery: slide.imagery ?? [],
    palettes: slide.palette ?? [],
    devices: slide.devices ?? [],
  };
}

export function analysisSummary(creative: RawDetailAnalysis): AnalysisSummary {
  return {
    status: "published",
    analysis_version: creative.analysis_version,
    taxonomy_version: creative.taxonomy_version ?? null,
    published_at: creative.published_at ?? null,
    source: creative.analysis_source ?? "ai",
    image_analysis_complete: Boolean(creative.image_analysis_complete),
    slides_analysed: creative.slides_analysed ?? 0,
    concept: creative.concept ?? null,
    summary: creative.creative_summary ?? null,
    hook: {
      technique: creative.hook?.technique ?? creative.hook_technique ?? null,
      observed_text: creative.hook?.observed_text ?? null,
      location: creative.hook?.location ?? null,
    },
    why_it_might_work: creative.why_it_might_work ?? [],
    takeaways: creative.takeaways ?? [],
    evidence: (creative.analysis_evidence ?? []).map((e) => ({ ref: e.ref, observation: e.observation, quote: e.quote ?? null })),
    note: creative.note,
  };
}

export function analysisFull(creative: RawDetailAnalysis, total: number): AnalysisFull {
  return {
    ...analysisSummary(creative),
    narrative: { pattern: creative.narrative?.pattern ?? creative.narrative_pattern ?? null, arc: creative.narrative?.arc ?? null },
    slides: (creative.narrative?.slides ?? []).map((s) => slideRecord(s, total)),
    copy_strategy: creative.copy_strategy ?? null,
    attention_mechanisms: creative.attention_mechanisms ?? [],
    adaptation_ideas: creative.adaptation_ideas ?? [],
    constraints_or_uncertainties: creative.constraints_or_uncertainties ?? [],
  };
}

function mediaIndex(post: RawPost, slides: RawSlide[]) {
  const byPosition = new Map(slides.map((s) => [s.position, s]));
  const total = post.images.length;
  return post.images.map((image) => {
    const slide = byPosition.get(image.position);
    return {
      media_id: mediaId(post.id, image.position),
      slide_index: image.position,
      slide_label: slideLabel(image.position, total),
      is_cover: image.position === 0,
      was_video: slide?.was_video ?? post.format === "video",
      alt_text: slide?.alt ?? (image.position === 0 ? post.alt : null),
    };
  });
}

export async function getPost(repo: CatalogRepository, input: PostInputT): Promise<{ data: PostOutputT; taxonomyVersion: string | null }> {
  const post = await loadPost(repo, input.post_id);
  const [slides, observedAt] = await Promise.all([repo.slides(post.id), repo.metricsObservedAt(post.id)]);
  const full = input.detail_level === "full";
  const cap = full ? CAPTION_FULL : CAPTION_SUMMARY;
  const caption = post.caption ?? "";
  const creative = hasAnalysis(post.creative) ? post.creative : null;
  const missing: string[] = [];
  if (!post.posted_at) missing.push("posted_at");
  if (!post.alt) missing.push("alt_text");
  if (post.metrics.likes === null) missing.push("metrics.likes");
  if (post.metrics.comments === null) missing.push("metrics.comments");
  if (!observedAt) missing.push("metrics.observed_at");
  if (!creative) missing.push("analysis (no published creative analysis for this post yet)");

  return {
    data: {
      post: {
        post_id: post.id,
        short_code: post.short_code,
        source_url: post.source_url,
        platform: "instagram",
        brand: brandOf(post),
        industry: industryOf(post),
        format: post.format,
        posted_at: post.posted_at,
        caption: { text: caption.length > cap ? caption.slice(0, cap) : caption, truncated: caption.length > cap, total_length: caption.length },
        alt_text: post.alt,
        hashtags: post.hashtags ?? [],
        metrics: {
          likes: post.metrics.likes,
          comments: post.metrics.comments,
          video_views: post.metrics.video_views,
          observed_at: observedAt,
          source: "instagram_scrape",
        },
        media: mediaIndex(post, slides),
        classification: classification(creative),
        analysis: creative ? (full ? analysisFull(creative, post.images.length) : analysisSummary(creative)) : null,
        missing,
      },
    },
    taxonomyVersion: creative?.taxonomy_version ?? null,
  };
}

export const CAROUSEL_DEFAULT_LIMIT = 5;

export async function getCarousel(repo: CatalogRepository, input: CarouselInputT): Promise<{ data: CarouselOutputT; taxonomyVersion: string | null; warnings: string[] }> {
  const post = await loadPost(repo, input.post_id);
  const slides = await repo.slides(post.id);
  const byPosition = new Map(slides.map((s) => [s.position, s]));
  const creative = hasAnalysis(post.creative) ? post.creative : null;
  const records = new Map((creative?.narrative?.slides ?? []).map((s) => [s.position, slideRecord(s, post.images.length)]));
  const start = input.start_slide ?? 0;
  const limit = input.limit ?? CAROUSEL_DEFAULT_LIMIT;
  const total = post.images.length;
  const warnings: string[] = [];
  if (post.format !== "carousel") warnings.push("This post is a single image, so it has one slide. curatit_get_post already lists it.");
  if (start >= total && total > 0) warnings.push(`start_slide ${start} is past the last slide (${total - 1}).`);

  const page = post.images.filter((image) => image.position >= start).slice(0, limit);
  const out = page.map((image) => {
    const slide = byPosition.get(image.position);
    return {
      media_id: mediaId(post.id, image.position),
      slide_index: image.position,
      slide_label: slideLabel(image.position, total),
      is_cover: image.position === 0,
      was_video: slide?.was_video ?? false,
      alt_text: slide?.alt ?? (image.position === 0 ? post.alt : null),
      public_url: repo.publicUrl(image.path),
      original_width: slide?.width ?? null,
      original_height: slide?.height ?? null,
      analysis: records.get(image.position) ?? null,
    };
  });
  const last = page[page.length - 1];
  const nextStart = last && post.images.some((image) => image.position > last.position) ? last.position + 1 : null;

  return {
    data: {
      post_id: post.id,
      short_code: post.short_code,
      format: post.format,
      total_slides: total,
      slides: out,
      next_start: nextStart,
      slides_analysed: creative?.slides_analysed ?? 0,
    },
    taxonomyVersion: creative?.taxonomy_version ?? null,
    warnings,
  };
}
