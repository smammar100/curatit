# Creative Intelligence

AI-drafted, editor-approved analyses of library posts: what each post is (archetype, objective,
hook, narrative), what every slide shows (type, layout, imagery, colour, devices, the text on it),
and a short critique a designer can use (concept, why it might work, takeaways), every claim tied
to the slide or caption it came from. Nothing an AI writes is public until an editor approves it.

## How it flows

```
Apify import (seed chunk per brand)
  └─ creative_enqueue(posts, pipeline)      only posts whose images are all in Storage; once per post+content+pipeline
       └─ classification_jobs (pending)
            └─ npm run creative -- work     on a person's machine, with their Claude Code subscription
                 ├─ creative_claim_jobs     lease, renewed by heartbeat; an expired lease is retried
                 ├─ manifest + images       exact post_images paths, checked WebP/JPEG/PNG, ≤10 MB
                 ├─ perception              every slide, ≤10 per call, the model must open each image
                 ├─ synthesis               the Creative DNA from the slide notes, caption and metadata
                 ├─ validation              zod contract + deterministic checks, one repair attempt
                 └─ creative_save_analysis  version + slides + run + job, in one transaction
                      └─ post_analyses (needs_review), or a proposal beside reviewed work
                           └─ /dashboard/review   an editor approves, edits, rejects, publishes
                                └─ published: post_creative_labels → curatit_mcp_search_v2 / get_post_v2
Daily (Vercel cron) creative_reconcile      queues posts with no analysis, or changed since; never calls a model
```

Code: `src/lib/creative/` (taxonomy, contracts, validator, prompts, adapters, pipeline, worker),
`scripts/creative.ts` (CLI), `src/components/dashboard/review/` (review UI),
`src/app/api/cron/creative-reconcile/route.ts`, migrations `…_creative_intelligence.sql` and
`…_creative_mcp_v2.sql`, tests in `src/lib/creative/*.test.ts` and
`supabase/tests/creative_intelligence.sql`.

## The model, and the subscription

The worker runs the local Claude Code CLI (`claude -p`) signed in with a claude.ai subscription:
no API key. `ClaudeCliAdapter` removes `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` from the
child's environment, refuses to start unless `claude auth status` reports `claude.ai` or
`oauth_token`, and refuses on Vercel. Each call is sandboxed: `--restricted`, only the Read tool
(none for synthesis), no MCP servers, no settings or hooks, nothing saved, in a temporary folder
holding just that post's images, with a JSON Schema for the answer and a `--max-budget-usd` cap.
The stream of tool calls is checked so a slide the model never opened fails the call.

Anthropic's terms keep subscription use to ordinary, individual use and send products and
services to API keys ("Legal and compliance → Authentication and credential use" in the Claude
Code docs). So: analyses run only when a person starts them on their own machine, in modest
batches; nothing scheduled or deployed ever calls the model. If Curatit's volume grows, or the
work should run unattended, add an API-key adapter behind `ModelAdapter` (`src/lib/creative/model.ts`)
and set `CREATIVE_ANALYSIS_PROVIDER`; confirm with Anthropic if in doubt.

Usage limits: a session or weekly limit stops the worker (`usage_limit`), and its job is retried
an hour later; the rest of the queue waits. Costs recorded per run are the CLI's list-price
estimates, a usage proxy, not a bill.

## Setup

1. `.env.local` (see `.env.example`): `SUPABASE_SECRET_KEY` from Project Settings → API keys →
   Secret keys. Server-only: never `NEXT_PUBLIC_`, never committed (`.env*.local` is ignored).
2. Claude Code installed and signed in (`claude`, then `/login` with the subscription).
   `claude auth status` should say `"authMethod": "claude.ai"`.
3. Editors: `profiles.role` is `editor` or `admin` (only the admin account is set today). Editors
   see Analysis review in the account menu.
4. Vercel (for the daily reconcile only): `SUPABASE_SECRET_KEY`, `CRON_SECRET`,
   `CREATIVE_ANALYSIS_ENABLED=true`, and `CREATIVE_RECONCILE_APPLY=true` once its dry runs look
   right. `vercel.json` schedules it at 04:30 UTC.

## Commands

