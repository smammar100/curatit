-- Creative Intelligence v1: AI-drafted, human-reviewed analyses of library posts.
--
-- Additive only. Nothing existing is dropped or rewritten, and existing reads (the curatit_mcp_*
-- functions, anything selecting post_analyses) behave as before: they only ever show an analysis
-- once published_at is set, and publishing now also requires an approved review.
--
--   creative_taxonomy_terms   the controlled vocabulary (src/lib/creative/taxonomy.ts); public
--   post_analyses             gains the structured Creative DNA, its review state and lineage
--   post_analysis_versions    every analysis produced or edited; immutable apart from its review
--   post_slide_analyses       one row per slide per version, tied to post_images (post_id, position)
--   post_creative_labels      the published version's labels, for exact filters (MCP search)
--   classification_jobs       the durable job ledger the worker leases from
--   creative_analysis_runs    every model attempt: outcome, tokens, estimated cost, errors
--   creative_review_events    who approved, rejected, reopened or unpublished what, and when
--
-- The worker runs with the secret key (service_role) through the creative_* functions, which no
-- browser role can execute. Editors (profiles.role editor or admin) act only through
-- creative_review, creative_save_edit and creative_enqueue: thin wrappers that check the editor,
-- over security definer functions in private that do the writes. Editors have no direct write
-- access to any of these tables, nor any more to post_analyses (its editor insert, update and
-- delete grants and policies from the first schema are removed), so every change to an analysis
-- leaves a version and a review event, and none can be passed off as the AI's. Versions, jobs,
-- runs and review history are never visible to anon; slide analyses and labels only for a
-- published analysis of a published post.
--
-- Rollback (nothing else depends on these yet; post_analyses had no rows when this was written).
-- Roll back …_creative_mcp_v2 first: its creative_search column is generated from creative_dna
-- and would be dropped silently with it. Then:
--   drop trigger immutable on public.post_analysis_versions;
--   drop function public.creative_enqueue, public.creative_reconcile, public.creative_post_manifest,
--     public.creative_claim_jobs, public.creative_heartbeat, public.creative_finish_job,
--     public.creative_save_analysis, public.creative_review, public.creative_save_edit,
--     private.creative_enqueue_job, private.creative_review_version, private.creative_save_edit_version,
--     private.creative_media_status, private.creative_content_fingerprint,
--     private.creative_write_labels, private.creative_insert_run, private.creative_apply_version,
--     private.creative_version_immutable;
--   drop table public.creative_review_events, public.post_creative_labels,
--     public.post_slide_analyses, public.creative_analysis_runs, public.classification_jobs;
--   alter table public.post_analyses drop constraint post_analyses_published_is_approved,
--     drop constraint post_analyses_current_version_fkey,
--     drop column creative_dna, drop column review_status, drop column analysis_source,
--     drop column input_fingerprint, drop column content_fingerprint, drop column pipeline_version,
--     drop column model_id, drop column prompt_version, drop column taxonomy_version,
--     drop column current_version_id, drop column reviewed_at, drop column image_analysis_complete,
--     drop column expected_slides, drop column processed_slides;
--   drop table public.post_analysis_versions, public.creative_taxonomy_terms;
--   grant insert, update, delete on public.post_analyses to authenticated;
--   and recreate its "Editors insert" / "Editors update" / "Editors delete" policies
--   (…_curatit_schema.sql).

set lock_timeout = '5s';

-- Taxonomy --------------------------------------------------------------------

create table public.creative_taxonomy_terms (
  dimension text not null check (dimension ~ '^[a-z_]+$'),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null check (char_length(label) between 1 and 80),
  description text not null default '',
  parent_dimension text,
  parent_slug text,
  synonyms text[] not null default '{}',
  criteria text,
  -- The version that last wrote the term; retired_at is set once a later version drops it
  taxonomy_version text not null,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (dimension, slug),
  foreign key (parent_dimension, parent_slug) references public.creative_taxonomy_terms (dimension, slug)
);

create index creative_taxonomy_terms_parent_idx on public.creative_taxonomy_terms (parent_dimension, parent_slug);

-- Versions --------------------------------------------------------------------

create table public.post_analysis_versions (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.instagram_posts (id) on delete cascade,
  version_no integer not null check (version_no > 0),
  -- ai: straight from the model; human: written by an editor; mixed: an editor's edit of an AI version
  source text not null check (source in ('ai', 'human', 'mixed')),
  -- The version an edit started from. Cascades so deleting a post never has to rewrite a version
  based_on_id uuid references public.post_analysis_versions (id) on delete cascade,
  summary text not null check (char_length(summary) between 1 and 4000),
  hook text check (char_length(hook) <= 2000),
  why_it_works text check (char_length(why_it_works) <= 4000),
  takeaways text[] not null default '{}' check (cardinality(takeaways) <= 20),
  creative_dna jsonb not null check (jsonb_typeof(creative_dna) = 'object'),
  -- The model's per-slide and caption reading the DNA was written from
  perception jsonb check (perception is null or jsonb_typeof(perception) = 'object'),
  -- input_fingerprint: content + model + prompt + taxonomy (src/lib/creative/fingerprint.ts);
  -- content_fingerprint: content only (private.creative_content_fingerprint), as it was when queued
  input_fingerprint text,
  content_fingerprint text,
  pipeline_version text,
  model_id text,
  prompt_version text,
  taxonomy_version text not null,
  -- The deterministic validator's warnings (outputs with errors never become versions)
  validation jsonb not null default '{}' check (jsonb_typeof(validation) = 'object'),
  image_analysis_complete boolean not null default false,
  expected_slides smallint not null default 0 check (expected_slides >= 0),
  processed_slides smallint not null default 0 check (processed_slides between 0 and expected_slides),
  review_decision text check (review_decision in ('approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 2000),
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (post_id, version_no),
  -- Lets child tables pin a version to its own post
  unique (id, post_id)
);

create index post_analysis_versions_based_on_id_idx on public.post_analysis_versions (based_on_id);
create index post_analysis_versions_reviewed_by_idx on public.post_analysis_versions (reviewed_by);
create index post_analysis_versions_created_by_idx on public.post_analysis_versions (created_by);
create index post_analysis_versions_input_fingerprint_idx on public.post_analysis_versions (input_fingerprint);

-- Content can't change once written; only the review columns can
create function private.creative_version_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.id, new.post_id, new.version_no, new.source, new.based_on_id, new.summary, new.hook,
      new.why_it_works, new.takeaways, new.creative_dna, new.perception, new.input_fingerprint,
      new.content_fingerprint, new.pipeline_version, new.model_id, new.prompt_version,
      new.taxonomy_version, new.validation, new.image_analysis_complete, new.expected_slides,
      new.processed_slides, new.created_at)
     is distinct from
     (old.id, old.post_id, old.version_no, old.source, old.based_on_id, old.summary, old.hook,
      old.why_it_works, old.takeaways, old.creative_dna, old.perception, old.input_fingerprint,
      old.content_fingerprint, old.pipeline_version, old.model_id, old.prompt_version,
      old.taxonomy_version, old.validation, old.image_analysis_complete, old.expected_slides,
      old.processed_slides, old.created_at) then
    raise exception 'Analysis versions are immutable; save the change as a new version' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger immutable before update on public.post_analysis_versions
  for each row execute function private.creative_version_immutable();

-- The canonical analysis ------------------------------------------------------

alter table public.post_analyses
  add column creative_dna jsonb check (creative_dna is null or jsonb_typeof(creative_dna) = 'object'),
  add column review_status text not null default 'draft'
    check (review_status in ('draft', 'needs_review', 'approved', 'rejected')),
  add column analysis_source text not null default 'human' check (analysis_source in ('ai', 'human', 'mixed')),
  add column input_fingerprint text,
  add column content_fingerprint text,
  add column pipeline_version text,
  add column model_id text,
  add column prompt_version text,
  add column taxonomy_version text,
  add column current_version_id uuid,
  add column reviewed_at timestamptz,
  add column image_analysis_complete boolean,
  add column expected_slides smallint,
  add column processed_slides smallint,
  add constraint post_analyses_published_is_approved check (published_at is null or review_status = 'approved'),
  -- The current version is one of this post's own; deleting it leaves the analysis without one
  add constraint post_analyses_current_version_fkey foreign key (current_version_id, post_id)
    references public.post_analysis_versions (id, post_id) on delete set null (current_version_id);

create index post_analyses_current_version_id_idx on public.post_analyses (current_version_id, post_id);
create index post_analyses_review_status_idx on public.post_analyses (review_status);

-- Jobs ------------------------------------------------------------------------

create table public.classification_jobs (
  id uuid primary key default gen_random_uuid(),
  -- <post id>:<pipeline version>:<content fingerprint>[:force:<uuid>]; the same input is queued once
  job_key text not null unique check (char_length(job_key) <= 300),
  post_id text not null references public.instagram_posts (id) on delete cascade,
  source_scrape_run_id uuid references public.scrape_runs (id) on delete set null,
  job_type text not null default 'analyze' check (job_type in ('analyze', 'reanalyze')),
  reason text not null default 'import' check (reason in ('import', 'reconcile', 'manual')),
  content_fingerprint text not null,
  pipeline_version text not null,
  priority smallint not null default 0,
  state text not null default 'pending' check (state in ('pending', 'leased', 'succeeded', 'skipped', 'failed')),
  attempts smallint not null default 0 check (attempts >= 0),
  max_attempts smallint not null default 3 check (max_attempts between 1 and 10),
  next_retry_at timestamptz not null default now(),
  lease_owner text check (char_length(lease_owner) <= 120),
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  last_error text check (char_length(last_error) <= 4000),
  last_failure_kind text check (char_length(last_failure_kind) <= 40),
  result_version_id uuid references public.post_analysis_versions (id) on delete set null,
  requested_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'leased') = (lease_owner is not null and lease_expires_at is not null))
);

