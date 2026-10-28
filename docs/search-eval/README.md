# Search evaluation

A judged test set for Curatit MCP search, built on 25 October 2026 to choose between keyword search and search by meaning, and kept so any later change to search can be scored the same way: `npm run search:eval`.

- `queries.json`: 95 requests a designer or an assistant would send, in four kinds. The first 60 (`a`–`d`, 25 October): 14 the taxonomy can express ("illustrated carousels explaining a concept"), 28 concepts in everyday words ("posts aimed at students", "nostalgia and retro throwback vibes"), 8 a brand with an idea ("Airbnb unique places to stay") and 10 about things the library doesn't cover ("scuba diving equipment"), where the right answer is nothing. Then 35 more (`e01`–`e35`, 26 October): 30 a designer would type ("summer campaign ideas", "posts with charts or data", "Nike motivational posts") and five about saving money ("save money on food delivery"), from a check of the live search that found everyday words read as filters.
- `judgments.json`: 1,201 grades, one per request and post: 2 = clearly what was asked, every constraint included; 1 = partly (the main idea, a constraint missing); 0 = not what was asked, a loose association, or can't tell from the description. `round` says which judging round each came from (1 to 3 for the test, 4 for the live check, 5 for the 26 October change, 6 for its follow-up).

## How it was judged

Every system's top 10 for each request was pooled and shuffled, so nobody grading knew which system had found a post. Each post was described the way an analyst would: brand, industries, format, caption excerpt, the published analysis's strategy (only what it says about the post, with boilerplate removed), its labels and visual notes. The graders were AI agents given the instructions above, one grade per pair, told to be strict and literal. Two later rounds graded the posts the reranker brought up that no system had shown before, so every result scored was judged. The method's limits: the graders weren't designers, no pair was graded twice, and 60 requests is a first test, not a large one.

Each similarity or reranker cutoff was chosen on half the requests (alternate requests of each kind) and reported on the other half, so no cutoff was tuned to the numbers it's judged by.

## Results

All 60 requests, top 10 of each:

| System | Ranking (nDCG@10) | Relevant posts found (recall) | Results relevant (precision) | Junk | Empty, though relevant posts exist | Topics not covered: junk |
|---|---|---|---|---|---|---|
| Keyword search (before 25 Oct) | 0.285 | 0.252 | 0.789 | 21% | 28 | 1 |
| Meaning alone (gte-small) | 0.659 | 0.860 | 0.390 | 61% | 0 | 96 |
| Hybrid, fused by rank, no cutoff | 0.673 | 0.766 | 0.511 | 49% | 5 | 85 |
| Hybrid with a similarity floor (cosine ≥ 0.85) | 0.393 | 0.350 | 0.748 | 25% | 17 | 1 |
| **Hybrid, reranked, keyword matches kept, meaning-only matches scored ≥ 0.02 (shipped)** | **0.464** | **0.384** | **0.792** | **21%** | **16** | **1** |

On the held-out half alone the shipped system scored 0.507 / 0.416 / 0.827 against keyword search's 0.312 / 0.283 / 0.842.

Live check, 25 October, after the migration was applied and the index built (`npm run search:eval`, the deployed code against the live database, every result judged): **nDCG@10 0.475, recall 0.408, precision 0.778, junk 22%, 15 empty with relevant posts existing, topics not covered 1 junk and 9 of 10 empty**; held-out half 0.556 / 0.472 / 0.806. It differs from the test in four requests: the two with "or" now answer (6 relevant posts and 3 not, graded as round 4 of `judgments.json`), and requests that are all filters keep keyword ranking, so paging through them works as before. A search took a median 1.6 s on a laptop (keyword alone 0.3 s), most of it the reranker. By kind (nDCG@10, all requests): taxonomy 0.675 → 0.723, concepts 0.106 → 0.298, brand with an idea 0.230 → 0.594. The one junk result for a topic not covered is keyword search's own ("knitting patterns").

What it showed: meaning alone finds far more, but always returns something, so it fills a page for topics the library doesn't have; gte-small's similarity can't separate "about this" from "near this topic" (unrelated text still scores about 0.74), so a floor strict enough to stop the junk loses most of the gain. A cross-encoder reranker (`Xenova/ms-marco-MiniLM-L-12-v2`) reading the request with each candidate's short description separates them (a related text scores about 0.99, an unrelated one 0.00). Shorter descriptions (strategy, labels and caption) scored as well as long ones and rerank twice as fast. Concepts remain the weakest kind: reranked without a cutoff they reach 0.625, so the cutoff still drops good matches; that's the next thing to improve.