| Command | What it does |
|---|---|
| `npm run creative -- status` | Jobs by state, analyses by review state, the last day's runs and estimated cost, dead letters |
| `npm run creative -- enqueue --post <id> [<id>…]` | Queue posts (`--scrape-run <uuid>`, `--all`; `--force` queues a fresh analysis even if nothing changed) |
| `npm run creative -- reconcile` | Dry run: which published posts are due and why. `--apply` queues them, `--include-stale` adds posts analysed under an older pipeline |
| `npm run creative -- work --dry-run` | Which jobs would run next |
| `npm run creative -- work --limit 10 --budget 2` | Analyse queued posts. `--concurrency` (2), `--post-budget` (0.5), `--model` (sonnet), `--post <id>…`, `--slides-per-call` (10) |
| `npm run creative -- preview --post <id>` | Analyse one post and print it; saves nothing |
| `npm run -s creative -- eval-sample --size 30` | A stratified set of posts to label by hand |
| `npm run creative -- eval --labels <file> [--queries <file>]` | Score the AI against those labels, and search against designer judgements |
| `npm run -s creative -- taxonomy-sql` | The SQL that seeds the taxonomy, for a new migration after a vocabulary change |
| `npm test` | Unit tests (vitest) |
| `npm run creative:test-db [-- --with-migration]` | The database suite against the linked project, in a transaction that always rolls back |

`work` refuses the mock provider unless `CREATIVE_ALLOW_MOCK_WRITES=true` (it would save made-up
analyses), and refuses everything when `CREATIVE_ANALYSIS_ENABLED=false`.

## Budgets

- Per post: `--post-budget` / `CREATIVE_MAX_USD_PER_POST` (default $0.50), passed to each call as
  its `--max-budget-usd` and checked between calls. A post over budget fails alone (`budget`).
- Per run: `--budget` / `CREATIVE_MAX_USD_PER_RUN` (default $2): the worker claims nothing more
  once it's spent.
- Unchanged input is free: a job whose input fingerprint (caption, brand, category, every image's
  path and ETag, model, prompt and taxonomy versions) already has a version is skipped before any
  call. Imports and reconciles never queue the same post, content and pipeline twice.
- Size of the work, for planning: an image of 1080×1350 is about 1,900 input tokens; a 13-slide
  carousel is two perception calls (7 and 6 slides, ~25k image tokens plus ~4k of instructions)
  and one text-only synthesis call (~10k in, ~2k out). Measure the real figures on the canary
  (`status` and the runs table report each run's tokens and estimate).

## Permissions

| Who | Can |
|---|---|
| anon, signed-in members | Read the taxonomy; read the analysis, slides and labels of a published analysis of a published post (through RLS and the MCP functions). Nothing else: no drafts, versions, jobs, runs or review history |
| Editors (`profiles.role` editor/admin, checked by `private.is_editor()`) | Read everything; approve, reject, reopen, unpublish (`creative_review`); save edits as new versions (`creative_save_edit`); queue analyses (`creative_enqueue`). Only through those: they're thin wrappers over security definer functions in `private`, and editors have no direct write access to any of these tables, nor to `post_analyses` (the first schema's editor write grants and policies on it are removed). So every change leaves a version and a review event, and none can pass for the AI's |
| The worker (`service_role`, secret key) | `creative_claim_jobs`, `creative_heartbeat`, `creative_finish_job`, `creative_save_analysis`, `creative_post_manifest`, `creative_reconcile`. No browser role can execute these |

Versions are immutable apart from their review fields (a trigger). A run never overwrites an
analysis that's approved, rejected, published or edited by a person: it's saved as a proposal
the editor can compare and approve. Publishing requires approval (a check constraint). An editor's
approved edit of a live analysis stays live; a draft edit of one is filed as a proposal, so
saving never takes a live analysis down.

## Review

`/dashboard/review` lists what needs review, what failed (with Retry) and what's published, with
recent runs. A post's page shows every slide with its zero-based position and what was read off
it, the Creative DNA, all versions with a field-by-field comparison, the caption with quoted
evidence marked, and the history. Evidence chips (`slide:3`, `caption`) jump to what they cite.
Approve and publish, Approve, Edit (checked with the same validator as the worker, saved as a new
version), Reject, Reopen, Unpublish, Analyse again (a fresh job; its result arrives as a proposal).

Auto-publish (`CREATIVE_ANALYSIS_AUTO_PUBLISH=true` plus `work --auto-publish`) publishes results
with no warnings, every slide read and the model not asking for review. Leave it off until the
evaluation shows those results are reliably right.

## Failures

| Kind | What happens |
|---|---|
| `rate_limit`, `timeout`, `network`, `server`, `missing_media` | Back to the queue with exponential backoff and jitter (30 s doubling, max 1 h), up to 3 attempts, then failed |
| `usage_limit` | Retried in an hour; the worker stops |
| `auth` | The worker stops: sign in to Claude Code again |
| `invalid_output` | One repair attempt in the same run, then failed with the output kept on the run for review |
| `corrupt_media`, `unsupported` (video, >10 MB, >8000 px), `budget`, `stale_input`, `bug` | Failed straight away (dead letter) |
| Worker killed | The lease (15 min, renewed every 5) runs out and another run picks the job up; on its last attempt it's failed (`lease_expired`) |

