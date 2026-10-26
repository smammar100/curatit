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

// Words that frame a request rather than describe a post ('posts that …', 'show me …'). The
// reranker reads the request beside each post's description, and the framing pulled good matches
// under the cutoff: for 'posts that make saving money feel fun' it scored Betterment's funny
// savings goals 0.013, for 'make saving money feel fun' 0.044 (2026-10-26)
const FRAMING = new Set("show find me please can could would you i want need looking search post posts ad ads example examples inspiration inspo reference references instagram idea ideas that which".split(" "));

// The request as the reranker reads it: the framing words left out, the rest in order. A request
// that's all framing is read as it is
export function rerankQuery(request: string) {
  const words = request.split(/\s+/).filter((word) => word && !FRAMING.has(word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")));
  return words.length ? words.join(" ") : request.trim();
}

// Why a post found only by meaning matched, in the words of the chunk it was closest to
const CHUNK_NAMES: Record<string, string> = { strategy: "strategy", caption: "caption", visual: "visuals and copy", decisions: "creative decisions", evidence: "slides" };
export function meaningReason(kind: string | null) {
  return `Close in meaning to the request${kind && CHUNK_NAMES[kind] ? ` (its ${CHUNK_NAMES[kind]})` : ""}, and the reranker judged it relevant`;
}
