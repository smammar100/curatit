// Creative Intelligence on the public post page: the shape of what the page shows, and the
// helpers its client components need (evidence labels, the copied recipe). No imports, so the
// browser never loads the taxonomy or the contracts with it; publicAnalysis.ts builds this view
// on the server.

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
  decisions: Insight[];
  hypotheses: Insight[];
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

// The recipe a designer copies: the principle, the steps and the credit, from what's on screen
export function recipeText(analysis: PublicAnalysis, source: { brand: string; url: string }) {
  const lines = [analysis.concept];
  const technique = analysis.labels.filter((l) => l.label === "Type" || l.label === "Format").map((l) => l.value);
  if (technique.length) lines.push("", `Technique: ${technique.join(" · ")}`);
  if (analysis.sequence.formula) lines.push(`Sequence: ${analysis.sequence.formula}`);
  if (analysis.takeaways.length) lines.push("", "How to apply:", ...analysis.takeaways.map((s, i) => `${i + 1}. ${s}`));
  if (analysis.adaptations.length) lines.push("", "Adapt it elsewhere:", ...analysis.adaptations.map((s) => `- ${s}`));
  if (analysis.caveats.length) lines.push("", "Caveats:", ...analysis.caveats.map((s) => `- ${s}`));
  lines.push("", `Source: ${source.brand} on Instagram, ${source.url}`, `The original creative belongs to ${source.brand}. Use the principle, not the assets.`, "From Curatit");
  return lines.join("\n");
}
