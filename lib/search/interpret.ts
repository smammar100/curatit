import { filterDimensions, type FilterDimension } from "../taxonomy";

export type Interpretation = {
  dimension: FilterDimension;
  id: string;
  name: string;
  /** The words in the query that triggered this match. */
  phrase: string;
};

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "by", "for", "from", "in", "into", "is", "it", "of",
  "on", "or", "that", "the", "this", "to", "with", "without", "show", "me", "find", "posts",
  "post", "examples", "example", "some", "like",
]);

/** Lower-cased search tokens with stopwords removed. Letters and digits only. */
export function tokenize(query: string) {
  return (query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (token) => token.length > 1 && !STOPWORDS.has(token)
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Map natural-language phrases to controlled taxonomy terms.
 *
 * These are *suggestions*: search uses them to rank, and the UI shows them as
 * chips the user can promote to hard filters. They never silently constrain
 * results (plan §26.2).
 */
export function interpretQuery(query: string): Interpretation[] {
  const text = ` ${query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  const found: Interpretation[] = [];
  const claimed: Array<[number, number]> = [];

  const candidates: Array<{ dimension: FilterDimension; id: string; name: string; phrase: string }> = [];
  for (const [dimension, { terms }] of Object.entries(filterDimensions) as Array<
    [FilterDimension, (typeof filterDimensions)[FilterDimension]]
  >) {
    for (const term of terms) {
      const phrases = [term.name, ...("synonyms" in term ? term.synonyms : [])];
      for (const phrase of phrases) {
        const normalised = phrase.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        if (normalised) candidates.push({ dimension, id: term.id, name: term.name, phrase: normalised });
      }
    }
  }

  // Longest phrases first, so "bold typography" wins over "bold".
  candidates.sort((a, b) => b.phrase.length - a.phrase.length);

  for (const candidate of candidates) {
    // Allow simple inflections: launch → launches, explain → explaining/explained.
    const pattern = new RegExp(` ${escapeRegex(candidate.phrase)}(?:s|es|ing|ed|d)? `);
    const match = pattern.exec(text);
    if (!match) continue;

    const start = match.index;
    const end = start + match[0].length;
    if (claimed.some(([s, e]) => start < e - 1 && end - 1 > s)) continue;
    if (found.some((item) => item.dimension === candidate.dimension && item.id === candidate.id)) continue;

    claimed.push([start, end]);
    found.push(candidate);
  }

  return found;
}
