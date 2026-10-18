// Creative Intelligence: the deterministic checks that run after the model, against the post it
// was given. Zod (schema.ts) checks the shape; these check the facts: every slide is present
// exactly once at its zero-based position and none is invented, evidence points at slides that
// exist, quotes are really in the caption or on the slide, "complete" is only claimed when every
// slide was looked at, no performance is claimed that the data can't show, and the writing isn't
// the caption pasted back, filler, or about the pipeline rather than the post ("only the notes
// were available"), which a designer would read. Errors mean the output can't be stored as a valid draft;
// warnings mean it can, flagged for review.
import { distance, rgbOf } from "./colours";
import { isVerificationBoilerplate, proseKey } from "./editorialQuality";
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

// Writing about how the analysis was made instead of about the post: "in the notes", "the slide
// records don't say", "only the notes were available, not the image". Kept narrow, so the caption
// "notes that…" or a Notes app screenshot pass
const PROCESS_TALK =
  /\b(in|from|per|according to) the (slide )?(notes|records)\b|\bthe (slide )?(notes|records) (say|said|describe|mention|list|show|suggest|indicate|don't|do not|only)\b|\b(slide|perception|text) (notes|records)\b|\b(notes|records|transcriptions?) (was|were) (all that was )?(available|provided|given)\b|\b(not|rather than|instead of) (from )?the (image|images|slide images)( itself| themselves)?\b|\b(wasn't|weren't|was not|were not) (shown|given|provided) the (image|images)\b/i;

// Advice to distort or hide what a creative shows: flattening or exaggerating a series beyond its
// values, cutting an axis, or shrinking and fading disclosures, sources or disclaimers. Checked on
// what Curatit recommends (takeaways, adaptations, a decision's principle and when to use it),
// never on descriptions of what a post did, which may honestly say a disclaimer is small
const DISTORTION = new RegExp(
  [
    String.raw`\bflat(?:ter)?\s+(?:line|series|curve|trend)\b`,
    String.raw`\b(?:flatten|exaggerat|steepen)\w*\b[^.]{0,40}\b(?:line|series|curve|trend|difference|gap|values?|data)\b`,
    String.raw`\b(?:truncat|crop|cut)\w*\b[^.]{0,30}\b(?:axis|axes|baseline|scale)\b`,
    String.raw`\b(?:disclaim\w*|disclosures?|sources?|fine print|small print|footnotes?)\b[^.]{0,60}\b(?:small|smaller|tiny|low[- ]contrast|faint|muted|hidden|out of the way|(?:do|does)(?: not|n't) compete)\b`,
    String.raw`\b(?:shrink|hide|bury|fade|minimi[sz]e|de-?emphasi[sz]e|tuck)\w*\b[^.]{0,40}\b(?:disclaim\w*|disclosures?|sources?|fine print|small print|footnotes?)\b`,
  ].join("|"),
  "i",
);

// Jargon standing in for an argument, and scores nobody measured
const BUZZWORDS = /\b(?:cognitive tension|visual dopamine|dopamine|neurological|neuro-?marketing|subconscious(?:ly)?)\b/i;
const INVENTED_SCORE = /\b\d+(?:\.\d+)?\s*\/\s*(?:10|100)\b|\b(?:virality|aesthetic|persuasion|effectiveness|engagement|attention) (?:score|rating|index)\b/i;

// The checks that apply to any text, Curatit's or not (the evaluation harness runs them on an
// ordinary critique too): claims of performance, jargon, invented scores, and language that
// recommends distorting data or playing down a disclosure
export function lintProse(text: string) {
  return [
    PERFORMANCE_CLAIM.test(text) && "performance_claim",
    BUZZWORDS.test(text) && "buzzword",
    INVENTED_SCORE.test(text) && "invented_score",
    DISTORTION.test(text) && "recommends_distortion",
  ].filter((code): code is string => !!code);
}

// Creative Intelligence 3.0: the checks that keep the analysis honest and short.

// A decision that's two techniques: "Start all lines together and label their ends"
const SECOND_MOVE =
  /\b(?:and|then|while|plus)\s+(?:also\s+)?(?:label|start|use|put|set|show|add|make|keep|let|give|lead|end|place|crop|repeat|pair|contrast|frame|stack|split|anchor|break|move|run|open|close|state|hold|save|fill|shoot|light|tint|colou?r|cut|name|number|mark|caption|highlight|annotate|align|centre|center|size|scale|layer|overlap|reveal|hide|swap|switch|echo|mirror|bookend|sign)(?:s|ed|ing)?\b/i;

// A figure called checked when nothing was checked
const OVERCLAIM = /\b(?:is|are|was|were|looks?|appears?|seems?)\s+(?!not\b)(?:(?:fully|broadly|largely|entirely)\s+)?(?:accurate|correct|verified|confirmed|fact-checked)\b|\b(?:verified|confirmed|fact-checked) (?:figures?|values?|numbers?|data)\b/i;

// A period miscounted: "11 years" for 2015–2025, where 10 years elapse between the labels.
// Ranges come from "2015–2025" anywhere in the post or the analysis, and from a slide that lists
// three or more years (a chart's axis). A sentence that attributes the number to the post (a
// quote, "the copy says", "labelled years") is left alone
const YEAR_RANGE = /\b((?:19|20)\d{2})\s*(?:–|—|-|to|through|until)\s*((?:19|20)\d{2})\b/g;
const NUMBER_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, "twenty-five": 25, thirty: 30 };
const YEARS = /\b(\d{1,2}|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?:-five)?|thirty)(?:[- ]years?\b|-year\b)/gi;
const ATTRIBUTED = /["“”'‘’]|\b(?:says?|said|claims?|states?|stated|copy|headline|body text|caption|labell?ed|calendar|data points?)\b/i;

export function yearRanges(texts: string[]) {
  const ranges = new Map<string, [number, number]>();
  for (const text of texts) {
    for (const match of text.matchAll(YEAR_RANGE)) {
      const [a, b] = [Number(match[1]), Number(match[2])];
      if (b > a && b - a < 100) ranges.set(`${a}-${b}`, [a, b]);
    }
    const years = [...new Set([...text.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => Number(m[0])))];
    if (years.length >= 3) {
      const [a, b] = [Math.min(...years), Math.max(...years)];
      if (b - a < 100) ranges.set(`${a}-${b}`, [a, b]);
    }
  }
  return [...ranges.values()];
}

export function periodMiscounts(prose: string, ranges: [number, number][]) {
  const out: { said: number; range: [number, number] }[] = [];
  if (!ranges.length) return out;
  for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
    if (ATTRIBUTED.test(sentence)) continue;
    for (const match of sentence.matchAll(YEARS)) {
      const said = NUMBER_WORDS[match[1].toLowerCase()] ?? Number(match[1]);
      const range = ranges.find(([a, b]) => said === b - a + 1);
      if (range && !ranges.some(([a, b]) => said === b - a)) out.push({ said, range });
    }
  }
  return out;
}

