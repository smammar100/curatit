// curatit_create_brief: an original creative brief grounded in one to eight catalog posts.
// Assembled deterministically from stored, editor-approved analysis and a template: no model
// runs, nothing is invented, and what's observed (on-slide text, labels, slide roles) stays
// separate from what's inferred (the analysis's hypotheses) and from what's recommended (the
// brief's proposals). A reference without a published analysis contributes only what can be
// seen: its caption, alt text and format, and the brief says so under missing evidence.

import type { Brief, BriefInputT, BriefOutputT } from "../contracts";
import { invalid } from "../errors";
import type { CatalogRepository, RawDetailAnalysis, RawPost } from "../repo/types";
import { brandOf, excerpt, hasAnalysis, loadPost, slideLabel } from "./shared";

type Reference = { post: RawPost; creative: RawDetailAnalysis | null; slides: number };

const uniq = (items: (string | null | undefined)[]) => [...new Set(items.filter((s): s is string => Boolean(s && s.trim())))];
const words = (slug: string) => slug.replace(/[-_]/g, " ");

function top(values: string[], n: number) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([v]) => v);
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

// What the constraints say about size, if they say it at all
function production(constraints: string | undefined, formats: string[], slides: number[]) {
  const ratio = constraints?.match(/\b(\d{1,2}:\d{1,2})\b/)?.[1] ?? null;
  const marginMatch = constraints?.match(/([^.]*\b(safe|margin)[^.]*)/i)?.[1]?.trim() ?? null;
  const carousel = formats.includes("carousel");
  const slideCount = carousel && slides.length ? Math.round(slides.reduce((a, b) => a + b, 0) / slides.length) : null;
  return {
    aspect_ratio: ratio,
    safe_margins: marginMatch,
    format: carousel ? "Instagram carousel" : "Instagram single image",
    slides: slideCount,
  };
}