create index classification_jobs_ready_idx on public.classification_jobs (priority desc, created_at, id)
  where state = 'pending';
create index classification_jobs_leased_idx on public.classification_jobs (lease_expires_at)
  where state = 'leased';
create index classification_jobs_post_id_idx on public.classification_jobs (post_id);
create index classification_jobs_source_scrape_run_id_idx on public.classification_jobs (source_scrape_run_id);
create index classification_jobs_result_version_id_idx on public.classification_jobs (result_version_id);
create index classification_jobs_requested_by_idx on public.classification_jobs (requested_by);
create index classification_jobs_state_idx on public.classification_jobs (state, updated_at desc);

-- Runs ------------------------------------------------------------------------

create table public.creative_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.classification_jobs (id) on delete set null,
  post_id text not null references public.instagram_posts (id) on delete cascade,
  version_id uuid references public.post_analysis_versions (id) on delete set null,
  worker text check (char_length(worker) <= 120),
  provider text not null check (char_length(provider) <= 40),
  model_id text,
  prompt_version text,
  taxonomy_version text,
  input_fingerprint text,
  -- succeeded: a valid version was saved; invalid: the output failed validation; failed: an error;
  -- skipped: nothing to do (unchanged input, unsupported media, wrong pipeline)
  status text not null check (status in ('succeeded', 'invalid', 'failed', 'skipped')),
  failure_kind text check (char_length(failure_kind) <= 40),
  error text check (char_length(error) <= 4000),
  expected_slides smallint,
  processed_slides smallint,
  model_calls smallint,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_write_tokens integer,
  -- The provider's own list-price estimate, not a bill
  estimated_cost_usd numeric(10, 4),
  duration_ms integer,
  -- The model's structured output, kept for audit (never credentials)
  output jsonb,
  validation jsonb,
  started_at timestamptz not null,
  finished_at timestamptz not null default now()
);

create index creative_analysis_runs_job_id_idx on public.creative_analysis_runs (job_id);
create index creative_analysis_runs_post_id_idx on public.creative_analysis_runs (post_id, started_at desc);
create index creative_analysis_runs_version_id_idx on public.creative_analysis_runs (version_id);
create index creative_analysis_runs_started_at_idx on public.creative_analysis_runs (started_at desc);

-- Slides ----------------------------------------------------------------------

create table public.post_slide_analyses (
  version_id uuid not null,
  post_id text not null,
  -- Zero-based, as post_images.position: 0 is the cover
  position smallint not null check (position >= 0),
  role text not null,
  headline text check (char_length(headline) <= 200),
  body text check (char_length(body) <= 600),
  legibility text not null check (legibility in ('clear', 'partial', 'illegible', 'no-text')),
  text_density text not null,
  typography text[] not null default '{}',
  type_weight text,
  layout text[] not null default '{}',
  imagery text[] not null default '{}',
  palette text[] not null default '{}',
  palette_hex text[] not null default '{}',
  devices text[] not null default '{}',
  product_prominence text,
  people_prominence text,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  -- The whole slide record as validated (src/lib/creative/schema.ts SlideObservation)
  observation jsonb not null check (jsonb_typeof(observation) = 'object'),
  created_at timestamptz not null default now(),
  primary key (version_id, position),
  foreign key (version_id, post_id) references public.post_analysis_versions (id, post_id) on delete cascade,
  -- A slide that isn't one of the post's images can't be recorded
  foreign key (post_id, position) references public.post_images (post_id, position) on delete cascade
);

create index post_slide_analyses_post_idx on public.post_slide_analyses (post_id, position);
create index post_slide_analyses_version_post_idx on public.post_slide_analyses (version_id, post_id);

-- Labels ----------------------------------------------------------------------

create table public.post_creative_labels (
  post_id text not null references public.instagram_posts (id) on delete cascade,
  version_id uuid not null,
  dimension text not null,
  slug text not null,
  -- 3 for the primary archetype (and its family), 2 for secondary archetypes and post-level
  -- reads (objective, hook, narrative), 1 for the rest
  weight smallint not null default 1 check (weight between 1 and 3),
  primary key (post_id, dimension, slug),
  foreign key (version_id, post_id) references public.post_analysis_versions (id, post_id) on delete cascade,
  foreign key (dimension, slug) references public.creative_taxonomy_terms (dimension, slug)
);

create index post_creative_labels_term_idx on public.post_creative_labels (dimension, slug, post_id);
create index post_creative_labels_version_idx on public.post_creative_labels (version_id, post_id);

-- Review history --------------------------------------------------------------

create table public.creative_review_events (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.instagram_posts (id) on delete cascade,
  version_id uuid,
  action text not null check (action in ('approve', 'reject', 'reopen', 'unpublish', 'publish', 'edit', 'auto_publish')),
  -- Null for the worker's auto-publish policy
  actor uuid references public.profiles (id) on delete set null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  foreign key (version_id, post_id) references public.post_analysis_versions (id, post_id) on delete cascade
);

create index creative_review_events_post_idx on public.creative_review_events (post_id, created_at desc);
create index creative_review_events_version_id_idx on public.creative_review_events (version_id, post_id);
create index creative_review_events_actor_idx on public.creative_review_events (actor);

create trigger set_updated_at before update on public.creative_taxonomy_terms
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.classification_jobs
  for each row execute function private.set_updated_at();

-- Media and fingerprints ------------------------------------------------------

-- Is every image of the post saved? Expected is one per carousel slide (instagram_post_media), or
-- one for a single image; each must have its post_images row at positions 0..n-1 and its file in
-- Storage. Definer so editors and the worker read storage.objects the same way; returns counts only.
create function private.creative_media_status(p_post_id text)
returns table (expected integer, image_rows integer, image_files integer, complete boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with counts as (
    select
      case when p.format = 'carousel'
        then (select count(*) from public.instagram_post_media m where m.post_id = p.id)
        else 1 end::integer as expected,
      (select count(*) from public.post_images i where i.post_id = p.id)::integer as image_rows,
      (select count(*) from public.post_images i
        join storage.objects o on o.bucket_id = i.bucket_id and o.name = i.path
        where i.post_id = p.id)::integer as image_files,
      (select coalesce(max(i.position), -1) from public.post_images i where i.post_id = p.id) as last_position
    from public.instagram_posts p
    where p.id = p_post_id
  )
  select expected, image_rows, image_files,
    expected > 0 and image_rows = expected and image_files = expected and last_position = expected - 1
  from counts;
$$;

-- What the analysis is of: the caption (whitespace aside), the brand and its category, and every
-- image by position, path and Storage ETag. Changes when any of them does.
create function private.creative_content_fingerprint(p_post_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(sha256(convert_to(concat_ws(chr(31),
    p.id,
    btrim(regexp_replace(coalesce(p.caption, ''), '\s+', ' ', 'g')),
    coalesce(b.slug, ''),
    coalesce(c.slug, ''),
    (select string_agg(i.position || ':' || i.bucket_id || '/' || i.path || '@' || coalesce(o.metadata ->> 'eTag', ''), chr(30) order by i.position)
      from public.post_images i
      left join storage.objects o on o.bucket_id = i.bucket_id and o.name = i.path
      where i.post_id = p.id)
  ), 'UTF8')), 'hex')
  from public.instagram_posts p
  left join public.brands b on b.id = p.brand_id
  left join public.categories c on c.id = b.category_id
  where p.id = p_post_id;
$$;

-- Everything the worker needs about one post, with the exact image paths from post_images
create function public.creative_post_manifest(p_post_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'short_code', p.short_code,
    'source_url', p.url,
    'format', p.format,
    'is_published', p.is_published,
    'caption', coalesce(p.caption, ''),
    'alt', p.alt,
    'hashtags', coalesce(to_jsonb(p.hashtags[1:30]), '[]'),
    'mentions', coalesce(to_jsonb(p.mentions[1:30]), '[]'),
    'paid_partnership', p.paid_partnership,
    'owner_username', p.owner_username,
    'posted_at', p.posted_at,
    'brand', jsonb_build_object('name', b.name, 'slug', b.slug),
    'category', jsonb_build_object('name', c.name, 'slug', c.slug),
    'scrape_run_id', p.scrape_run_id,
    'media', (select to_jsonb(m) from private.creative_media_status(p.id) m),
    'content_fingerprint', private.creative_content_fingerprint(p.id),
    'images', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', i.position,
        'bucket', i.bucket_id,
        'path', i.path,
        'etag', o.metadata ->> 'eTag',
        'size', (o.metadata ->> 'size')::bigint,
        'mimetype', o.metadata ->> 'mimetype',
        'was_video', coalesce(lower(md.type) = 'video', false)
      ) order by i.position)
      from public.post_images i
      left join storage.objects o on o.bucket_id = i.bucket_id and o.name = i.path
      left join public.instagram_post_media md on md.post_id = i.post_id and md.position = i.position
      where i.post_id = p.id
    ), '[]')
  )
  from public.instagram_posts p
  left join public.brands b on b.id = p.brand_id
  left join public.categories c on c.id = b.category_id
  where p.id = p_post_id;
$$;

-- Queueing --------------------------------------------------------------------

