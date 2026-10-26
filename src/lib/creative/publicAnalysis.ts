// Creative Intelligence on the public post page: the published Creative DNA and its current
// version's slide records, turned into the compact view the page shows. Pure (no reading, no
// model, no inference), so it's tested against fixtures; display.ts does the reading. Everything
// shown comes from stored, reviewed output. Storage counts slides from zero ("slide:6", and the
// prose says "slide 6"); the screen counts from one, so the 7th image is always "Slide 7".
import type { ColourView, DecisionView, EvidenceTarget, Insight, IntegrityStatus, IntegrityView, PublicAnalysis, SlideDetail, VisualSection } from "./publicView";
import type { CreativeDna, SlideObservation } from "./schema";
import { term, type Dimension } from "./taxonomy";
import { proseKey, uniqueProse } from "./editorialQuality";

export * from "./publicView";

// What display.ts reads: the published analysis row and its current version's slide rows
export type AnalysisRecord = {
  creative_dna: unknown;
  current_version_id: string | null;
  image_analysis_complete: boolean | null;
  expected_slides: number | null;
  processed_slides: number | null;
};
export type SlideRecord = { version_id: string; position: number; observation: unknown };

const HIDDEN = new Set(["other", "unknown", "none"]);

// A slug in words, or null for one that says nothing ("other", "unknown", "none") or isn't known
function word(dimension: Dimension, slug: unknown) {
  return typeof slug === "string" && !HIDDEN.has(slug) ? (term(dimension, slug)?.label ?? null) : null;
}
function words(dimension: Dimension, slugs: unknown) {
  return Array.isArray(slugs) ? [...new Set(slugs.map((slug) => word(dimension, slug)).filter((label): label is string => !!label))] : [];
}
const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const texts = (list: unknown) => (Array.isArray(list) ? list.map(text).filter((s): s is string => !!s) : []);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const record = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

// "slide:6" → the 7th image; "caption" and "metadata" as themselves; anything else, or a slide
// past the last image, is dropped rather than turned into a link to nowhere
export function parseEvidence(refs: unknown, count: number): EvidenceTarget[] {
  const slides = new Set<number>();
  let caption = false;
  let metadata = false;
  for (const ref of list(refs)) {
    if (ref === "caption") caption = true;
    else if (ref === "metadata") metadata = true;
    else if (typeof ref === "string") {
      const match = /^slide:(\d{1,3})$/.exec(ref);
      const index = match ? Number(match[1]) : -1;
      if (index >= 0 && index < count) slides.add(index);
    }
  }
  return [
    ...[...slides].sort((a, b) => a - b).map((index): EvidenceTarget => ({ kind: "slide", index })),
    ...(caption ? [{ kind: "caption" } as const] : []),
    ...(metadata ? [{ kind: "metadata" } as const] : []),
  ];
}

// Slide numbers in stored prose. The pipeline writes them from zero ("slides 0 to 5", "Slide 6's")
// and an editor may write them from one, so each analysis's convention is decided once, from all
// its prose: a 0 anywhere means zero-based, a number equal to the slide count means one-based,
// and otherwise it's the pipeline's zero-based default. The screen always counts from one.
// A mention is "slide(s)" or "position(s)" and its numbers. Numbers joined by and, or, to,
// through, vs, a slash or a dash are all slides; one joined by a comma is a slide only when no
// counted noun follows it ("slide 2, 3 players" names one slide). A number past the last image
// is left as written.
export type Numbering = "zero" | "one";
const NUM = String.raw`\d{1,3}(?!\d)(?!\.\d)(?!\s*%)`;
const LINK = String.raw`(?:\s*[–—-]\s*|\s*\/\s*|\s*&\s*|\s+(?:and|or|to|through|vs\.?|versus)\s+)`;
const NOT_COUNTED = String.raw`(?!\s+(?!(?:as|is|was|has|its|this|plus|across|whereas)\b)[A-Za-z]+s\b)`;
const MENTION = new RegExp(String.raw`\b(slides?|positions?)(\s+)(${NUM}(?:${LINK}${NUM}|\s*,\s*${NUM}${NOT_COUNTED})*)`, "gi");

