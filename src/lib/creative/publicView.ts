// Creative Intelligence on the public post page: the shape of what the page shows, and the
// helpers its client components need (evidence labels, the copied creative brief). No imports, so
// the browser never loads the taxonomy or the contracts with it; publicAnalysis.ts builds this
// view on the server.

// Where a statement comes from. A slide's index is zero-based; the screen shows index + 1
export type EvidenceTarget = { kind: "slide"; index: number } | { kind: "caption" } | { kind: "metadata" };

export type Insight = {
  text: string;
  kind: "observation" | "interpretation" | "hypothesis";
  evidence: EvidenceTarget[];
};

export type SlideDetail = {
  index: number;
  role: string | null;
  headline: string | null;
  body: string | null;
  legibility: "clear" | "partial" | "illegible" | "no-text" | null;
  observation: string | null;
  // Layout, type, imagery and so on, in words; only what says something about the slide
  facts: { label: string; value: string }[];
  // Approximate colours sampled from the image (#rrggbb), and their families in words
  colours: string[];
  colourNames: string[];
  brandTreatment: string | null;
  confidence: "high" | "medium" | "low" | null;
  // One flat colour with nothing on it (a video's blank cover): nothing about it can be said
  blank: boolean;
  // What differs from the slide before, compared field by field
  changes: string[];
};

// A creative decision as the page shows it: the technique and a sentence or two on it, then on
// request what was observed, its possible effect, the reusable principle and what to watch out
// for, with the slides that show it. Analyses from 2.1 have no explanation, so their observation
// stands in for it (and isn't repeated as Observed); their "avoid when" is the watch-out
export type DecisionView = {
  title: string;
  explanation: string;
  observation: string | null;
  effect: string;
  principle: string;
  watchOut: string | null;
  evidence: EvidenceTarget[];
  confidence: "high" | "medium" | "low";
};

// What kind of statement a data check is (3.0): an observation about what the creative shows, a
// potential concern, or something the post doesn't let anyone check. "verified" is reserved for a
// check against a real source; nothing Curatit shows today is. Older checks map across: sound is
// an observation, concern a potential concern, unverified can't be verified
export type IntegrityStatus = "observed" | "concern" | "cannot_verify" | "verified";
export type IntegrityView = {
  aspect: string;
  status: IntegrityStatus;
  note: string;
  evidence: EvidenceTarget[];
};

// One dimension of the visual system: an insight in a sentence, up to four attributes, and the
// slides that show them
export type VisualSection = {
  key: "composition" | "typography" | "colour" | "imagery" | "devices" | "branding";
  title: string;
  insight: string | null;
  chips: string[];
  evidence: EvidenceTarget[];
};

// A colour the post is built on: its measured hex and, from 3.0, the job it does
export type ColourView = { hex: string; role: string | null };

export type PublicAnalysis = {
  // The strategy in one line (3.0), else the concept, and a sentence or two after it
  headline: string;
  summary: string | null;
  // The idea in a line, for the brief
  concept: string;
  // Type, inferred goal, hook and format, when known
  labels: { label: string; value: string; evidence: EvidenceTarget[] }[];
  hookText: string | null;
  sequence: {
    // The narrative pattern in words ("Gallery", "Step by step"…)
    pattern: string | null;
    // Each slide's role in words, collapsed: "Hook → Gallery frame ×5 → Closing"
    formula: string | null;
    arc: string | null;
    roles: (string | null)[];
  };
  // The analysis's creative decisions (from 2.1 on; empty for analyses written before)
  creativeDecisions: DecisionView[];
  // What it does, as the analysis observed it: one line each (every analysis has these)
  mechanisms: Insight[];
  hypotheses: Insight[];
  // Checks on data, charts and claims (2.1)
  integrity: IntegrityView[];
  // The idea as a reusable sequence of moves (2.1): "Bold claim → Clear comparison → Visual evidence"
  formula: string | null;
  visual: VisualSection[];
  // On a carousel: what every slide shares, and what changes on which slides
  consistency: { same: string[]; varies: { label: string; evidence: EvidenceTarget[] }[] } | null;
  // The colour roles (3.0), else the colours measured on the slides, without roles
  colours: ColourView[];
  // How the words work (3.0), for the brief
  copywriting: string | null;
  // When the idea is worth using and when it isn't (3.0; from the decisions before that)
  application: { whenToUse: string[]; whenNotToUse: string[] };
  // One per image, by index; null where there's no record for that image
  slides: (SlideDetail | null)[];
  takeaways: string[];
  adaptations: string[];
  caveats: string[];
  // Every slide was read and recorded
  complete: boolean;
};