export async function createBrief(repo: CatalogRepository, input: BriefInputT): Promise<{ data: BriefOutputT; warnings: string[]; taxonomyVersion: string | null }> {
  const ids = uniq(input.reference_post_ids);
  const refs: Reference[] = [];
  for (const id of ids) {
    const post = await loadPost(repo, id);
    refs.push({ post, creative: hasAnalysis(post.creative) ? post.creative : null, slides: post.images.length });
  }
  if (!refs.length) throw invalid("Give at least one reference post id.");
  const warnings: string[] = [];
  const analysed = refs.filter((r) => r.creative);
  if (!analysed.length) warnings.push("None of the references has a published analysis yet, so the brief rests on captions, alt text and formats only.");

  const observations: Brief["observations"] = refs.map(({ post, creative, slides }) => {
    const observed: string[] = [];
    observed.push(`${post.format === "carousel" ? `A ${slides}-slide carousel` : "A single image"} by ${brandOf(post).name}${post.posted_at ? `, posted ${post.posted_at.slice(0, 10)}` : ""}.`);
    if (post.caption) observed.push(`Caption opens: "${excerpt(post.caption, 140)}"`);
    if (post.alt) observed.push(`Alt text: ${excerpt(post.alt, 160)}`);
    const inferred: string[] = [];
    if (creative) {
      for (const s of creative.narrative?.slides ?? []) {
        if (s.headline) observed.push(`${slideLabel(s.position, slides)}${s.role ? ` (${words(s.role)})` : ""}: "${excerpt(s.headline, 120)}"`);
      }
      for (const e of creative.analysis_evidence ?? []) {
        if (e.quote) observed.push(`${e.ref.replace(/^slide:(\d+)$/, (_, n) => slideLabel(Number(n), slides))}: "${excerpt(e.quote, 120)}"`);
        else if (e.observation) observed.push(`${e.ref}: ${excerpt(e.observation, 160)}`);
      }
      const labels = [
        creative.primary_type && `approach: ${words(creative.primary_type)}`,
        creative.objective && `goal: ${words(creative.objective)}`,
        creative.hook_technique && `hook: ${words(creative.hook_technique)}`,
        creative.narrative_pattern && `narrative: ${words(creative.narrative_pattern)}`,
        creative.typography_categories?.length && `typography: ${creative.typography_categories.map(words).join(", ")}`,
        creative.layout_tags?.length && `layout: ${creative.layout_tags.map(words).join(", ")}`,
        creative.visual_styles?.length && `imagery: ${creative.visual_styles.map(words).join(", ")}`,
        creative.palette?.length && `palette: ${creative.palette.map(words).join(", ")}`,
      ].filter((s): s is string => typeof s === "string");
      if (labels.length) observed.push(`Editor-approved labels: ${labels.join("; ")}.`);
      if (creative.concept) inferred.push(creative.concept);
      for (const h of creative.why_it_might_work ?? []) inferred.push(`${h.hypothesis}${h.evidence?.length ? ` (evidence: ${h.evidence.slice(0, 2).join("; ")})` : ""}`);
      for (const t of creative.takeaways ?? []) inferred.push(t);
    } else {
      inferred.push("No published analysis: nothing is inferred about its layout or typography from the caption alone.");
    }
    return { post_id: post.id, observed: uniq(observed), inferred: uniq(inferred) };
  });

  const principles = uniq([...analysed.flatMap((r) => r.creative!.takeaways ?? []), ...analysed.map((r) => r.creative!.concept)]).slice(0, 6);
  const approaches = top(uniq(analysed.map((r) => r.creative!.primary_type)), 2).map(words);
  const hooks = uniq(analysed.map((r) => r.creative!.hook?.technique ?? r.creative!.hook_technique)).map(words);
  const narratives = uniq(analysed.map((r) => r.creative!.narrative?.pattern ?? r.creative!.narrative_pattern)).map(words);
  const typography = top(analysed.flatMap((r) => r.creative!.typography_categories ?? []), 3).map(words);
  const layouts = top(analysed.flatMap((r) => r.creative!.layout_tags ?? []), 4).map(words);
  const imagery = top(analysed.flatMap((r) => r.creative!.visual_styles ?? []), 3).map(words);
  const palettes = top(analysed.flatMap((r) => r.creative!.palette ?? []), 3).map(words);
  const copy = uniq(analysed.flatMap((r) => stringList(r.creative!.copy_strategy)));
  const attention = uniq(analysed.flatMap((r) => stringList(r.creative!.attention_mechanisms)));
  const adaptations = uniq(analysed.flatMap((r) => stringList(r.creative!.adaptation_ideas)));
  const caveats = uniq(analysed.flatMap((r) => stringList(r.creative!.constraints_or_uncertainties)));
  const formats = refs.map((r) => r.post.format);
  const prod = production(input.constraints, formats, refs.filter((r) => r.post.format === "carousel").map((r) => r.slides));

  const concept: Brief["concept"] = {
    proposal: [
      `An original ${prod.format.toLowerCase()} for ${input.audience.trim()} that ${input.objective.trim().replace(/\.$/, "")}.`,
      approaches.length ? `Recommended approach: ${approaches.join(" or ")}${hooks.length ? `, opening with a ${hooks[0]} hook` : ""}.` : "Recommended approach: open on the one thing the audience most needs to know, then earn the rest.",
      narratives.length && prod.format.includes("carousel") ? `Sequence the slides as a ${narratives[0]} narrative.` : null,
    ]
      .filter(Boolean)
      .join(" "),
    built_on: principles.length ? principles : ["The references' formats and captions only; no analysed principles were available."],
  };

  const copyDirections: Brief["copy_directions"] = {
    headline: uniq([
      hooks.length ? `Lead with a ${hooks[0]} hook stated in your own words.` : "Lead with the audience's problem or payoff in one line.",
      `Say what the piece does for ${input.audience.trim()} before saying what you are.`,
      ...copy.slice(0, 2).map((c) => `Reference copy strategy (adapt, don't copy): ${c}`),
    ]),
    supporting: uniq([
      "One idea per line; cut anything that doesn't move the reader to the next slide or the call to action.",
      ...attention.slice(0, 2).map((a) => `Keep attention with: ${a}`),
      "Close with a call to action that matches the objective, not a generic one.",
    ]),
  };

  const design: Brief["design_guidance"] = {
    layout: uniq([...layouts.map((l) => `Reference layout pattern: ${l} (use the pattern, not the composition).`), "Keep one focal point per slide; let the rest recede."]),
    hierarchy: uniq(["Headline first, then one supporting line, then the mark. Never three equal weights.", prod.format.includes("carousel") ? "Each slide answers one question; the last one carries the action." : "The single image must read at thumbnail size."]),
    typography: uniq([...typography.map((t) => `Reference typography category: ${t}; choose your own typeface in that spirit.`), "Two sizes do most of the work: large for the hook, small for support."]),
    colour: uniq([...palettes.map((p) => `Reference palette character: ${p}; build it from your own brand colours, never the reference's values.`), "Enough contrast for text to pass at small sizes."]),
    imagery: uniq([...imagery.map((i) => `Reference imagery: ${i}; shoot or make your own.`), "No stock that looks like stock; no reproduction of the references' images or marks."]),
    spacing: uniq(["Generous margins; the content-safe area clear of Instagram's UI (bottom caption band, right-hand actions).", prod.safe_margins ? `Requested: ${prod.safe_margins}` : null]),
  };

  const adapt: Brief["adapt"] = {
    take: uniq([...principles.slice(0, 4), ...adaptations.slice(0, 2)]),
    do_not_copy: uniq([
      "The references' words, headlines, images, logos, marks or colour codes.",
      "Their data, claims or disclaimers: use your own, accurate and legible.",
      ...caveats.slice(0, 2),
    ]),
  };

  const missing = uniq([
    ...refs.filter((r) => !r.creative).map((r) => `${r.post.short_code}: no published analysis; only its caption and format were used.`),
    ...analysed.filter((r) => !r.creative!.image_analysis_complete).map((r) => `${r.post.short_code}: the analysis didn't cover every slide.`),
    !input.brand_context ? "No brand_context was given, so the brief can't speak to your identity or voice." : null,
    !prod.aspect_ratio ? "No aspect ratio in constraints; 4:5 is Instagram's tallest feed ratio." : null,
  ]);
  const share = analysed.length / refs.length;
  const confidence = share === 1 ? "Every reference has an editor-approved analysis; the inferences are its hypotheses, not measured performance." : share > 0 ? `${analysed.length} of ${refs.length} references have a published analysis; the rest add observed facts only.` : "Low: no reference has a published analysis, so nothing about layout or typography is substantiated.";

  const generationPrompt = [
    `Create an original ${prod.format.toLowerCase()}${prod.slides ? ` of about ${prod.slides} slides` : ""}${prod.aspect_ratio ? ` at ${prod.aspect_ratio}` : ""} for ${input.audience.trim()}.`,
    `Objective: ${input.objective.trim()}`,
    input.brand_context ? `Brand: ${input.brand_context.trim()}` : null,
    approaches.length ? `Approach: ${approaches.join(" or ")}.` : null,
    hooks.length ? `Open with a ${hooks[0]} hook.` : null,
    narratives.length && prod.slides ? `Narrative: ${narratives[0]}.` : null,
    typography.length ? `Typography in the spirit of: ${typography.join(", ")}.` : null,
    layouts.length ? `Layout patterns: ${layouts.join(", ")}.` : null,
    imagery.length ? `Imagery: ${imagery.join(", ")}, original.` : null,
    palettes.length ? `Palette character: ${palettes.join(", ")}, in the brand's own colours.` : null,
    input.constraints ? `Constraints: ${input.constraints.trim()}` : null,
    "Use only original words, images and marks. Keep any data, sources and disclosures accurate and legible.",
  ]
    .filter(Boolean)
    .join("\n");

  const brief: Brief = {
    objective: input.objective.trim(),
    audience: input.audience.trim(),
    references: refs.map(({ post, creative }) => ({
      post_id: post.id,
      short_code: post.short_code,
      source_url: post.source_url,
      brand: brandOf(post).name,
      format: post.format,
      analysis_available: Boolean(creative),
    })),
    observations,
    concept,
    copy_directions: copyDirections,
    design_guidance: design,
    production: prod,
    adapt,
    limitations: { missing_evidence: missing, confidence },
    generation_prompt: generationPrompt,
  };
  const format = input.output_format ?? "markdown";
  return {
    // A prompt is rendered as the Markdown brief until the brief has its own prompt renderer
    data: { brief, text: renderBrief(brief, format === "prompt" ? "markdown" : format), output_format: format, method: "deterministic_template" },
    warnings,
    taxonomyVersion: analysed[0]?.creative?.taxonomy_version ?? null,
  };
}

