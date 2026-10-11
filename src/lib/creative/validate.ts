// Creative Intelligence: the deterministic checks that run after the model, against the post it
// was given. Zod (schema.ts) checks the shape; these check the facts: every slide is present
// exactly once at its zero-based position and none is invented, evidence points at slides that
// exist, quotes are really in the caption or on the slide, "complete" is only claimed when every
// slide was looked at, no performance is claimed that the data can't show, and the writing isn't
// the caption pasted back or filler. Errors mean the output can't be stored as a valid draft;
// warnings mean it can, flagged for review.
import type { CreativeDna, EvidenceRef, Perception } from "./schema";

export type Issue = { code: string; message: string; path?: string };
export type Verdict = { errors: Issue[]; warnings: Issue[] };

// What the model was given
export type PostInput = { caption: string; expectedSlides: number };

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

function slideOf(ref: EvidenceRef): number | null {
  const match = /^slide:(\d+)$/.exec(ref);
  return match ? Number(match[1]) : null;
}

// Engagement isn't evidence of effect: no lift figures, conversion or virality claims
const PERFORMANCE_CLAIM =
  /\b(high[- ]converting|went viral|goes viral|viral (hit|post|success)|conversion rates?|click[- ]through rates?|\bctr\b|\broi\b|drove (sales|conversions|revenue)|proven to (convert|sell|work))\b|\b\d+(\.\d+)?\s?%\s?(more|higher|increase|lift|uplift|boost|growth)\b/i;

// Advice that fits every post and so says nothing about this one
const GENERIC_TAKEAWAYS = [
  /^use (bright|bold) colou?rs?\.?$/i,
  /^be consistent\.?$/i,
  /^post (regularly|consistently)\.?$/i,
  /^know your audience\.?$/i,
  /^use high[- ]quality (images|photos|visuals)\.?$/i,
  /^engage with your (audience|followers)\.?$/i,
  /^keep it simple\.?$/i,
];

