# Natural-language search

Implemented on `feat/natural-language-search`, 2026-10-18; expanded and rebased onto `967cb2b` on 2026-10-21. Deployment requires publishing the branch, merging and deploying the application; there is no database migration or new API key. The initial push was blocked by automatic approval review; changes remain local until publishing is authorized.

## What changed

The dashboard previously required every word to appear in the short hook, brand or format. It now interprets supported English descriptions and searches the published catalog through `curatit_mcp_search_v2`, including captions, on-slide text and approved creative analyses. Exact brand/category searches remain immediate and local. Searches retain database relevance order instead of being reordered by For you preferences.

The MCP/REST service uses the same interpreter. `query_mode` now defaults to `natural`. Existing clients that require the previous behavior should explicitly send `all_words`; `any_word` remains available. `applied.original_query` holds the submitted sentence, `applied.query` the remaining keywords, and `applied.filters` the effective filters. Explicit filters win, with a warning. Cursors include the original query, interpretation, mode, filters and account.

| Query | Interpretation |
| --- | --- |
| Show me fintech carousels that open with a stat | Finance + carousel + number/statistic opening hook |
| Fintech posts launching a feature | Finance + feature launch |
| Find food posts with product photography | Food & Drink + product photography |
| Posts using sans serif fonts | Sans-serif typography |
| Single image brand partnership posts | Static + collaboration |
| Food posts about Halloween | Food & Drink + keyword `halloween` |
| Fintech posts about "Black Friday" | Finance + literal phrase `Black Friday` |
| I am looking for fintech ads announcing a new feature | Finance + feature launch |
| Posts with customer reviews | Testimonial |
| Carousels with app screens | Carousel + screenshot/UI imagery |
| Food carosuel posts | Food & Drink + carousel, with a visible correction |
| Product photgraphy | Product photography, with a visible correction |

## October 21 improvements

- Broader paraphrases for feature/product launches, testimonials, product showcases, app screenshots, illustration, data visualizations and layouts; better plurals such as `launches`.
- Conservative spelling correction: at most one edit (including adjacent transposition) in one word per matched phrase, minimum six characters, only one unambiguous taxonomy target. Exact vocabulary matches and quoted phrases are protected. Within a sentence, fuzzy brand names need `from` or `by`. Corrections appear in the dashboard and MCP warnings; they are interpretations, not guarantees of user intent.
- Ready-to-run refinements remove exactly one constraint or explicitly remove residual keywords. They are never executed automatically or described as having results. The dashboard provides buttons; MCP/REST exposes optional `suggested_queries` and includes them in text responses. No generated refinements for multi-value explicit filters or `analysed_only`, since those cannot currently round-trip through the natural grammar.
- Empty Saved/category searches offer **Search full library**, retaining the query. Invalid syntax asks for a changed query; network failures offer retry.
- The search panel offers three example descriptions. Successful complete results are cached for 60 seconds, at most 16 per feed snapshot; errors and capped responses are not cached. The taxonomy cache remains five minutes.
- Preserves main's current Playbooks, exact type/hook searches, feed spreading, keyboard behavior and design-system components. Search relevance is not reordered by personal feed preferences.

## October 25 improvements

Measured on 35 requests designers and assistants actually send, run through the MCP service against the live catalog: 18 came back empty and 4 were refused before; 4 are empty and none refused after, and each of those four is an honest empty (no post carries that combination of labels). The average search took 773 ms before and 577 ms after.

- Words that frame a request rather than describe a post are no longer required matches: campaign, content, creative, ideas, brand(s), design, colour and palette, messaging, strong, modern and the like. "Halloween campaign" searches `halloween`; "educational finance content" is Finance + Education.
- Everyday words that are also a whole industry or approach family count only when they are the entire request: "design" (Graphics & Design), "brand" and "product" (approach families). "Memes from food brands" no longer requires the Brand family.
- Spelling correction targets names and the curated aliases in `interpret.ts`, never the database's synonyms, which include everyday words: "content" was being corrected to the giveaway's "contest".
- A second creative approach in one sentence ("influencer collaboration", "product launch announcement") keeps the first as the filter and the second as words the post must also match, with a note in the response. This narrows; it never widens. Any other dimension still refuses two values ("red and blue posts").
- New designer vocabulary: infographic and chart (data visualisation), screenshot and UI, explain/explaining (explainer), user generated content and UGC, ask a question (community prompt), sale, minimalist/white space/clean (minimal tone), motivational, storytelling, emotional (empathy), funny (humour), dark background (black), tech (AI).
- The MCP server reads the vocabulary (taxonomy terms, industries, brands) once per server instance every five minutes (`recent()` in `src/lib/mcp/repo/supabase.ts`) instead of four round trips before every natural-language search.
- Keywords match only what an analysis says about the post itself (migration `20261025191109_search_post_text_only`, tested in `supabase/tests/search_post_text_only.sql`): its strategy, the title, observation, explanation and rationale of each decision, visual notes, copy, narrative and evidence. Not the takeaways and adaptation ideas (advice about other, hypothetical products), each decision's reusable principle and watch-out, the data checks, the label slugs or the internal quality notes. Before it, "banking app" found three minimal finance posts only through lines like "A meal-planning app could launch custom menus", and "product launch announcement" found six posts through one stock takeaway sentence; both are now honest empties. The match reasons read the same parts, so a reason always quotes text about the post.
- Still never relaxed: when every leftover word can't be matched, the search comes back empty with suggestions, as before. Posts carry one creative-approach label on average, so a request naming two ("influencer collaboration") is usually empty; its first suggestion is the first approach alone.

## Implementation

