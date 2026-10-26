import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { batchLoader, chunks } from "@/lib/batch";
import { shareInFlight } from "@/lib/inFlight";
import { getPublishedPosts, type LibraryPost } from "@/lib/posts";
import { createPublicClient } from "@/utils/supabase/public";
import { mentionsSlides, toPublicAnalysis, type AnalysisRecord, type PublicAnalysis, type SlideRecord } from "./publicAnalysis";

// Creative Intelligence on the post's detail page: reads the published analysis and its current
// version's slide records, and hands publicAnalysis.ts what it needs to build the compact view.
// Server only, and kept out of lib/posts.ts, which the homepage's client code imports, so the
// taxonomy never ships to the browser. The public client sees a published analysis of a
// published post only, and only the slide records of its current version (RLS on post_analyses
// and post_slide_analyses); versions, review notes and history aren't readable at all. The slides
// are still matched to the analysis's current version here, so two versions' "position 0" can
// never be mixed.
export type { PublicAnalysis } from "./publicAnalysis";

type AnalysisRow = AnalysisRecord & { post_id: string };
type SlideRow = SlideRecord & { post_id: string };
type AnalysisRows = { analysis: AnalysisRow; slides: SlideRecord[] };

// PostgREST answers at most 1,000 rows a request; longer lists are read a page at a time
const PAGE = 1000;

// The published analyses of these posts and their current slide records, 50 posts to a request
async function readAnalysisRows(client: SupabaseClient, postIds: string[]): Promise<Map<string, AnalysisRows>> {
  const found = new Map<string, AnalysisRows>();
  for (const ids of chunks(postIds, 50)) {
    const { data: analyses, error } = await client
      .from("post_analyses")
      .select("post_id, creative_dna, current_version_id, image_analysis_complete, expected_slides, processed_slides")
      .in("post_id", ids)
      .not("published_at", "is", null)
      .returns<AnalysisRow[]>();
    if (error) throw new Error(`Could not load the analyses of ${ids.length} posts from Supabase: ${error.message}`);
    // Slides only of posts with a published analysis
    const versioned = (analyses ?? []).filter((analysis) => analysis.current_version_id).map((analysis) => analysis.post_id);
    const slides = versioned.length ? await readSlideRows(client, versioned) : new Map<string, SlideRow[]>();
    for (const analysis of analyses ?? []) {
      const own = (slides.get(analysis.post_id) ?? []).filter((slide) => slide.version_id === analysis.current_version_id);
      found.set(analysis.post_id, { analysis, slides: analysis.current_version_id ? own : [] });
    }
  }
  return found;
}

