// curatit_get_post and curatit_get_carousel with the 3.0 analysis, the contract they're held to,
// and the input rules every tool shares. The fixture's analyses are stored Creative DNA, checked
// here against the pipeline's own schema, so what's tested is what the database holds.

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CreativeDna, SlideObservation } from "@/lib/creative/schema";
import { DataCheckSchema, SCHEMA_VERSION, SearchHitSchema, TOOLS, envelopeSchema } from "../contracts";
import { success } from "../envelope";
import { createFixtureCatalog, FIXTURE_IDS, FIXTURE_TAGGED } from "../repo/fixture";
import type { RawDetailAnalysis, RawPost } from "../repo/types";
import { toolOutputSchema } from "../tools";
import { getCarousel, getPost, publicAnalysisOf } from "./post";

const envelope = (data: unknown) => success("00000000-0000-4000-8000-000000000000", data, [], "2026.10.11-1");
const rawPost = async (id: string) => (await createFixtureCatalog().getPost(id))!;
const creativeOf = (post: RawPost) => post.creative as RawDetailAnalysis;

// A post as the catalog returned it before …_creative_mcp_analysis_v3: no DNA or slide records,
// and slide tags with 'unknown' in them
function beforeMigration(post: RawPost): RawPost {
  const { dna: _d, slide_records: _r, current_version_id: _v, expected_slides: _e, processed_slides: _p, strategy_headline: _h, strategy_summary: _s, tones: _t, persuasion: _q, cta: _c, ...old } = creativeOf(post);
  const slides = old.narrative!.slides.map((slide) => (slide.position === 1 ? { ...slide, role: "unknown", typography: ["unknown"], imagery: ["unknown", "screenshot-ui"] } : slide));
  return { ...post, creative: { ...old, narrative: { ...old.narrative!, slides } } as unknown as RawDetailAnalysis };
}

describe("the fixture", () => {
  it("holds analyses the pipeline would have stored", async () => {
    for (const id of [FIXTURE_IDS.carousel, FIXTURE_TAGGED.id]) {
      const creative = creativeOf(await rawPost(id));
      expect(CreativeDna.safeParse(creative.dna).error).toBeUndefined();
      for (const slide of creative.slide_records) expect(SlideObservation.safeParse(slide.observation).error).toBeUndefined();
    }
  });
});

describe("the get_post contract", () => {
  it("parses a post at summary and at full, with the envelope's schema version", async () => {
    const repo = createFixtureCatalog();
    for (const id of [FIXTURE_IDS.carousel, FIXTURE_IDS.single, FIXTURE_TAGGED.id]) {
      for (const detail_level of ["summary", "full"] as const) {
        const { data } = await getPost(repo, { post_id: id, detail_level });
        const parsed = toolOutputSchema("curatit_get_post").safeParse(envelope(data));
        expect(parsed.error).toBeUndefined();
      }
    }
    expect(SCHEMA_VERSION).toBe("1.1");
    expect(envelopeSchema(z.object({})).parse(envelope({})).schema_version).toBe("1.1");
  });

  it("publishes the 3.0 fields in its JSON Schema", () => {
    const schema = JSON.stringify(z.toJSONSchema(toolOutputSchema("curatit_get_post"), { io: "output", unrepresentable: "any" }));
    for (const field of ["strategy_headline", "decisions", "data_checks", "watch_out", "application", "colour_roles", "brief_markdown", "categories"]) expect(schema).toContain(`"${field}"`);
    expect(DataCheckSchema.shape.status.options).toEqual(["observed", "potential_concern", "cannot_verify"]);
  });

  it("still takes a search hit without the fields later changes fill", () => {
    const hit = {
      post_id: "1",
      short_code: "ABCDE",
      source_url: "https://www.instagram.com/p/ABCDE/",
      brand: { name: "B", slug: "b" },
      industry: null,
      format: "static",
      posted_at: null,
      caption_excerpt: "",
      thumbnail: { available: false, media_id: null, url: null },
      classification: null,
      analysis_available: false,
      match_reasons: [],
      score: null,
    };
    expect(SearchHitSchema.safeParse(hit).error).toBeUndefined();
    expect(SearchHitSchema.safeParse({ ...hit, categories: [{ name: "Finance", slug: "finance", main: true }], strategy_headline: null }).error).toBeUndefined();
  });
});

