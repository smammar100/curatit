import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { readPublishedAnalysis, summaryDna } from "./display";
import { mentionsSlides, toPublicAnalysis } from "./publicAnalysis";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION } from "./fixtures";

// A stand-in for the Supabase client that records each query's filters and answers from tables
// in memory, applying the same eq / in / not-null filters the real database would
function fakeClient(tables: Record<string, Record<string, unknown>[]>) {
  const queries: { table: string; filters: [string, unknown][] }[] = [];
  const client = {
    from(table: string) {
      const query = { table, filters: [] as [string, unknown][] };
      queries.push(query);
      const rows = () =>
        (tables[table] ?? []).filter((row) =>
          query.filters.every(([column, value]) => (value === "not-null" ? row[column] != null : Array.isArray(value) ? value.includes(row[column]) : row[column] === value)),
        );
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => (query.filters.push([column, value]), builder),
        in: (column: string, values: unknown[]) => (query.filters.push([column, values]), builder),
        not: (column: string) => (query.filters.push([column, "not-null"]), builder),
        order: () => builder,
        range: () => builder,
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
    // The post's published analysis, then its slides; the version is matched here (RLS also hides old ones)
    expect(queries.find((q) => q.table === "post_analyses")!.filters).toEqual([["post_id", ["p1"]], ["published_at", "not-null"]]);
    expect(queries.find((q) => q.table === "post_slide_analyses")!.filters).toEqual([["post_id", ["p1"]]]);
  });

  it("returns nothing for a post without a published analysis, and reads no slides for it", async () => {
    const { client, queries } = fakeClient({ post_analyses: [analysisRow(false)] });
    expect(await readPublishedAnalysis(client, "p1", 3)).toBeNull();
    expect(queries.map((q) => q.table)).toEqual(["post_analyses"]);
  });
});

describe("Playbooks summaries", () => {
  it("come out the same from four parts of an analysis as from the whole of it", () => {
    const whole = { creative_dna: FIXTURE_DNA, current_version_id: "v2", image_analysis_complete: true, expected_slides: 3, processed_slides: 3 };
    const dna = FIXTURE_DNA as unknown as { concept: string; strategy_headline?: string; primary_archetype?: { slug: string }; hook?: { technique: string } };
    const parts = summaryDna({ concept: dna.concept, strategy_headline: dna.strategy_headline ?? null, archetype: dna.primary_archetype?.slug ?? null, hook: dna.hook?.technique ?? null });
    const pick = (view: ReturnType<typeof toPublicAnalysis>) => ({ headline: view!.headline, labels: view!.labels.filter((l) => l.label === "Type" || l.label === "Hook").map((l) => l.value) });
    expect(mentionsSlides(dna.strategy_headline) || mentionsSlides(dna.concept)).toBe(false);
    expect(pick(toPublicAnalysis({ ...whole, creative_dna: parts }, [], 3))).toEqual(pick(toPublicAnalysis(whole, [], 3)));
  });

  it("read a headline that names a slide whole, since its number depends on all the prose", () => {
    expect(mentionsSlides("The offer lands on slide 3")).toBe(true);
    expect(mentionsSlides("Slides 0 to 5 build the story")).toBe(true);
    expect(mentionsSlides("Three steps to a 5% raise")).toBe(false);
    expect(mentionsSlides(null)).toBe(false);
  });
});