// Whether a piece of prose names a slide by number, the only text the numbering changes
export const mentionsSlides = (prose: unknown) => typeof prose === "string" && new RegExp(MENTION.source, "i").test(prose);

export function numberingOf(prose: string[], count: number): Numbering {
  const numbers = prose.flatMap((text) => [...text.matchAll(MENTION)].flatMap((match) => match[3].match(/\d+/g)!.map(Number)));
  if (numbers.includes(0)) return "zero";
  if (numbers.includes(count)) return "one";
  return "zero";
}

export function oneBased(prose: string, count: number, numbering: Numbering = "zero") {
  if (numbering === "one") return prose;
  return prose.replace(MENTION, (_mention, noun: string, gap: string, numbers: string) => `${noun}${gap}${numbers.replace(/\d+/g, (n) => (Number(n) < count ? String(Number(n) + 1) : n))}`);
}

// The first sentences of a passage, split the way a reader would: "4.5:1", "$4.99" and "U.S."
// don't end one
export function sentences(prose: string, max: number) {
  if (typeof Intl.Segmenter !== "function") return prose;
  const parts = [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(prose)].map((part) => part.segment);
  return parts.slice(0, max).join("").trim();
}

// Roles in a row collapsed: Hook, Gallery frame ×5, Closing
function formula(roles: (string | null)[]) {
  if (roles.length < 2 || roles.every((role) => !role)) return null;
  const parts: string[] = [];
  for (let i = 0; i < roles.length; ) {
    let j = i;
    while (j + 1 < roles.length && roles[j + 1] === roles[i]) j++;
    const role = roles[i] ?? "Slide";
    parts.push(j > i ? `${role} ×${j - i + 1}` : role);
    i = j + 1;
  }
  return parts.join(" → ");
}

const LEVEL_ORDER = ["none", "low", "medium", "high"];
const PLACEHOLDER_ROLE = /cover sample \d+; not a brand token/i;
const ORDER: IntegrityStatus[] = ["concern", "cannot_verify", "observed", "verified"];

