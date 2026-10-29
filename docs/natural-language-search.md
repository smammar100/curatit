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
| Posts with customer testimonials | Testimonial |
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

The pieces: `src/lib/search/semantic/` (`documents.ts` builds each post's chunks and description, removing sentences the analysis pipeline writes word for word into five or more posts; `hybrid.ts` the keep rule and order; `models.ts` the two models through transformers.js), migration `20261025194719_hybrid_search` (pgvector, `post_search_documents`, `post_search_chunks`, `curatit_search_index_source`, `curatit_mcp_search_v3`, tested by `supabase/tests/hybrid_search.sql`), `npm run search:index` (embeds what changed; run after an import or after analyses are published or edited), `npm run search:models` (fetches the two int8 models, about 34 MB each, pinned and checksummed, into `./models`; also before every build, so the deployed server never downloads them). Since October 28 the dashboard's search uses it too (below).

An "or" between words left to search ("brand mascots or characters") is now the keyword search's own alternative; between filter values ("Nike or Wise") it's still refused.

## October 26 improvements

Thirty requests a designer would type, run against the live search, found everyday words read as filters and the meaning matches dropped by the request's framing. The judged set grew to 95 requests (`docs/search-eval/`, round 5) and every change was scored on it: nDCG@10 0.459 → 0.542, recall 0.424 → 0.504, precision 0.812 → 0.814, the same junk (19%) and the same answers for topics the library doesn't cover; requests that came back empty though relevant posts exist, 27 → 20.

- Everyday words that are also a label's or an industry's name stay words: funny, hilarious, motivational, motivation, inspiring, inspiration, summer, holiday, Black Friday, back to school, money, save money, review, customer review (`everyday` in `interpret.ts`; the whole phrase, so "Black Friday" doesn't become the colour black). "Summer campaign ideas" had become the one Seasonal label and brought back autumn posts; "save money on food delivery" was refused as two industries; "travel inspiration carousels" and "Nike motivational posts" required labels no post carried. Funny, motivational and customer reviews were added as aliases on October 25 and are taken out again. A label's own name still selects it ("seasonal posts", "inspirational tone", "humorous posts").
- "X or Y" between two values of one creative label is either value, which the database already matches ("witty or playful", "red or blue", "memes or user generated content"). With a label on one side only ("charts or data"), or labels of two kinds, both sides are searched as words, the keyword search's alternative. Between brands, industries or formats it's still refused; "and" between two values of one label still is too ("red and blue").
- MCP search's reranker first read the request without the words that only frame it ("posts that", "show me", "examples"). Later the same day that became two readings: the reranker reads the request as written and as the words the interpreter left (no framing, no filter words), and each post keeps its better score (`hybridPage` in `src/lib/mcp/services/search.ts`); the embedding still reads it whole. Over the 95 requests: nDCG@10 0.542 → 0.561, recall 0.503 → 0.519, precision 0.814 → 0.804. It brings back "posts aimed at students" (the trim had cut "posts", which matches its "social-post" description) and the crypto memes for "funny posts from fintech brands" (their descriptions say "Crypto & Web3, Finance", not "fintech brands"; read as "funny" they score 0.02 to 0.54), at the cost of a second reranker pass and three extra posts for "summer campaign ideas" that aren't about summer.
- Still empty: "save money on food delivery" and "saving money on groceries". The relevant posts offer promo codes, which the reranker doesn't connect with saving money. (Until October 28 the dashboard had no meaning search, so there an everyday word was matched in the text only.)

## Dashboard search by meaning (October 28)

Members searching the dashboard now get the same hybrid ranking as MCP and REST. In two launch simulations, finding a half-remembered post by describing it was the job people praised most, and until now only assistants could do it. On the judged set, the dashboard's top 10 went from nDCG@10 0.362, recall 0.346, precision 0.824 and 39 requests empty though relevant posts exist (keyword search with the browser's interpretation) to 0.561, 0.519, 0.804 and 19: the same as MCP search (`docs/search-eval/`, 28 October).

How a dashboard search runs now:

1. The browser interprets the request as before (`interpret.ts`: the chips, corrections, refinements and "Adjust your search" are unchanged). Exact brand, category and Playbook searches stay immediate and local; a request that's all filters stays keyword search, as in MCP.
2. With words left, it asks `POST /api/search` (`src/app/api/search/`) to rank the interpreted request by meaning while its own keyword pages load (`curatit_mcp_search_v2`, `fields: "ids"`, scoped, up to 500). The route is for signed-in members (the session cookie, same origin), counts against the MCP's per-account read limit (60 a minute, `dashboard:<user id>`), and runs `hybridOrder` in `services/search.ts`: the MCP's own ranking (embed, `curatit_mcp_search_v3`, reranked twice, the 0.02 cutoff), kept 5 minutes per server instance. It answers post ids only; the browser already holds every post's card, so nothing is hydrated.
3. The results wait for both: the route's order first (the matches the reranker keeps, best first, then the first 50 keyword matches), then the keyword matches past those, so no keyword match is lost. The count line says "Closest in meaning first". Tiles never reorder after they show.
4. If the route fails, isn't signed in, or hasn't answered in 12 seconds (a cold server loading its models; 6 seconds until 29 October, when a fresh ranking measured about 5 s on the live site and half the first searches fell back), the keyword results show with a one-line notice ("Searching by meaning isn't working right now, so these results only match your words.") and Try again. That answer isn't kept, so the next search asks again; the server finishes a ranking it started, so Try again after a slow first search is usually instant. With `CURATIT_HYBRID_SEARCH=off` the route answers `off` and the dashboard goes back to keyword search quietly for the visit.
5. Opening the search box asks `GET /api/search`, which starts the models loading in the background (`after()`), at most every five minutes per visit.

Saved searches send the saved posts' ids, and `curatit_mcp_search_v3` takes them since migration `20261028155252_hybrid_search_post_ids` (`post_ids`, as v2 takes it; tested by `supabase/tests/hybrid_search_post_ids.sql`, rollback in `supabase/rollbacks/`), so Saved is ranked by meaning within the saved posts, not cut from the whole library's top 30. Applied to production on 29 October (`npx supabase db push`; the checks pass against the live function, and the security and performance advisors show nothing new). Without it a Saved search would fall back to keyword results with the notice, since the database refuses the field.

Cost: one more function invocation per settled search with words left: about 2 s of function time on a laptop (median 1.9 s, two reranker passes over at most 30 descriptions), and the models' load on a fresh instance (14 to 36 s on a busy Windows laptop). On the live site (29 October, signed in, warm server) a fresh search took about 5 s end to end (5.0 to 5.2 s for three requests) and a repeated one 1.2 to 1.4 s: Vercel's function CPU is slower than the laptop's. Supabase: one `curatit_mcp_search_v3` read of 30 short descriptions per new search, plus the rate-limit counter, on top of today's id pages. Approved by the owner on 2026-10-28. Design references (Mobbin): Copilot's "Searching the web" status and Perplexity's "Image results for" line for the one line above the grid; Cosmos's search grid for keeping explanation off the tiles; Pinterest's scoped empty state for never mixing scopes silently.

## Boundaries

Interpretation is deterministic, and keyword search is full text. Hybrid search adds two small models that run on the server (an embedding model and a reranker), with no per-search charge and no call to a hosted model. It understands the supported taxonomy and aliases, and meaning beyond them only as far as gte-small and the reranker do; it does not infer visual similarity from the images or invent missing labels. Database requests still use normal infrastructure resources.

Quoted phrases remain literal. Negations, alternatives between brands, industries or formats, two values of one label joined by "and", and date ordering are rejected with guidance rather than inverted or silently broadened. Exact ambiguous brands such as On and Public work; within a sentence use `from On` or `by Public` to select them. Creative filters require published analysis; an unlabelled post will not match one merely because it looks appropriate. No filters are relaxed automatically.

## Verification

- Unit coverage: natural sentences, long-phrase precedence, plural formats, old industry aliases, ambiguous brands, literal phrases, unknown/Unicode text, unsupported constraints and query bounds.
- Service coverage: natural results and applied metadata, explicit-filter precedence without input mutation, literal mode compatibility, and cursor scope.
- Dashboard coverage: paginated ordering/deduplication, result cap, upstream errors, debounce and out-of-order responses.
- October 21: 411 tests passed, 6 skipped (live integration requires credentials); TypeScript and whitespace checks passed. Added paraphrase/typo cases, correction ambiguity protections, refinement round-trip checks, cache expiry, and MCP correction/refinement metadata. The prior live SQL examples below are dated October 18, not a new measurement of today's catalog.
- Read-only live SQL checks on the existing published catalog: feature launches in Finance returned Wise `DeJsl6nF39v`, Public `Dd_wdh5lBrC`, Robinhood `Dd9Lmh6o00b`, Wealthfront `DdrpIpkAYGX`. Product photography, sans-serif typography and collaboration searches returned labelled matches. Finance + carousel + number hook returned zero; this is retained as an honest empty result, not converted into looser matches.
- Live checks exercised the interpreted RPC requests. The signed-in browser flow and deployed MCP endpoint still require a deployment smoke check; local DOM tests exercise the new client request lifecycle.

Commands: `npm test`, `npm run typecheck`, `git diff --check`.