- `src/lib/search/interpret.ts`: shared pure interpreter, longest phrase matching, plurals, aliases, quotation handling, conservative spelling correction and conversational filler removal. Unknown words remain keywords. Brand/term names come from the catalog, not generated guesses. `refine.ts` generates explicit broader queries that round-trip through this interpreter.
- `src/components/dashboard/useLibrarySearch.ts`: 300 ms debounce, cancellation, stale-response protection, 15-second deadline, a five-minute cache of the public taxonomy, and ranked pagination. Exact brands/categories bypass remote work.
- `Feed.tsx`: displays interpretation, loading and error states. Search intersects the selected Discover category or Saved posts. Whitespace-only queries restore the feed.
- `src/lib/mcp/services/search.ts`: applies the shared interpretation to the existing repository, preserving explicit filters, signed pagination and empty-result suggestions.

The dashboard collects pages up to the existing 500-result limit before intersecting Saved/Discover. It reports the cap instead of implying completeness. This fits the current small catalog; for a substantially larger library, move scoped filtering and lightweight ID-only pagination into a dedicated database search RPC. The current RPC returns more metadata than the dashboard needs.

## Hybrid search (MCP and REST, October 25)

Curatit MCP's search (and `/api/v1/posts/search`) also finds posts by meaning, chosen from a judged test (`docs/search-eval/`: 60 requests, 828 blind-judged results). Against keyword search alone it ranks about 60% better (nDCG@10 0.285 → 0.464), finds about half again as many of the relevant posts (recall 0.252 → 0.384), with the same share of relevant results (0.789 → 0.792) and nothing more for topics the library doesn't cover.

How a search runs, when a natural-language request has words left after interpretation:

1. The whole request is embedded with gte-small (`Supabase/gte-small`, 384 numbers).
2. `curatit_mcp_search_v3` ranks the keyword matches exactly as `curatit_mcp_search_v2` does, under exactly its filters, takes the top 20 with the 30 posts closest in meaning (a post scores by its closest chunk: strategy and labels, caption, visuals and copy, decisions and narrative, evidence), and fuses them by reciprocal rank; the best 30 come back with each post's short description.
3. The reranker (`Xenova/ms-marco-MiniLM-L-12-v2`, a cross-encoder) reads the request with each description and scores it 0 to 1.
4. Every keyword match stays; a post found only by meaning stays when the reranker scores it 0.02 or more (`RERANK_CUTOFF`); they go best first, followed by the other keyword matches in keyword order (up to 50 keyword matches in all; past that a warning says so). Its `match_reasons` say it was close in meaning, and to which part of the post; `applied.ranking` is `hybrid`.

Filters are never loosened, and literal modes, sorting by newest and requests that are all filters keep keyword search, unchanged. If the models or the index fail, the first page answers with keyword search alone and a warning; a later page of a hybrid search asks to start again rather than mixing two orders. `CURATIT_HYBRID_SEARCH=off` turns it off.

The pieces: `src/lib/search/semantic/` (`documents.ts` builds each post's chunks and description, removing sentences the analysis pipeline writes word for word into five or more posts; `hybrid.ts` the keep rule and order; `models.ts` the two models through transformers.js), migration `20261025194719_hybrid_search` (pgvector, `post_search_documents`, `post_search_chunks`, `curatit_search_index_source`, `curatit_mcp_search_v3`, tested by `supabase/tests/hybrid_search.sql`), `npm run search:index` (embeds what changed; run after an import or after analyses are published or edited), `npm run search:models` (fetches the two int8 models, about 34 MB each, pinned and checksummed, into `./models`; also before every build, so the deployed server never downloads them). The dashboard's search is unchanged.

An "or" between words left to search ("brand mascots or characters") is now the keyword search's own alternative; between filter values ("Nike or Wise") it's still refused.

## Boundaries

Interpretation is deterministic, and keyword search is full text. Hybrid search adds two small models that run on the server (an embedding model and a reranker), with no per-search charge and no call to a hosted model. It understands the supported taxonomy and aliases, and meaning beyond them only as far as gte-small and the reranker do; it does not infer visual similarity from the images or invent missing labels. Database requests still use normal infrastructure resources.

Quoted phrases remain literal. Negations, alternative/multiple values within a dimension, and date ordering are rejected with guidance rather than inverted or silently broadened. Exact ambiguous brands such as On and Public work; within a sentence use `from On` or `by Public` to select them. Creative filters require published analysis; an unlabelled post will not match one merely because it looks appropriate. No filters are relaxed automatically.

## Verification

- Unit coverage: natural sentences, long-phrase precedence, plural formats, old industry aliases, ambiguous brands, literal phrases, unknown/Unicode text, unsupported constraints and query bounds.
- Service coverage: natural results and applied metadata, explicit-filter precedence without input mutation, literal mode compatibility, and cursor scope.
- Dashboard coverage: paginated ordering/deduplication, result cap, upstream errors, debounce and out-of-order responses.
- October 21: 411 tests passed, 6 skipped (live integration requires credentials); TypeScript and whitespace checks passed. Added paraphrase/typo cases, correction ambiguity protections, refinement round-trip checks, cache expiry, and MCP correction/refinement metadata. The prior live SQL examples below are dated October 18, not a new measurement of today's catalog.
- Read-only live SQL checks on the existing published catalog: feature launches in Finance returned Wise `DeJsl6nF39v`, Public `Dd_wdh5lBrC`, Robinhood `Dd9Lmh6o00b`, Wealthfront `DdrpIpkAYGX`. Product photography, sans-serif typography and collaboration searches returned labelled matches. Finance + carousel + number hook returned zero; this is retained as an honest empty result, not converted into looser matches.
- Live checks exercised the interpreted RPC requests. The signed-in browser flow and deployed MCP endpoint still require a deployment smoke check; local DOM tests exercise the new client request lifecycle.

Commands: `npm test`, `npm run typecheck`, `git diff --check`.
