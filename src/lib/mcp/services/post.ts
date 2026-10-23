// curatit_get_post and curatit_get_carousel: one post with its caption, counts, media index and
// published analysis; and a carousel's slides, page by page, in stored order with each slide's
// analysis record. Nothing is invented: fields the catalog has no value for are null and named
// in `missing`.
//
// The analysis is built with the post page's own code (toPublicAnalysis, src/lib/creative/
// publicAnalysis.ts) from the Creative DNA and slide records the catalog returns, so the MCP and
// the website can't disagree: the same legacy fallbacks, the same hidden "unknown" labels, slides
// counted the same way in prose. The older fields (concept, why_it_might_work, evidence…) stay as
// they were for the clients that read them.

import { briefMarkdown, evidenceGroups, toPublicAnalysis, type AnalysisRecord, type EvidenceTarget, type IntegrityStatus, type PublicAnalysis, type SlideDetail } from "@/lib/creative/publicAnalysis";
import type { BriefSource } from "@/lib/creative/publicView";
import { term } from "@/lib/creative/taxonomy";
import type { AnalysisFull, AnalysisSummary, CarouselInputT, CarouselOutputT, DataCheck, Decision, PostInputT, PostOutputT, SlideAnalysis } from "../contracts";
import type { CatalogRepository, RawDetailAnalysis, RawPost, RawSlide, RawSlideAnalysis } from "../repo/types";
import { brandOf, categoriesOf, classification, hasAnalysis, industryOf, known, knownOne, loadPost, mediaId, slideLabel } from "./shared";

const CAPTION_SUMMARY = 1500;
const CAPTION_FULL = 12000;

// Every 2026-10-13 analysis names its colours "Cover sample 3; not a brand token": a placeholder,
// not a job the colour does, so it's no role at all
const PLACEHOLDER_ROLE = /cover sample \d+; not a brand token/i;

const NOTE = "AI-drafted analysis, approved for publication by Curatit. Rationale is hypothesis, not measured performance.";
const NOTE_REVIEW =
  "AI-drafted analysis, approved for publication by Curatit and flagged for a closer editor review, so read it as a draft. Rationale is hypothesis, not measured performance.";

const record = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((s): s is string => typeof s === "string" && s.trim() !== "") : []);

// The post's analysis as the post page shows it, or null: no published analysis, or a catalog
// that doesn't return the Creative DNA yet (before …_creative_mcp_analysis_v3)
export function publicAnalysisOf(post: RawPost): PublicAnalysis | null {
  if (!hasAnalysis(post.creative)) return null;
  const creative = post.creative;
  if (creative.dna === undefined || creative.dna === null) return null;
  const analysis: AnalysisRecord = {
    creative_dna: creative.dna,
    current_version_id: creative.current_version_id ?? creative.analysis_version ?? null,
    image_analysis_complete: creative.image_analysis_complete ?? null,
    expected_slides: creative.expected_slides ?? creative.slides_total ?? null,
    processed_slides: creative.processed_slides ?? creative.slides_analysed ?? null,
  };
  return toPublicAnalysis(analysis, creative.slide_records ?? [], post.images.length);
}

// Whether the analysis asks for a closer review. All the 2026-10-13 analyses do; without the DNA
// to say otherwise, assume it does rather than claim a review that may not have happened
function needsReview(creative: RawDetailAnalysis) {
  return record(record(creative.dna).quality).needs_review !== false;
}

// Where a statement rests, as indexes and as people count them: "Slide 7", "Slides 1–2, 6"
// (the post page's own wording), "Cover" on a single image
function slidesOf(evidence: EvidenceTarget[], total: number) {
  const slides = evidence.flatMap((target) => (target.kind === "slide" ? [target.index] : []));
  const parts = evidenceGroups(evidence)
    .filter((group) => group.target.kind === "slide")
    .map((group) => group.label.replace(/^Slides? /, ""));
  const label = !parts.length ? null : total <= 1 ? "Cover" : parts.length === 1 && !parts[0].includes("–") ? `Slide ${parts[0]}` : `Slides ${parts.join(", ")}`;
  return { slides, slides_label: label, on_caption: evidence.some((target) => target.kind === "caption") };
}

// The page's statuses in the contract's words. "verified" is reserved for a check against a real
// source, which nothing makes; if one ever appears it's still only an observation here
const STATUS: Record<IntegrityStatus, DataCheck["status"]> = { concern: "potential_concern", cannot_verify: "cannot_verify", observed: "observed", verified: "observed" };

function decisionsOf(analysis: PublicAnalysis, total: number): Decision[] {
  return analysis.creativeDecisions.map((d) => ({
    title: d.title,
    explanation: d.explanation,
    observation: d.observation,
    effect: d.effect,
    principle: d.principle,
    watch_out: d.watchOut,
    confidence: d.confidence,
    ...slidesOf(d.evidence, total),
  }));
}

function dataChecksOf(analysis: PublicAnalysis, total: number): DataCheck[] {
  return analysis.integrity.map((check) => ({ aspect: check.aspect, status: STATUS[check.status], note: check.note, ...slidesOf(check.evidence, total) }));
}

// The colours with placeholder roles cleared, for the contract and for the brief built from them
function withRoles(analysis: PublicAnalysis): PublicAnalysis {
  return { ...analysis, colours: analysis.colours.map((colour) => ({ hex: colour.hex, role: colour.role && !PLACEHOLDER_ROLE.test(colour.role) ? colour.role : null })) };
}

// A slide role's slug in words, as the page names it ("gallery-frame" → "Gallery frame")
function roleWords(slug: unknown) {
  const role = knownOne(slug);
  return role ? (term("slide_role", role)?.label ?? role) : null;
}

