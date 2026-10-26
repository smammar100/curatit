# Supabase egress: baseline

Measured on 26 October 2026 (UTC) against Supabase project `ytxtwowgxmztaboxgdmq` (production, read-only), on the code at `e9b85fd` (main after PR 45). What changed and what it saved is in [supabase-egress-optimization.md](./supabase-egress-optimization.md); search in [search-performance.md](./search-performance.md).

**How things were measured.** Supabase's edge logs give request counts, paths, client IPs and the `x-client-info` header (supabase-js version and Node version), but no response sizes ("These logs currently do not include response byte data", Supabase's egress guide). So bytes were measured at the application boundary: `src/utils/supabase/meter.ts` wraps the Supabase clients' `fetch` and records, per endpoint, requests, response bytes and their gzipped size. Supabase answers Node clients with `Content-Encoding: gzip` (checked on 26 Oct), so **gzip bytes approximate what crossed the network; raw bytes are the decompressed JSON**. Both are reported. Image sizes come from Storage's object metadata and from a local `next start`.

- `scripts/perf/measure-workflows.ts`: the app's own read code, per workflow, cold then warm (3 runs; latencies are exploratory, not a load test).
- Metered `next build` (cold: `.next` removed), summed with `scripts/perf/supabase-budget.mjs`.
- Edge logs (24 hours retained on this plan) for counts and attribution; `pg_stat_statements` for cumulative SQL calls (no reset).

## What the database holds (verified 26 Oct, 07:18 UTC)

| | Brief said | Verified |
|---|---:|---:|
| Instagram posts | 367 | 367, of which **291 published** |
| Creative analyses | 291 | 291, all published and approved |
| Search documents | 291 | 291 (one per published, analysed post; none for unpublished posts) |
| Search chunks | 1,442 | 1,442, covering 291 posts |
| Slide analyses | 3,741 | 3,741 rows, of which **1,271** belong to the current published version (the rest are older versions, hidden from the public by RLS) |
| Creative labels | 4,337 | 4,337 |
| Library images | 1,654 | 1,654 objects, 147 MB, mean 92,907 bytes (90.7 KiB) |

## The October 25 spike: what caused it

Edge logs, 25 Oct 17:50–22:10 UTC: **37,575 requests**, sorted by the client that sent them (`x-client-info` names the Node version, which tells the machines apart; the IPs agree: one residential IP, Azure ranges, AWS ranges).

| Source | Requests | Share | What it was | Evidence |
|---|---:|---:|---|---|
| GitHub Actions builds (Node 24.21.0, Azure IPs) | 13,393 | 36% | 12 CI runs between 18:30 and 21:17 (PRs 40–44 and their merges), each a full `next build` | `gh run list`: run times match the 10-minute bursts; ~1,000–1,320 requests a burst, ~290–370 each of `post_analyses`, `post_slide_analyses`, `instagram_posts` |
| The owner's laptop (Node 24.19.0, one IP) | 12,571 | 33% | Two runs of `npm run test:mcp:live` (18:10–18:30: 1,828 `curatit_mcp_get_post_v2`, 1,824 `instagram_post_media`, ~4,860 `instagram_posts`), three local production builds (18:50, 19:00, 20:00, ~1,300 each), search evaluation runs | AGENTS.md records the two live test runs that day; the builds show the same per-post pattern as CI |
| Vercel builds (Node 24.22.1, AWS IPs) | 11,138 | 30% | Preview and production builds for the same pushes, ~880 requests each: 292 `post_analyses`, 291 `post_slide_analyses`, 293 `instagram_posts`, i.e. one of each per published post | Counts match the 291 published analyses exactly |
| Browsers and everything else | 473 | 1% | Visitors, the dashboard | |

**Cause: build-time static generation reading one post at a time, multiplied by many builds.** Every build renders every post page (`generateStaticParams` in `src/app/dashboard/post.tsx`, for the page and the intercepting modal route), and each post page made its own three reads: `getPostDetail` (`instagram_posts`), then `readPublishedAnalysis` (`post_analyses`, then `post_slide_analyses`). That is an N+1 across pages: ~880 requests a build on Vercel, ~1,000–1,500 on CI and locally (more workers, so more duplicate cache misses). Each push to a pull request built twice (GitHub CI and a Vercel preview), each merge twice more (CI on `main` and production). A busy afternoon of five PRs made about 24 builds.

