// How hybrid search settles the order, from the judged test (docs/search-eval/): every candidate
// is reranked; a keyword match always stays (it matched the words or the filters), a post found
// only by meaning stays when the reranker scores it RERANK_CUTOFF or more; the kept candidates go
// by reranker score, then the other keyword matches follow in keyword order. Pure.

// The cutoff the judged test chose on its calibration half: the most relevant posts found without
// more junk, or more results for topics the library doesn't cover, than keyword search alone
export const RERANK_CUTOFF = 0.02;

export type Candidate = { id: string; keywordRank: number | null; similarity: number | null; kind: string | null; description: string | null };
export type Ranked = { id: string; rerank: number | null; meaningOnly: boolean; kind: string | null };

export function settle(candidates: Candidate[], scores: (number | null)[], keywordRest: string[]): Ranked[] {
  const kept = candidates
    .map((candidate, index) => ({ candidate, score: scores[index] ?? null, index }))
    .filter(({ candidate, score }) => candidate.keywordRank !== null || (score ?? 0) >= RERANK_CUTOFF)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.index - b.index)
    .map(({ candidate, score }) => ({ id: candidate.id, rerank: score, meaningOnly: candidate.keywordRank === null, kind: candidate.kind }));
  const seen = new Set(kept.map((r) => r.id));
  return [...kept, ...keywordRest.filter((id) => !seen.has(id)).map((id) => ({ id, rerank: null, meaningOnly: false, kind: null }))];
}

// Why a post found only by meaning matched, in the words of the chunk it was closest to
const CHUNK_NAMES: Record<string, string> = { strategy: "strategy", caption: "caption", visual: "visuals and copy", decisions: "creative decisions", evidence: "slides" };
export function meaningReason(kind: string | null) {
  return `Close in meaning to the request${kind && CHUNK_NAMES[kind] ? ` (its ${CHUNK_NAMES[kind]})` : ""}, and the reranker judged it relevant`;
}
