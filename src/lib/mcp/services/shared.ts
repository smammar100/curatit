// Pieces the services share: slide labels, media ids, the classification block built from a
// published analysis, and how a post id or short code becomes a post.

import type { Classification } from "../contracts";
import { invalid, notFound } from "../errors";
import type { CatalogRepository, RawCompactAnalysis, RawPost } from "../repo/types";

// Slides are zero-based in the API; people count from 1
export const slideLabel = (index: number, total: number) => (total <= 1 ? "Cover" : `Slide ${index + 1}`);

export const mediaId = (postId: string, position: number) => `${postId}.${position}`;

export function parseMediaId(id: string) {
  const dot = id.lastIndexOf(".");
  const post = id.slice(0, dot);
  const index = Number(id.slice(dot + 1));
  if (!/^[A-Za-z0-9_-]{5,60}$/.test(post) || !Number.isInteger(index) || index < 0 || index > 99) throw invalid("media_id must be <post id>.<slide index>, e.g. 3999245988837424761.0");
  return { post, index };
}

export async function resolvePostId(repo: CatalogRepository, idOrShortCode: string) {
  const found = await repo.resolvePost(idOrShortCode);
  if (!found) throw notFound(`No published post matches "${idOrShortCode}". Ids and short codes come from curatit_search_posts.`);
  return found;
}

export async function loadPost(repo: CatalogRepository, idOrShortCode: string): Promise<RawPost> {
  const { id } = await resolvePostId(repo, idOrShortCode);
  const post = await repo.getPost(id);
  if (!post) throw notFound(`No published post matches "${idOrShortCode}".`);
  return post;
}

// A post with no published analysis carries null (the catalog function finds no row) or an
// empty object; either way, no analysis
export const hasAnalysis = (creative: RawPost["creative"]): creative is Exclude<RawPost["creative"], Record<string, never> | null> =>
  creative !== null && typeof (creative as { analysis_version?: unknown }).analysis_version === "string";

export function classification(analysis: RawCompactAnalysis | null | undefined): Classification | null {
  if (!analysis) return null;
  return {
    creative_approach: analysis.primary_type ?? null,
    approach_family: null,
    secondary_approaches: analysis.secondary_types ?? [],
    goal: analysis.objective ?? null,
    hook_technique: analysis.hook_technique ?? null,
    narrative_pattern: analysis.narrative_pattern ?? null,
    typography: analysis.typography_categories ?? [],
    layouts: analysis.layout_tags ?? [],
    imagery: analysis.visual_styles ?? [],
    palettes: analysis.palette ?? [],
    taxonomy_version: analysis.taxonomy_version ?? null,
    confidence: null,
  };
}

export const excerpt = (text: string | null | undefined, max: number) => {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
};

export const industryOf = (post: { categories: { name: string; slug: string }[] }) => post.categories[0] ?? null;
export const brandOf = (post: { brand: { name: string | null; slug: string | null } }) => ({ name: post.brand.name ?? "Unknown brand", slug: post.brand.slug ?? "unknown" });
