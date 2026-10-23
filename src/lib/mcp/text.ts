// What a host that reads only a tool's text content sees. MCP results carry the envelope as
// structured content too, but some hosts show the model the text alone, so the text has to hold
// what matters: warnings first, every category a post is in, and the published analysis as the
// post page reads (strategy, decisions with what each risks, data checks, when to use the idea),
// in a few thousand characters at most. Nothing here is new data; it's the envelope, in words.

import type { AnalysisFull, CarouselOutputT, PostCategory, PostOutputT, SearchOutputT } from "./contracts";

// Room for the analysis without crowding out the rest of a conversation
export const POST_TEXT_MAX = 4_000;

// The warnings, ahead of everything else, so a reader can't miss them
export function withWarnings(warnings: string[], text: string) {
  return warnings.length ? `Warnings: ${warnings.join(" ")}\n${text}` : text;
}

// Every category, the main one first, tags marked: "Shopping; tagged Lifestyle"
export function categoriesText(categories: PostCategory[] | undefined, industry: { name: string } | null) {
  const main = (categories ?? []).filter((c) => c.main).map((c) => c.name);
  const tags = (categories ?? []).filter((c) => !c.main).map((c) => c.name);
  const first = main.length ? main.join(", ") : (industry?.name ?? "no category");
  return tags.length ? `${first}; tagged ${tags.join(", ")}` : first;
}

const day = (iso: string | null | undefined) => iso?.slice(0, 10) ?? "undated";
const sentence = (text: string) => text.trim().replace(/[.!?]?$/, (end) => end || ".");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Lines in order until the budget is spent, then a pointer to the rest. `tail` always fits: it's
// what a reader most needs to see last (the analysis's note, what's missing)
function fit(lines: string[], tail: string[], max: number) {
  const out: string[] = [];
  let used = tail.reduce((n, line) => n + line.length + 1, 0);
  for (const line of lines.filter(Boolean)) {
    if (used + line.length + 1 > max - 60) {
      out.push("… more in the structured result.");
      break;
    }
    out.push(line);
    used += line.length + 1;
  }
  return [...out, ...tail.filter(Boolean)].join("\n");
}

const CHECK_WORDS = {
  potential_concern: { one: "potential concern", many: "potential concerns", label: "Potential concern" },
  observed: { one: "observation", many: "observations", label: "Observation" },
  cannot_verify: { one: "cannot verify", many: "cannot verify", label: "Cannot verify" },
} as const;

const VISUAL_WORDS: Record<NonNullable<AnalysisFull["visual"]>[number]["dimension"], string> = {
  composition: "Composition",
  typography: "Typography",
  colour: "Colour",
  imagery: "Imagery",
  devices: "Visual devices",
  branding: "Branding & consistency",
};

// The analysis as the post page reads it, summary sections always and the visual notes at full
function analysisLines(a: AnalysisFull, full: boolean): string[] {
  const lines = [`Strategy: ${a.strategy_headline}`];
  if (a.strategy_summary) lines.push(a.strategy_summary);
  if (a.creative_formula) lines.push(`Formula: ${a.creative_formula}`);
  if (a.decisions.length) {
    lines.push("Key creative decisions:");
    a.decisions.forEach((d, i) => {
      const where = d.slides_label ? ` (${d.slides_label}${d.on_caption ? ", caption" : ""})` : d.on_caption ? " (caption)" : "";
      lines.push(`${i + 1}. ${d.title.replace(/\.$/, "")}${where}.${d.watch_out ? ` Watch out: ${sentence(d.watch_out)}` : ""}`);
    });
  }
  if (a.data_checks.length) {
    const kinds = (["potential_concern", "observed", "cannot_verify"] as const).filter((k) => a.data_checks.some((c) => c.status === k));
    lines.push(`Data checks: ${kinds.map((k) => plural(a.data_checks.filter((c) => c.status === k).length, CHECK_WORDS[k].one, CHECK_WORDS[k].many)).join(" · ")}. No figure was checked against its sources.`);
    for (const k of ["potential_concern", "cannot_verify"] as const) {
      for (const c of a.data_checks.filter((check) => check.status === k)) lines.push(`- ${CHECK_WORDS[k].label} (${c.aspect}${c.slides_label ? `, ${c.slides_label}` : ""}): ${sentence(c.note)}`);
    }
  }
  if (a.application.when_to_use.length) lines.push(`Use it when: ${a.application.when_to_use.map((s) => s.replace(/\.$/, "")).join("; ")}.`);
  if (a.application.when_not_to_use.length) lines.push(`Not when: ${a.application.when_not_to_use.map((s) => s.replace(/\.$/, "")).join("; ")}.`);
  if (full) {
    const visual = (a.visual ?? []).filter((v) => v.insight || v.attributes.length);
    if (visual.length) {
      lines.push("Visual:");
      for (const v of visual) {
        const attributes = v.attributes.join(", ");
        lines.push(`- ${VISUAL_WORDS[v.dimension]}: ${v.insight ? `${sentence(v.insight)}${attributes ? ` (${attributes})` : ""}` : attributes}`);
      }
    }
    if (a.brief_markdown) lines.push("A copy brief for any LLM is in analysis.brief_markdown.");
  }
  return lines;
}