// Evidence as the screen names it: consecutive slides as one range ("Slides 1–6"), sparse ones
// apart ("Slide 1", "Slides 4–5"), then the caption. Each group points at its first slide
export function evidenceGroups(targets: EvidenceTarget[]): { label: string; target: EvidenceTarget }[] {
  const indices = targets.flatMap((target) => (target.kind === "slide" ? [target.index] : []));
  const groups: { label: string; target: EvidenceTarget }[] = [];
  for (let i = 0; i < indices.length; ) {
    let j = i;
    while (j + 1 < indices.length && indices[j + 1] === indices[j] + 1) j++;
    const [first, last] = [indices[i] + 1, indices[j] + 1];
    groups.push({ label: first === last ? `Slide ${first}` : `Slides ${first}–${last}`, target: { kind: "slide", index: indices[i] } });
    i = j + 1;
  }
  if (targets.some((target) => target.kind === "caption")) groups.push({ label: "Caption", target: { kind: "caption" } });
  if (targets.some((target) => target.kind === "metadata")) groups.push({ label: "Post details", target: { kind: "metadata" } });
  return groups;
}

// The data checks in a line: "2 potential concerns · 3 observations · 1 cannot verify"
export const STATUS_LABEL: Record<IntegrityStatus, string> = { concern: "Potential concern", observed: "Observed", cannot_verify: "Cannot verify", verified: "Verified" };
export function integritySummary(checks: IntegrityView[]) {
  const count = (status: IntegrityStatus) => checks.filter((check) => check.status === status).length;
  const parts = [
    [count("concern"), "potential concern", "potential concerns"],
    [count("observed"), "observation", "observations"],
    [count("cannot_verify"), "cannot verify", "cannot verify"],
    [count("verified"), "verified", "verified"],
  ] as const;
  return parts
    .filter(([n]) => n > 0)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`)
    .join(" · ");
}

export type BriefSource = { brand: string; url: string; format: "static" | "carousel" | "video"; slides: number };

// Slide numbers as ranges where they run on: [0,1,2,3,4,5] → "Slides 1–6"
function slideRange(from: number, to: number) {
  return from === to ? `Slide ${from + 1}` : `Slides ${from + 1}–${to + 1}`;
}

// A creative brief a designer can start from, built from what the page shows (3.0): objective,
// core idea, formula, visual structure, copywriting approach, production steps, constraints, and
// the source with a credit. It points at the original post; it never copies its words, images,
// marks or colour codes
export function briefText(analysis: PublicAnalysis, source: BriefSource) {
  const label = (name: string) => analysis.labels.find((l) => l.label === name)?.value ?? null;
  const lead = analysis.creativeDecisions[0];
  const lines: string[] = [`CREATIVE BRIEF`, `Built from a reference: ${source.brand} on Instagram`, ""];
  const section = (title: string, body: string[]) => {
    if (!body.length) return;
    lines.push(title.toUpperCase(), ...body, "");
  };

  const goal = label("Inferred goal");
  section("Objective", ["[What this piece has to do for your brand and audience.]", ...(goal ? [`The reference's inferred goal: ${goal.toLowerCase()}.`] : [])]);
  section("Core idea", [
    "[Your idea, in one sentence.]",
    `Built on: ${lead?.principle ?? analysis.concept}`,
    ...(analysis.adaptations[0] ? [`For example: ${analysis.adaptations[0]}`] : []),
  ]);
  section("Creative formula", analysis.formula ? [analysis.formula] : analysis.sequence.formula ? [analysis.sequence.formula] : []);

  const format = label("Format");
  const roles = analysis.sequence.roles;
  const structure: string[] = [];
  for (let i = 0; i < roles.length; ) {
    let j = i;
    while (j + 1 < roles.length && roles[j + 1] === roles[i]) j++;
    structure.push(`- ${slideRange(i, j)}: ${roles[i] ?? "Slide"}`);
    i = j + 1;
  }
  const colourRoles = analysis.colours.filter((colour) => colour.role).map((colour) => colour.role!.replace(/:.*$/, "").toLowerCase());
  section("Recommended visual structure", [
    `- Format: ${source.slides > 1 ? `Instagram carousel, about ${source.slides} slides${format ? ` (${format.toLowerCase()})` : ""}` : "Instagram single image"}`,
    ...structure,
    ...analysis.visual
      .filter((part) => part.insight && part.key !== "branding")
      .map((part) => `- ${part.title}: ${part.insight}`),
    ...(colourRoles.length ? [`- Colour jobs: ${[...new Set(colourRoles)].join(", ")}, in your own palette`] : []),
  ]);
  section("Copywriting approach", analysis.copywriting ? [analysis.copywriting, "Write your own words; don't reuse the reference's."] : []);
  section("Production steps", analysis.takeaways.map((step, i) => `${i + 1}. ${step}`));
  section("Important constraints", [
    ...[...new Set([...analysis.creativeDecisions.flatMap((decision) => (decision.watchOut ? [decision.watchOut] : [])), ...analysis.application.whenNotToUse])].map((line) => `- ${line}`),
    ...analysis.integrity.filter((note) => note.status === "concern").map((note) => `- ${note.aspect}: ${note.note}`),
    `- Make it original: your own imagery, words, layout and colours. Keep data, sources and disclosures accurate and legible.`,
  ]);
  section("Attribution and source", [
    `Reference: ${source.brand}, ${source.url}`,
    `Used for its principle only; its words, images and marks are ${source.brand}'s. Analysis by Curatit (AI-written, editor-checked).`,
  ]);
  return lines.join("\n").trim();
}