-- Queue posts for analysis under a pipeline version (taxonomy + prompt, src/lib/creative/versions.json).
-- Only published posts whose images are all saved are queued; the same post, content and pipeline
-- is queued once however often this runs, unless forced (which never overwrites a reviewed analysis:
-- the worker files its result as a proposal). Definer, so editors can queue without any write
-- access to classification_jobs; reached only through public.creative_enqueue.
create function private.creative_enqueue_job(
  p_post_ids text[],
  p_pipeline text,
  p_scrape_run uuid default null,
  p_reason text default 'import',
  p_force boolean default false,
  p_priority smallint default 0
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id text;
  v_media record;
  v_fingerprint text;
  v_key text;
  v_enqueued text[] := '{}';
  v_duplicate text[] := '{}';
  v_incomplete text[] := '{}';
  v_unknown text[] := '{}';
begin
  -- Signed-in callers must be editors (current_user is this function's owner here, so read the
  -- request's role); the worker (service_role) and imports (postgres, no request) may queue
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'authenticated'
      and not (select private.is_editor()) then
    raise exception 'Only editors can queue analyses' using errcode = '42501';
  end if;
  if coalesce(p_priority, 0) not between -10 and 10 then
    raise exception 'priority must be -10..10' using errcode = '22023';
  end if;
  if p_pipeline is null or p_pipeline !~ '^[0-9A-Za-z.+_-]{1,64}$' then
    raise exception 'Invalid pipeline version' using errcode = '22023';
  end if;
  if p_reason is null or p_reason not in ('import', 'reconcile', 'manual') then
    raise exception 'Invalid reason' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_post_ids), 0) > 1000 then
    raise exception 'At most 1000 posts at a time' using errcode = '22023';
  end if;

  foreach v_id in array coalesce(p_post_ids, '{}') loop
    if not exists (select 1 from public.instagram_posts where id = v_id and is_published) then
      v_unknown := v_unknown || v_id;
      continue;
    end if;
    select * into v_media from private.creative_media_status(v_id);
    if not v_media.complete then
      v_incomplete := v_incomplete || v_id;
      continue;
    end if;
    v_fingerprint := private.creative_content_fingerprint(v_id);
    v_key := v_id || ':' || p_pipeline || ':' || v_fingerprint
      || case when p_force then ':force:' || gen_random_uuid() else '' end;
    insert into public.classification_jobs
      (job_key, post_id, source_scrape_run_id, job_type, reason, content_fingerprint, pipeline_version, priority, requested_by)
    values
      (v_key, v_id, p_scrape_run, case when p_force then 'reanalyze' else 'analyze' end, p_reason, v_fingerprint,
       p_pipeline, coalesce(p_priority, 0), (select auth.uid()))
    on conflict (job_key) do nothing;
    if found then
      v_enqueued := v_enqueued || v_id;
    else
      v_duplicate := v_duplicate || v_id;
    end if;
  end loop;

  return jsonb_build_object('enqueued', to_jsonb(v_enqueued), 'duplicate', to_jsonb(v_duplicate),
    'incomplete', to_jsonb(v_incomplete), 'unknown', to_jsonb(v_unknown));
end;
$$;

