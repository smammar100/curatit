// Checks that the Playbooks summaries read from four parts of each analysis come out exactly as
// they do from the whole Creative DNA, for every published analysis (two reads, read-only):
//   npx tsx scripts/perf/check-summaries.ts
export {};
process.loadEnvFile(".env.local");
const { readPublishedPosts } = await import("@/lib/posts");
const { readBreakdownSummaries } = await import("@/lib/creative/display");
const { toPublicAnalysis } = await import("@/lib/creative/publicAnalysis");
const { createPublicClient } = await import("@/utils/supabase/public");

const posts = await readPublishedPosts();
const images = new Map(posts.map((post) => [post.id, post.images.length]));
const narrow = await readBreakdownSummaries(posts);
const { data, error } = await createPublicClient()
  .from("post_analyses")
  .select("post_id, creative_dna, current_version_id, image_analysis_complete, expected_slides, processed_slides")
  .not("published_at", "is", null);
if (error) throw error;
let same = 0;
const differ: string[] = [];
for (const row of data ?? []) {
  const count = images.get(row.post_id);
  if (!count) continue;
  const view = toPublicAnalysis(row as never, [], count);
  const label = (name: string) => view?.labels.find((item) => item.label === name)?.value ?? null;
  const expected = view ? { headline: view.headline, type: label("Type"), hook: label("Hook") } : undefined;
  if (JSON.stringify(expected) === JSON.stringify(narrow[row.post_id])) same++;
  else differ.push(`${row.post_id}: ${JSON.stringify(expected)} vs ${JSON.stringify(narrow[row.post_id])}`);
}
console.log(`${same} summaries identical, ${differ.length} differ; ${Object.keys(narrow).length} from the narrow read`);
for (const line of differ.slice(0, 10)) console.log(`  ${line}`);
process.exitCode = differ.length ? 1 : 0;