## 26 October: everyday words, framing words and "or"

Thirty requests run against the live search found everyday words read as filters: "summer" and "back to school" became the one Seasonal label (autumn and Halloween posts came back), "funny" and "motivational" a humour or tone label the right posts don't carry, "money" the Finance industry ("save money on food delivery" was refused as two industries), "customer reviews" a second creative approach, and "posts with charts or data" was refused as two searches. Three changes, each scored here before and after:

1. Everyday words that are also a label's or an industry's name stay words (`everyday` in `src/lib/search/interpret.ts`): funny, hilarious, motivational, motivation, inspiring, inspiration, summer, holiday, Black Friday, back to school, money, save money, review, customer review. A label's own name still selects it ("seasonal posts", "inspirational tone").
2. The reranker reads the request without the words that only frame it ("posts that", "show me", "examples"; `rerankQuery`, replaced the same day by two readings, below). The embedding still reads the whole request.
3. "X or Y" between two values of one creative label is either value ("witty or playful", "memes or user generated content"); beside a label on one side only ("charts or data") both sides are searched as words. Between brands, industries or formats it's still refused.

Every result of the runs below was graded blind as round 5 (363 new grades, four graders), together with the top 10 of a run with no reranker cutoff, so relevant posts both versions missed count against recall. The two versions of change 2 (these framing words, or every word the interpreter ignores) were compared on the calibration half: the same ranking (0.482 against 0.484) with more precision (0.816 against 0.795), so the framing words shipped.

| All 95 requests | Ranking (nDCG@10) | Recall | Precision | Junk | Empty, though relevant posts exist | Topics not covered: junk, empty |
|---|---|---|---|---|---|---|
| Before | 0.459 | 0.424 | 0.812 | 19% | 27 | 2, 12 of 14 |
| Everyday words as words, "or" (1 and 3) | 0.539 | 0.499 | 0.814 | 19% | 20 | 2, 12 of 14 |
| **All three (shipped)** | **0.542** | **0.504** | **0.814** | **19%** | **20** | **2, 12 of 14** |

The first 60 requests alone: 0.436 → 0.446 nDCG@10, 0.382 → 0.401 recall, 0.778 → 0.767 precision. The 35 new ones: 0.496 → 0.697, 0.492 → 0.665, 0.864 → 0.871. Held-out half: 0.515 / 0.473 / 0.817 before, 0.604 / 0.555 / 0.811 after.

Requests that came back from empty or wrong: "posts with charts or data" (refused → 9 relevant of 10), "travel inspiration carousels" (empty → 8 of 10), "social proof with customer reviews" (empty → 3 of 8), "Coca-Cola holiday moments" (empty → 2 of 5), "Nike motivational posts" (empty → 2 of 5), "summer campaign ideas" (six autumn posts → the one summer post first), "back to school posts" (six autumn posts → a back-to-school post first), "funny posts about saving money" (empty → 3 of 3), "posts that make saving money feel fun" (1 → 2 relevant), "posts for language learners" (empty → 1). Worse: "funny posts from fintech brands" (0.65 → 0.30: the humour label had found three crypto memes, the word "funny" finds one post), and "posts aimed at students" (0.43 → 0: without "posts", its one match scores under the cutoff). Still empty with relevant posts in the library: "save money on food delivery" and "saving money on groceries" (no longer refused, but nothing clears the cutoff), "healthy eating tips" (one partial match).

The reranker change on its own is close to neutral: it adds 0.015 on the calibration half and costs 0.008 on the held-out half. It's what brings back "posts for language learners" and the saving-money requests, and what loses "posts aimed at students".

## 26 October, later: the reranker reads the request twice

The four requests still missing after that change were traced against the live catalog. "Posts aimed at students" lost DoorDash's student offer to the trimmed request: it scores 0.565 as written ("posts" matches "social-post" in its description) and 0.013 trimmed. "Funny posts from fintech brands" lost the crypto memes, which score about 0.0001 as written, because their descriptions say "Crypto & Web3, Finance" where the request says "fintech brands", although the Finance filter already guarantees that; read as the word the interpreter left, "funny", they score 0.02 to 0.54. "Save money on food delivery" and "saving money on groceries" stay empty: the relevant Postmates posts offer promo codes ("$15 off $35"), which the reranker doesn't connect with saving money (under 0.002), and groceries has one partial match. That's the model's limit, and no hand-made expansion was added for it.