**The October 25 caching fixes did not stop it.** They (PR 41, merged 19:16:42 UTC, inside the spike) moved the library and the Playbooks summaries into Next's data cache, which removed the per-page catalog reads, but `getPublishedAnalysis` is cached per post and `getPostDetail` wasn't cached at all, so a cold build still read each post individually: the builds at 20:20, 20:40, 21:00 and 21:10, after the fix, show the same ~880–1,300 requests. The same pattern recurred on 26 Oct at 06:00 (PR 45's builds: 1,295 / 1,311 / 1,305 reads of the three tables).

**Confidence:** high for the three classes (the Node versions and IP ranges separate them, and the per-build counts equal the number of published posts); high for the live tests (the `get_post_v2` and media counts match AGENTS.md's record); medium for mapping each individual burst to one specific commit. No retry storm was found: errors were rare and the counts are exact multiples of the post count.

## Workflows before the change

From `scripts/perf/measure-workflows.ts` (3 runs each; first run cold) and a cold metered build, 26 Oct.

| Workflow | Requests | Raw bytes | Gzip (≈ transfer) | Latency p50 (n=3) | Notes |
|---|---:|---:|---:|---:|---|
| **Cold `next build`** (700 pages, 7 workers) | **1,511** | **15.60 MiB** | **3.27 MiB** | 189 s build | 585 `instagram_posts`, 464 `post_analyses` (12.82 MiB raw: each worker read every analysis whole for the Playbooks summaries, and each post page read its own), 458 `post_slide_analyses`, 4 search RPCs |
| Library catalog (`getPublishedPosts`) | 1 | 297.2 KiB | 59.0 KiB | 1,240 ms | Once per worker per build, and per hourly dashboard refresh |
| Playbooks summaries (`getBreakdownSummaries`) | 1 | 1,735.6 KiB | 280.1 KiB | 829 ms | Every analysis's whole Creative DNA, to show a headline, a type and a hook. Unpaged: past 1,000 analyses PostgREST would cut it off |
| One post page (detail + analysis + slides) | 3 | 12.6 KiB | 4.1 KiB | ~840 ms | ×291 posts per build |
| Dashboard search, 6 queries | 8 | 376.6 KiB | 76.5 KiB | 3,597 ms (all 6) | Full search results (`curatit_mcp_search_v2`, 50 a page) just to learn short codes; ~57 KiB raw a query |
| MCP search, 4 natural-language queries | 11 | 130.3 KiB | 30.3 KiB | 2,827 ms | Includes the first vocabulary read (taxonomy, terms, brands) |
| MCP search, same query 3 times | 6 | 92.1 KiB | 30.9 KiB | 6,816 ms | Ranking (embedding, `curatit_mcp_search_v3`, rerank) redone every time |
| MCP search, two pages | 4 | 60.0 KiB | 16.5 KiB | 2,461 ms | Ranking redone for page 2 |
| MCP get post, 3 posts | 15 | 57.7 KiB | 13.2 KiB | 2,763 ms | Rich by contract; unchanged |
| AI integration page examples (hourly) | 4 | 91.4 KiB | 21.0 KiB | 719 ms | Full results for 24 short codes |

Search response sizes (raw UTF-8 JSON, same requests, measured in SQL as `anon`): 20 finance carousels 82,464 bytes; 50 "playful" results 176,333 bytes; `curatit_mcp_search_v3` hydration of 20 posts 84,925 bytes. Of each result, the post's analysis (`private.creative_mcp_analysis`: evidence ~1.0 KB, rationale, takeaways, summaries) is about 2.4 KB of ~3.8 KB, and search shows none of it but its labels.

`pg_stat_statements` (cumulative since its last reset; call counts only, not attribution): the per-post analysis read 52,121 calls, the post detail read 50,842 (15.9 ms mean), the slides read 49,147, `curatit_mcp_get_post_v2` 41,664: the per-post pattern dominates the database's work as well as its traffic.

## Images (Storage)

- Covers reach browsers through `next/image` (`/_next/image?url=/lib/...`), which Vercel's optimizer fetches from Supabase Storage through the `/lib` rewrite. Supabase serves the originals with `Cache-Control: public, max-age=604800` (7 days), longer than Next 16's 4-hour default `minimumCacheTTL`, so the optimizer already keeps each variant 7 days.
- One cover, WebP, quality 75 (measured on a local `next start`): 11.2 KiB at 256 px, 19.1 KiB at 384, **39.5 KiB at 640** (a desktop feed tile), 53.9 KiB at 828 (2× screens), 97.8 KiB at 1,080; the original is 124.6 KiB. Feed tiles load only the cover, lazily, with `sizes` from the column count; carousels load their slides only when a post opens.
- Storage edge logs, 25–26 Oct (24 h): ~470 requests: 252 full GETs of post images (165 Supabase CDN hits = cached egress, 87 misses = uncached), 70 conditional 304s, 19 range reads (MCP media), 15 resizes (MCP inline images), 93 brand logo requests. About 22 MiB a day, ~8 MiB of it uncached.

## Probable causes and what to do (as planned before the change)

| Problem | Cause | Evidence | Proposed | Expected |
|---|---|---|---|---|
| ~1,500 requests, 3.3 MiB per build, ~24 builds on a busy day | Post pages read one post each (N+1 across pages) | Edge logs, metered build | Batch the post pages' reads (DataLoader) and cache post details like analyses | ≥80% fewer requests per build |
| 1.7 MiB per Playbooks summary read, per worker and per hourly refresh | Whole Creative DNA read for four fields | Metered read | Read only the four fields; whole DNA only where a headline names a slide | ~90% fewer bytes |
| Dashboard search downloads full results | Rich RPC output for short codes | Workflow measurement | Opt-in ID projection, scoped to the view in the database | ~95% fewer bytes |
| MCP search hydration ~2.4 KB a result unused | Full analysis in each result | SQL sizes | Opt-in card projection, same public contract | ~60% fewer bytes |
| Repeat searches and next pages redo the ranking | No ranking cache | Workflow measurement | Keep each search's order a few minutes | Fewer RPCs, ~1 s less a repeat |
| Images | Already 7-day optimizer cache, lazy covers, 39 KiB tiles | Headers, sizes | Keep as is | — |

Live MCP tests reading production thousands of times were already taken out of `npm test` on 25 Oct; they still make ~4,300 requests a run when run on purpose.
