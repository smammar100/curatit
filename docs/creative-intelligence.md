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
                 ├─ manifest + images       exact post_images paths, checked WebP/JPEG/PNG, ≤10 MB, blank frames marked
                 ├─ perception              every slide, ≤10 per call, the model must open each image
                 ├─ synthesis               opens every slide again; the Creative DNA, checked against the images
                 ├─ validation              zod contract + deterministic checks, one repair attempt
                 └─ creative_save_analysis  version + slides + run + job, in one transaction
                      └─ post_analyses (needs_review), or a proposal beside reviewed work
                           └─ /dashboard/review   an editor approves, edits, rejects, publishes
                                └─ published: post_creative_labels → curatit_mcp_search_v2 / get_post_v2,
                                   and the post's page in the dashboard (rebuilt on publish): getPublishedAnalysis →
                                   toPublicAnalysis (current version only) → the Creative breakdown (spec sheet)
                                   and the Slide breakdown (post-analysis/*)
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
`oauth_token`, and refuses on Vercel. Each call is sandboxed: `--restricted`, only the Read tool,
no MCP servers, no settings or hooks, nothing saved, in a temporary folder
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
  and one synthesis call that opens all 13 again (~25k of images plus ~10k of records and
  instructions in, ~2k out). The first canary (prompt `2026.10.11-1`, synthesis without images)
  averaged $0.19 a post at list prices, $0.08 for a single image to $0.35 for 12 slides; `status`
  and the runs table report each run's tokens and estimate.

## What the prompt version 2026.10.11-2 changed, and why

A check of the first canary (every analysis compared with its slides by one reviewer, each
problem then challenged by a second) found every analysis usable but none right as it stood. The
same mistakes recurred, so the pipeline changed rather than the ten analyses:

- Synthesis wrote from the slide records alone, so it over-read them ("an all-black dress code"
  that was mostly black, a size step between two lines set at one size, a frame that wasn't
  there) and told designers "only the notes were available". It now opens every slide (the stream
  check applies, as for perception), is told the records can be wrong and the image wins, and
  any wording about notes, records or what it was given fails validation (`process_talk`) and
  goes to the repair attempt.
- Perception squeezed long on-slide text into a summary, dropping titles and writing a stand-in
  ("Terminator joke row") that synthesis then quoted. Text is now copied verbatim, line by line,
  cut with "…" if it doesn't fit, and lines set at one size stay together as the headline.
- Labels were stretched past their definitions (a URL coded as "visit", a feature list as "tips
  list", humour where there was none). The rule now: a slug only when its definition plainly fits;
  leave secondary archetypes and persuasion out rather than stretch.
- A video's black cover frame was read two ways in one post. `media.ts` measures every image
  (a channel spread of 16 or less is one flat colour; the library's black covers spread 0, every
  other slide over 250), the model is told the frame is blank, and `analyze.ts` records it the
  same way every time, with a `blank_slide` warning instead of a low-confidence one.
- A slide's own role and its role in the narrative disagreed. Perception may have seen only part
  of a long carousel, so the narrative's role is now kept for both.

## What prompt 2026.10.11-3 (Creative Intelligence 2.1) changed

Designers can ask a chat assistant to critique a post; Curatit has to give them more than that:
specific, evidence-backed decisions they can reuse, and honesty about what a creative shows.

- **Creative decisions** (`creative_decisions`): one to five choices that most shape how the post
  communicates, most important first, never padded to a number. Each has a title written as a
  technique, what was done (visible evidence), why it might work (hedged), the reusable principle,
  when to use it and when not, the slides that show it, and a confidence. On the post page they
  lead the Breakdown tab and opening one shows its slide.
- **Data checks** (`integrity_notes`): for anything with data, charts, prices, comparisons or
  financial, health, insurance, investment or scientific claims. Start values, time period, axes,
  baseline, units, transformations, inflation, end labels, missing context, assumptions, emphasis,
  and the legibility of sources and disclaimers, each sound, concern or unverified. Figures the
  post doesn't let the model check are unverified; nothing is presented as fact-checked, and no
  financial, medical or investment advice is given.
- **Visual notes and the formula** (`visual_notes`, `creative_formula`): a sentence each on how the
  composition, colour, imagery and branding are executed, and the idea as a reusable sequence.
- **Stricter advice.** The validator sends back any takeaway, adaptation, principle or formula that
  recommends distorting data (flattening or exaggerating a series, cutting an axis) or playing down
  a disclosure, jargon in place of an argument, and invented scores. Descriptions may still say
  what a post did ("the disclaimer is tiny"), which is how a tradeoff gets explained.

The new fields live inside `creative_dna` (no migration). They're optional in `CreativeDna`, so
analyses written before stay valid and their pages show their own observations instead of
decisions; the model is held to them through `CreativeDnaOutput`. A re-run of an approved post
lands as a proposal beside it, as always; nothing is published without review.

### Evaluation against an ordinary critique

`npm run creative:compare -- --set docs/creative-eval/eval-set.json` puts each post's latest stored
analysis beside the answer to "give me a design critique of this post" from the same model on the
same images, labelled A and B in a fixed random order, with a rating sheet and deterministic counts.
People rate them with `docs/creative-eval/rubric.md` (accuracy, specificity, evidence, novelty,
usefulness, principles, limitations, redundancy, hallucinations, time to understand); a model never
judges its own output. The set is 24 published posts across all seven categories; posts without a
2.1 analysis need one first (`enqueue --force`, then `work`), which is a budget decision.

## What prompt 2026.10.12-1 (Creative Intelligence 3.0) changed

An audit of the 2.1 analyses against their posts found the problems 3.0 is about. The Wealthsimple
chart's analysis said "over 11 years" for an axis labelled 2015 to 2025 (10 years elapse; the post's
own copy says 11). It marked "inflation adjustment and sources" sound because the footnote names
them. "Start all lines at one point and label their ends" was two techniques in one decision. The
hex values were the model's guesses. And the page was still long paragraphs.

- **Strategy first.** `strategy_headline` (8 to 14 words) and `strategy_summary` (one or two
  sentences) lead the post page.
- **Decisions, one technique each.** Two to four, never padded. Each has a short `explanation`
  (shown first), then on request what was observed, the possible effect, the reusable principle and
  a `watch_out`. A title that joins two moves is sent back (`compound_decision`); near-duplicates
  warn.
- **Data checks say what kind of statement they are.** `observed` (a fact about what the creative
  shows or states; stated is not verified), `potential_concern`, `cannot_verify` (listed sources
  don't verify figures). The model never writes "verified", and the validator refuses a note that
  calls a figure accurate, correct or verified. The prompt spells out elapsed time against labelled
  years, real against nominal values, a shared starting value as a presentation choice (not proof),
  legibility of fine print, and the qualifications an investment, financial, health or insurance
  claim gives or leaves out. `period_miscount` catches "11 years" for 2015–2025 unless the sentence
  attributes it to the post.
- **Measured colours.** `media.ts` measures each image's main colours from its pixels
  (`colours.ts`), the slide records keep those instead of the model's, the prompt lists them next
  to each image, and `colour_roles` (the job each colour does) must use one of them.
- **Posting account against visible marks.** A wordmark or series name on the image may not be the
  posting brand; it's described as what's visible.
- **Apply.** `application` (when to use, when not), `copywriting` (how the words work) and one or
  two adaptations feed the Apply tab and the copied brief.
- **Counting.** Any number given (slides, faces, lines, years) is counted on the images.

Older analyses keep working: every new field is optional in `CreativeDna`, the page maps 2.1's
statuses (sound → observed, concern → potential concern, unverified → cannot verify), uses a 2.1
decision's observation as its explanation and its avoid-when as its watch-out, and takes the first
sentence of the stored typography and device descriptions where 3.0 notes are missing. Nothing is
re-analysed in bulk: a new version of an approved post lands as a proposal, as always.

The first runs (proposals, not published): Wealthsimple `DeSB6D7NsfO`, Adidas `DeSAKiEG9nf`,
Wealthfront `DeMxAgbm3T2`, Deliveroo `DeRlksnIK-o`, Claude `DeSAJSDIMcQ`.

### Three-way evaluation

`npm run creative:compare` now writes up to three sides per post, blind and in an order fixed per
post: the newest stored analysis, the newest one from an earlier prompt (old Curatit), and the
ordinary critique from the same model on the same images. `--no-generic` compares Curatit's two
versions only and spends nothing. Rate with `docs/creative-eval/rubric.md`; a model never judges
its own output.

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

## Editorial quality update — 2026.10.17-1

The complete authoring brief is [creative-analysis-prompt.md](./creative-analysis-prompt.md).
This update supersedes the earlier broad instruction to add checks whenever a post contains a
price, claim or sensitive industry. Checks now require a concrete, material issue; ordinary
jokes, galleries, seasonal copy and product photographs normally have no data-check section.

An audit of all 217 existing analyses found 202 with the same public caveat repeated in their
data checks and constraints, and 162 with the same color-sampling disclaimer. The issue was
saved editorial content, reinforced by a public projection that fell back to internal
`quality.uncertainties`. The cleanup corrected 203 current analyses, retained 14 unchanged,
kept useful presentation and coverage limitations, and preserved the old immutable versions.
It did not claim to perform a fresh visual review of all 217 posts.

The executable prompt now gives each caveat one home. Validation rejects verification-only
boilerplate and normalized duplicate public caveats. The public projection deduplicates checks,
omits caveats already represented by checks or decision watch-outs, and never falls back to
internal quality metadata. Concrete missing-source notes remain supported.

The 20 newly imported posts (10 Postmates, 10 GoFundMe) received a separate visual review of all
47 stored images. Their authored notes are in `docs/creative-eval/session-2026-10-17/`; the
serializer in `scripts/maintenance/build-session-analyses.ts` measures colors, validates the
current contracts and writes save-ready analysis records. It is not a caption-based generator.
These new analyses are saved as drafts for the existing editor review workflow.

Maintenance uses new versions and copies the original slide records. The SQL template in
`scripts/maintenance/apply-editorial-cleanup.sql` checks the expected current version under a
per-post lock, so it refuses to overwrite newer work. It runs through a rolled-back transaction
before applying. Review notes identify the AI editorial cleanup without assigning a human actor.
