# Supabase egress: what changed and what it saved

26 October 2026. The baseline, and the proof of what caused the 25 October spike, are in [supabase-egress-baseline.md](./supabase-egress-baseline.md); search in [search-performance.md](./search-performance.md). Production was only read: the one database change is a migration in this branch, not applied (see Rollout).

## In short

Real visitors were about 1% of the October 25 spike. The rest was builds (two per push, two per merge), each reading the database a post at a time, plus test runs on a laptop. Builds now read in batches. The Playbooks summary reads four fields instead of every analysis whole. Search asks for only what it shows (once the migration is applied), and a search's order is kept a few minutes. CI now fails a build that reads the database too much.

## Before and after (measured)

| | Before | After | Change |
|---|---:|---:|---:|
| **Cold build: Supabase requests** | 1,511 | 90 | **−94%** |
| Cold build: bytes, raw / gzipped | 15.60 / 3.27 MiB | 5.96 / 1.08 MiB | −62% / −67% |
| Cold build: time (static generation) | 189 s (80 s) | 103 s (37 s) | −45% |
| Post page reads at build, per post | 3 requests | ~0.3 (batched, up to 50 posts a request) | −90% |
| Playbooks summaries read, raw / gzipped | 1,735.6 / 280.1 KiB | 109.1 / 27.5 KiB | −94% / −90% |
| Dashboard search, 6 queries: requests | 8 | 7 (6 searches + 1 vocabulary) ¹ | −13% |
| Dashboard search, 6 queries: search bytes raw / gzipped | 329.4 / 69.3 KiB | 5.4 / 2.7 KiB ¹ | **−98% / −96%** |
| AI integration page examples (hourly): raw | 91.4 KiB | 2.0 KiB ¹ | −98% |
| MCP search, same 4 queries: search bytes raw / gzipped | 77.7 / 17.8 KiB | 25.3 / 7.3 KiB ¹ | −67% / −59% |
| MCP search, same query 3×: requests / time | 6 / 6,816 ms | 4 / 1,441 ms | −33% / −79% |
| MCP search, two pages: requests / time | 4 / 2,461 ms | 3 / 711 ms | −25% / −71% |
| Judged search relevance (95 requests, nDCG@10) | 0.542 | 0.542 | identical; all 95 ordered result lists identical |
| Search latency, 95 judged requests, p50 / p95 | 1,620 / 2,560 ms | 1,491 / 2,431 ms | within noise (no repeats in the set) |

¹ With the migration applied, measured by `scripts/perf/replay-projections.ts`: the app's own requests, answered by today's and the migration's functions in one transaction that rolls back, as `anon`. Every response kept the same posts in the same order. Until the migration is applied the app asks once, is refused, and asks the old way (one extra small request per process or browser visit).

How: `scripts/perf/measure-workflows.ts` (3 runs per workflow; latencies exploratory), metered cold builds (`CURATIT_SUPABASE_USAGE=<dir> next build`, `.next` removed first, then `scripts/perf/supabase-budget.mjs <dir>`), `npm run search:eval`. Both builds ran on the same laptop and network, and the same day and catalog (291 published posts).

## What changed

**Builds: batched post-page reads.** `src/lib/batch.ts` collects the keys asked for within 10 ms (up to 50) and reads them together, the DataLoader pattern from the `data-n-plus-one` best practice. `getPostDetail` (`src/lib/posts.ts`) and `getPublishedAnalysis` (`src/lib/creative/display.ts`) go through it, so the post pages a worker renders together share one `.in(...)` read per table. `next.config.ts` lets each build worker render 32 pages at once (Next's default is 8), so batches are larger: 276 requests a build at 8, 90 at 32. `getPostDetail` is now in Next's data cache too, like the analysis, with the same hour and the `library` tag, so a post's page and its modal, rendered by different workers, read it once. Slide records are read 1,000 rows a page (PostgREST's cap) and matched to each analysis's current version; slides are read only for posts with a published analysis. At run time a lone page waits 10 ms and reads alone, as before.

**Playbooks summaries: four fields, not the whole DNA.** `readBreakdownSummaries` selects `concept`, `strategy_headline`, `primary_archetype.slug` and `hook.technique` from each analysis's JSON (PostgREST `->>`), paging past 1,000. A headline that names a slide by number is renumbered from all of an analysis's prose, so those analyses (`mentionsSlides()`) are read whole. All 291 summaries are identical to the old read (`scripts/perf/check-summaries.ts`).