-- Queue posts for analysis (see private.creative_enqueue_job). Called at the end of each import, by
-- the reconciler, by the CLI, and by editors (Analyse again); a signed-in caller must be an editor.
create function public.creative_enqueue(
  p_post_ids text[],
  p_pipeline text,
  p_scrape_run uuid default null,
  p_reason text default 'import',
  p_force boolean default false,
  p_priority smallint default 0
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  -- Nested, because is_editor() is only executable by the Data API's signed-in role
  if current_user = 'authenticated' then
    if not (select private.is_editor()) then
      raise exception 'Only editors can queue analyses' using errcode = '42501';
    end if;
  end if;
  return private.creative_enqueue_job(p_post_ids, p_pipeline, p_scrape_run, p_reason, p_force, p_priority);
end;
$$;

-- Find published posts that are due: no analysis yet, content changed since the analysis, or (with
-- p_include_stale) analysed under another pipeline version. A post already queued for its current
-- content and pipeline is never due again, whatever became of that job, so this can't loop. A post
-- whose images aren't all saved isn't due yet (it would take a slot on every run); those are counted
-- under incomplete instead. Dry run by default.
create function public.creative_reconcile(
  p_pipeline text,
  p_dry_run boolean default true,
  p_include_stale boolean default false,
  p_limit integer default 200
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_due jsonb;
  v_ids text[];
  v_incomplete integer;
begin
  if p_pipeline is null or p_pipeline !~ '^[0-9A-Za-z.+_-]{1,64}$' then
    raise exception 'Invalid pipeline version' using errcode = '22023';
  end if;
  if p_limit is null or p_limit not between 1 and 1000 then
    raise exception 'limit must be 1..1000' using errcode = '22023';
  end if;

  with posts as (
    select p.id, private.creative_content_fingerprint(p.id) as fingerprint,
      (select m.complete from private.creative_media_status(p.id) m) as complete,
      a.id is not null as analysed, a.content_fingerprint as analysed_fingerprint, a.pipeline_version as analysed_pipeline
    from public.instagram_posts p
    left join public.post_analyses a on a.post_id = p.id
    where p.is_published
  ), candidates as materialized (
    select id, complete,
      case when not analysed then 'missing'
        when analysed_fingerprint is not null and analysed_fingerprint <> fingerprint then 'changed'
        else 'stale' end as why
    from posts
    where (not analysed
        or (analysed_fingerprint is not null and analysed_fingerprint <> fingerprint)
        or (p_include_stale and analysed_pipeline is distinct from p_pipeline))
      and not exists (
        select 1 from public.classification_jobs j
        where j.job_key = posts.id || ':' || p_pipeline || ':' || posts.fingerprint
      )
  ), due as (
    select id, why from candidates where complete order by id limit p_limit
  )
  select (select jsonb_agg(jsonb_build_object('post_id', id, 'why', why) order by id) from due),
    (select array_agg(id order by id) from due),
    (select count(*) from candidates where not complete)
  into v_due, v_ids, v_incomplete;

  if p_dry_run or v_ids is null then
    return jsonb_build_object('dry_run', p_dry_run, 'due', coalesce(v_due, '[]'), 'incomplete', v_incomplete);
  end if;
  return jsonb_build_object('dry_run', false, 'due', v_due, 'incomplete', v_incomplete,
    'queued', public.creative_enqueue(v_ids, p_pipeline, null, 'reconcile'));
end;
$$;

-- Leasing ---------------------------------------------------------------------

-- Lease up to p_limit ready jobs to one worker, optionally only for some posts. A lease that ran
-- out (the worker died) makes its job ready again, and counts as an attempt; on the last attempt
-- it's a dead letter instead.
create function public.creative_claim_jobs(
  p_worker text,
  p_limit integer default 1,
  p_lease_seconds integer default 900,
  p_post_ids text[] default null
)
returns setof public.classification_jobs
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if p_worker is null or char_length(p_worker) not between 1 and 120 then
    raise exception 'Invalid worker name' using errcode = '22023';
  end if;
  if p_limit is null or p_limit not between 1 and 20 or p_lease_seconds is null or p_lease_seconds not between 60 and 7200 then
    raise exception 'Invalid limit or lease' using errcode = '22023';
  end if;

  update public.classification_jobs
  set state = 'failed', lease_owner = null, lease_expires_at = null, finished_at = now(),
    last_failure_kind = 'lease_expired', last_error = 'The worker stopped responding on the last attempt'
  where state = 'leased' and lease_expires_at < now() and attempts >= max_attempts;

  return query
  update public.classification_jobs j
  set state = 'leased', lease_owner = p_worker, lease_expires_at = now() + make_interval(secs => p_lease_seconds),
    heartbeat_at = now(), attempts = j.attempts + 1, started_at = coalesce(j.started_at, now())
  where j.id in (
    select c.id from public.classification_jobs c
    where ((c.state = 'pending' and c.next_retry_at <= now())
        or (c.state = 'leased' and c.lease_expires_at < now()))
      and (p_post_ids is null or c.post_id = any (p_post_ids))
    order by c.priority desc, c.created_at, c.id
    limit p_limit
    for update skip locked
  )
  returning j.*;
end;
$$;

create function public.creative_heartbeat(p_job uuid, p_worker text, p_lease_seconds integer default 900)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if p_lease_seconds is null or p_lease_seconds not between 60 and 7200 then
    raise exception 'Invalid lease' using errcode = '22023';
  end if;
  update public.classification_jobs
  set heartbeat_at = now(), lease_expires_at = now() + make_interval(secs => p_lease_seconds)
  where id = p_job and state = 'leased' and lease_owner = p_worker;
  return found;
end;
$$;

create function private.creative_insert_run(p_job uuid, p_post_id text, p_version uuid, p_run jsonb)
returns void
language sql
volatile
set search_path = ''
as $$
  insert into public.creative_analysis_runs
    (job_id, post_id, version_id, worker, provider, model_id, prompt_version, taxonomy_version,
     input_fingerprint, status, failure_kind, error, expected_slides, processed_slides, model_calls,
     input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, estimated_cost_usd,
     duration_ms, output, validation, started_at)
  select p_job, p_post_id, p_version, r.worker, coalesce(r.provider, 'unknown'), r.model_id, r.prompt_version,
    r.taxonomy_version, r.input_fingerprint, r.status, r.failure_kind, left(r.error, 4000), r.expected_slides,
    r.processed_slides, r.model_calls, r.input_tokens, r.output_tokens, r.cache_read_tokens,
    r.cache_write_tokens, r.estimated_cost_usd, r.duration_ms, r.output, r.validation,
    coalesce(r.started_at, now())
  from jsonb_to_record(p_run) as r(
    worker text, provider text, model_id text, prompt_version text, taxonomy_version text,
    input_fingerprint text, status text, failure_kind text, error text, expected_slides smallint,
    processed_slides smallint, model_calls smallint, input_tokens integer, output_tokens integer,
    cache_read_tokens integer, cache_write_tokens integer, estimated_cost_usd numeric,
    duration_ms integer, output jsonb, validation jsonb, started_at timestamptz);
$$;

-- End a leased job without a new analysis: skipped (nothing to do), pending (retry at p_retry_at)
-- or failed (dead letter). Only the worker holding the lease can; returns 'lost_lease' otherwise.
create function public.creative_finish_job(
  p_job uuid,
  p_worker text,
  p_state text,
  p_failure_kind text default null,
  p_error text default null,
  p_retry_at timestamptz default null,
  p_run jsonb default null
)
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_post_id text;
begin
  if p_state is null or p_state not in ('skipped', 'pending', 'failed') then
    raise exception 'A job can only be skipped, retried or failed here' using errcode = '22023';
  end if;
  if p_state = 'pending' and p_retry_at is null then
    raise exception 'A retry needs a time' using errcode = '22023';
  end if;

  update public.classification_jobs
  set state = p_state, lease_owner = null, lease_expires_at = null,
    next_retry_at = case when p_state = 'pending' then p_retry_at else next_retry_at end,
    last_error = case when p_state = 'skipped' then last_error else left(p_error, 4000) end,
    last_failure_kind = case when p_state = 'skipped' then last_failure_kind else left(p_failure_kind, 40) end,
    finished_at = case when p_state = 'pending' then null else now() end
  where id = p_job and state = 'leased' and lease_owner = p_worker
  returning post_id into v_post_id;
  if v_post_id is null then
    return 'lost_lease';
  end if;

  if p_run is not null then
    perform private.creative_insert_run(p_job, v_post_id, null, p_run);
  end if;
  return p_state;
end;
$$;

-- Applying and labelling ------------------------------------------------------

-- Write the labels of the version that's now published (replacing any earlier ones). Definer;
-- only private.creative_apply_version calls it
create function private.creative_write_labels(p_post_id text, p_version uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_dna jsonb;
begin
  select creative_dna into v_dna from public.post_analysis_versions where id = p_version and post_id = p_post_id;
  if v_dna is null then
    raise exception 'Version % of post % not found', p_version, p_post_id using errcode = 'P0002';
  end if;

  delete from public.post_creative_labels where post_id = p_post_id;

  insert into public.post_creative_labels (post_id, version_id, dimension, slug, weight)
  select p_post_id, p_version, l.dimension, l.slug, max(l.weight)
  from (
    select 'archetype' as dimension, v_dna #>> '{primary_archetype,slug}' as slug, 3 as weight
    union all select 'archetype', e ->> 'slug', 2 from jsonb_array_elements(coalesce(v_dna -> 'secondary_archetypes', '[]')) e
    union all select 'objective', v_dna #>> '{marketing_objective,slug}', 2
    union all select 'hook_technique', v_dna #>> '{hook,technique}', 2
    union all select 'narrative_pattern', v_dna #>> '{narrative,pattern}', 2
    union all select 'cta', v_dna #>> '{copy_strategy,cta}', 1
    union all select 'tone', t, 1 from jsonb_array_elements_text(coalesce(v_dna #> '{copy_strategy,tone}', '[]')) t
    union all select 'persuasion', t, 1 from jsonb_array_elements_text(coalesce(v_dna #> '{copy_strategy,persuasion}', '[]')) t
    union all select 'layout', t, 1 from jsonb_array_elements_text(coalesce(v_dna #> '{visual_system,composition}', '[]')) t
    union all select 'typography', t, 1 from jsonb_array_elements_text(coalesce(v_dna #> '{visual_system,typography}', '[]')) t
    union all select 'imagery', t, 1 from jsonb_array_elements_text(coalesce(v_dna #> '{visual_system,imagery}', '[]')) t
    union all select 'palette', t, 1 from jsonb_array_elements_text(coalesce(v_dna #> '{visual_system,palette}', '[]')) t
    union all select 'visual_device', d, 1 from public.post_slide_analyses s, unnest(s.devices) d where s.version_id = p_version
  ) l
  join public.creative_taxonomy_terms t on t.dimension = l.dimension and t.slug = l.slug
  where l.slug not in ('unknown', 'none', 'other')
  group by l.dimension, l.slug;

  insert into public.post_creative_labels (post_id, version_id, dimension, slug, weight)
  select p_post_id, p_version, 'archetype_family', t.parent_slug, max(l.weight)
  from public.post_creative_labels l
  join public.creative_taxonomy_terms t on t.dimension = 'archetype' and t.slug = l.slug
  where l.post_id = p_post_id and l.dimension = 'archetype' and t.parent_slug is not null
  group by t.parent_slug;
end;
$$;

-- Make a version the post's current analysis, with a review status, published or not. Definer, so
-- the review functions can write post_analyses and labels that editors can't write themselves;
-- called by creative_save_analysis (the worker) and the private review functions
create function private.creative_apply_version(p_version uuid, p_status text, p_publish boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v public.post_analysis_versions;
  v_published_at timestamptz := case when p_publish then now() end;
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'authenticated'
      and not (select private.is_editor()) then
    raise exception 'Only editors can change analyses' using errcode = '42501';
  end if;
  select * into v from public.post_analysis_versions where id = p_version;
  if not found then
    raise exception 'No analysis version %', p_version using errcode = 'P0002';
  end if;
  if p_publish and p_status <> 'approved' then
    raise exception 'Only an approved analysis can be published' using errcode = '22023';
  end if;

  insert into public.post_analyses
    (post_id, author_id, summary, hook, why_it_works, takeaways, creative_dna, review_status, analysis_source,
     input_fingerprint, content_fingerprint, pipeline_version, model_id, prompt_version, taxonomy_version,
     current_version_id, image_analysis_complete, expected_slides, processed_slides, reviewed_at, published_at)
  values
    (v.post_id, v.created_by, v.summary, v.hook, v.why_it_works, v.takeaways, v.creative_dna, p_status, v.source,
     v.input_fingerprint, v.content_fingerprint, v.pipeline_version, v.model_id, v.prompt_version, v.taxonomy_version,
     v.id, v.image_analysis_complete, v.expected_slides, v.processed_slides,
     case when p_status in ('approved', 'rejected') then now() end, v_published_at)
  on conflict (post_id) do update set
    author_id = excluded.author_id, summary = excluded.summary, hook = excluded.hook,
    why_it_works = excluded.why_it_works, takeaways = excluded.takeaways, creative_dna = excluded.creative_dna,
    review_status = excluded.review_status, analysis_source = excluded.analysis_source,
    input_fingerprint = excluded.input_fingerprint, content_fingerprint = excluded.content_fingerprint,
    pipeline_version = excluded.pipeline_version, model_id = excluded.model_id,
    prompt_version = excluded.prompt_version, taxonomy_version = excluded.taxonomy_version,
    current_version_id = excluded.current_version_id,
    image_analysis_complete = excluded.image_analysis_complete, expected_slides = excluded.expected_slides,
    processed_slides = excluded.processed_slides, reviewed_at = excluded.reviewed_at,
    published_at = excluded.published_at;

  update public.post_analysis_versions set published_at = null
  where post_id = v.post_id and id <> v.id and published_at is not null;

  if p_publish then
    update public.post_analysis_versions set published_at = v_published_at where id = v.id;
    perform private.creative_write_labels(v.post_id, v.id);
  else
    update public.post_analysis_versions set published_at = null where id = v.id and published_at is not null;
    delete from public.post_creative_labels where post_id = v.post_id;
  end if;
end;
$$;

-- Saving a worker's result ----------------------------------------------------

-- Save a validated AI analysis and finish its job, all or nothing. The new version becomes the
-- post's current analysis only if there's none yet or the current one is an untouched AI draft;
-- anything a person approved, edited, rejected or published stays, and the new version waits
-- beside it as a proposal. Publishing straight away (p_publish) is the auto-publish policy, off
-- unless CREATIVE_ANALYSIS_AUTO_PUBLISH is set.
create function public.creative_save_analysis(
  p_job uuid,
  p_worker text,
  p_version jsonb,
  p_slides jsonb,
  p_run jsonb,
  p_publish boolean default false
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_job public.classification_jobs;
  v_current public.post_analyses;
  v_version_id uuid;
  v_version_no integer;
  v_status text;
  v_applied boolean := false;
  v_complete boolean;
  v_expected integer;
  v_slides integer;
begin
  select * into v_job from public.classification_jobs
  where id = p_job and state = 'leased' and lease_owner = p_worker
  for update;
  if not found then
    raise exception 'Job % is not leased by %', p_job, p_worker using errcode = '55000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('creative:' || v_job.post_id, 0));

  if private.creative_content_fingerprint(v_job.post_id) is distinct from v_job.content_fingerprint then
    raise exception 'Post % changed while it was being analysed', v_job.post_id using errcode = '40001', hint = 'stale_input';
  end if;
  if jsonb_typeof(p_version -> 'creative_dna') is distinct from 'object' or jsonb_typeof(p_slides) is distinct from 'array' then
    raise exception 'The version needs creative_dna and the slides an array' using errcode = '22023';
  end if;

  v_status := coalesce(p_version ->> 'review_status', 'needs_review');
  if v_status not in ('draft', 'needs_review') then
    raise exception 'An AI analysis starts as a draft or needing review' using errcode = '22023';
  end if;

  select coalesce(max(version_no), 0) + 1 into v_version_no
  from public.post_analysis_versions where post_id = v_job.post_id;

  insert into public.post_analysis_versions
    (post_id, version_no, source, summary, hook, why_it_works, takeaways, creative_dna, perception,
     input_fingerprint, content_fingerprint, pipeline_version, model_id, prompt_version, taxonomy_version,
     validation, image_analysis_complete, expected_slides, processed_slides)
  select v_job.post_id, v_version_no, 'ai', v.summary, v.hook, v.why_it_works, coalesce(v.takeaways, '{}'),
    p_version -> 'creative_dna', v.perception, v.input_fingerprint, v_job.content_fingerprint,
    v_job.pipeline_version, v.model_id, v.prompt_version, v.taxonomy_version, coalesce(v.validation, '{}'),
    coalesce(v.image_analysis_complete, false), coalesce(v.expected_slides, 0), coalesce(v.processed_slides, 0)
  from jsonb_to_record(p_version) as v(
    summary text, hook text, why_it_works text, takeaways text[], perception jsonb, input_fingerprint text,
    model_id text, prompt_version text, taxonomy_version text, validation jsonb,
    image_analysis_complete boolean, expected_slides smallint, processed_slides smallint)
  returning id, image_analysis_complete, expected_slides into v_version_id, v_complete, v_expected;

  insert into public.post_slide_analyses
    (version_id, post_id, position, role, headline, body, legibility, text_density, typography, type_weight,
     layout, imagery, palette, palette_hex, devices, product_prominence, people_prominence, confidence, observation)
  select v_version_id, v_job.post_id, s.position, s.role, s.visible_text ->> 'headline', s.visible_text ->> 'body',
    s.legibility, s.text_density,
    array(select jsonb_array_elements_text(coalesce(s.typography -> 'classes', '[]'))), s.typography ->> 'weight',
    coalesce(s.layout, '{}'), coalesce(s.imagery, '{}'),
    array(select jsonb_array_elements_text(coalesce(s.palette -> 'families', '[]'))),
    array(select jsonb_array_elements_text(coalesce(s.palette -> 'hex', '[]'))),
    coalesce(s.devices, '{}'), s.product_prominence, s.people_prominence, s.confidence, e.slide
  from jsonb_array_elements(p_slides) as e(slide)
  cross join lateral jsonb_to_record(e.slide) as s(
    position smallint, role text, visible_text jsonb, legibility text, text_density text, typography jsonb,
    layout text[], imagery text[], palette jsonb, devices text[], product_prominence text,
    people_prominence text, confidence text);
  get diagnostics v_slides = row_count;

  -- Complete means every one of the post's images was read, whatever the payload claims
  if v_complete and (v_slides <> v_expected
      or v_expected <> (select m.expected from private.creative_media_status(v_job.post_id) m)) then
    raise exception 'Marked complete with % of % slides', v_slides, v_expected using errcode = '22023';
  end if;

  select * into v_current from public.post_analyses where post_id = v_job.post_id for update;
  if not found or (v_current.analysis_source = 'ai' and v_current.published_at is null
      and v_current.review_status in ('draft', 'needs_review')) then
    perform private.creative_apply_version(v_version_id, case when p_publish then 'approved' else v_status end, p_publish);
    v_applied := true;
    if p_publish then
      update public.post_analysis_versions set review_decision = 'approved', reviewed_at = now(),
        review_note = 'Auto-publish policy'
      where id = v_version_id;
      insert into public.creative_review_events (post_id, version_id, action, note)
      values (v_job.post_id, v_version_id, 'auto_publish', 'Auto-publish policy');
    end if;
  end if;

  perform private.creative_insert_run(p_job, v_job.post_id, v_version_id, coalesce(p_run, '{}') || jsonb_build_object('status', 'succeeded'));

  update public.classification_jobs
  set state = 'succeeded', result_version_id = v_version_id, lease_owner = null, lease_expires_at = null,
    finished_at = now(), last_error = null, last_failure_kind = null
  where id = p_job;

  return jsonb_build_object('version_id', v_version_id, 'version_no', v_version_no, 'applied', v_applied,
    'published', v_applied and p_publish);
end;
$$;

-- Review ----------------------------------------------------------------------

-- An editor's decision on a version: approve (make it the post's analysis, and publish it if asked
-- or if the post's analysis was already published), reject, reopen for review, or unpublish.
-- Definer (editors can't write these tables themselves); reached through public.creative_review.
create function private.creative_review_version(p_version uuid, p_action text, p_publish boolean, p_note text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v public.post_analysis_versions;
  v_current public.post_analyses;
  v_is_current boolean;
  v_publish boolean := false;
begin
  if not (select private.is_editor()) then
    raise exception 'Only editors can review analyses' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('approve', 'reject', 'reopen', 'unpublish') then
    raise exception 'Unknown review action %', p_action using errcode = '22023';
  end if;
  if char_length(p_note) > 2000 then
    raise exception 'The note is too long' using errcode = '22023';
  end if;

  select * into v from public.post_analysis_versions where id = p_version;
  if not found then
    raise exception 'No analysis version %', p_version using errcode = 'P0002';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('creative:' || v.post_id, 0));
  select * into v_current from public.post_analyses where post_id = v.post_id for update;
  -- coalesce: an analysis with no current version must not count as this one (NULL would)
  v_is_current := found and coalesce(v_current.current_version_id = v.id, false);

  if p_action = 'approve' then
    v_publish := coalesce(p_publish, false) or (v_current.published_at is not null);
    update public.post_analysis_versions
    set review_decision = 'approved', reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = p_note
    where id = v.id;
    perform private.creative_apply_version(v.id, 'approved', v_publish);
  elsif p_action = 'reject' then
    update public.post_analysis_versions
    set review_decision = 'rejected', reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = p_note,
      published_at = null
    where id = v.id;
    if v_is_current then
      perform private.creative_apply_version(v.id, 'rejected', false);
    end if;
  elsif p_action = 'reopen' then
    update public.post_analysis_versions
    set review_decision = null, reviewed_by = null, reviewed_at = null, review_note = p_note
    where id = v.id;
    if v_is_current then
      perform private.creative_apply_version(v.id, 'needs_review', false);
    end if;
  else
    if not v_is_current then
      raise exception 'Only the current analysis can be unpublished' using errcode = '22023';
    end if;
    perform private.creative_apply_version(v.id, v_current.review_status, false);
  end if;

  insert into public.creative_review_events (post_id, version_id, action, actor, note)
  values (v.post_id, v.id, case when p_action = 'approve' and v_publish then 'publish' else p_action end,
    (select auth.uid()), p_note);

  return jsonb_build_object('post_id', v.post_id, 'version_id', v.id, 'action', p_action, 'published', v_publish);
end;
$$;

-- An editor's edit, saved as a new version (human, or mixed when it started from an AI version).
-- Approved, it becomes the post's analysis, and stays public if the analysis was (or goes public
-- with p_publish). Not approved, it becomes the analysis waiting for review, unless the current
-- analysis is public: then it waits beside it as a proposal, so saving a draft never takes a live
-- analysis down. p_slides replaces the slide records; null keeps the base version's. Definer;
-- reached through public.creative_save_edit.
create function private.creative_save_edit_version(
  p_post_id text,
  p_based_on uuid,
  p_version jsonb,
  p_slides jsonb,
  p_approve boolean,
  p_publish boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_base public.post_analysis_versions;
  v_current public.post_analyses;
  v_source text;
  v_version_id uuid;
  v_version_no integer;
  v_publish boolean := false;
  v_applied boolean := true;
begin
  if not (select private.is_editor()) then
    raise exception 'Only editors can edit analyses' using errcode = '42501';
  end if;
  if jsonb_typeof(p_version -> 'creative_dna') is distinct from 'object' then
    raise exception 'The version needs creative_dna' using errcode = '22023';
  end if;
  if p_publish and not p_approve then
    raise exception 'Only an approved analysis can be published' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('creative:' || p_post_id, 0));
  select * into v_current from public.post_analyses where post_id = p_post_id for update;
  if p_based_on is not null then
    select * into v_base from public.post_analysis_versions where id = p_based_on and post_id = p_post_id;
    if not found then
      raise exception 'Version % is not an analysis of post %', p_based_on, p_post_id using errcode = 'P0002';
    end if;
  end if;
  v_source := case when v_base.id is null then 'human' when v_base.source = 'human' then 'human' else 'mixed' end;

  select coalesce(max(version_no), 0) + 1 into v_version_no
  from public.post_analysis_versions where post_id = p_post_id;

  insert into public.post_analysis_versions
    (post_id, version_no, source, based_on_id, summary, hook, why_it_works, takeaways, creative_dna, perception,
     input_fingerprint, content_fingerprint, pipeline_version, model_id, prompt_version, taxonomy_version,
     validation, image_analysis_complete, expected_slides, processed_slides, created_by)
  select p_post_id, v_version_no, v_source, v_base.id, v.summary, v.hook, v.why_it_works, coalesce(v.takeaways, '{}'),
    p_version -> 'creative_dna', v_base.perception, v_base.input_fingerprint, v_base.content_fingerprint,
    v_base.pipeline_version, v_base.model_id, v_base.prompt_version,
    coalesce(v.taxonomy_version, v_base.taxonomy_version), coalesce(v.validation, '{}'),
    coalesce(v_base.image_analysis_complete, false), coalesce(v_base.expected_slides, 0),
    coalesce(v_base.processed_slides, 0), (select auth.uid())
  from jsonb_to_record(p_version) as v(summary text, hook text, why_it_works text, takeaways text[],
    taxonomy_version text, validation jsonb)
  returning id into v_version_id;

  if p_slides is null then
    insert into public.post_slide_analyses
      (version_id, post_id, position, role, headline, body, legibility, text_density, typography, type_weight,
       layout, imagery, palette, palette_hex, devices, product_prominence, people_prominence, confidence, observation)
    select v_version_id, post_id, position, role, headline, body, legibility, text_density, typography, type_weight,
      layout, imagery, palette, palette_hex, devices, product_prominence, people_prominence, confidence, observation
    from public.post_slide_analyses where version_id = v_base.id;
  else
    insert into public.post_slide_analyses
      (version_id, post_id, position, role, headline, body, legibility, text_density, typography, type_weight,
       layout, imagery, palette, palette_hex, devices, product_prominence, people_prominence, confidence, observation)
    select v_version_id, p_post_id, s.position, s.role, s.visible_text ->> 'headline', s.visible_text ->> 'body',
      s.legibility, s.text_density,
      array(select jsonb_array_elements_text(coalesce(s.typography -> 'classes', '[]'))), s.typography ->> 'weight',
      coalesce(s.layout, '{}'), coalesce(s.imagery, '{}'),
      array(select jsonb_array_elements_text(coalesce(s.palette -> 'families', '[]'))),
      array(select jsonb_array_elements_text(coalesce(s.palette -> 'hex', '[]'))),
      coalesce(s.devices, '{}'), s.product_prominence, s.people_prominence, s.confidence, e.slide
    from jsonb_array_elements(p_slides) as e(slide)
    cross join lateral jsonb_to_record(e.slide) as s(
      position smallint, role text, visible_text jsonb, legibility text, text_density text, typography jsonb,
      layout text[], imagery text[], palette jsonb, devices text[], product_prominence text,
      people_prominence text, confidence text);
  end if;

  if p_approve then
    update public.post_analysis_versions
    set review_decision = 'approved', reviewed_by = (select auth.uid()), reviewed_at = now()
    where id = v_version_id;
    v_publish := coalesce(p_publish, false) or v_current.published_at is not null;
    perform private.creative_apply_version(v_version_id, 'approved', v_publish);
  elsif v_current.published_at is null then
    perform private.creative_apply_version(v_version_id, 'needs_review', false);
  else
    v_applied := false;
  end if;

  insert into public.creative_review_events (post_id, version_id, action, actor)
  values (p_post_id, v_version_id, case when v_publish then 'publish' when p_approve then 'approve' else 'edit' end,
    (select auth.uid()));

  return jsonb_build_object('version_id', v_version_id, 'version_no', v_version_no, 'source', v_source,
    'applied', v_applied, 'published', v_publish);
end;
$$;

-- The editor-facing entry points: check the caller, then hand over to the definer functions above

create function public.creative_review(p_version uuid, p_action text, p_publish boolean default false, p_note text default null)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_editor()) then
    raise exception 'Only editors can review analyses' using errcode = '42501';
  end if;
  return private.creative_review_version(p_version, p_action, p_publish, p_note);
end;
$$;

create function public.creative_save_edit(
  p_post_id text,
  p_based_on uuid,
  p_version jsonb,
  p_slides jsonb default null,
  p_approve boolean default false,
  p_publish boolean default false
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_editor()) then
    raise exception 'Only editors can edit analyses' using errcode = '42501';
  end if;
  return private.creative_save_edit_version(p_post_id, p_based_on, p_version, p_slides, p_approve, p_publish);
end;
$$;

-- Data API access -------------------------------------------------------------

-- New objects start with no access (see …_least_privilege_grants). The worker uses service_role.
grant usage on schema private to service_role;
grant all on public.creative_taxonomy_terms, public.post_analysis_versions, public.post_slide_analyses,
  public.post_creative_labels, public.classification_jobs, public.creative_analysis_runs,
  public.creative_review_events
to service_role;

-- Reads only: every write goes through the functions below
grant select on public.creative_taxonomy_terms, public.post_slide_analyses, public.post_creative_labels
to anon, authenticated;
grant select on public.post_analysis_versions, public.creative_review_events, public.classification_jobs,
  public.creative_analysis_runs
to authenticated;

-- post_analyses is now written only by private.creative_apply_version, so editors lose the direct
-- write access the first schema gave them (selects, through RLS, stay)
revoke insert, update, delete on public.post_analyses from authenticated;
drop policy "Editors insert" on public.post_analyses;
drop policy "Editors update" on public.post_analyses;
drop policy "Editors delete" on public.post_analyses;

revoke execute on function
  public.creative_post_manifest(text),
  public.creative_enqueue(text[], text, uuid, text, boolean, smallint),
  public.creative_reconcile(text, boolean, boolean, integer),
  public.creative_claim_jobs(text, integer, integer, text[]),
  public.creative_heartbeat(uuid, text, integer),
  public.creative_finish_job(uuid, text, text, text, text, timestamptz, jsonb),
  public.creative_save_analysis(uuid, text, jsonb, jsonb, jsonb, boolean),
  public.creative_review(uuid, text, boolean, text),
  public.creative_save_edit(text, uuid, jsonb, jsonb, boolean, boolean),
  private.creative_enqueue_job(text[], text, uuid, text, boolean, smallint),
  private.creative_review_version(uuid, text, boolean, text),
  private.creative_save_edit_version(text, uuid, jsonb, jsonb, boolean, boolean),
  private.creative_media_status(text),
  private.creative_content_fingerprint(text),
  private.creative_insert_run(uuid, text, uuid, jsonb),
  private.creative_write_labels(text, uuid),
  private.creative_apply_version(uuid, text, boolean),
  private.creative_version_immutable()
from public, anon, authenticated;

-- The worker's functions
grant execute on function
  public.creative_post_manifest(text),
  public.creative_enqueue(text[], text, uuid, text, boolean, smallint),
  public.creative_reconcile(text, boolean, boolean, integer),
  public.creative_claim_jobs(text, integer, integer, text[]),
  public.creative_heartbeat(uuid, text, integer),
  public.creative_finish_job(uuid, text, text, text, text, timestamptz, jsonb),
  public.creative_save_analysis(uuid, text, jsonb, jsonb, jsonb, boolean),
  private.creative_enqueue_job(text[], text, uuid, text, boolean, smallint),
  private.creative_media_status(text),
  private.creative_content_fingerprint(text),
  private.creative_insert_run(uuid, text, uuid, jsonb),
  private.creative_apply_version(uuid, text, boolean)
to service_role;

-- Editors' entry points. The wrappers check private.is_editor(); the definer functions behind them
-- check again, and live in private, which the Data API doesn't expose
grant execute on function
  public.creative_enqueue(text[], text, uuid, text, boolean, smallint),
  public.creative_review(uuid, text, boolean, text),
  public.creative_save_edit(text, uuid, jsonb, jsonb, boolean, boolean),
  private.creative_enqueue_job(text[], text, uuid, text, boolean, smallint),
  private.creative_review_version(uuid, text, boolean, text),
  private.creative_save_edit_version(text, uuid, jsonb, jsonb, boolean, boolean)
to authenticated;

-- Row level security ----------------------------------------------------------

alter table public.creative_taxonomy_terms enable row level security;
alter table public.post_analysis_versions enable row level security;
alter table public.post_slide_analyses enable row level security;
alter table public.post_creative_labels enable row level security;
alter table public.classification_jobs enable row level security;
alter table public.creative_analysis_runs enable row level security;
alter table public.creative_review_events enable row level security;

create policy "Anyone can read the creative taxonomy" on public.creative_taxonomy_terms
  for select to anon, authenticated using (true);

create policy "Editors read analysis versions" on public.post_analysis_versions
  for select to authenticated using ((select private.is_editor()));

-- Slides and labels of a published analysis are as public as the analysis; editors see all
create policy "Published slide analyses are public; editors see all" on public.post_slide_analyses
  for select to anon, authenticated
  using (
    (select private.is_editor())
    or exists (
      select 1 from public.post_analyses a
      where a.post_id = post_slide_analyses.post_id and a.current_version_id = post_slide_analyses.version_id
        and a.published_at is not null
    )
  );

create policy "Published labels are public; editors see all" on public.post_creative_labels
  for select to anon, authenticated
  using (
    (select private.is_editor())
    or exists (
      select 1 from public.post_analyses a
      where a.post_id = post_creative_labels.post_id and a.current_version_id = post_creative_labels.version_id
        and a.published_at is not null
    )
  );

create policy "Editors read jobs" on public.classification_jobs
  for select to authenticated using ((select private.is_editor()));

create policy "Editors read runs" on public.creative_analysis_runs
  for select to authenticated using ((select private.is_editor()));

create policy "Editors read review history" on public.creative_review_events
  for select to authenticated using ((select private.is_editor()));


-- Taxonomy ---------------------------------------------------------------------

-- Taxonomy 2026.10.11-1, generated from src/lib/creative/taxonomy.ts
insert into public.creative_taxonomy_terms
  (dimension, slug, label, description, parent_dimension, parent_slug, synonyms, criteria, taxonomy_version)
values
  ('archetype_family', 'product', 'Product', 'The product itself is the subject.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'launch', 'Launch & announcement', 'Something new or changed is being announced.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'promotion', 'Promotion', 'A deal, drop, giveaway or other incentive to act now.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'proof', 'Proof', 'Evidence that the brand delivers: customers, numbers, press.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'partnership', 'Partnership', 'Another brand, creator or organisation shares the post.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'education', 'Education', 'Teaches or explains something useful.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'brand', 'Brand', 'Who the brand is: story, values, people, process.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'community', 'Community', 'Customers and followers are the subject or the audience being invited in.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'entertainment', 'Entertainment', 'Made mainly to amuse or join a cultural moment.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'lifestyle', 'Lifestyle', 'Mood, aspiration and the life around the product.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'event', 'Events & seasons', 'Tied to an event, a date or a season.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'impact', 'Impact', 'Social or environmental responsibility.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'recruiting', 'Recruiting', 'Hiring and team culture.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'operational', 'Operational', 'Service, policy or availability updates.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'editorial', 'Editorial', 'Journalism-style content: features, commentary, interviews.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'lead-gen', 'Lead generation', 'Pushes a sign-up, download or other captured action.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'utility', 'Utility', 'A useful artefact in its own right: itinerary, recipe, checklist, calculator.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'other', 'Other', 'Something real that no term here covers; say what in the rationale.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype_family', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype', 'product-showcase', 'Product showcase', 'Shows the product as the hero.', 'archetype_family', 'product', array['product shot', 'hero product', 'packshot', 'product display'], null, '2026.10.11-1'),
  ('archetype', 'product-feature', 'Feature explainer', 'Explains what a product or feature does.', 'archetype_family', 'product', array['feature highlight', 'how it works'], null, '2026.10.11-1'),
  ('archetype', 'how-to-use', 'How to use', 'Shows the product in use, step by step.', 'archetype_family', 'product', array['product tutorial', 'demo'], null, '2026.10.11-1'),
  ('archetype', 'product-launch', 'Product launch', 'A new product is introduced.', 'archetype_family', 'launch', array['new product', 'drop announcement', 'release'], null, '2026.10.11-1'),
  ('archetype', 'feature-launch', 'Feature launch', 'A new feature or update to an existing product.', 'archetype_family', 'launch', array['product update', 'new feature'], null, '2026.10.11-1'),
  ('archetype', 'announcement', 'Announcement', 'News that isn''t a launch: milestones, openings, changes.', 'archetype_family', 'launch', array['news', 'update'], null, '2026.10.11-1'),
  ('archetype', 'teaser', 'Teaser', 'Hints at something coming without showing it all.', 'archetype_family', 'launch', array['coming soon', 'countdown'], null, '2026.10.11-1'),
  ('archetype', 'sale-offer', 'Sale or offer', 'A discount, deal or price promotion.', 'archetype_family', 'promotion', array['discount', 'promo code', 'price drop', 'bundle'], null, '2026.10.11-1'),
  ('archetype', 'limited-drop', 'Limited drop', 'Scarcity-led: limited stock or a short window.', 'archetype_family', 'promotion', array['limited edition', 'flash sale'], null, '2026.10.11-1'),
  ('archetype', 'giveaway', 'Giveaway or contest', 'Enter to win.', 'archetype_family', 'promotion', array['contest', 'sweepstakes'], null, '2026.10.11-1'),
  ('archetype', 'testimonial', 'Testimonial', 'A customer''s words or experience.', 'archetype_family', 'proof', array['customer quote', 'review'], null, '2026.10.11-1'),
  ('archetype', 'case-study', 'Case study', 'A worked example of a result for a customer.', 'archetype_family', 'proof', array['success story'], null, '2026.10.11-1'),
  ('archetype', 'stats-proof', 'Stats as proof', 'Numbers the brand puts forward about itself.', 'archetype_family', 'proof', array['milestone numbers', 'by the numbers'], null, '2026.10.11-1'),
  ('archetype', 'press-mention', 'Press mention', 'Coverage, awards or rankings.', 'archetype_family', 'proof', array['as seen in', 'award'], null, '2026.10.11-1'),
  ('archetype', 'collaboration', 'Collaboration', 'A joint product or campaign with another brand.', 'archetype_family', 'partnership', array['collab', 'co-branded', 'brand partnership'], null, '2026.10.11-1'),
  ('archetype', 'creator-feature', 'Creator feature', 'A creator, athlete or celebrity fronts the post.', 'archetype_family', 'partnership', array['influencer', 'ambassador', 'athlete'], null, '2026.10.11-1'),
  ('archetype', 'sponsorship', 'Sponsorship', 'The brand sponsors a team, event or cause.', 'archetype_family', 'partnership', '{}'::text[], null, '2026.10.11-1'),
  ('archetype', 'tutorial', 'Tutorial', 'Teaches a task step by step.', 'archetype_family', 'education', array['how-to', 'guide', 'walkthrough'], null, '2026.10.11-1'),
  ('archetype', 'tips-list', 'Tips list', 'A numbered or bulleted set of tips.', 'archetype_family', 'education', array['listicle', 'dos and don''ts', 'hacks'], null, '2026.10.11-1'),
  ('archetype', 'explainer', 'Explainer', 'Explains a concept, term or how something works.', 'archetype_family', 'education', array['101', 'glossary', 'what is'], null, '2026.10.11-1'),
  ('archetype', 'myth-busting', 'Myth busting', 'Corrects a common belief.', 'archetype_family', 'education', array['myth vs fact'], null, '2026.10.11-1'),
  ('archetype', 'data-insight', 'Data insight', 'A chart, study or statistic about the world (not the brand).', 'archetype_family', 'education', array['research', 'report', 'trend data'], null, '2026.10.11-1'),
  ('archetype', 'brand-story', 'Brand story', 'Origins, mission or what the brand stands for.', 'archetype_family', 'brand', array['manifesto', 'values', 'about us'], null, '2026.10.11-1'),
  ('archetype', 'behind-the-scenes', 'Behind the scenes', 'How things are made or the people making them.', 'archetype_family', 'brand', array['BTS', 'making of', 'process'], null, '2026.10.11-1'),
  ('archetype', 'founder-voice', 'Founder voice', 'The founder or leadership speaks directly.', 'archetype_family', 'brand', array['CEO note', 'letter'], null, '2026.10.11-1'),
  ('archetype', 'ugc-repost', 'UGC repost', 'Content made by a customer, shared by the brand.', 'archetype_family', 'community', array['user-generated', 'customer photo', 'repost'], null, '2026.10.11-1'),
  ('archetype', 'customer-spotlight', 'Customer spotlight', 'Features a customer or community member.', 'archetype_family', 'community', array['community feature', 'member story'], null, '2026.10.11-1'),
  ('archetype', 'community-prompt', 'Community prompt', 'Asks followers to answer, vote, tag or share.', 'archetype_family', 'community', array['question post', 'poll', 'this or that', 'caption this'], null, '2026.10.11-1'),
  ('archetype', 'milestone', 'Milestone celebration', 'Thanks followers for a milestone.', 'archetype_family', 'community', array['anniversary', 'followers milestone'], null, '2026.10.11-1'),
  ('archetype', 'meme', 'Meme', 'A known meme format or internet joke.', 'archetype_family', 'entertainment', array['reaction image', 'shitpost'], null, '2026.10.11-1'),
  ('archetype', 'relatable-humor', 'Relatable humour', 'A joke about a shared experience.', 'archetype_family', 'entertainment', array['POV', 'when you', 'relatable'], null, '2026.10.11-1'),
  ('archetype', 'trend-participation', 'Trend participation', 'Joins a trend, format or cultural moment.', 'archetype_family', 'entertainment', array['trend', 'newsjacking', 'pop culture'], null, '2026.10.11-1'),
  ('archetype', 'lifestyle-mood', 'Lifestyle mood', 'Aspirational imagery of the life around the product.', 'archetype_family', 'lifestyle', array['aesthetic', 'moodboard', 'inspiration'], null, '2026.10.11-1'),
  ('archetype', 'event-promo', 'Event promotion', 'Promotes an upcoming event.', 'archetype_family', 'event', array['save the date', 'tickets'], null, '2026.10.11-1'),
  ('archetype', 'event-recap', 'Event recap', 'Shows what happened at an event.', 'archetype_family', 'event', array['highlights', 'recap'], null, '2026.10.11-1'),
  ('archetype', 'seasonal', 'Seasonal', 'Tied to a holiday or season.', 'archetype_family', 'event', array['holiday', 'Black Friday', 'summer', 'back to school'], null, '2026.10.11-1'),
  ('archetype', 'csr-impact', 'Social impact', 'Charity, sustainability or community impact.', 'archetype_family', 'impact', array['CSR', 'sustainability', 'giving back'], null, '2026.10.11-1'),
  ('archetype', 'hiring', 'Hiring', 'Job openings and why to join.', 'archetype_family', 'recruiting', array['we''re hiring', 'careers', 'team culture'], null, '2026.10.11-1'),
  ('archetype', 'service-update', 'Service update', 'Availability, hours, outages or policy changes.', 'archetype_family', 'operational', array['policy update', 'store hours', 'now available in'], null, '2026.10.11-1'),
  ('archetype', 'editorial-feature', 'Editorial feature', 'A magazine-style feature or interview.', 'archetype_family', 'editorial', array['interview', 'profile', 'commentary'], null, '2026.10.11-1'),
  ('archetype', 'lead-magnet', 'Lead magnet', 'Offers something in exchange for a sign-up or download.', 'archetype_family', 'lead-gen', array['download the app', 'sign up', 'free guide', 'waitlist'], null, '2026.10.11-1'),
  ('archetype', 'utility-content', 'Utility content', 'A useful artefact: itinerary, recipe, checklist, template.', 'archetype_family', 'utility', array['itinerary', 'recipe', 'checklist', 'template', 'calculator'], null, '2026.10.11-1'),
  ('archetype', 'other', 'Other', 'Something real that no term here covers; say what in the rationale.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('archetype', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'awareness', 'Awareness', 'Get the brand or product noticed.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'consideration', 'Consideration', 'Help people weigh the product: features, comparisons, proof.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'conversion', 'Conversion', 'Get people to buy, sign up or download now.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'retention', 'Retention & loyalty', 'Keep existing customers engaged or coming back.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'engagement', 'Engagement', 'Get comments, saves, shares or participation.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'education', 'Education', 'Teach something, with or without the product.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'reputation', 'Reputation', 'Shape how the brand is seen: values, impact, credibility.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'recruitment', 'Recruitment', 'Attract people to work there.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('objective', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'question', 'Question', 'Opens with a question.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'bold-claim', 'Bold claim', 'A strong statement or promise.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'number', 'Number or statistic', 'Leads with a figure.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'curiosity-gap', 'Curiosity gap', 'Withholds the answer to make you swipe or read on.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'how-to-promise', 'How-to promise', 'Promises to show how to do something.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'list-count', 'List count', 'Announces a number of items (5 ways…).', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'contrarian', 'Contrarian', 'Goes against a common belief.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'relatable-pain', 'Relatable pain', 'Names a frustration the audience shares.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'reveal', 'Reveal', 'Shows something new or surprising up front.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'news', 'News', 'Leads with an announcement.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'humor', 'Humour', 'Leads with a joke.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'social-proof', 'Social proof', 'Leads with what others say or do.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'urgency', 'Urgency', 'Leads with a deadline or limited time.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'offer', 'Offer', 'Leads with the deal.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'visual-only', 'Visual only', 'The image does the work; there''s no verbal hook.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'quote', 'Quote', 'Opens with someone''s words.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'none', 'None', 'Not present.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('hook_technique', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'humor', 'Humour', 'Uses jokes or wit.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'comparison', 'Comparison', 'Sets two things side by side.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'curiosity', 'Curiosity', 'Makes you want to know more.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'social-proof', 'Social proof', 'Others use or endorse it.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'authority', 'Authority', 'Experts, credentials or data.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'urgency', 'Urgency', 'Act now.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'scarcity', 'Scarcity', 'Limited quantity or access.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'aspiration', 'Aspiration', 'Who you could be or how life could look.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'empathy', 'Empathy', 'Shows it understands the audience.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'utility', 'Utility', 'Gives something useful outright.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'novelty', 'Novelty', 'It''s new.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'exclusivity', 'Exclusivity', 'For a select group.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'value', 'Value', 'Price or savings.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('persuasion', 'none', 'None', 'Not present.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'playful', 'Playful', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'witty', 'Witty', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'warm', 'Warm', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'confident', 'Confident', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'authoritative', 'Authoritative', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'educational', 'Educational', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'urgent', 'Urgent', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'inspirational', 'Inspirational', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'minimal', 'Minimal', 'Says very little.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'irreverent', 'Irreverent', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'earnest', 'Earnest', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'luxurious', 'Luxurious', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('tone', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'product-photography', 'Product photography', 'The product photographed as the subject.', null, null, array['packshot', 'studio product'], null, '2026.10.11-1'),
  ('imagery', 'lifestyle-photography', 'Lifestyle photography', 'People or scenes with the product in context.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'portrait', 'Portrait', 'A person is the subject.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'ugc-style', 'UGC-style photo', 'Looks phone-shot, casual or customer-made.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'illustration', 'Illustration', 'Drawn or vector artwork.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', '3d-render', '3D render', 'Rendered 3D imagery.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'typographic', 'Typographic', 'Type is the image; little or no imagery.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'screenshot-ui', 'Screenshot or UI', 'App screens, tweets, chats or other interface captures.', null, null, array['tweet screenshot', 'app UI', 'chat'], null, '2026.10.11-1'),
  ('imagery', 'data-visualization', 'Data visualisation', 'Charts, graphs or diagrams of data.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'collage', 'Collage', 'Several images or cut-outs combined.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'video-frame', 'Video frame', 'A still taken from video.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'meme-format', 'Meme format', 'A recognised meme template.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'mixed', 'Mixed', 'Several media with none dominant.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('imagery', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'sans-serif', 'Sans-serif', 'No serifs.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'serif', 'Serif', 'Serifs on the letterforms.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'slab-serif', 'Slab serif', 'Heavy, block-like serifs.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'display', 'Display', 'Decorative or highly stylised headline type.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'condensed', 'Condensed', 'Narrow, tall letterforms.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'script', 'Script', 'Joined, calligraphic letterforms.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'handwritten', 'Handwritten', 'Looks hand-lettered or written.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'monospace', 'Monospace', 'Fixed-width, code-like.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'mixed', 'Mixed', 'Several classes with none dominant.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'none', 'None', 'Not present.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('typography', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('type_weight', 'light', 'Light', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('type_weight', 'regular', 'Regular', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('type_weight', 'bold', 'Bold', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('type_weight', 'heavy', 'Heavy', 'Black or extra-bold.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('type_weight', 'mixed', 'Mixed', 'Strong contrast between weights.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('type_weight', 'none', 'None', 'Not present.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('type_weight', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'centered', 'Centred', 'A single subject or block in the middle.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'split', 'Split', 'Two halves, side by side or stacked.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'grid', 'Grid', 'A regular grid of items.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'full-bleed', 'Full bleed', 'An image fills the frame.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'text-over-image', 'Text over image', 'Copy sits on top of a photo or artwork.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'text-only', 'Text only', 'Copy on a plain or patterned ground.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'list-stack', 'List stack', 'Items stacked as a list.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'diagram', 'Diagram', 'A flow, map or labelled diagram.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'ui-mockup', 'UI mock-up', 'Built to look like an app, tweet, chat or notification.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'before-after', 'Before and after', 'Shows a change across two states.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'collage', 'Collage', 'Free arrangement of several elements.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'framed-card', 'Framed card', 'Content set in a card or frame on a ground.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'asymmetric', 'Asymmetric', 'Deliberately off-centre balance.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('layout', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'arrows', 'Arrows or pointers', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'annotations', 'Annotations or callouts', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'highlighter', 'Highlighter or underline marks', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'stickers-badges', 'Stickers or badges', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'icons', 'Icons', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'emoji', 'Emoji', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'charts', 'Charts', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'logo-lockup', 'Logo lock-up', 'The brand''s logo placed as a deliberate element.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'price-tag', 'Price tag', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'numbered-steps', 'Numbered steps', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'swipe-cue', 'Swipe cue', 'An arrow or text telling you to swipe.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'cutout', 'Cut-out', 'A subject cut out from its background.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'hand-drawn', 'Hand-drawn marks', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'solid-ground', 'Solid colour ground', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'gradient-ground', 'Gradient ground', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'texture', 'Texture or grain', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('visual_device', 'none', 'None', 'Not present.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'hook', 'Hook', 'Stops the scroll; usually the first slide.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'context', 'Context', 'Sets up the situation.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'problem', 'Problem', 'Names the problem or tension.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'insight', 'Insight', 'The key idea or turn.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'explanation', 'Explanation', 'Explains how or why.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'step', 'Step', 'One step of a sequence.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'example', 'Example', 'A worked example or instance.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'proof', 'Proof', 'Evidence: numbers, quotes, results.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'comparison', 'Comparison', 'Sets options side by side.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'product-detail', 'Product detail', 'A closer look at the product.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'offer', 'Offer', 'The deal or incentive.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'cta', 'Call to action', 'Tells you what to do next.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'recap', 'Recap', 'Sums up.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'gallery-frame', 'Gallery frame', 'One more image in a set, with no distinct role in a story.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'closing', 'Closing', 'Sign-off, logo or credits.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'other', 'Other', 'Something real that no term here covers; say what in the rationale.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('slide_role', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'single-image', 'Single image', 'One frame; no sequence.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'hook-problem-solution', 'Hook, problem, solution', 'Opens, names a problem, resolves it.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'listicle', 'Listicle', 'A set of parallel items.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'step-by-step', 'Step by step', 'An ordered process.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'reveal-then-detail', 'Reveal, then detail', 'Shows the thing, then zooms in.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'before-after', 'Before and after', 'A change across states.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'story-arc', 'Story arc', 'Characters or events move through a beginning, middle and end.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'data-story', 'Data story', 'Builds an argument from numbers.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'q-and-a', 'Q&A', 'Questions with answers.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'comparison-series', 'Comparison series', 'Option after option, compared.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'gallery', 'Gallery', 'Several images with no plot: a set, not a sequence.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'other', 'Other', 'Something real that no term here covers; say what in the rationale.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('narrative_pattern', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'shop', 'Shop', 'Buy or shop now.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'learn-more', 'Learn more', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'sign-up', 'Sign up', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'download', 'Download', 'Download the app or a resource.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'follow', 'Follow', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'comment', 'Comment', 'Answer, vote or reply in the comments.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'share', 'Share', 'Send it to someone.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'save', 'Save', 'Save the post for later.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'tag-a-friend', 'Tag a friend', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'link-in-bio', 'Link in bio', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'visit', 'Visit', 'Go to a store or place.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'book', 'Book or reserve', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'enter', 'Enter', 'Enter a giveaway or contest.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'watch', 'Watch', 'Watch a video, episode or stream.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'none', 'None', 'Not present.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('cta', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'red', 'Red', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'orange', 'Orange', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'yellow', 'Yellow', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'green', 'Green', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'teal', 'Teal', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'blue', 'Blue', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'purple', 'Purple', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'pink', 'Pink', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'brown', 'Brown', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'beige', 'Beige', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'black', 'Black', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'white', 'White', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'grey', 'Grey', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('palette', 'multicolor', 'Multicolour', 'A dominant colour family.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('level', 'none', 'None', 'Not present.', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('level', 'low', 'Low', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('level', 'medium', 'Medium', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('level', 'high', 'High', '', null, null, '{}'::text[], null, '2026.10.11-1'),
  ('level', 'unknown', 'Unknown', 'Can''t be told from the caption and images.', null, null, '{}'::text[], null, '2026.10.11-1')
on conflict (dimension, slug) do update set
  label = excluded.label, description = excluded.description, parent_dimension = excluded.parent_dimension,
  parent_slug = excluded.parent_slug, synonyms = excluded.synonyms, criteria = excluded.criteria,
  taxonomy_version = excluded.taxonomy_version, retired_at = null;

-- Terms the current version no longer has stay (old analyses point at them) but are retired
update public.creative_taxonomy_terms set retired_at = now() where taxonomy_version <> '2026.10.11-1' and retired_at is null;