function words(s: string) {
  return new Set(normalise(s).match(/[a-z0-9']+/g) ?? []);
}
function overlap(a: string, b: string) {
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / Math.min(wa.size, wb.size);
}

function positions(list: { position: number }[], expected: number, path: string, verdict: Verdict) {
  const seen = new Set<number>();
  for (const { position } of list) {
    if (position >= expected) verdict.errors.push({ code: "phantom_slide", message: `Slide ${position} doesn't exist; the post has ${expected}`, path });
    else if (seen.has(position)) verdict.errors.push({ code: "duplicate_slide", message: `Slide ${position} appears twice`, path });
    seen.add(position);
  }
  for (let p = 0; p < expected; p++) {
    if (!seen.has(p)) verdict.errors.push({ code: "missing_slide", message: `Slide ${p} has no record`, path });
  }
  return seen;
}

function checkRefs(list: EvidenceRef[], post: PostInput, path: string, verdict: Verdict) {
  for (const ref of list) {
    const slide = slideOf(ref);
    if (slide != null && slide >= post.expectedSlides) verdict.errors.push({ code: "bad_evidence_ref", message: `${ref} points past the last slide`, path });
    if (ref === "caption" && !post.caption.trim()) verdict.errors.push({ code: "bad_evidence_ref", message: "Cites the caption, but the post has none", path });
  }
}

export function validatePerception(output: Perception, post: PostInput): Verdict {
  const verdict: Verdict = { errors: [], warnings: [] };
  positions(output.slides, post.expectedSlides, "slides", verdict);
  for (const slide of output.slides) {
    const hasText = slide.visible_text.headline || slide.visible_text.body;
    if (slide.legibility === "no-text" && hasText) verdict.errors.push({ code: "text_contradiction", message: `Slide ${slide.position} says it has no text but quotes some`, path: `slides.${slide.position}` });
    if (slide.confidence === "low") verdict.warnings.push({ code: "low_confidence_slide", message: `Slide ${slide.position} was read with low confidence`, path: `slides.${slide.position}` });
  }
  if (output.caption.hook_text && output.caption.hook_text.length > 0 && !normalise(post.caption).includes(normalise(output.caption.hook_text))) {
    verdict.warnings.push({ code: "hook_not_in_caption", message: "The caption hook isn't a quote from the caption", path: "caption.hook_text" });
  }
  if (output.conflicts.length) verdict.warnings.push({ code: "text_image_conflict", message: "The caption and images disagree; kept for review", path: "conflicts" });
  return verdict;
}

export function validateDna(dna: CreativeDna, post: PostInput, perception?: Perception): Verdict {
  const verdict: Verdict = { errors: [], warnings: [] };
  const expected = post.expectedSlides;

  // The narrative covers every slide, in order, and nothing else
  positions(dna.narrative.slide_roles, expected, "narrative.slide_roles", verdict);
  if (expected === 1 && dna.narrative.pattern !== "single-image" && dna.narrative.pattern !== "unknown") {
    verdict.warnings.push({ code: "single_image_pattern", message: "A one-image post is given a multi-slide pattern", path: "narrative.pattern" });
  }

  // "Complete" only when every slide was looked at
  const q = dna.quality;
  if (q.expected_slides !== expected) verdict.errors.push({ code: "wrong_expected_slides", message: `Says ${q.expected_slides} slides; the post has ${expected}`, path: "quality.expected_slides" });
  if (q.processed_slides > expected) verdict.errors.push({ code: "phantom_slide", message: "Processed more slides than exist", path: "quality.processed_slides" });
  if (q.image_analysis_complete && q.processed_slides !== expected) {
    verdict.errors.push({ code: "false_complete", message: `Claims complete after ${q.processed_slides} of ${expected} slides`, path: "quality.image_analysis_complete" });
  }
  if (perception && q.image_analysis_complete && perception.slides.length !== expected) {
    verdict.errors.push({ code: "false_complete", message: "Claims complete, but perception didn't cover every slide", path: "quality.image_analysis_complete" });
  }

  // Every reference points at something real, and every quote is really there
  const allRefs: [EvidenceRef[], string][] = [
    [dna.primary_archetype.evidence, "primary_archetype"],
    [dna.marketing_objective.evidence, "marketing_objective"],
    [dna.hook.evidence, "hook"],
    ...dna.secondary_archetypes.map((label, i): [EvidenceRef[], string] => [label.evidence, `secondary_archetypes.${i}`]),
    ...dna.attention_mechanisms.map((m, i): [EvidenceRef[], string] => [m.evidence, `attention_mechanisms.${i}`]),
    ...dna.creative_rationale.map((r, i): [EvidenceRef[], string] => [r.evidence, `creative_rationale.${i}`]),
    ...dna.evidence.map((e, i): [EvidenceRef[], string] => [[e.ref], `evidence.${i}`]),
  ];
  for (const [list, path] of allRefs) checkRefs(list, post, path, verdict);

  const slideText = new Map<number, string>();
  for (const slide of perception?.slides ?? []) slideText.set(slide.position, normalise(`${slide.visible_text.headline ?? ""} ${slide.visible_text.body ?? ""}`));
  dna.evidence.forEach((e, i) => {
    if (!e.quote) return;
    const quote = normalise(e.quote);
    const slide = slideOf(e.ref);
    if (e.ref === "caption" && !normalise(post.caption).includes(quote)) {
      verdict.errors.push({ code: "quote_not_found", message: `"${e.quote}" isn't in the caption`, path: `evidence.${i}.quote` });
    } else if (slide != null && perception && !(slideText.get(slide) ?? "").includes(quote)) {
      verdict.warnings.push({ code: "quote_not_read", message: `"${e.quote}" wasn't read off slide ${slide}`, path: `evidence.${i}.quote` });
    }
  });
  if (dna.hook.location === "caption" && dna.hook.observed_text && !normalise(post.caption).includes(normalise(dna.hook.observed_text))) {
    verdict.errors.push({ code: "quote_not_found", message: "The hook is placed in the caption but isn't in it", path: "hook.observed_text" });
  }

  // The same archetype twice, or as both primary and secondary
  const secondary = dna.secondary_archetypes.map((label) => label.slug);
  if (secondary.includes(dna.primary_archetype.slug) || new Set(secondary).size !== secondary.length) {
    verdict.errors.push({ code: "duplicate_archetype", message: "An archetype is listed twice", path: "secondary_archetypes" });
  }

  // No performance claims the data can't support
  const prose: [string, string][] = [
    [dna.concept, "concept"],
    [dna.creative_summary, "creative_summary"],
    [dna.content_intent, "content_intent"],
    [dna.narrative.arc, "narrative.arc"],
    [dna.copy_strategy.notes, "copy_strategy.notes"],
    ...dna.creative_rationale.map((r, i): [string, string] => [r.hypothesis, `creative_rationale.${i}`]),
    ...dna.attention_mechanisms.map((m, i): [string, string] => [m.statement, `attention_mechanisms.${i}`]),
    ...dna.takeaways.map((s, i): [string, string] => [s, `takeaways.${i}`]),
  ];
  for (const [s, path] of prose) {
    if (PERFORMANCE_CLAIM.test(s)) verdict.errors.push({ code: "performance_claim", message: "Claims an effect the data can't show", path });
  }

  // Not the caption pasted back, and not filler
  if (post.caption.trim().length >= 40 && overlap(dna.creative_summary, post.caption) > 0.8) {
    verdict.errors.push({ code: "repeats_caption", message: "The summary mostly repeats the caption", path: "creative_summary" });
  }
  dna.takeaways.forEach((s, i) => {
    if (GENERIC_TAKEAWAYS.some((pattern) => pattern.test(s.trim()))) verdict.warnings.push({ code: "generic_takeaway", message: `"${s}" fits any post`, path: `takeaways.${i}` });
  });

  if (dna.quality.uncertainties.length || dna.constraints_or_uncertainties.length) {
    verdict.warnings.push({ code: "uncertain", message: "The analysis lists uncertainties", path: "quality.uncertainties" });
  }
  return verdict;
}

// Review always happens unless a deliberately enabled policy says otherwise; a clean verdict
// alone never means "approved"
export function needsReview(verdict: Verdict, dna: CreativeDna) {
  return verdict.warnings.length > 0 || dna.quality.needs_review || !dna.quality.image_analysis_complete;
}