// A slide's record: the page's reading of it (role in words, the copy, legibility, measured
// colours, a blank frame, what changed) and the catalog's tags, without the ones that say nothing
function slideRecord(position: number, total: number, raw: RawSlideAnalysis | undefined, detail: SlideDetail | null | undefined): SlideAnalysis {
  return {
    slide_index: position,
    slide_label: slideLabel(position, total),
    role: detail ? detail.role : roleWords(raw?.role),
    headline: detail ? detail.headline : (raw?.headline ?? null),
    body: detail?.body ?? null,
    legibility: detail?.legibility ?? null,
    observation: detail?.observation ?? raw?.observation ?? null,
    typography: known(raw?.typography),
    layouts: known(raw?.layout),
    imagery: known(raw?.imagery),
    palettes: known(raw?.palette),
    devices: known(raw?.devices),
    colours: (detail?.colours ?? []).map((hex) => hex.toLowerCase()),
    blank: detail?.blank ?? false,
    changes: detail?.changes ?? [],
  };
}

// One record per slide that has one, in slide order
export function slideRecords(creative: RawDetailAnalysis, analysis: PublicAnalysis | null, total: number): SlideAnalysis[] {
  const raw = new Map((creative.narrative?.slides ?? []).map((slide) => [slide.position, slide]));
  const positions = new Set([...raw.keys(), ...(analysis?.slides ?? []).flatMap((slide, index) => (slide ? [index] : []))]);
  return [...positions].sort((a, b) => a - b).map((position) => slideRecord(position, total, raw.get(position), analysis?.slides[position]));
}

export function analysisSummary(creative: RawDetailAnalysis, analysis: PublicAnalysis | null, total: number): AnalysisSummary {
  const review = needsReview(creative);
  return {
    status: "published",
    analysis_version: creative.analysis_version,
    taxonomy_version: creative.taxonomy_version ?? null,
    published_at: creative.published_at ?? null,
    source: creative.analysis_source ?? "ai",
    needs_review: review,
    image_analysis_complete: Boolean(creative.image_analysis_complete),
    slides_analysed: creative.slides_analysed ?? 0,
    strategy_headline: analysis?.headline ?? creative.strategy_headline ?? creative.concept ?? creative.creative_summary ?? "",
    strategy_summary: analysis ? analysis.summary : (creative.strategy_summary ?? null),
    creative_formula: analysis?.formula ?? null,
    concept: creative.concept ?? null,
    summary: creative.creative_summary ?? null,
    hook: {
      technique: creative.hook?.technique ?? creative.hook_technique ?? null,
      observed_text: creative.hook?.observed_text ?? null,
      location: creative.hook?.location ?? null,
    },
    decisions: analysis ? decisionsOf(analysis, total) : [],
    data_checks: analysis ? dataChecksOf(analysis, total) : [],
    application: { when_to_use: analysis?.application.whenToUse ?? [], when_not_to_use: analysis?.application.whenNotToUse ?? [] },
    why_it_might_work: creative.why_it_might_work ?? [],
    takeaways: creative.takeaways ?? [],
    evidence: (creative.analysis_evidence ?? []).map((e) => ({ ref: e.ref, observation: e.observation, quote: e.quote ?? null })),
    caveats: analysis ? analysis.caveats : strings(creative.constraints_or_uncertainties),
    note: review ? NOTE_REVIEW : NOTE,
  };
}

// What the visual adaptation prompt needs besides the analysis: the stored images as public URLs
// in stage order, which of them were videos, and the post's size (the first slide's, as recorded)
function briefSourceOf(post: RawPost, slides: RawSlide[], publicUrl: (path: string) => string): BriefSource {
  const byPosition = new Map(slides.map((s) => [s.position, s]));
  const images = [...post.images].sort((a, b) => a.position - b.position);
  const first = byPosition.get(0) ?? slides[0];
  return {
    brand: brandOf(post).name,
    shortCode: post.short_code,
    url: post.source_url,
    format: post.format,
    slides: images.length,
    images: images.map((image) => publicUrl(image.path)),
    videos: images.map((image) => byPosition.get(image.position)?.was_video ?? post.format === "video"),
    width: first?.width ?? null,
    height: first?.height ?? null,
  };
}

export function analysisFull(post: RawPost, creative: RawDetailAnalysis, analysis: PublicAnalysis | null, source: { slides: RawSlide[]; publicUrl: (path: string) => string }): AnalysisFull {
  const total = post.images.length;
  const shown = analysis ? withRoles(analysis) : null;
  return {
    ...analysisSummary(creative, analysis, total),
    narrative: { pattern: creative.narrative?.pattern ?? creative.narrative_pattern ?? null, arc: creative.narrative?.arc ?? null },
    slides: slideRecords(creative, analysis, total),
    visual: (shown?.visual ?? []).map((section) => ({
      dimension: section.key,
      insight: section.insight,
      attributes: section.chips,
      slides: section.evidence.flatMap((target) => (target.kind === "slide" ? [target.index] : [])),
    })),
    colour_roles: shown?.colours ?? [],
    copywriting: shown?.copywriting ?? null,
    brief_markdown: shown ? briefMarkdown(shown, briefSourceOf(post, source.slides, source.publicUrl)) : null,
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
  const analysis = publicAnalysisOf(post);
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
        categories: categoriesOf(post),
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
        analysis: creative ? (full ? analysisFull(post, creative, analysis, { slides, publicUrl: (path) => repo.publicUrl(path) }) : analysisSummary(creative, analysis, post.images.length)) : null,
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
  const records = new Map((creative ? slideRecords(creative, publicAnalysisOf(post), post.images.length) : []).map((r) => [r.slide_index, r]));
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
