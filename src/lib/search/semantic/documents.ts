// What hybrid search embeds and what its reranker reads, built from curatit_search_index_source
// (only what an analysis says about the post itself). The same texts the judged test used
// (docs/search-eval/): a post becomes up to five chunks, each opening with the brand, industries
// and format, and one short description for the reranker. Sentences the analysis pipeline writes
// word for word into many analyses ("This is not a measured performance result.") are removed
// first: any sentence found in five or more posts is boilerplate. Pure, so it runs anywhere.

export type IndexSource = {
  id: string;
  brand: string;
  format: string;
  caption: string | null;
  categories: string[];
  summary: string | null;
  strategy: string | null;
  decisions: string | null;
  visual: string | null;
  copy: string | null;
  narrative: string | null;
  evidence: string | null;
  // Dimension to the names of the post's labels in it, strongest first
  labels: Record<string, string[]>;
};

export type ChunkKind = "strategy" | "caption" | "visual" | "decisions" | "evidence";
export type SearchDocument = { postId: string; description: string; chunks: { kind: ChunkKind; text: string }[] };

const PARTS = ["strategy", "decisions", "visual", "copy", "narrative", "evidence", "summary"] as const;
const BOILERPLATE_POSTS = 5;
const DIMENSION_NAMES: Record<string, string> = {
  archetype: "Creative approach", archetype_family: "Approach family", objective: "Goal", hook_technique: "Opening hook",
  narrative_pattern: "Sequence", typography: "Typography", layout: "Layout", imagery: "Imagery", palette: "Colours",
  visual_device: "Visual devices", tone: "Tone", persuasion: "Persuasion", cta: "Call to action",
};
// The labels the reranker's short description names
const DESCRIPTION_DIMENSIONS = ["archetype", "objective", "hook_technique", "narrative_pattern", "imagery", "layout", "tone", "persuasion", "palette"];

const sentencesOf = (text: string | null) => (text ?? "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

// Every sentence that appears word for word in the analyses of five or more posts
export function boilerplateOf(posts: IndexSource[]): Set<string> {
  const seenIn = new Map<string, number>();
  for (const post of posts) {
    for (const sentence of new Set(PARTS.flatMap((part) => sentencesOf(post[part])))) seenIn.set(sentence, (seenIn.get(sentence) ?? 0) + 1);
  }
  return new Set([...seenIn].filter(([sentence, n]) => n >= BOILERPLATE_POSTS && sentence.length > 12).map(([sentence]) => sentence));
}

export function buildDocument(post: IndexSource, boilerplate: Set<string>): SearchDocument {
  const clean = (text: string | null, max = Infinity) => sentencesOf(text).filter((s) => !boilerplate.has(s)).join(" ").slice(0, max);
  const header = `${post.brand}. ${post.categories.join(", ")}. ${post.format}.`;
  // Every dimension the post has labels in, or only those listed
  const labels = (dimensions?: string[]) =>
    Object.entries(post.labels)
      .filter(([dimension]) => !dimensions || dimensions.includes(dimension))
      .map(([dimension, names]) => `${DIMENSION_NAMES[dimension] ?? dimension}: ${names.join(", ")}.`)
      .join(" ");
  const bodies: Record<ChunkKind, string> = {
    strategy: `${labels()} ${clean(post.strategy)} ${clean(post.summary)}`,
    caption: post.caption ?? "",
    visual: `${clean(post.visual)} ${clean(post.copy)}`,
    decisions: `${clean(post.decisions)} ${clean(post.narrative)}`,
    evidence: clean(post.evidence),
  };
  const chunks = (Object.entries(bodies) as [ChunkKind, string][])
    .filter(([, body]) => body.trim().length >= 20)
    .map(([kind, body]) => ({ kind, text: `${header} ${body}`.slice(0, 2500) }));
  const description = [
    header,
    clean(post.strategy, 260),
    labels(DESCRIPTION_DIMENSIONS),
    `Caption: ${(post.caption ?? "").replace(/\s+/g, " ").slice(0, 160)}`,
  ].join(" ").slice(0, 2000);
  return { postId: post.id, description, chunks };
}