describe("the 3.0 analysis", () => {
  it("leads with the strategy, decisions with watch-outs and concerns first", async () => {
    const post = await rawPost(FIXTURE_IDS.carousel);
    const dna = creativeOf(post).dna as CreativeDna;
    const { data } = await getPost(createFixtureCatalog(), { post_id: FIXTURE_IDS.carousel });
    const analysis = data.post.analysis!;
    expect(analysis.strategy_headline).toBe(dna.strategy_headline);
    expect(analysis.strategy_summary).toBe(dna.strategy_summary);
    expect(analysis.creative_formula).toBe("Question → Side-by-side → Verdict");
    expect(analysis.decisions).toHaveLength(2);
    expect(analysis.decisions[0]).toMatchObject({ title: "Ask the question your audience already asks", watch_out: "A question that's too broad reads as bait.", confidence: "high", slides: [0, 1], slides_label: "Slides 1–2", on_caption: false });
    expect(analysis.decisions[1]).toMatchObject({ watch_out: null, slides: [1], slides_label: "Slide 2", on_caption: true });
    expect(analysis.data_checks.map((c) => c.status)).toEqual(["potential_concern", "cannot_verify"]);
    expect(analysis.data_checks[0]).toMatchObject({ aspect: "Comparison baseline", slides_label: "Slide 2" });
    expect(analysis.application).toEqual({ when_to_use: dna.application!.when_to_use, when_not_to_use: dna.application!.when_not_to_use });
    expect(analysis.caveats).toEqual(["Comparison claims need a source"]);
    expect(analysis.needs_review).toBe(true);
    expect(analysis.note).not.toMatch(/reviewed and approved by a Curatit editor/);
    expect(analysis.note).toMatch(/approved for publication by Curatit/);
    expect(JSON.stringify(analysis)).not.toMatch(/"verified"/);
    // The summary leaves the full sections out
    expect(analysis).not.toHaveProperty("slides");
    expect(analysis).not.toHaveProperty("brief_markdown");
    expect(data.post.categories).toEqual([{ name: "Finance", slug: "finance", main: true }]);
  });

  it("reads a 2.1 analysis's statuses and decisions the way the post page does", async () => {
    const { data } = await getPost(createFixtureCatalog(), { post_id: FIXTURE_TAGGED.id, detail_level: "full" });
    const analysis = data.post.analysis!;
    // Before 3.0 there's no strategy headline, so the concept leads
    expect(analysis.strategy_headline).toBe("One knit, three colours, shot flat on a plain ground.");
    expect(analysis.data_checks.map((c) => [c.aspect, c.status])).toEqual([
      ["Price", "potential_concern"],
      ["Colour accuracy", "cannot_verify"],
      ["Product shown", "observed"],
    ]);
    expect(analysis.data_checks[0]).toMatchObject({ slides: [], slides_label: null, on_caption: true });
    expect(analysis.data_checks[2]).toMatchObject({ slides: [0], slides_label: "Cover", on_caption: true });
    // The observation explains the decision, and "avoid when" becomes its watch-out
    expect(analysis.decisions[0]).toMatchObject({ explanation: "The three colourways sit folded side by side.", observation: null, watch_out: "Avoid it when there are too many variants to read at feed size." });
    expect(analysis.application).toEqual({ when_to_use: ["The product comes in a few colours worth comparing."], when_not_to_use: ["There are too many variants to read at feed size."] });
    expect(analysis.needs_review).toBe(false);
    expect(analysis.note).toBe("AI-drafted analysis, approved for publication by Curatit. Rationale is hypothesis, not measured performance.");
  });

  it("adds the visual notes, measured colours and the copy brief at full", async () => {
    const { data } = await getPost(createFixtureCatalog(), { post_id: FIXTURE_IDS.carousel, detail_level: "full" });
    const analysis = data.post.analysis!;
    expect(analysis.visual?.map((v) => v.dimension)).toEqual(["composition", "typography", "colour", "imagery", "devices", "branding"]);
    expect(analysis.visual?.find((v) => v.dimension === "devices")?.insight).toBe("Thin arrows lead from the question to the columns.");
    // Measured colours; a placeholder role is no role
    expect(analysis.colour_roles).toEqual([
      { hex: "#111111", role: null },
      { hex: "#f4f4f2", role: "Headline on the dark ground" },
    ]);
    expect(JSON.stringify(analysis.colour_roles)).not.toMatch(/cover sample/i);
    expect(analysis.copywriting).toMatch(/^Short questions/);
    // The same visual adaptation prompt the post page copies, with the stored images as public
    // URLs in stage order
    expect(analysis.brief_markdown).toMatch(/^# Instagram post — visual adaptation brief/);
    expect(analysis.brief_markdown).not.toMatch(/cover sample/i);
    expect(analysis.brief_markdown).toContain("https://storage.example/library/fixture/fixture-co/carousel/FIX00001/01.webp");
    expect(analysis.brief_markdown).toContain("https://storage.example/library/fixture/fixture-co/carousel/FIX00001/02.webp");
    expect(analysis.brief_markdown).toContain("https://www.instagram.com/p/FIX00001/");
  });

  it("gives each slide its role in words, copy, measured colours and changes, and flags a blank frame", async () => {
    const { data } = await getPost(createFixtureCatalog(), { post_id: FIXTURE_IDS.carousel, detail_level: "full" });
    const [cover, compare, blank] = data.post.analysis!.slides!;
    expect(cover).toMatchObject({ role: "Hook", headline: "Cash or card?", body: "We settled it.", legibility: "clear", colours: ["#111111", "#f4f4f2"], blank: false, typography: ["sans-serif"] });
    expect(compare).toMatchObject({ role: null, typography: [], layouts: ["framed-card", "list-stack"], legibility: "partial" });
    expect(compare.changes.length).toBeGreaterThan(0);
    expect(blank).toMatchObject({ slide_label: "Slide 3", blank: true, headline: null, colours: [], typography: [] });
  });

  it("pages the carousel with the same slide records", async () => {
    const repo = createFixtureCatalog();
    const page = await getCarousel(repo, { post_id: FIXTURE_IDS.carousel, start_slide: 1 });
    expect(TOOLS.curatit_get_carousel.output.safeParse(page.data).error).toBeUndefined();
    const [compare, blank] = page.data.slides;
    expect(compare.analysis).toMatchObject({ slide_index: 1, role: null, typography: [] });
    expect(blank.analysis).toMatchObject({ slide_index: 2, blank: true });
    expect(blank.was_video).toBe(true);
  });

  it("works from a catalog without the migration, leaving out what it can't build", async () => {
    const post = beforeMigration(await rawPost(FIXTURE_IDS.carousel));
    expect(publicAnalysisOf(post)).toBeNull();
    const repo = { ...createFixtureCatalog(), getPost: async () => post };
    const { data } = await getPost(repo, { post_id: FIXTURE_IDS.carousel, detail_level: "full" });
    expect(toolOutputSchema("curatit_get_post").safeParse(envelope(data)).error).toBeUndefined();
    const analysis = data.post.analysis!;
    expect(analysis).toMatchObject({ strategy_headline: "A side-by-side that makes the better option obvious.", decisions: [], data_checks: [], needs_review: true, brief_markdown: null, colour_roles: [] });
    expect(analysis.caveats).toEqual(["Comparison claims need a source"]);
    // The service drops what says nothing even when the catalog doesn't
    expect(analysis.slides![1]).toMatchObject({ role: null, typography: [], imagery: ["screenshot-ui"] });
    expect(analysis.slides![0].role).toBe("Hook");
    expect(data.post.classification).toMatchObject({ tones: [], persuasion: [], cta: null });
    const carousel = await getCarousel(repo, { post_id: FIXTURE_IDS.carousel, start_slide: 1, limit: 1 });
    expect(carousel.data.slides[0].analysis).toMatchObject({ role: null, typography: [] });
  });
});

describe("tool inputs", () => {
  const search = TOOLS.curatit_search_posts.input;
  const messages = (result: { error?: z.ZodError }) => (result.error?.issues ?? []).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");

  it("takes names, labels and synonyms as filter values", () => {
    const parsed = search.parse({ filters: { industries: ["Food & drink"], creative_approaches: ["product shot"], tones: ["Playful"] } });
    expect(parsed.filters).toEqual({ industries: ["Food & drink"], creative_approaches: ["product shot"], tones: ["Playful"] });
  });

  it("refuses what the database would refuse, with a reason", () => {
    expect(messages(search.safeParse({ query: "x".repeat(301) }))).toMatch(/300/);
    expect(search.safeParse({ query: "x".repeat(300) }).success).toBe(true);
    expect(messages(search.safeParse({ query: "cash\u0000card" }))).toMatch(/control character/);
    expect(messages(search.safeParse({ query: "cash \ud800" }))).toMatch(/unpaired surrogate/);
    expect(search.safeParse({ query: "line one\nline two\tand a tab" }).success).toBe(true);
    expect(messages(search.safeParse({ filters: { industries: ["a", "b"] } }))).toMatch(/takes one value/);
    expect(messages(search.safeParse({ filters: { tones: ["warm\u0007"] } }))).toMatch(/control character/);
    expect(messages(TOOLS.curatit_create_brief.input.safeParse({ objective: "Grow\u0007", audience: "y", reference_post_ids: ["ABCDE"] }))).toMatch(/objective: contains a control character/);
  });

  it("explains an unknown filter and a value sent as a string", () => {
    expect(messages(search.safeParse({ filters: { themes: ["x"] } }))).toBe('filters: Unrecognized filter "themes": not a filter. curatit_get_taxonomy lists the filters and names what isn\'t classified (theme, occasion).');
    expect(messages(search.safeParse({ filters: { industries: "finance" } }))).toBe('filters.industries: send a list, e.g. ["finance"]');
  });

  it("publishes the defaults without changing what parses", () => {
    // What tools/list and the OpenAPI document show (the SDK reads the standard JSON Schema)
    const published = search["~standard"].jsonSchema!.input({ target: "draft-2020-12" }) as { properties: Record<string, { default?: unknown; description?: string }> };
    expect(published.properties.limit.default).toBe(8);
    expect(published.properties.sort.default).toBe("relevance");
    expect(published.properties.query_mode.default).toBe("natural");
    expect(published.properties.filters.description).toContain('{"industries":["finance"],"formats":["carousel"],"hook_techniques":["question"]}');
    expect(search.parse({ query: "x" })).toEqual({ query: "x" });
    const carousel = z.toJSONSchema(TOOLS.curatit_get_carousel.input) as { properties: Record<string, { default?: unknown }> };
    expect(carousel.properties.start_slide.default).toBe(0);
    // No "prompt" format until the brief has a renderer of its own: refused, not quietly Markdown
    expect(TOOLS.curatit_create_brief.input.safeParse({ objective: "x", audience: "y", reference_post_ids: ["ABCDE"], output_format: "prompt" }).success).toBe(false);
  });
});
