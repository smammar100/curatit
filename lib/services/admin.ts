import "server-only";

import { z } from "zod";
import { all, get, now, parseJson, run, transaction } from "../db";
import type { SlideArt } from "../art";
import type { Viewer } from "../auth";
import { AppError, conflict, notFound } from "../errors";
import { cleanText } from "../security";
import { categories } from "../taxonomy";
import { audit } from "./events";

/**
 * Editorial curation (plan §7.4, §25 publication invariant).
 *
 * candidate → shortlisted → (enriched, ready) → published
 *                   ↘ rejected                     ↘ removed (overrides all)
 */

function requireAdmin(viewer: Viewer) {
  if (viewer.role !== "admin") {
    audit("admin.access", "admin", null, "denied", viewer.userId);
    throw new AppError("forbidden", "Admin access required.");
  }
}

export type QueueItem = {
  id: string;
  brandName: string;
  brandIsDemo: boolean;
  categoryId: string;
  mediaType: string;
  caption: string | null;
  sourceUrl: string;
  publishedAt: string | null;
  capturedAt: string;
  editorialStatus: string;
  processingStatus: string;
  publicationStatus: string;
  rejectionReason: string | null;
  hook: string | null;
  summary: string | null;
  confidence: number | null;
  humanReviewed: boolean;
  slides: { art: SlideArt; alt: string }[];
};

export type QueueView = "review" | "published" | "rejected" | "removed";

const viewWhere: Record<QueueView, string> = {
  review: "p.publication_status = 'unpublished' AND p.editorial_status IN ('candidate', 'shortlisted')",
  published: "p.publication_status = 'published'",
  rejected: "p.publication_status = 'unpublished' AND p.editorial_status = 'rejected'",
  removed: "p.publication_status = 'removed'",
};

export function listQueue(viewer: Viewer, view: QueueView): QueueItem[] {
  requireAdmin(viewer);
  const rows = all<{
    id: string;
    brand_name: string;
    is_demo: number;
    category_id: string;
    media_type: string;
    caption: string | null;
    source_url: string;
    published_at: string | null;
    captured_at: string;
    editorial_status: string;
    processing_status: string;
    publication_status: string;
    rejection_reason: string | null;
    hook: string | null;
    summary: string | null;
    confidence: number | null;
    human_reviewed: number | null;
  }>(
    `SELECT p.id, b.name AS brand_name, b.is_demo, b.primary_category_id AS category_id, p.media_type,
            p.caption, p.source_url, p.published_at, p.captured_at, p.editorial_status,
            p.processing_status, p.publication_status, p.rejection_reason,
            a.hook, a.summary, a.confidence, a.human_reviewed
       FROM source_posts p
       JOIN brands b ON b.id = p.brand_id
       LEFT JOIN creative_analyses a ON a.post_id = p.id
      WHERE ${viewWhere[view]}
      ORDER BY p.captured_at DESC
      LIMIT 200`
  );

  const slides = all<{ post_id: string; art: string; alt_text: string }>(
    "SELECT post_id, art, alt_text FROM post_slides ORDER BY post_id, position"
  );

  return rows.map((row) => ({
    id: row.id,
    brandName: row.brand_name,
    brandIsDemo: row.is_demo === 1,
    categoryId: row.category_id,
    mediaType: row.media_type,
    caption: row.caption,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    capturedAt: row.captured_at,
    editorialStatus: row.editorial_status,
    processingStatus: row.processing_status,
    publicationStatus: row.publication_status,
    rejectionReason: row.rejection_reason,
    hook: row.hook,
    summary: row.summary,
    confidence: row.confidence,
    humanReviewed: row.human_reviewed === 1,
    slides: slides
      .filter((slide) => slide.post_id === row.id)
      .map((slide) => ({ art: parseJson<SlideArt>(slide.art, {} as SlideArt), alt: slide.alt_text })),
  }));
}

type PostState = {
  id: string;
  editorial_status: string;
  processing_status: string;
  publication_status: string;
};

function postState(postId: string) {
  const post = get<PostState>(
    "SELECT id, editorial_status, processing_status, publication_status FROM source_posts WHERE id = ?",
    postId
  );
  if (!post) throw notFound("Post");
  return post;
}

export type AdminAction = "shortlist" | "reject" | "publish" | "remove" | "restore";

const reasonSchema = z.string().transform(cleanText).pipe(z.string().min(3).max(300));

