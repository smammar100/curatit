import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { shareInFlight } from "@/lib/inFlight";
import { getPublishedPosts } from "@/lib/posts";
import { createPublicClient } from "@/utils/supabase/public";
import { toPublicAnalysis, type AnalysisRecord, type PublicAnalysis, type SlideRecord } from "./publicAnalysis";

// Creative Intelligence on the post's detail page: reads the published analysis and its current
// version's slide records, and hands publicAnalysis.ts what it needs to build the compact view.
// Server only, and kept out of lib/posts.ts, which the homepage's client code imports, so the
// taxonomy never ships to the browser. The public client sees a published analysis of a
// published post only, and only the slide records of its current version (RLS on post_analyses
// and post_slide_analyses); versions, review notes and history aren't readable at all. The slide
// query still names the version, so two versions' "position 0" can never be mixed.
export type { PublicAnalysis } from "./publicAnalysis";

export async function readPublishedAnalysis(client: SupabaseClient, postId: string, images: number): Promise<PublicAnalysis | null> {
  const { data: analysis, error } = await client
    .from("post_analyses")
    .select("creative_dna, current_version_id, image_analysis_complete, expected_slides, processed_slides")
    .eq("post_id", postId)
    .not("published_at", "is", null)
    .maybeSingle<AnalysisRecord>();
  if (error) throw new Error(`Could not load the analysis of post ${postId} from Supabase: ${error.message}`);
  if (!analysis) return null;

  let slides: SlideRecord[] = [];
  if (analysis.current_version_id) {
    const { data, error: slideError } = await client
      .from("post_slide_analyses")
      .select("version_id, position, observation")
      .eq("post_id", postId)
      .eq("version_id", analysis.current_version_id)
      .order("position")
      .returns<SlideRecord[]>();
    if (slideError) throw new Error(`Could not load the slide analysis of post ${postId} from Supabase: ${slideError.message}`);
    slides = data ?? [];
  }
  return toPublicAnalysis(analysis, slides, images);
}

// Both reads below are kept in Next's data cache for an hour under this tag, so a build's pages
// and its workers share one read instead of making one each (until 2026-10-25 every dashboard
// page a build rendered downloaded every analysis's creative_dna, 1.72 MB, which was most of the
// project's Supabase egress). refreshPostPage expires the tag when an editor publishes or edits
export const BREAKDOWNS_TAG = "breakdowns";

// The post's analysis once an editor has published it; null before that
export const getPublishedAnalysis = cache(
  unstable_cache((postId: string, images: number) => readPublishedAnalysis(createPublicClient(), postId, images), ["published-analysis"], {
    revalidate: 3600,
    tags: [BREAKDOWNS_TAG],
  }),
);

// What the feed's Playbooks rows show of every post with a published breakdown: the strategy in a
// line, and the type of post and hook it was filed under. One read for the whole library, keyed by
// instagram_posts.id (a plain object, since the data cache stores JSON); each post's slide count,
// which the prose's slide numbers need, comes from the library
export type BreakdownSummary = { headline: string; type: string | null; hook: string | null };

export const getBreakdownSummaries = unstable_cache(shareInFlight(readBreakdownSummaries), ["breakdown-summaries"], { revalidate: 3600, tags: [BREAKDOWNS_TAG] });

async function readBreakdownSummaries(): Promise<Record<string, BreakdownSummary>> {
  const images = new Map((await getPublishedPosts()).map((post) => [post.id, post.images.length]));
  const { data, error } = await createPublicClient()
    .from("post_analyses")
    .select("post_id, creative_dna, current_version_id, image_analysis_complete, expected_slides, processed_slides")
    .not("published_at", "is", null)
    .returns<(AnalysisRecord & { post_id: string })[]>();
  if (error) throw new Error(`Could not load the published breakdowns from Supabase: ${error.message}`);
  const summaries: Record<string, BreakdownSummary> = {};
  for (const row of data ?? []) {
    const count = images.get(row.post_id);
    if (!count) continue;
    const view = toPublicAnalysis(row, [], count);
    if (!view) continue;
    const label = (name: string) => view.labels.find((item) => item.label === name)?.value ?? null;
    summaries[row.post_id] = { headline: view.headline, type: label("Type"), hook: label("Hook") };
  }
  return summaries;
}