Failed jobs show in the review queue and in `status`; Retry queues a fresh job. Nothing is
reported done until it's committed: the version, its slides, the run and the job's success are
one transaction.

Kill switch: `CREATIVE_ANALYSIS_ENABLED=false` stops the worker, the import's queuing (at seed
build) and the cron.

## Migrations and rollout

1. `npm run creative:test-db -- --with-migration`: applies both migrations inside a transaction on
   the linked project, runs the suite (169 checks: RLS and write access for every role, leases,
   retries, the overwrite rules, publishing, editing live analyses, MCP compatibility), and rolls
   back.
2. `npx supabase db push` (after review), then the advisors, then
   `npx supabase gen types typescript --linked > src/lib/database.types.ts`.
3. `npm run creative:test-db` again, now against the applied schema.
4. Milestone 1: `npm run creative -- preview --post <id> --provider mock` against the real data (no
   model call, nothing saved).
5. Milestone 2, needs approval: a 10-post canary (several 10+ slide carousels, short captions):
   `enqueue --post …` then `work --limit 10 --budget <agreed>`; review each in `/dashboard/review`.
6. Milestones 3–5: tune prompts and taxonomy (bump versions.json), then a resumable backfill
   (`reconcile --apply`, then `work` in batches), then `CREATIVE_ANALYSIS_ENABLED=true` on Vercel.

Rollback: each migration starts with the statements that undo it; undo `…_creative_mcp_v2` first
(its search column is generated from `creative_dna`). Nothing existing depends on the new objects;
`post_analyses` keeps its original columns, and the rollback restores editors' direct write access
to it.

## MCP

Additive; the existing `curatit_mcp_*` functions are unchanged (the suite compares their output
before and after).

- `curatit_mcp_search_v2(p_request jsonb)`: `{ query, category, brand, format, analysed_only,
  limit (1–50), offset (0–500), and any of archetype, archetype_family, objective, hook_technique,
  narrative_pattern, typography, layout, imagery, palette, visual_device, tone, persuasion, cta }`.
  Terms accept slugs, labels or synonyms; a list is any-of; dimensions are all-of. Ranked by text
  match on the published analysis (weighted over the caption) plus matched labels, newest first
  among equals. Each result has `reasons` (visual matches name the slides they were seen on) and
  `analysis` (primary_type, secondary_types, objective, visual_styles, typography_categories,
  layout_tags, narrative_pattern, hook_technique, creative_summary, why_it_might_work, takeaways,
  analysis_evidence with slide image paths, analysis_version, verified_status). No confidence
  score: none has been measured.
- `curatit_mcp_get_post_v2(p_id)`: `curatit_mcp_get_post` plus `creative`, with the narrative
  slide by slide.
- `curatit_mcp_creative_terms(p_dimension)`: the vocabulary with published counts.

The MCP server needs tools for these three; the existing tools keep working as they are. Hybrid
semantic search (pgvector) is the next step once the evaluation's held-out queries show it beats
keyword + taxonomy.

## Evaluation

1. `npm run -s creative -- eval-sample --size 30 > labels.json` (kept out of git: it names posts).
2. A person fills in `labels.json` from the posts themselves, without looking at the AI's answer.
3. After the canary or backfill: `npm run creative -- eval --labels labels.json --queries
   docs/creative-eval/queries.example.json` (fill each query's `relevant` ids by hand first).
4. The report: family and primary-archetype accuracy, per-archetype precision and recall,
   agreement on typography, layout and imagery, slide-role accuracy, missed-slide rate, evidence
   validity, accuracy of flagged vs unflagged analyses (is "needs review" pointing at the wrong
   ones?), and Precision@5.

## Taxonomy

`src/lib/creative/taxonomy.ts`, version in `versions.json`. Independent dimensions; archetypes in
17 families, with "other" and "unknown"; the long tail of type names lives on as synonyms. To change
it: append terms (never rename or reuse a slug), bump `taxonomy`, generate a migration with
`npm run -s creative -- taxonomy-sql`; a test fails until a migration holds the current version.
Changing the prompts bumps `prompt`. Either makes analysed posts eligible again only with
`reconcile --include-stale`.

## Not done yet

- Production schema push, generated database types, advisors (waiting for approval).
- The canary and the backfill (waiting for approval and a budget).
- The MCP server's tools for the v2 functions (the server isn't in this repository).
- Video posts (marked unsupported; no frame extraction).
- Labels for a calibrated auto-approval policy, and pgvector hybrid search.