function slideDetail(raw: unknown, index: number, count: number, numbering: Numbering): SlideDetail {
  const o = record(raw);
  const visible = record(o.visible_text);
  const typography = record(o.typography);
  const palette = record(o.palette);
  const observation = text(o.observation);
  const legibility = ["clear", "partial", "illegible", "no-text"].includes(o.legibility as string) ? (o.legibility as SlideDetail["legibility"]) : null;
  const confidence = ["high", "medium", "low"].includes(o.confidence as string) ? (o.confidence as SlideDetail["confidence"]) : null;
  const imagery = list(o.imagery);
  const blank = !!observation?.startsWith("Blank:") || (legibility === "no-text" && confidence === "low" && imagery.includes("video-frame") && !texts(o.objects).length);

  const facts: { label: string; value: string }[] = [];
  const add = (label: string, value: string | null) => value && facts.push({ label, value });
  if (!blank) {
    add("Layout", words("layout", o.layout).join(", ") || null);
    const classes = words("typography", typography.classes);
    const weight = word("type_weight", typography.weight);
    add("Type", classes.length ? `${classes.join(", ")}${weight ? ` · ${weight}` : ""}` : null);
    add("Imagery", words("imagery", o.imagery).join(", ") || null);
    add("Devices", words("visual_device", o.devices).join(", ") || null);
    const density = word("level", o.text_density);
    add("Text", density ? `${density} density${legibility === "partial" ? ", partly legible" : legibility === "illegible" ? ", not legible" : ""}` : null);
    const prominent = (value: unknown) => (value === "high" || value === "medium" ? word("level", value) : null);
    add("People", prominent(o.people_prominence));
    add("Product", prominent(o.product_prominence));
  }

  return {
    index,
    role: word("slide_role", o.role),
    headline: blank ? null : text(visible.headline),
    body: blank ? null : text(visible.body),
    legibility,
    observation: observation ? oneBased(observation, count, numbering) : null,
    facts,
    colours: blank ? [] : list(palette.hex).filter((hex): hex is string => typeof hex === "string" && /^#[0-9a-f]{6}$/i.test(hex)).slice(0, 5),
    colourNames: blank ? [] : words("palette", palette.families),
    brandTreatment: blank || !text(o.brand_treatment) ? null : oneBased(text(o.brand_treatment)!, count, numbering),
    confidence,
    blank,
    changes: [],
  };
}

// What differs from the slide before, from the stored fields alone (no reading of effect into it)
function changes(previous: SlideObservation | Record<string, unknown>, current: SlideObservation | Record<string, unknown>) {
  const p = record(previous);
  const c = record(current);
  const out: string[] = [];
  const pair = (label: string, before: string[], after: string[]) => {
    if (before.length && after.length && before.join() !== after.join()) out.push(`${label}: ${before.join(" + ")} → ${after.join(" + ")}`);
  };
  pair("Imagery", words("imagery", p.imagery), words("imagery", c.imagery));
  const density = (value: unknown) => (value === "none" ? "no text" : (word("level", value)?.toLowerCase() ?? null));
  const [before, after] = [density(p.text_density), density(c.text_density)];
  if (before && after && before !== after) out.push(`Text: ${before} → ${after}`);
  for (const [label, key] of [["Product", "product_prominence"], ["People", "people_prominence"]] as const) {
    const [from, to] = [LEVEL_ORDER.indexOf(p[key] as string), LEVEL_ORDER.indexOf(c[key] as string)];
    if (from >= 0 && to >= 0 && Math.abs(to - from) >= 2) out.push(`${label}: ${p[key]} → ${c[key]}`);
  }
  const known = new Set(words("palette", record(p.palette).families));
  const fresh = words("palette", record(c.palette).families).filter((family) => !known.has(family));
  if (fresh.length) out.push(`New colours: ${fresh.join(", ").toLowerCase()}`);
  return out.slice(0, 4);
}

// The current version's slide records, one per image: rows of another version, positions that
// aren't an image, and repeats are dropped; a missing position stays empty rather than shifting
export function alignSlides(rows: SlideRecord[], currentVersionId: string | null, count: number) {
  const byIndex: (Record<string, unknown> | null)[] = Array.from({ length: count }, () => null);
  if (!currentVersionId) return byIndex;
  for (const row of rows) {
    if (row.version_id !== currentVersionId || !Number.isInteger(row.position) || row.position < 0 || row.position >= count) continue;
    if (byIndex[row.position]) continue;
    byIndex[row.position] = record(row.observation);
  }
  return byIndex;
}

// Slides that show something (by slug), for the Visual DNA sections. A blank frame shows nothing,
// so it's never cited
function slidesWith(observations: (Record<string, unknown> | null)[], slides: (SlideDetail | null)[], pick: (o: Record<string, unknown>) => unknown[], slug: string): EvidenceTarget[] {
  return observations.flatMap((o, index) => (o && !slides[index]?.blank && pick(o).includes(slug) ? [{ kind: "slide" as const, index }] : []));
}

// Every piece of prose an analysis shows, to settle how it numbers its slides
function allProse(d: Record<string, unknown>, observations: (Record<string, unknown> | null)[]) {
  const visual = record(d.visual_system);
  return [
    d.concept,
    d.creative_summary,
    d.content_intent,
    record(d.narrative).arc,
    visual.text_hierarchy,
    visual.decorative_system,
    visual.brand_consistency,
    ...list(d.attention_mechanisms).map((m) => record(m).statement),
    ...list(d.creative_rationale).map((r) => record(r).hypothesis),
    ...list(d.takeaways),
    ...list(d.adaptation_ideas),
    ...list(d.constraints_or_uncertainties),
    d.creative_formula,
    d.strategy_headline,
    d.strategy_summary,
    d.copywriting,
    ...list(record(d.application).when_to_use),
    ...list(record(d.application).when_not_to_use),
    ...Object.values(record(d.visual_notes)),
    ...list(d.creative_decisions).flatMap((x) => {
      const decision = record(x);
      return [decision.title, decision.explanation, decision.observation, decision.rationale, decision.principle, decision.use_when, decision.avoid_when, decision.watch_out];
    }),
    ...list(d.integrity_notes).map((n) => record(n).note),
    ...list(record(d.quality).uncertainties),
    ...observations.flatMap((o) => (o ? [o.observation, o.brand_treatment] : [])),
  ].filter((s): s is string => typeof s === "string");
}

export function toPublicAnalysis(analysis: AnalysisRecord, slideRows: SlideRecord[], count: number): PublicAnalysis | null {
  const d = record(analysis.creative_dna) as Partial<CreativeDna> & Record<string, unknown>;
  if (!text(d.concept)) return null;
  const observations = alignSlides(slideRows, analysis.current_version_id, count);
  const numbering = numberingOf(allProse(d, observations), count);
  const prose = (value: unknown) => {
    const s = text(value);
    return s ? oneBased(s, count, numbering) : null;
  };
  const concept = prose(d.concept)!;

  const slides = observations.map((o, index) => (o ? slideDetail(o, index, count, numbering) : null));
  slides.forEach((slide, index) => {
    const before = observations[index - 1];
    if (slide && before && observations[index] && !slide.blank && !slides[index - 1]?.blank) slide.changes = changes(before, observations[index]!);
  });

  const narrative = record(d.narrative);
  const pattern = typeof narrative.pattern === "string" ? narrative.pattern : null;
  const storedRoles = list(narrative.slide_roles).map(record);
  const roles = count > 1 ? Array.from({ length: count }, (_, index) => word("slide_role", storedRoles.find((entry) => entry.position === index)?.role) ?? slides[index]?.role ?? null) : [];

  const hook = record(d.hook);
  const label = (name: string, value: string | null, evidence: unknown) => (value ? [{ label: name, value, evidence: parseEvidence(evidence, count) }] : []);
  const visualSystem = record(d.visual_system);

  const insight = (kind: Insight["kind"], statement: unknown, evidence: unknown): Insight[] => {
    const s = prose(statement);
    return s ? [{ text: s, kind, evidence: parseEvidence(evidence, count) }] : [];
  };

  // Visual DNA (3.0): six dimensions, each one insight (a sentence), up to four attributes and the
  // slides whose own records show them. Analyses before 3.0 have no typography or devices note,
  // so the first sentence of their stored description stands in
  const typographyClasses = (o: Record<string, unknown>) => list(record(o.typography).classes);
  const tagged = (dimension: Dimension, slugs: unknown, pick: (o: Record<string, unknown>) => unknown[]) =>
    list(slugs)
      .filter((slug): slug is string => typeof slug === "string" && !!word(dimension, slug))
      .filter((slug, i, all) => all.indexOf(slug) === i)
      .map((slug) => ({ value: word(dimension, slug)!, evidence: slidesWith(observations, slides, pick, slug) }));
  const deviceSlugs = [...new Set(observations.flatMap((o, index) => (o && !slides[index]?.blank ? list(o.devices) : [])))];
  const leads = (key: string, name: string) => {
    const evidence = observations.flatMap((o, index) => (o && o[key] === "high" && !slides[index]?.blank ? [{ kind: "slide" as const, index }] : []));
    return evidence.length ? [{ value: name, evidence }] : [];
  };
  const notes = record(d.visual_notes);
  const one = (value: unknown) => {
    const s = prose(value);
    return s ? sentences(s, 1) : null;
  };
  // The colours: the roles when the analysis gives them (each hex measured on a slide), else the
  // slides' measured colours, first seen first. A role that only says which sample it was ("Cover
  // sample 1; not a brand token", on every 2026-10-13 analysis) names no job, so the colour stays
  // and its role is null
  const colourRoles: ColourView[] = list(d.colour_roles)
    .map(record)
    .flatMap((c) => {
      const role = text(c.role);
      return typeof c.hex === "string" && /^#[0-9a-f]{6}$/i.test(c.hex) && role ? [{ hex: c.hex.toLowerCase(), role: PLACEHOLDER_ROLE.test(role) ? null : role }] : [];
    });
  const colours: ColourView[] = colourRoles.length ? colourRoles : [...new Set(slides.flatMap((slide) => slide?.colours ?? []).map((hex) => hex.toLowerCase()))].slice(0, 6).map((hex) => ({ hex, role: null }));
  const section = (key: VisualSection["key"], title: string, insight: string | null, tags: { value: string; evidence: EvidenceTarget[] }[], always = false): VisualSection[] => {
    const chips = tags.slice(0, 4);
    const indices = [...new Set(chips.flatMap((chip) => chip.evidence.flatMap((target) => (target.kind === "slide" ? [target.index] : []))))].sort((a, b) => a - b);
    return insight || chips.length || always ? [{ key, title, insight, chips: chips.map((chip) => chip.value), evidence: indices.map((index) => ({ kind: "slide" as const, index })) }] : [];
  };
  const visual: VisualSection[] = [
    ...section("composition", "Composition", one(notes.composition), tagged("layout", visualSystem.composition, (o) => list(o.layout))),
    ...section("typography", "Typography", one(notes.typography ?? visualSystem.text_hierarchy), tagged("typography", visualSystem.typography, typographyClasses)),
    ...section("colour", "Colour", one(notes.colour), tagged("palette", visualSystem.palette, (o) => list(record(o.palette).families)), colours.length > 0),
    ...section("imagery", "Imagery", one(notes.imagery), [...tagged("imagery", visualSystem.imagery, (o) => list(o.imagery)), ...leads("people_prominence", "People lead"), ...leads("product_prominence", "Product leads")]),
    ...section("devices", "Visual devices", one(notes.devices ?? visualSystem.decorative_system), tagged("visual_device", deviceSlugs, (o) => list(o.devices))),
    ...section(
      "branding",
      "Branding & consistency",
      one(notes.branding ?? visualSystem.brand_consistency),
      slides.some((slide) => slide?.brandTreatment)
        ? [{ value: "Brand mark", evidence: slides.flatMap((slide) => (slide?.brandTreatment ? [{ kind: "slide" as const, index: slide.index }] : [])) }]
        : [],
    ),
  ];

  // On a carousel, what every slide with something on it shares (layout, type, imagery, colour
  // families) and, for what doesn't, the slides that break from the most common version
  const live = observations.flatMap((o, index) => (o && !slides[index]?.blank ? [{ o, index }] : []));
  const consistency: PublicAnalysis["consistency"] = (() => {
    if (count < 2 || live.length < 2) return null;
    const dimensions: [string, (o: Record<string, unknown>) => string][] = [
      ["Layout", (o) => words("layout", o.layout).sort().join(" + ")],
      ["Type", (o) => [...words("typography", record(o.typography).classes).sort(), word("type_weight", record(o.typography).weight) ?? ""].join(" + ")],
      ["Imagery", (o) => words("imagery", o.imagery).sort().join(" + ")],
      ["Colour", (o) => words("palette", record(o.palette).families).sort().join(" + ")],
    ];
    const same: string[] = [];
    const varies: { label: string; evidence: EvidenceTarget[] }[] = [];
    for (const [label, key] of dimensions) {
      const keys = live.map(({ o }) => key(o));
      if (keys.every((k) => !k.replace(/[\s+]/g, ""))) continue;
      const tally = new Map<string, number>();
      for (const k of keys) tally.set(k, (tally.get(k) ?? 0) + 1);
      const [usual] = [...tally].sort((a, b) => b[1] - a[1])[0];
      if (tally.size === 1) same.push(label);
      else varies.push({ label, evidence: live.filter((_, i) => keys[i] !== usual).map(({ index }) => ({ kind: "slide" as const, index })) });
    }
    return same.length || varies.length ? { same, varies } : null;
  })();

  // Quality uncertainties belong to editor review, never a fallback public paragraph.
  const caveats = uniqueProse(texts(d.constraints_or_uncertainties), [
    ...list(d.integrity_notes).map((n) => text(record(n).note) ?? ""),
    ...list(d.creative_decisions).map((n) => text(record(n).watch_out) ?? ""),
  ]);
  const expected = analysis.expected_slides ?? count;
  const decisions = list(d.creative_decisions)
    .map(record)
    .flatMap((x): DecisionView[] => {
      const [title, explanation, observation, effect, principle, avoidWhen, watchOut] = [x.title, x.explanation, x.observation, x.rationale, x.principle, x.avoid_when, x.watch_out].map(prose);
      const evidence = parseEvidence(x.evidence, count).filter((target) => target.kind !== "slide" || !slides[target.index]?.blank);
      // A decision is shown whole or not at all, and only with something to point at
      if (!title || !observation || !effect || !principle || !evidence.length) return [];
      const confidence = x.confidence === "high" || x.confidence === "low" ? x.confidence : "medium";
      // Before 3.0 there's no explanation or watch-out: the observation says what was done, so it
      // leads, and "avoid when" becomes a watch-out that says so ("Avoid it when series differ…")
      const avoid = avoidWhen ? `Avoid it when ${/^[A-Z][a-z]/.test(avoidWhen) ? avoidWhen[0].toLowerCase() + avoidWhen.slice(1) : avoidWhen}` : null;
      return [{ title, explanation: explanation ?? observation, observation: explanation ? observation : null, effect, principle, watchOut: watchOut ?? avoid, evidence, confidence }];
    })
    .slice(0, 5);
  const application = record(d.application);
  const whenToUse = texts(application.when_to_use).map((s) => oneBased(s, count, numbering));
  const whenNotToUse = texts(application.when_not_to_use).map((s) => oneBased(s, count, numbering));
  const legacyUse = [...new Set(list(d.creative_decisions).map((x) => prose(record(x).use_when)).filter((s): s is string => !!s))];
  const legacyAvoid = [...new Set(list(d.creative_decisions).map((x) => prose(record(x).avoid_when)).filter((s): s is string => !!s))];
  const status: Record<string, IntegrityStatus> = { observed: "observed", sound: "observed", potential_concern: "concern", concern: "concern", cannot_verify: "cannot_verify", unverified: "cannot_verify" };
  return {
    headline: prose(d.strategy_headline) ?? concept,
    summary: (() => {
      const s = prose(d.strategy_summary) ?? prose(d.creative_summary);
      return s ? sentences(s, 2) : null;
    })(),
    concept,
    labels: [
      ...label("Type", word("archetype", record(d.primary_archetype).slug), record(d.primary_archetype).evidence),
      ...label("Inferred goal", word("objective", record(d.marketing_objective).slug), record(d.marketing_objective).evidence),
      ...label("Hook", word("hook_technique", hook.technique), hook.evidence),
      ...label("Format", count > 1 && pattern !== "single-image" ? word("narrative_pattern", pattern) : null, null),
    ],
    hookText: text(hook.observed_text),
    sequence: {
      pattern: count > 1 && pattern !== "single-image" ? word("narrative_pattern", pattern) : null,
      formula: formula(roles),
      arc: count > 1 ? prose(narrative.arc) : null,
      roles,
    },
    creativeDecisions: decisions,
    mechanisms: list(d.attention_mechanisms)
      .map(record)
      .flatMap((m) => insight(m.kind === "interpretation" ? "interpretation" : "observation", m.statement, m.evidence))
      .slice(0, 3),
    hypotheses: list(d.creative_rationale)
      .map(record)
      .flatMap((r) => insight("hypothesis", r.hypothesis, r.evidence)),
    integrity: list(d.integrity_notes)
      .map(record)
      .flatMap((x): IntegrityView[] => {
        const [aspect, note] = [text(x.aspect), prose(x.note)];
        // "verified" never comes from the model: only a real check against a source could set it
        const mapped = typeof x.status === "string" ? (status[x.status] ?? null) : null;
        return aspect && note && mapped ? [{ aspect, status: mapped, note, evidence: parseEvidence(x.evidence, count) }] : [];
      })
      .filter((note, i, notes) => notes.findIndex((other) => proseKey(other.note) === proseKey(note.note)) === i)
      // Concerns first, then what can't be checked, then plain observations
      .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)),
    formula: prose(d.creative_formula),
    visual,
    consistency,
    colours,
    copywriting: prose(d.copywriting),
    application: {
      whenToUse: whenToUse.length ? whenToUse : legacyUse,
      whenNotToUse: whenNotToUse.length ? whenNotToUse : legacyAvoid,
    },
    slides,
    takeaways: texts(d.takeaways).map((s) => oneBased(s, count, numbering)),
    adaptations: texts(d.adaptation_ideas).map((s) => oneBased(s, count, numbering)),
    caveats: caveats.map((s) => oneBased(s, count, numbering)),
    complete: analysis.image_analysis_complete === true && analysis.processed_slides === expected && expected === count && slides.every(Boolean),
  };
}
