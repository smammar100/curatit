# Search performance

26 October 2026, alongside [supabase-egress-optimization.md](./supabase-egress-optimization.md). Search works as [natural-language-search.md](../natural-language-search.md) describes, and this change keeps every result where it was. It changes what each response carries, where a scope applies, and how often a search's order is worked out.

## What a search sends back

`curatit_mcp_search_v2` and `curatit_mcp_search_v3` (hydration) take an optional `fields`. A request without it gets exactly what it did before (checked byte for byte, as `anon`, on 7 requests).

| `fields` | Each result carries | Who asks | 20 results, raw JSON |
|---|---|---|---:|
| (none) | id, short code, link, format, caption (400 characters), date, brand, categories, cover, score, match reasons, the full analysis (labels, prose, rationale, takeaways, evidence) | the app before this change; any other caller | 82,464 bytes (v2), 84,925 (v3 hydration) |
| `"card"` | the same, with the analysis cut to its labels and version (`private.creative_mcp_card`) | Curatit MCP and REST search | 28,616 (−65%), 29,650 (−65%) |
| `"ids"` | id and short code; 100 to a page | the dashboard, the AI integration page | 1,354 (−98%) |

The card keeps every field the public MCP/REST contract shows: `classification` reads only the labels, `analysis_available` the analysis's presence, and `caption_excerpt` the caption, cut to 240 characters after whitespace is folded (so the 400 stays). `src/lib/mcp/services/projection.test.ts` runs the search service over full and card results, keyword and hybrid, and requires identical output. Over the requests the app really sends, MCP search bytes fall 63–68% raw and 54–59% gzipped. The rich contract sets the floor: a caption, reasons, categories and cover per result.

The dashboard holds every post's card already (the feed's data), so its search needs only the order. Its six measured searches went from 329.4 KiB to 5.4 KiB, and from 7 requests to 6.

## Saved and Discover

A search in Saved or in a Discover category now applies that scope in the database before cutting pages:
- **Discover** sends the category as a filter.
- **Saved** sends the saved posts' ids as `post_ids` (at most 2,000; ids that aren't published posts match nothing).

Until now the dashboard fetched up to 500 global matches and kept the ones in view, which was right only while the library had fewer than 500 matching posts. A scoped search ranks within the scope in the same global order: in the rolled-back check, posts ranked 2, 7 and 31–50 of 89 came back in exactly that order. The feed still intersects with what it shows, as a safety net. Pages are bounded: 100 short codes a page, up to the same 500, after which the feed says it shows the first 500.

## A search's order, kept

Hybrid search (MCP and REST) works out a search's order from an embedding, a `curatit_mcp_search_v3` ranking read and the reranker: about a second, and the bulk of a search's time.
- **What's kept:** that order, for 5 minutes, for at most 200 searches per server process.
- **Key:** everything the order depends on, namely the original request, its interpretation, filters, mode and sort (the search's fingerprint), plus the reranker cutoff.
- **What's read fresh:** each page's posts, from `curatit_mcp_search_v3` with `p_ids`, so a post unpublished since never shows. One published since joins when the order expires.
- **Concurrency and failures:** concurrent identical searches share one ranking, and a failed ranking isn't kept.
- **Paging:** cursors are unchanged (HMAC-signed, tied to the search, the account and the catalog's marker). A next page on an instance without the order works the order out again, as before.

Measured: the same search three times took 6,816 ms and 6 database calls before, and takes 1,441 ms and 4 calls now. Two pages took 2,461 ms and 4 calls, and take 711 ms and 3 calls.

## Relevance

`npm run search:eval` on the judged set (95 requests, 1,200 grades):

| | nDCG@10 | Recall (judged positives) | Precision | Junk | Empty, relevant exist | Topics not covered |
|---|---:|---:|---:|---:|---:|---|
| main (`e9b85fd`) | 0.542 | 0.504 | 0.814 | 19% | 20 | 2 junk, 12 of 14 empty |
| This branch | 0.542 | 0.504 | 0.814 | 19% | 20 | 2 junk, 12 of 14 empty |

All 95 ordered result lists and ranking modes are identical (compared request by request). The projections change no ordering: the SQL check shows the same posts in the same order for default, card and IDs. The kept ranking can't change a first search. Latency over the 95 requests was p50 1,620 → 1,491 ms and p95 2,560 → 2,431 ms, on a laptop, with models warm. The set has no repeats, so the difference is noise.

## Not changed, with the evidence

- **Typo tolerance.** The interpreter's one-edit spelling correction already handles the brief's typo case: "fintehc carousels" reads as Finance + carousel, with the correction disclosed. No `pg_trgm`.
- **Vector index.** Exact search over all 1,442 chunks takes ~0.37 s as `anon` (row-level security included), within a ~1.5 s search, and it grows linearly. An HNSW index becomes worth testing around 10,000 chunks (about 2,000 analysed posts). Test it then for recall under selective filters, since an approximate index with a candidate limit can drop filtered matches. None is added now.
- **Full-text indexes, RRF and the reranker cutoff (0.02):** unchanged.
- **Candidate counts:** already bounded (20 keyword + 30 by meaning, 30 reranked).

## Still open

- **Synthetic 10,000-post benchmark: blocked.** No non-production database: there's no Docker here, and a Supabase branch would change billing.
- **Latency samples are small:** 3 per workflow and 95 per configuration, not 100 per condition under load.
- **Reranker readings (PR 46):** the separate change that reads requests several ways changes `hybridPage` too; whichever merges second resolves a small conflict there.