const sentenceCount = (s: string) => s.split(/(?<=[.!?])\s+(?=[A-Z"“])/).filter((part) => part.trim()).length;
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

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
    ...(dna.creative_decisions ?? []).map((d, i): [EvidenceRef[], string] => [d.evidence, `creative_decisions.${i}`]),
    ...(dna.integrity_notes ?? []).map((n, i): [EvidenceRef[], string] => [n.evidence, `integrity_notes.${i}`]),
  ];
  for (const [list, path] of allRefs) checkRefs(list, post, path, verdict);

  // Decisions are distinct (one technique each, no two about the same thing), and a chart or a
  // number on a slide gets its integrity checked
  const decisions = dna.creative_decisions ?? [];
  const editorialNotes: [string, string][] = [
    ...(dna.integrity_notes ?? []).map((note, i): [string, string] => [note.note, `integrity_notes.${i}.note`]),
    ...dna.constraints_or_uncertainties.map((note, i): [string, string] => [note, `constraints_or_uncertainties.${i}`]),
  ];
  const seenNotes = new Set<string>();
  for (const [note, path] of editorialNotes) {
    if (isVerificationBoilerplate(note)) verdict.errors.push({ code: "verification_boilerplate", message: "Replace generic verification language with a concrete visible issue, or omit the note", path });
    const key = proseKey(note);
    if (seenNotes.has(key)) verdict.errors.push({ code: "duplicate_caveat", message: "This note already appears in the analysis; keep it in one section only", path });
    seenNotes.add(key);
  }
  decisions.forEach((d, i) => {
    if (decisions.slice(0, i).some((e) => overlap(d.title, e.title) >= 0.75 || overlap(d.principle, e.principle) >= 0.8)) {
      verdict.warnings.push({ code: "duplicate_decision", message: `Decision ${i + 1} repeats an earlier one`, path: `creative_decisions.${i}` });
    }
    if (d.explanation !== undefined && SECOND_MOVE.test(d.title)) {
      verdict.errors.push({ code: "compound_decision", message: `"${d.title}" is two techniques: make each its own decision if both matter, otherwise keep the one that matters more`, path: `creative_decisions.${i}.title` });
    }
    if (d.explanation !== undefined && sentenceCount(d.explanation) > 2) {
      verdict.errors.push({ code: "too_long", message: "The explanation is over two sentences; say it in one or two", path: `creative_decisions.${i}.explanation` });
    }
  });
  if (dna.strategy_headline !== undefined) {
    const n = wordCount(dna.strategy_headline);
    if (n < 6 || n > 16) verdict.errors.push({ code: "too_long", message: `The strategy headline is ${n} words; write 8 to 14`, path: "strategy_headline" });
  }
  if (dna.strategy_summary !== undefined && sentenceCount(dna.strategy_summary) > 2) {
    verdict.errors.push({ code: "too_long", message: "The strategy summary is over two sentences", path: "strategy_summary" });
  }

  // Colours come from the pixels: every role's hex is one measured on a slide
  const measured = (perception?.slides ?? []).flatMap((slide) => slide.palette.hex);
  if (measured.length) {
    (dna.colour_roles ?? []).forEach((colour, i) => {
      if (!measured.some((hex) => distance(rgbOf(hex.toLowerCase()), rgbOf(colour.hex.toLowerCase())) <= 30)) {
        verdict.errors.push({ code: "colour_not_measured", message: `${colour.hex} isn't one of the measured colours (${[...new Set(measured)].slice(0, 12).join(", ")}); copy one of those`, path: `colour_roles.${i}.hex` });
      }
    });
  }

  // Nothing is presented as checked, and no period is miscounted
  (dna.integrity_notes ?? []).forEach((n, i) => {
    if (OVERCLAIM.test(n.note)) verdict.errors.push({ code: "overclaims_verification", message: "Calls a figure accurate, correct or verified; nothing here was checked against a source. Say what the post shows or states instead", path: `integrity_notes.${i}.note` });
  });
  const postText = [post.caption, ...(perception?.slides ?? []).map((slide) => `${slide.visible_text.headline ?? ""}\n${slide.visible_text.body ?? ""}`)];
  const analysisText: [string | null | undefined, string][] = [
    [dna.concept, "concept"],
    [dna.strategy_headline, "strategy_headline"],
    [dna.strategy_summary, "strategy_summary"],
    [dna.creative_summary, "creative_summary"],
    ...decisions.flatMap((d, i): [string | undefined, string][] => [
      [d.explanation, `creative_decisions.${i}.explanation`],
      [d.observation, `creative_decisions.${i}.observation`],
    ]),
    ...(dna.integrity_notes ?? []).map((n, i): [string, string] => [n.note, `integrity_notes.${i}.note`]),
  ];
  const ranges = yearRanges([...postText, ...analysisText.map(([s]) => s ?? "")]);
  for (const [s, path] of analysisText) {
    for (const miss of periodMiscounts(s ?? "", ranges)) {
      const [a, b] = miss.range;
      verdict.errors.push({
        code: "period_miscount",
        message: `"${miss.said} years" for ${a}–${b}: ${b - a} years elapse between the first and last label (${miss.said} labelled years). Say which, or attribute the number to the post if it's the post's own claim`,
        path,
      });
    }
  }

  const charted = perception?.slides.some((slide) => slide.imagery.includes("data-visualization")) ?? false;
  if (dna.integrity_notes !== undefined && charted && !dna.integrity_notes.length) {
    verdict.errors.push({ code: "integrity_missing", message: "A slide shows data or a chart, but integrity_notes is empty: check what it shows (start values, time period, axes, baseline, units, sources and disclaimers…)", path: "integrity_notes" });
  }

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
  const present = (list: [string | null | undefined, string][]) => list.filter((entry): entry is [string, string] => !!entry[0]);
  const prose: [string, string][] = present([
    [dna.concept, "concept"],
    [dna.strategy_headline, "strategy_headline"],
    [dna.strategy_summary, "strategy_summary"],
    [dna.creative_summary, "creative_summary"],
    [dna.content_intent, "content_intent"],
    [dna.narrative.arc, "narrative.arc"],
    [dna.copy_strategy.notes, "copy_strategy.notes"],
    ...dna.creative_rationale.map((r, i): [string, string] => [r.hypothesis, `creative_rationale.${i}`]),
    ...dna.attention_mechanisms.map((m, i): [string, string] => [m.statement, `attention_mechanisms.${i}`]),
    ...dna.takeaways.map((s, i): [string, string] => [s, `takeaways.${i}`]),
    ...(dna.creative_decisions ?? []).flatMap((d, i): [string | undefined, string][] => [
      [d.title, `creative_decisions.${i}.title`],
      [d.explanation, `creative_decisions.${i}.explanation`],
      [d.observation, `creative_decisions.${i}.observation`],
      [d.rationale, `creative_decisions.${i}.rationale`],
      [d.principle, `creative_decisions.${i}.principle`],
    ]),
  ]);
  for (const [s, path] of prose) {
    if (PERFORMANCE_CLAIM.test(s)) verdict.errors.push({ code: "performance_claim", message: "Claims an effect the data can't show", path });
  }

  // What Curatit recommends never distorts data or hides a disclosure
  const advice: [string, string][] = present([
    ...dna.takeaways.map((s, i): [string, string] => [s, `takeaways.${i}`]),
    ...dna.adaptation_ideas.map((s, i): [string, string] => [s, `adaptation_ideas.${i}`]),
    ...(dna.creative_decisions ?? []).flatMap((d, i): [string | undefined, string][] => [
      [d.title, `creative_decisions.${i}.title`],
      [d.principle, `creative_decisions.${i}.principle`],
      [d.use_when, `creative_decisions.${i}.use_when`],
    ]),
    ...(dna.application?.when_to_use ?? []).map((s, i): [string, string] => [s, `application.when_to_use.${i}`]),
    [dna.creative_formula, "creative_formula"],
  ]);
  for (const [s, path] of advice) {
    if (DISTORTION.test(s)) {
      verdict.errors.push({ code: "recommends_distortion", message: "Recommends distorting data or playing down a disclosure; describe the tradeoff instead of recommending it", path });
    }
  }

  // Everything a designer reads is about the post, not the pipeline
  const readable: [string | null, string][] = [
    ...prose,
    [dna.visual_system.text_hierarchy, "visual_system.text_hierarchy"],
    [dna.visual_system.decorative_system, "visual_system.decorative_system"],
    [dna.visual_system.brand_consistency, "visual_system.brand_consistency"],
    ...dna.adaptation_ideas.map((s, i): [string, string] => [s, `adaptation_ideas.${i}`]),
    ...dna.constraints_or_uncertainties.map((s, i): [string, string] => [s, `constraints_or_uncertainties.${i}`]),
    ...dna.quality.uncertainties.map((s, i): [string, string] => [s, `quality.uncertainties.${i}`]),
    ...dna.evidence.map((e, i): [string, string] => [e.observation, `evidence.${i}.observation`]),
    ...(dna.creative_decisions ?? []).flatMap((d, i): [string | null, string][] => [
      [d.use_when ?? null, `creative_decisions.${i}.use_when`],
      [d.avoid_when ?? null, `creative_decisions.${i}.avoid_when`],
      [d.watch_out ?? null, `creative_decisions.${i}.watch_out`],
    ]),
    ...(dna.integrity_notes ?? []).map((n, i): [string, string] => [n.note, `integrity_notes.${i}.note`]),
    ...Object.entries(dna.visual_notes ?? {}).map(([key, s]): [string | null, string] => [s ?? null, `visual_notes.${key}`]),
    [dna.creative_formula ?? null, "creative_formula"],
    [dna.copywriting ?? null, "copywriting"],
    ...(dna.application?.when_to_use ?? []).map((s, i): [string, string] => [s, `application.when_to_use.${i}`]),
    ...(dna.application?.when_not_to_use ?? []).map((s, i): [string, string] => [s, `application.when_not_to_use.${i}`]),
    ...(dna.colour_roles ?? []).map((c, i): [string, string] => [c.role, `colour_roles.${i}.role`]),
  ];
  for (const [s, path] of readable) {
    if (!s) continue;
    if (PROCESS_TALK.test(s)) verdict.errors.push({ code: "process_talk", message: "Talks about how the analysis was made instead of the post; describe the post itself", path });
    if (BUZZWORDS.test(s)) verdict.errors.push({ code: "buzzword", message: "Uses jargon in place of an argument; say what the design does", path });
    if (INVENTED_SCORE.test(s)) verdict.errors.push({ code: "invented_score", message: "Gives a score nobody measured", path });
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