async function readSlideRows(client: SupabaseClient, postIds: string[]): Promise<Map<string, SlideRow[]>> {
  const rows: SlideRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from("post_slide_analyses")
      .select("post_id, version_id, position, observation")
      .in("post_id", postIds)
      .order("post_id")
      .order("version_id")
      .order("position")
      .range(from, from + PAGE - 1)
      .returns<SlideRow[]>();
    if (error) throw new Error(`Could not load the slide analysis of ${postIds.length} posts from Supabase: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }
  return Map.groupBy(rows, (row) => row.post_id);
}

export async function readPublishedAnalysis(client: SupabaseClient, postId: string, images: number): Promise<PublicAnalysis | null> {
  const rows = (await readAnalysisRows(client, [postId])).get(postId);
  return rows ? toPublicAnalysis(rows.analysis, rows.slides, images) : null;
}

// Both reads below are kept in Next's data cache for an hour under this tag, so a build's pages
// and its workers share one read instead of making one each (until 2026-10-25 every dashboard
// page a build rendered downloaded every analysis's creative_dna, 1.72 MB, which was most of the
// project's Supabase egress). refreshPostPage expires the tag when an editor publishes or edits
export const BREAKDOWNS_TAG = "breakdowns";

// The post's analysis once an editor has published it; null before that. Post pages that render
// together, as in a build, share one read (batchLoader); a build made three requests a post until
// 2026-10-26
const analysisLoader = batchLoader((postIds: string[]) => readAnalysisRows(createPublicClient(), postIds));
export const getPublishedAnalysis = cache(
  unstable_cache(
    async (postId: string, images: number) => {
      const rows = await analysisLoader(postId);
      return rows ? toPublicAnalysis(rows.analysis, rows.slides, images) : null;
    },
    ["published-analysis"],
    { revalidate: 3600, tags: [BREAKDOWNS_TAG] },
  ),
);

// What the feed's Playbooks rows show of every post with a published breakdown: the strategy in a
// line, and the type of post and hook it was filed under, keyed by instagram_posts.id (a plain
// object, since the data cache stores JSON); each post's slide count, which the prose's slide
// numbers need, comes from the library
export type BreakdownSummary = { headline: string; type: string | null; hook: string | null };

export const getBreakdownSummaries = unstable_cache(shareInFlight(() => readBreakdownSummaries()), ["breakdown-summaries"], { revalidate: 3600, tags: [BREAKDOWNS_TAG] });

type SummaryRow = Omit<AnalysisRow, "creative_dna"> & { concept: string | null; strategy_headline: string | null; archetype: string | null; hook: string | null };

// Only the four parts of each analysis a summary shows, not its whole Creative DNA (1.7 MB for the
// library, read by every build worker and every hourly refresh until 2026-10-26). A headline that
// names a slide by number is renumbered from all of the analysis's prose, so those few analyses
// are read whole and built exactly as the post page builds them; the rest come out the same
// from the four parts alone (src/lib/creative/display.test.ts)
// `posts`: the library, when the caller has it (scripts/perf, outside Next's data cache)
export async function readBreakdownSummaries(posts?: LibraryPost[]): Promise<Record<string, BreakdownSummary>> {
  const images = new Map((posts ?? (await getPublishedPosts())).map((post) => [post.id, post.images.length]));
  const client = createPublicClient();
  const rows: SummaryRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from("post_analyses")
      .select(
        "post_id, current_version_id, image_analysis_complete, expected_slides, processed_slides, concept:creative_dna->>concept, strategy_headline:creative_dna->>strategy_headline, archetype:creative_dna->primary_archetype->>slug, hook:creative_dna->hook->>technique",
      )
      .not("published_at", "is", null)
      .order("post_id")
      .range(from, from + PAGE - 1)
      .returns<SummaryRow[]>();
    if (error) throw new Error(`Could not load the published breakdowns from Supabase: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }

  const whole = rows.filter((row) => images.get(row.post_id) && (mentionsSlides(row.strategy_headline) || mentionsSlides(row.concept))).map((row) => row.post_id);
  const full = whole.length ? await readAnalysisRows(client, whole) : new Map<string, AnalysisRows>();
  const summaries: Record<string, BreakdownSummary> = {};
  for (const row of rows) {
    const count = images.get(row.post_id);
    if (!count) continue;
    const { concept, strategy_headline, archetype, hook, ...record } = row;
    const analysis = full.get(row.post_id)?.analysis ?? { ...record, creative_dna: summaryDna({ concept, strategy_headline, archetype, hook }) };
    const view = toPublicAnalysis(analysis, [], count);
    if (!view) continue;
    const label = (name: string) => view.labels.find((item) => item.label === name)?.value ?? null;
    summaries[row.post_id] = { headline: view.headline, type: label("Type"), hook: label("Hook") };
  }
  return summaries;
}

// The four parts of a Creative DNA a summary reads, in the DNA's own shape
export function summaryDna(parts: { concept: string | null; strategy_headline: string | null; archetype: string | null; hook: string | null }) {
  return {
    ...(parts.concept != null && { concept: parts.concept }),
    ...(parts.strategy_headline != null && { strategy_headline: parts.strategy_headline }),
    ...(parts.archetype != null && { primary_archetype: { slug: parts.archetype } }),
    ...(parts.hook != null && { hook: { technique: parts.hook } }),
  };
}