**Search projections (migration `20261026070552_search_projections.sql`, additive).**
- `curatit_mcp_search_v2` takes `fields`: `"card"` returns each result's analysis as its labels only; `"ids"` returns each result's id and short code, 100 to a page.
- `post_ids` limits a search to those posts (the dashboard's saved posts) before the page is cut.
- `curatit_mcp_search_v3` takes `fields: "card"` for hydration.
- `private.creative_mcp_card` builds a card from `private.creative_mcp_analysis`'s own output, so its labels can't differ.
- A request without the new fields gets byte-for-byte what it got before.

**App use of the projections.**
- The dashboard (`useLibrarySearch.ts`) asks for IDs scoped to the view: Discover's category, or the saved posts. A match ranked past the library's first 500 now counts in Saved and Discover.
- The MCP repository (`repo/supabase.ts`) asks for cards, and the AI integration page's examples ask for IDs.
- Each falls back to today's request when the database refuses the field (error 22023), once per process or visit.
- The public MCP and REST output is unchanged: `projection.test.ts` checks the tool output is identical with full analyses and with cards.

**Search ranking kept for a few minutes** (`services/search.ts`). A hybrid search's order is kept 5 minutes per server process: at most 200 searches, keyed by the request's fingerprint and the ranking version. Concurrent identical searches share one ranking, and a failed ranking isn't kept. Each page still reads its posts fresh, so a post unpublished since is left out; a post published since joins once the order expires.

**Instrumentation and the CI guard.**
- `src/utils/supabase/meter.ts` meters the public and MCP clients when `CURATIT_SUPABASE_USAGE` is set. It records requests, raw and gzipped bytes and errors per endpoint, never a query, header or body, and is off in production.
- CI meters its build, and `scripts/perf/supabase-budget.mjs` fails a build over 400 requests or 8 MiB gzipped. A return to the per-post pattern (~1,500) fails, while the library can grow about fourfold first.

**Retries.** The MCP client already retried only safe reads, once, inside the call's deadline. The public client keeps supabase-js's own bounded retries of GETs on 503/520 and network errors (exponential backoff, on by default since April 2026). Batching cut the number of requests that could retry by 94%. No change was needed.

## Images

Measured and left as they are: Supabase serves the originals with a 7-day `max-age`, so Vercel's optimizer already keeps each variant 7 days. A desktop feed tile is a 39 KiB WebP (19 KiB at 384 px), covers load lazily, and carousels load their slides only when a post opens. Adding AVIF would add a variant per width, and each variant is a separate original fetch from Supabase. Supabase's own image resizing is a Pro plan feature, and the MCP's inline images already use it sparingly. About 22 MiB of image traffic a day reaches Supabase, ~8 MiB of it uncached.

## Monthly egress forecast

`node scripts/perf/egress-estimate.mjs [--before] [--uncompressed] [--workload file.json] [--used-gb N --days-left N]`. Unit costs are measured (listed in the script with their sources). Workloads are assumptions:

| Assumption per day | Low | Expected | High |
|---|---:|---:|---:|
| Builds | 2 | 8 | 30 |
| Dashboard refreshes (hourly while visited) | 6 | 24 | 24 |
| People searching × searches each | 3 × 5 | 20 × 8 | 150 × 10 |
| MCP searches + next pages/repeats + posts | 10 + 5 + 10 | 60 + 30 + 60 | 400 + 200 + 400 |
| Post pages rendered at run time | 20 | 150 | 1,000 |
| Image originals fetched by the optimizer | 100 | 300 | 1,500 |

Forecast per 30-day cycle. Image fetches split 65% cached (Supabase CDN hits, as logged) and 35% uncached:

| Scenario | Before, gzipped | **After, gzipped** | After, if billed uncompressed (upper bound) | Fits 4 GB uncached (after)? |
|---|---:|---:|---:|---|
| Low | 0.38 GB uncached | **0.18 GB uncached, 0.18 GB cached** | 0.55 GB | yes |
| Expected | 1.49 GB | **0.66 GB uncached, 0.54 GB cached** | 2.16 GB | yes |
| High | 5.67 GB | **2.78 GB uncached, 2.72 GB cached** | 8.06 GB | gzipped yes; uncompressed no |

- At the expected workload, the 4 GB target holds up to 6.1× that activity.
- Builds alone would need 123 a day to reach it.
- At the uncompressed upper bound, the expected workload *before* the change comes to 6.2 GB, consistent with the 5 GB allowance running out on 25 October. So Supabase's metering may be closer to the uncompressed figures; the dashboard's usage page is the billing truth.
- Warning thresholds on the 5 GB allowance: 70% = 3.5 GB, 85% = 4.25 GB, 95% = 4.75 GB.
- This is a model, not a cap: nothing here enforces a limit.

## Rollout (not done by this branch)

1. Merge the app. It works before the migration: it falls back to today's requests, and builds already get the batched reads.
2. Apply the migration: `npx supabase db push` (additive: one new private function, and two functions regenerated from their live definitions with only the new fields; `git diff` against `20261025194719_hybrid_search.sql` shows exactly the changed lines). Then run `npx supabase db query --linked -f supabase/tests/search_projections.sql`: every check should read `true`.
3. Run the `get_advisors` security and performance checks, and `npm run search:eval`. The numbers should still be 0.542 / 0.504 / 0.814.
4. Watch the next builds' `supabase usage` line in CI, and the Supabase usage page over the following days.

**Rollback.** The app reverts on its own: the old app never sends the new fields, and the functions answer it as before. To take the migration back, run `supabase/rollbacks/20261026070552_search_projections.sql`. It restores the two functions exactly as they were live on 26 October (taken with `pg_get_functiondef` before the migration, so it is correct by construction; it was not run against production) and drops `private.creative_mcp_card`. No data is involved.

## Practices applied (Supabase skills)

- **N+1 to batch** (`data-n-plus-one`): `.in()` batches of ≤50 keys, from pages that render together.
- **Pagination** (`data-pagination`): reads that can pass PostgREST's 1,000-row cap page with `range`. Search keeps offset paging over its bounded, stable order (≤500), which the skill accepts for small bounded sets.
- **Select only what's used**: the summary read's JSON paths, and the search projections.
- **Indexes** (`query-missing-indexes`, `query-composite-indexes`, `query-partial-indexes`, `query-index-types`): no new index. The batched reads use the existing `post_slide_analyses_post_idx` and `post_analyses_post_id_key`: `EXPLAIN (ANALYZE, BUFFERS)` as `anon` showed 660 shared hits and no sequential scan of slides.
- **RLS** (`security-rls-basics`, `security-rls-performance`):
  - Untouched. The new function is `SECURITY INVOKER` in the unexposed `private` schema, with `EXECUTE` revoked from `PUBLIC` and granted to `anon`, `authenticated` and `service_role`, like the functions it sits beside.
  - The regenerated functions keep `search_path = ''`, fully qualified names, their 5 s statement timeout and their input validation (new fields allow-listed; `post_ids` must be a list of at most 2,000).
  - The checks ran as `anon`, so RLS applied.
- **Monitoring** (`monitor-pg-stat-statements`, `monitor-explain-analyze`): statistics read, never reset; `EXPLAIN ANALYZE` only on reads, in transactions that roll back.
- **Connection pooling** (`conn-pooling`): unchanged. Every read goes through PostgREST (the Data API), which pools its own connections.

## Freshness and withdrawal

- **Catalog and analyses: up to an hour, as before.** The library, post details and analyses are kept in Next's data cache no longer than the pages that use them (1 hour). Publishing or editing through the review page expires them at once (`refreshPostPage`).
- **Search: at most 5 minutes stale, never showing withdrawn posts.** A kept search order can be up to 5 minutes old, but posts are always read fresh, and the database returns published posts only.
- **Static pages: a gap that predates this change.** A post unpublished straight in the database stays on its already-built page until the next hourly revalidation or deploy; this change doesn't lengthen that.
- **Public bucket images stay reachable** by URL regardless of RLS. That is a known property of the public `library` bucket, unchanged here.

## Status

- **Implemented and verified locally / read-only against production:**
  - Batched builds and summaries, both measured.
  - Search projections, tested in a rolled-back transaction as `anon`. Default results are identical, cards and IDs keep the order, and scoped search returns posts ranked 31–50 in the global order.
  - Ranking cache and the dashboard's scoped search, covered by unit tests.
  - Instrumentation and the CI budget.
  - Estimator.
  - Tests: 468 of 469 pass. The exception is the theme-scopes check, which fails on Windows line endings only, as it does on main.
  - `tsc` and the Glaze lint are clean.
- **Blocked:**
  - **No local or non-production database.** Docker isn't available, and making a Supabase branch would change billing. The SQL was therefore tested in transactions that always roll back, as `anon`, with nothing left behind.
  - **No synthetic 10,000-post load test** (same reason).
  - **Latency samples are exploratory**: 3 per workflow, 95 per search configuration, not the 100 per condition the brief asks for.
- **Needs checking after deploy:** applying the migration (Rollout), CI's `supabase usage` line, and Supabase's usage page over a billing week.