export function renderBrief(brief: Brief, format: "markdown" | "json" | "text") {
  if (format === "json") return JSON.stringify(brief, null, 2);
  const md = format === "markdown";
  const h = (t: string) => (md ? `## ${t}` : t.toUpperCase());
  const li = (items: string[]) => items.map((i) => `- ${i}`);
  const lines: string[] = [md ? "# Creative brief" : "CREATIVE BRIEF", ""];
  lines.push(h("Objective and audience"), brief.objective, `Audience: ${brief.audience}`, "");
  lines.push(h("References"), ...brief.references.map((r) => `- ${r.brand}, ${r.format}, ${r.source_url}${r.analysis_available ? "" : " (no published analysis)"}`), "");
  lines.push(h("What the references show"));
  for (const o of brief.observations) {
    const ref = brief.references.find((r) => r.post_id === o.post_id);
    lines.push(md ? `### ${ref?.brand ?? o.post_id}` : `${ref?.brand ?? o.post_id}:`, "Observed:", ...li(o.observed), "Inferred:", ...li(o.inferred), "");
  }
  lines.push(h("Proposed concept"), brief.concept.proposal, "Built on:", ...li(brief.concept.built_on), "");
  lines.push(h("Copy directions"), "Headline:", ...li(brief.copy_directions.headline), "Supporting copy:", ...li(brief.copy_directions.supporting), "");
  lines.push(h("Design guidance"));
  for (const [key, items] of Object.entries(brief.design_guidance)) lines.push(`${key[0].toUpperCase()}${key.slice(1)}:`, ...li(items));
  lines.push("");
  lines.push(h("Production"), `- Format: ${brief.production.format}${brief.production.slides ? `, about ${brief.production.slides} slides` : ""}`, `- Aspect ratio: ${brief.production.aspect_ratio ?? "not specified"}`, `- Safe margins: ${brief.production.safe_margins ?? "not specified"}`, "");
  lines.push(h("Adapt, don't copy"), "Take:", ...li(brief.adapt.take), "Never copy:", ...li(brief.adapt.do_not_copy), "");
  lines.push(h("Limitations"), ...li(brief.limitations.missing_evidence), `Confidence: ${brief.limitations.confidence}`, "");
  lines.push(h("Generation prompt"), md ? "```" : "", brief.generation_prompt, md ? "```" : "");
  return lines.join("\n").trim();
}
