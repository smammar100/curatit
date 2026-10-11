// Creative Intelligence: measuring the AI against people. Labels come from a person who looked at
// each post without seeing the AI's answer (docs/creative-intelligence.md, "Evaluation"); the AI
// never grades itself. Reports family and archetype accuracy, per-archetype precision and recall,
// agreement on visual attributes, slide roles, missed slides, how often evidence holds up, whether
// "needs review" flags the analyses that are actually wrong, and Precision@5 for search queries.
import type { CreativeDna } from "./schema";
import { familyOf } from "./taxonomy";
import { validateDna } from "./validate";

export type HumanLabel = {
  post_id: string;
  primary_archetype?: string;
  family?: string;
  secondary_archetypes?: string[];
  objective?: string;
  narrative_pattern?: string;
  hook_technique?: string;
  typography?: string[];
  layout?: string[];
  imagery?: string[];
  slide_roles?: { position: number; role: string }[];
};

export type Prediction = { post_id: string; dna: CreativeDna; caption: string; expectedSlides: number; slidesRecorded: number };

export type SearchJudgement = { query: string; results: string[]; relevant: string[] };

const round = (n: number) => Math.round(n * 1000) / 1000;
const ratio = (hit: number, of: number) => (of ? round(hit / of) : null);

export function jaccard(a: readonly string[] = [], b: readonly string[] = []) {
  const x = new Set(a);
  const y = new Set(b);
  if (!x.size && !y.size) return 1;
  let both = 0;
  for (const v of x) if (y.has(v)) both++;
  return both / (x.size + y.size - both);
}

export function precisionAtK(results: string[], relevant: Iterable<string>, k = 5) {
  const wanted = new Set(relevant);
  const top = results.slice(0, k);
  if (!top.length) return 0;
  return top.filter((id) => wanted.has(id)).length / k;
}

function accuracy(pairs: [string | undefined, string | undefined][]) {
  const judged = pairs.filter(([truth]) => truth !== undefined);
  return { accuracy: ratio(judged.filter(([truth, guess]) => truth === guess).length, judged.length), n: judged.length };
}

export function evaluate(labels: HumanLabel[], predictions: Prediction[], searches: SearchJudgement[] = []) {
  const byPost = new Map(predictions.map((p) => [p.post_id, p]));
  const pairs = labels.flatMap((label) => {
    const prediction = byPost.get(label.post_id);
    return prediction ? [{ label, prediction, dna: prediction.dna }] : [];
  });

  // Per-archetype precision and recall on the primary archetype
  const classes = new Set(pairs.flatMap(({ label, dna }) => [label.primary_archetype, dna.primary_archetype.slug].filter(Boolean) as string[]));
  const perArchetype = Object.fromEntries(
    [...classes].sort().map((slug) => {
      const predicted = pairs.filter(({ dna }) => dna.primary_archetype.slug === slug);
      const actual = pairs.filter(({ label }) => label.primary_archetype === slug);
      const correct = predicted.filter(({ label }) => label.primary_archetype === slug).length;
      return [slug, { precision: ratio(correct, predicted.length), recall: ratio(correct, actual.length), support: actual.length }];
    }),
  );

  const mean = (values: number[]) => (values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null);
  const attribute = (key: "typography" | "layout" | "imagery", get: (dna: CreativeDna) => string[]) =>
    mean(pairs.filter(({ label }) => label[key]).map(({ label, dna }) => jaccard(label[key], get(dna))));

  const roles = pairs.flatMap(({ label, dna }) =>
    (label.slide_roles ?? []).map((truth) => [truth.role, dna.narrative.slide_roles.find((r) => r.position === truth.position)?.role] as [string, string | undefined]),
  );

  // Evidence that points at something real and quotes what's really there
  let refs = 0;
  let badRefs = 0;
  for (const { prediction, dna } of pairs) {
    refs += dna.evidence.length + dna.creative_rationale.reduce((n, r) => n + r.evidence.length, 0) + dna.primary_archetype.evidence.length;
    badRefs += validateDna(dna, { caption: prediction.caption, expectedSlides: prediction.expectedSlides }).errors.filter((e) => e.code === "bad_evidence_ref" || e.code === "quote_not_found").length;
  }

  // Does "needs review" (or a listed uncertainty) point at the wrong answers?
  const flagged = (dna: CreativeDna) => dna.quality.needs_review && (dna.quality.uncertainties.length > 0 || dna.constraints_or_uncertainties.length > 0);
  const primaryRight = ({ label, dna }: (typeof pairs)[number]) => label.primary_archetype === dna.primary_archetype.slug;
  const judgedPrimary = pairs.filter(({ label }) => label.primary_archetype);

  const expected = predictions.reduce((n, p) => n + p.expectedSlides, 0);
  const recorded = predictions.reduce((n, p) => n + Math.min(p.slidesRecorded, p.expectedSlides), 0);

  return {
    labelled: labels.length,
    analysed: pairs.length,
    family: accuracy(pairs.map(({ label, dna }) => [label.family ?? (label.primary_archetype ? familyOf(label.primary_archetype) : undefined), familyOf(dna.primary_archetype.slug)])),
    primaryArchetype: accuracy(pairs.map(({ label, dna }) => [label.primary_archetype, dna.primary_archetype.slug])),
    // Any of the human's archetypes (primary or secondary) among the AI's
    archetypeAgreement: mean(
      pairs
        .filter(({ label }) => label.primary_archetype)
        .map(({ label, dna }) => jaccard([label.primary_archetype!, ...(label.secondary_archetypes ?? [])], [dna.primary_archetype.slug, ...dna.secondary_archetypes.map((s) => s.slug)])),
    ),
    perArchetype,
    objective: accuracy(pairs.map(({ label, dna }) => [label.objective, dna.marketing_objective.slug])),
    narrativePattern: accuracy(pairs.map(({ label, dna }) => [label.narrative_pattern, dna.narrative.pattern])),
    hookTechnique: accuracy(pairs.map(({ label, dna }) => [label.hook_technique, dna.hook.technique])),
    attributes: {
      typography: attribute("typography", (dna) => dna.visual_system.typography),
      layout: attribute("layout", (dna) => dna.visual_system.composition),
      imagery: attribute("imagery", (dna) => dna.visual_system.imagery),
    },
    slideRoles: accuracy(roles),
    missedSlideRate: expected ? round(1 - recorded / expected) : null,
    evidenceValidity: refs ? round(1 - badRefs / refs) : null,
    uncertainty: {
      flaggedAccuracy: ratio(judgedPrimary.filter((p) => flagged(p.dna) && primaryRight(p)).length, judgedPrimary.filter((p) => flagged(p.dna)).length),
      unflaggedAccuracy: ratio(judgedPrimary.filter((p) => !flagged(p.dna) && primaryRight(p)).length, judgedPrimary.filter((p) => !flagged(p.dna)).length),
    },
    search: searches.length
      ? { queries: searches.length, precisionAt5: mean(searches.map((s) => precisionAtK(s.results, s.relevant, 5))) }
      : null,
  };
}
