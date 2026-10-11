import { cache } from "react";
import { createPublicClient } from "@/utils/supabase/public";
import type { CreativeDna } from "./schema";
import { term, type Dimension } from "./taxonomy";

// Creative Intelligence on the post's detail page: its published Creative DNA, with the labels
// in words and only what a designer reads (not the evidence trail, the uncertainties or the
// adaptation ideas). Server only, and kept out of lib/posts.ts, which the homepage's client code
// imports, so the taxonomy never ships to the browser.
export type PostAnalysis = {
  concept: string;
  // [heading, label] for the archetype, objective, hook and structure; "other" and "unknown",
  // and the structure of a single image, are left out
  labels: [string, string][];
  // The hook's own words, when it has some
  hookText: string | null;
  arc: string;
  // Each slide's role, in slide order; empty for a single image
  roles: (string | null)[];
  why: string[];
  takeaways: string[];
};

const known = (dimension: Dimension, slug: unknown) =>
  typeof slug === "string" && slug !== "other" && slug !== "unknown" ? (term(dimension, slug)?.label ?? null) : null;
const texts = (list: unknown) => (Array.isArray(list) ? list.filter((s): s is string => typeof s === "string" && s.trim() !== "") : []);

// Read defensively: a published analysis passed the contract when it was written, but the
// contract may have moved on since
export function toAnalysis(dna: unknown, slides: number): PostAnalysis | null {
  if (!dna || typeof dna !== "object") return null;
  const d = dna as Partial<CreativeDna>;
  if (typeof d.concept !== "string" || !d.concept.trim()) return null;
  const pattern = d.narrative?.pattern;
  const labels: [string, string | null][] = [
    ["Type", known("archetype", d.primary_archetype?.slug)],
    ["Goal", known("objective", d.marketing_objective?.slug)],
    ["Hook", known("hook_technique", d.hook?.technique)],
    ["Structure", pattern === "single-image" ? null : known("narrative_pattern", pattern)],
  ];
  const roles = Array.isArray(d.narrative?.slide_roles) ? d.narrative.slide_roles : [];
  return {
    concept: d.concept.trim(),
    labels: labels.filter((entry): entry is [string, string] => entry[1] !== null),
    hookText: typeof d.hook?.observed_text === "string" && d.hook.observed_text.trim() ? d.hook.observed_text.trim() : null,
    arc: typeof d.narrative?.arc === "string" ? d.narrative.arc.trim() : "",
    roles: slides > 1 ? Array.from({ length: slides }, (_, position) => known("slide_role", roles.find((entry) => entry?.position === position)?.role)) : [],
    why: texts((Array.isArray(d.creative_rationale) ? d.creative_rationale : []).map((item) => item?.hypothesis)),
    takeaways: texts(d.takeaways),
  };
}

// The post's analysis once an editor has published it; null before that. The public client sees
// published analyses of published posts only (RLS on post_analyses), so a draft can't leak here
export const getPublishedAnalysis = cache(async (postId: string, slides: number): Promise<PostAnalysis | null> => {
  const { data, error } = await createPublicClient()
    .from("post_analyses")
    .select("creative_dna, published_at")
    .eq("post_id", postId)
    .not("published_at", "is", null)
    .maybeSingle();
  if (error) throw new Error(`Could not load the analysis of post ${postId} from Supabase: ${error.message}`);
  return data ? toAnalysis(data.creative_dna, slides) : null;
});
