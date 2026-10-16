// Pieces the services share: slide labels, media ids, the classification block built from a
// published analysis, a post's categories, and how a post id or short code becomes a post.

import { familyOf } from "@/lib/creative/taxonomy";
import type { Classification, PostCategory } from "../contracts";
import { invalid, notFound } from "../errors";
import type { CatalogRepository, RawCategory, RawCompactAnalysis, RawPost } from "../repo/types";

// Slides are zero-based in the API; people count from 1
export const slideLabel = (index: number, total: number) => (total <= 1 ? "Cover" : `Slide ${index + 1}`);

export const mediaId = (postId: string, position: number) => `${postId}.${position}`;

// A name compared loosely: lower case, "&" and the word "and" left out, then everything but
// letters and digits, so "Food & Drink", "food_drink" and "Food and drink" are one name, and so
// are "Coca Cola" and "coca-cola". The same rule as private.curatit_mcp_name_key in
// …_mcp_category_resolution.sql; change the two together
export const nameKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/&|\band\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");

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

// Taxonomy values that say nothing about a post. The pipeline writes them when it can't tell or
// nothing applies, and no filter matches them (creative_write_labels leaves them out), so they're
// never shown as labels
const SAYS_NOTHING = new Set(["unknown", "none", "other"]);

// The values in a list that say something, in order, once each; [] for anything that isn't a list
export function known(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is string => typeof v === "string" && v.trim() !== "" && !SAYS_NOTHING.has(v)))];
}

// One value that says something, or null
export const knownOne = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" && !SAYS_NOTHING.has(value) ? value : null);

export function classification(analysis: RawCompactAnalysis | null | undefined): Classification | null {
  if (!analysis) return null;
  const approach = knownOne(analysis.primary_type);
  return {
    creative_approach: approach,
    approach_family: approach ? (familyOf(approach) ?? null) : null,
    secondary_approaches: known(analysis.secondary_types),
    goal: knownOne(analysis.objective),
    hook_technique: knownOne(analysis.hook_technique),
    narrative_pattern: knownOne(analysis.narrative_pattern),
    typography: known(analysis.typography_categories),
    layouts: known(analysis.layout_tags),
    imagery: known(analysis.visual_styles),
    palettes: known(analysis.palette),
    // From the copy strategy (…_creative_mcp_analysis_v3); empty on a database without it
    tones: known(analysis.tones),
    persuasion: known(analysis.persuasion),
    cta: knownOne(analysis.cta),
    taxonomy_version: analysis.taxonomy_version ?? null,
    // Nothing measures the analysis as a whole; each decision has its own confidence
    confidence: null,
  };
}

export const excerpt = (text: string | null | undefined, max: number) => {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
};

// The catalog lists a post's categories main first (…_mcp_main_category_first): the brand's main
// category, then the tags its posts carry. `industry` is the main one alone
export const industryOf = (post: { categories: RawCategory[] }) => post.categories[0] ?? null;

// Every category a post is in, main first, each once
export function categoriesOf(post: { categories: RawCategory[] | null | undefined }): PostCategory[] {
  const seen = new Set<string>();
  return (post.categories ?? []).flatMap((category, i) => {
    if (!category?.slug || seen.has(category.slug)) return [];
    seen.add(category.slug);
    return [{ name: category.name, slug: category.slug, main: i === 0 }];
  });
}
export const brandOf = (post: { brand: { name: string | null; slug: string | null } }) => ({ name: post.brand.name ?? "Unknown brand", slug: post.brand.slug ?? "unknown" });
