# Search evaluation

A judged test set for Curatit MCP search, built on 25 October 2026 to choose between keyword search and search by meaning, and kept so any later change to search can be scored the same way: `npm run search:eval`.

- `queries.json`: 60 requests a designer or an assistant would send, in four kinds. 14 the taxonomy can express ("illustrated carousels explaining a concept"), 28 concepts in everyday words ("posts aimed at students", "nostalgia and retro throwback vibes"), 8 a brand with an idea ("Airbnb unique places to stay") and 10 about things the library doesn't cover ("scuba diving equipment"), where the right answer is nothing.
- `judgments.json`: 828 grades, one per request and post: 2 = clearly what was asked, every constraint included; 1 = partly (the main idea, a constraint missing); 0 = not what was asked, a loose association, or can't tell from the description. 551 zeros, 126 ones, 151 twos.

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

On the held-out half alone the shipped system scored 0.507 / 0.416 / 0.827 against keyword search's 0.312 / 0.283 / 0.842. By kind (nDCG@10, all requests): taxonomy 0.675 → 0.723, concepts 0.106 → 0.298, brand with an idea 0.230 → 0.594. The one junk result for a topic not covered is keyword search's own ("knitting patterns").

What it showed: meaning alone finds far more, but always returns something, so it fills a page for topics the library doesn't have; gte-small's similarity can't separate "about this" from "near this topic" (unrelated text still scores about 0.74), so a floor strict enough to stop the junk loses most of the gain. A cross-encoder reranker (`Xenova/ms-marco-MiniLM-L-12-v2`) reading the request with each candidate's short description separates them (a related text scores about 0.99, an unrelated one 0.00). Shorter descriptions (strategy, labels and caption) scored as well as long ones and rerank twice as fast. Concepts remain the weakest kind: reranked without a cutoff they reach 0.625, so the cutoff still drops good matches; that's the next thing to improve.

## Re-scoring

```bash
npm run search:eval
```

runs every request through the search service the server runs (the live catalog, read-only, and the models in `./models`) and prints the table's columns for all requests, for the held-out half and by kind. `-- --keyword` scores keyword search alone; `-- --out <file>` writes every result. A result nobody has judged counts as not relevant and is listed: before trusting a change that brings up many, grade them the same way (blind, strict, from the description) and add them to `judgments.json` with the next `round` number.