export function postText(post: PostOutputT["post"], full: boolean): string {
  const caption = post.caption.text;
  const head = [
    `${post.brand.name} (${categoriesText(post.categories, post.industry)}), ${post.format}, posted ${day(post.posted_at)}: ${post.source_url}`,
    `Caption: ${caption.slice(0, 300)}${post.caption.truncated || caption.length > 300 ? "…" : ""}`,
    `Counts: ${post.metrics.likes ?? "not available"} likes, ${post.metrics.comments ?? "not available"} comments, collected ${post.metrics.observed_at?.slice(0, 10) ?? "at an unknown time"}.`,
    `Media: ${plural(post.media.length, "slide", "slides")} (${post.media.map((m) => m.media_id).join(", ")}).`,
  ];
  const a = post.analysis;
  const body = a ? analysisLines(a, full) : ["No published analysis yet."];
  const tail = [a ? a.note : "", post.missing.length ? `Missing: ${post.missing.join("; ")}` : ""];
  return fit([...head, ...body], tail, POST_TEXT_MAX);
}

export function searchText(data: SearchOutputT): string {
  const n = data.posts.length;
  const head = n ? `${plural(n, "post", "posts")}${data.next_cursor ? " (more with next_cursor)" : ""}:` : "No posts matched.";
  const lines = data.posts.flatMap((p, i) => [
    `${i + 1}. ${p.brand.name} (${categoriesText(p.categories, p.industry)}), ${p.format}, ${day(p.posted_at)} [post_id ${p.post_id}${p.analysis_available ? ", analysed" : ""}]`,
    ...(p.strategy_headline ? [`   Strategy: ${p.strategy_headline}`] : []),
    `   Caption: "${p.caption_excerpt.slice(0, 120)}${p.caption_excerpt.length > 120 ? "…" : ""}"`,
    ...(p.match_reasons.length ? [`   Matched: ${p.match_reasons.slice(0, 2).join("; ")}`] : []),
  ]);
  const tail = data.suggestions.length ? [`Suggestions: ${data.suggestions.join(" ")}`] : [];
  const interpretation = data.applied.query_mode === "natural" ? [
    `Interpreted search: ${Object.entries(data.applied.filters).map(([key, values]) => `${key}=${values.join(", ")}`).join("; ") || "no filters"}; keywords=${data.applied.query ?? "none"}.`,
  ] : [];
  const refinements = (data.suggested_queries ?? []).map((item) => `${item.label}: ${JSON.stringify(item.query)}`);
  return [head, ...interpretation, ...lines, ...tail, ...refinements].join("\n");
}

// Instagram's automatic alt text ("Photo by Brand on May 1, 2026…") says nothing about the slide
const AUTO_ALT = /^Photo (shared )?by .* on /;

export function carouselText(data: CarouselOutputT): string {
  const lines = data.slides.map((s) => {
    const a = s.analysis;
    const alt = s.alt_text && !AUTO_ALT.test(s.alt_text) ? s.alt_text : null;
    const what = a?.blank ? "Blank frame" : a?.headline ? `"${a.headline}"` : (a?.observation ?? alt ?? "no text recorded");
    return `${s.slide_label}${s.was_video ? " (video cover)" : ""}: ${what}${a?.role ? ` — ${a.role}` : ""} [${s.media_id}]`;
  });
  const next = data.next_start !== null ? `\nNext page: start_slide ${data.next_start}` : "";
  return `${data.short_code}: ${plural(data.total_slides, "slide", "slides")}, ${data.slides_analysed} analysed.\n${lines.join("\n")}${next}`;
}
