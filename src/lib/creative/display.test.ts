import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { readPublishedAnalysis } from "./display";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION } from "./fixtures";

// A stand-in for the Supabase client that records each query's filters and answers from tables
// in memory, applying the same eq / not-null filters the real database would
function fakeClient(tables: Record<string, Record<string, unknown>[]>) {
  const queries: { table: string; filters: [string, unknown][] }[] = [];
  const client = {
    from(table: string) {
      const query = { table, filters: [] as [string, unknown][] };
      queries.push(query);
      const rows = () =>
        (tables[table] ?? []).filter((row) => query.filters.every(([column, value]) => (value === "not-null" ? row[column] != null : row[column] === value)));
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => (query.filters.push([column, value]), builder),
        not: (column: string) => (query.filters.push([column, "not-null"]), builder),
        order: () => builder,
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        returns: async () => ({ data: rows().sort((a, b) => (a.position as number) - (b.position as number)), error: null }),
      };
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, queries };
}

const analysisRow = (published: boolean) => ({
  post_id: "p1",
  creative_dna: FIXTURE_DNA,
  current_version_id: "v2",
  published_at: published ? "2026-10-11T15:00:00Z" : null,
  image_analysis_complete: true,
  expected_slides: 3,
  processed_slides: 3,
});

describe("readPublishedAnalysis", () => {
  it("reads only the published analysis's current version of each slide", async () => {
    const old = clone(FIXTURE_PERCEPTION.slides).map((slide) => ({ version_id: "v1", post_id: "p1", position: slide.position, observation: { ...slide, observation: "OLD" } }));
    const current = clone(FIXTURE_PERCEPTION.slides).map((slide) => ({ version_id: "v2", post_id: "p1", position: slide.position, observation: slide }));
    const { client, queries } = fakeClient({ post_analyses: [analysisRow(true)], post_slide_analyses: [...old, ...current] });
    const analysis = await readPublishedAnalysis(client, "p1", 3);
    expect(analysis!.slides.map((slide) => slide!.observation)).toEqual(FIXTURE_PERCEPTION.slides.map((slide) => slide.observation));
    expect(queries.find((q) => q.table === "post_analyses")!.filters).toEqual([["post_id", "p1"], ["published_at", "not-null"]]);
    expect(queries.find((q) => q.table === "post_slide_analyses")!.filters).toEqual([["post_id", "p1"], ["version_id", "v2"]]);
  });

  it("returns nothing for a post without a published analysis, and reads no slides for it", async () => {
    const { client, queries } = fakeClient({ post_analyses: [analysisRow(false)] });
    expect(await readPublishedAnalysis(client, "p1", 3)).toBeNull();
    expect(queries.map((q) => q.table)).toEqual(["post_analyses"]);
  });
});