export function applyAction(viewer: Viewer, postId: string, action: AdminAction, reason?: string) {
  requireAdmin(viewer);
  if (!z.string().uuid().safeParse(postId).success) throw notFound("Post");
  const timestamp = now();

  transaction(() => {
    const post = postState(postId);

    // `removed` overrides every other state; only an explicit restore undoes it.
    if (post.publication_status === "removed" && action !== "restore") {
      throw conflict("This post is removed. Restore it through review before changing it.");
    }

    switch (action) {
      case "shortlist": {
        if (post.editorial_status !== "candidate") throw conflict("Only candidates can be shortlisted.");
        // Enrichment is not wired locally; demo candidates already carry analysis.
        const hasAnalysis = get("SELECT 1 FROM creative_analyses WHERE post_id = ?", postId);
        run(
          "UPDATE source_posts SET editorial_status = 'shortlisted', processing_status = ?, updated_at = ? WHERE id = ?",
          hasAnalysis ? "ready" : "pending",
          timestamp,
          postId
        );
        break;
      }
      case "reject": {
        if (post.publication_status !== "unpublished") throw conflict("Only unpublished posts can be rejected.");
        const parsed = reasonSchema.safeParse(reason ?? "");
        if (!parsed.success) throw new AppError("invalid_input", "Give a rejection reason (3–300 characters).");
        run(
          "UPDATE source_posts SET editorial_status = 'rejected', rejection_reason = ?, updated_at = ? WHERE id = ?",
          parsed.data,
          timestamp,
          postId
        );
        break;
      }
      case "publish": {
        // Publication requires: shortlisted, processed, valid analysis, slides, attribution.
        if (post.editorial_status !== "shortlisted") throw conflict("Shortlist the post before publishing.");
        if (post.processing_status !== "ready") throw conflict("Enrichment hasn't finished for this post.");
        const complete = get<{ slides: number; analysis: number; source: string }>(
          `SELECT (SELECT COUNT(*) FROM post_slides WHERE post_id = p.id) AS slides,
                  (SELECT COUNT(*) FROM creative_analyses WHERE post_id = p.id AND summary != '') AS analysis,
                  p.source_url AS source
             FROM source_posts p WHERE p.id = ?`,
          postId
        )!;
        if (!complete.slides || !complete.analysis || !complete.source) {
          throw conflict("This post is missing slides, analysis, or a source link.");
        }
        run(
          "UPDATE source_posts SET publication_status = 'published', updated_at = ? WHERE id = ?",
          timestamp,
          postId
        );
        run("UPDATE creative_analyses SET human_reviewed = 1, updated_at = ? WHERE post_id = ?", timestamp, postId);
        break;
      }
      case "remove": {
        // Immediate serving suppression across search, detail, boards, shares.
        run(
          "UPDATE source_posts SET publication_status = 'removed', updated_at = ? WHERE id = ?",
          timestamp,
          postId
        );
        break;
      }
      case "restore": {
        if (post.publication_status !== "removed") throw conflict("Only removed posts can be restored.");
        // Restored posts return to review — never straight back to published.
        run(
          "UPDATE source_posts SET publication_status = 'unpublished', editorial_status = 'shortlisted', updated_at = ? WHERE id = ?",
          timestamp,
          postId
        );
        break;
      }
    }
  });

  audit(`post.${action}`, "source_post", postId, "success", viewer.userId);
}

/** Coverage dashboard per launch category (plan §32 acceptance checklist). */
export function coverage(viewer: Viewer) {
  requireAdmin(viewer);
  const rows = all<{ category_id: string; brands: number; published: number; objectives: number; queued: number }>(
    `SELECT b.primary_category_id AS category_id,
            COUNT(DISTINCT CASE WHEN p.publication_status = 'published' THEN b.id END) AS brands,
            SUM(p.publication_status = 'published') AS published,
            COUNT(DISTINCT CASE WHEN p.publication_status = 'published' THEN a.objective_id END) AS objectives,
            SUM(p.publication_status = 'unpublished' AND p.editorial_status != 'rejected') AS queued
       FROM source_posts p
       JOIN brands b ON b.id = p.brand_id
       LEFT JOIN creative_analyses a ON a.post_id = p.id
      GROUP BY b.primary_category_id`
  );

  return categories.map((category) => {
    const row = rows.find((item) => item.category_id === category.id);
    const published = row?.published ?? 0;
    const brands = row?.brands ?? 0;
    const objectives = row?.objectives ?? 0;
    return {
      id: category.id,
      name: category.name,
      brands,
      published,
      objectives,
      queued: row?.queued ?? 0,
      // Plan §32: 60 posts, ≥4 brands, ≥3 objectives before a category is "ready".
      ready: published >= 60 && brands >= 4 && objectives >= 3,
    };
  });
}