So the reranker now reads each request twice, as written and as the words the interpreter left (no framing, no filter words, `request.query`), and each post keeps its better score (`hybridPage` in `src/lib/mcp/services/search.ts`). The trimmed reading is gone: it added nothing once the leftover words were read. Four versions were scored on all 95 requests, every result judged (one new grade, round 6):

| All 95 requests | Ranking (nDCG@10) | Recall | Precision | Junk | Empty, though relevant posts exist | Calibration half (nDCG / recall / precision) |
|---|---|---|---|---|---|---|
| Trimmed reading (before) | 0.542 | 0.503 | 0.814 | 19% | 20 | 0.482 / 0.451 / 0.816 |
| Best of as written and trimmed | 0.547 | 0.504 | 0.811 | 19% | 19 | 0.481 / 0.451 / 0.816 |
| Best of all three readings | 0.561 | 0.521 | 0.802 | 20% | 19 | 0.494 / 0.462 / 0.805 |
| **Best of as written and leftover words (shipped)** | **0.561** | **0.519** | **0.804** | **20%** | **19** | **0.494 / 0.462 / 0.810** |

Held-out half, shipped: 0.629 / 0.576 / 0.799 (before 0.604 / 0.555 / 0.811). Topics the library doesn't cover are unchanged (2 junk, 12 of 14 empty).

Better: "funny posts from fintech brands" (0.28 → 0.71, 1 → 4 relevant), "posts aimed at students" (empty → its one relevant post), "how a product is made" (0.61 → 0.92), "product on a plain coloured background" (0.38 → 0.65, 2 → 4 relevant), "football and soccer" (5 → 6 relevant), "brand mascots or characters", "posts with charts or data". Worse: "summer campaign ideas" keeps its summer post first but adds three posts that aren't about summer (1 of 2 → 1 of 5), "a celebrity or famous person fronting the post" (9 → 8 relevant), "funny posts about saving money" (3 → 2 relevant). Precision falls by a point (0.814 → 0.804) for 1.6 points of recall.

The cost is a second reranker pass. One pass over 30 descriptions took a median 1.35 s on a laptop that was busy with another session's work, so a hybrid search takes about one pass longer than before. That's well inside the 25 s a tool call has; hybrid search only starts with 8 s left.

## 28 October: the dashboard

The dashboard's search now ranks by meaning through `/api/search` (`docs/natural-language-search.md`). `npm run search:eval -- --dashboard` runs it as the browser does, with the server's ranking called directly; `--keyword` with it is the dashboard as it was. Same catalog, same day:

| All 95 requests | Ranking (nDCG@10) | Recall | Precision | Junk | Empty, though relevant posts exist | Topics not covered: junk, empty |
|---|---|---|---|---|---|---|
| Dashboard before (keyword, its own interpretation) | 0.362 | 0.346 | 0.824 | 18% | 39 | 2, 12 of 14 |
| **Dashboard with meaning (shipped)** | **0.561** | **0.519** | **0.804** | **20%** | **19** | **2, 12 of 14** |
| MCP search, before and after this change | 0.561 | 0.519 | 0.804 | 20% | 19 | 2, 12 of 14 |

Held-out half: 0.412 / 0.389 / 0.823 before, 0.629 / 0.576 / 0.799 after. By kind (nDCG@10): taxonomy 0.671 → 0.794, concepts 0.156 → 0.339, a brand with an idea 0.284 → 0.767. The dashboard with meaning returns the same top 10 as MCP search on every request. The keyword run brought up 8 results nobody has judged (three requests, counted as not relevant), so its figures may be a little low. Median time a search on a laptop running a dev server alongside: 297 ms keyword, 2,242 ms with meaning.

## Re-scoring

```bash
npm run search:eval
```

runs every request through the search service the server runs (the live catalog, read-only, and the models in `./models`) and prints the table's columns for all requests, for the held-out half and by kind. `-- --keyword` scores keyword search alone; `-- --dashboard` scores the dashboard's search instead (its own interpretation, the exact brand and category shortcut, its keyword pages and the order `/api/search` adds; with `--keyword`, the dashboard as it was before October 28); `-- --out <file>` writes every result. A result nobody has judged counts as not relevant and is listed: before trusting a change that brings up many, grade them the same way (blind, strict, from the description) and add them to `judgments.json` with the next `round` number.
