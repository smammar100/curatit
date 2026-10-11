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

// A creative decision as the page shows it (2.1): the technique, what was done, why it might work,
// the reusable principle, when to use it and when not, and the slides that show it
export type DecisionView = {
  title: string;
  observation: string;
  rationale: string;
  principle: string;
  useWhen: string;
  avoidWhen: string;
  evidence: EvidenceTarget[];
  confidence: "high" | "medium" | "low";
};

// A check on what a data-driven creative shows ("Start values", "Sources and disclaimers"…)
export type IntegrityView = {
  aspect: string;
  status: "sound" | "concern" | "unverified";
  note: string;
  evidence: EvidenceTarget[];
};

export type VisualSection = {
  title: string;
  text: string | null;
  rows: { value: string; evidence: EvidenceTarget[] }[];
};

export type PublicAnalysis = {
  concept: string;
  summary: string | null;
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

export type BriefSource = { brand: string; url: string; format: "static" | "carousel" | "video"; slides: number };

// Slide numbers as ranges where they run on: [0,1,2,3,4,5] → "Slides 1–6"
function slideRange(from: number, to: number) {
  return from === to ? `Slide ${from + 1}` : `Slides ${from + 1}–${to + 1}`;
}

// A creative brief a designer can start from, built from what the page shows: the principle, an
// objective, a concept to fill in, the format, the visual direction, the structure, the steps, the
// constraints and the credit. It points at the original post; it never copies its assets or words
export function briefText(analysis: PublicAnalysis, source: BriefSource) {
  const label = (name: string) => analysis.labels.find((l) => l.label === name)?.value ?? null;
  const lead = analysis.creativeDecisions[0];
  const lines: string[] = [`CREATIVE BRIEF`, `Reference: ${source.brand} on Instagram`, ""];
  const section = (title: string, body: string[]) => {
    if (!body.length) return;
    lines.push(title.toUpperCase(), ...body, "");
  };

  section("Creative principle", [lead?.principle ?? analysis.concept]);
  section("Suggested objective", label("Inferred goal") ? [label("Inferred goal")!] : []);
  section("Concept", [
    "[Your idea, for your brand and audience, in one sentence.]",
    `Built on: ${analysis.formula ?? analysis.concept}`,
    ...(analysis.adaptations[0] ? [`For example: ${analysis.adaptations[0]}`] : []),
  ]);
  const format = label("Format");
  section("Format", [source.slides > 1 ? `Instagram carousel, about ${source.slides} slides${format ? ` (${format.toLowerCase()})` : ""}` : "Instagram single image"]);
  section(
    "Visual direction",
    analysis.visual
      .filter((part) => ["Composition", "Typography", "Colour", "Imagery", "Branding"].includes(part.title))
      .map((part) => `- ${part.title}: ${part.text ?? part.rows.map((row) => row.value).join(", ")}`)
      .filter((line) => !line.endsWith(": ")),
  );
  const roles = analysis.sequence.roles;
  const structure: string[] = [];
  for (let i = 0; i < roles.length; ) {
    let j = i;
    while (j + 1 < roles.length && roles[j + 1] === roles[i]) j++;
    structure.push(`- ${slideRange(i, j)}: ${roles[i] ?? "Slide"}`);
    i = j + 1;
  }
  section("Content structure", structure.length ? structure : analysis.formula ? [analysis.formula] : []);
  section("Execution steps", analysis.takeaways.map((step, i) => `${i + 1}. ${step}`));
  section("Important constraints", [
    ...analysis.creativeDecisions.map((decision) => `- ${decision.avoidWhen}`),
    ...analysis.integrity.filter((note) => note.status !== "sound").map((note) => `- ${note.aspect}: ${note.note}`),
    `- Make it original: your own imagery, words and layout. Keep sources, disclosures and data shown accurately and legibly.`,
  ]);
  section("Original reference", [source.url]);
  section("Attribution", [`Reference creative by ${source.brand}, used for its principle only. Analysis by Curatit (AI-written, editor-checked).`]);
  return lines.join("\n").trim();
}
