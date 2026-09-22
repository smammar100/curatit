-- Curatit — initial production schema (Supabase Postgres).
--
-- Mirrors lib/db/schema.ts (the local SQLite store). Not yet applied to any
-- environment: review, apply to a clean staging project, and run the
-- cross-account isolation tests (plan §29, §34.6) before production.
--
-- Access model (plan §27):
--   * Row-level security is ON and deny-by-default on every table.
--   * Members read the published library and only their own workspace's boards.
--   * Ingestion/enrichment workers and admin tooling use the service role,
--     which bypasses RLS — so their application code needs separate tests.
--   * Share links are served by a server route using the service role and a
--     sanitised serializer; there is deliberately no anon policy on boards.

create extension if not exists vector;
create extension if not exists pg_trgm;

-- ─── Taxonomy and sources ──────────────────────────────────────────────────

create table categories (
  id     text primary key,
  name   text not null,
  status text not null check (status in ('candidate', 'active', 'deferred'))
);

create table taxonomy_values (
  dimension  text not null,
  id         text not null,
  name       text not null,
  version    text not null,
  active     boolean not null default true,
  primary key (dimension, id)
);

create table brands (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  name                   text not null,
  parent_brand_id        uuid references brands(id),
  primary_category_id    text not null references categories(id),
  is_demo                boolean not null default false
);

-- One brand can have several accounts/markets; handles change, IDs don't.
create table brand_profiles (
  id                     uuid primary key default gen_random_uuid(),
  brand_id               uuid not null references brands(id),
  platform               text not null check (platform in ('instagram')),
  platform_account_id    text,
  handle                 text not null,
  profile_url            text not null,
  market                 text not null,
  language               text not null default 'en',
  identity_status        text not null default 'unverified'
                         check (identity_status in ('unverified', 'confirmed', 'ambiguous', 'rejected')),
  identity_evidence_url  text,
  audit_status           text not null default 'pending' check (audit_status in ('pending', 'passed', 'failed')),
  source_approval_status text not null default 'pending' check (source_approval_status in ('pending', 'approved', 'blocked')),
  ingestion_enabled      boolean not null default false,
  reviewed_by            uuid,
  checked_at             timestamptz,
  last_attempt_at        timestamptz,
  last_success_at        timestamptz,
  unique (platform, platform_account_id),
  -- Collection only after identity, quality, and source approval all pass.
  constraint ingestion_requires_approval check (
    not ingestion_enabled
    or (identity_status = 'confirmed' and audit_status = 'passed' and source_approval_status = 'approved')
  )
);

create table source_posts (
  id                 uuid primary key default gen_random_uuid(),
  platform           text not null check (platform in ('instagram')),
  platform_post_id   text not null,
  source_url         text not null,
  brand_id           uuid not null references brands(id),
  brand_profile_id   uuid references brand_profiles(id),
  caption            text,
  language           text,
  media_type         text not null check (media_type in ('static', 'carousel')),
  published_at       timestamptz,
  captured_at        timestamptz not null default now(),
  last_checked_at    timestamptz,
  editorial_status   text not null default 'candidate' check (editorial_status in ('candidate', 'shortlisted', 'rejected')),
  processing_status  text not null default 'pending' check (processing_status in ('pending', 'running', 'ready', 'failed')),
  publication_status text not null default 'unpublished' check (publication_status in ('unpublished', 'published', 'removed')),
  reference_status   text not null default 'reference-only' check (reference_status in ('reference-only', 'licensed', 'owned')),
  rejection_reason   text,
  raw_payload_ref    text,          -- restricted, expiring; never exposed by any API
  search_document    tsvector,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (platform, platform_post_id)
);
create index source_posts_serving on source_posts (publication_status, processing_status, published_at desc);
create index source_posts_brand on source_posts (brand_id);
create index source_posts_search on source_posts using gin (search_document);

-- Suppression register: survives deletion so a removed post is never re-imported.
create table suppressed_sources (
  platform         text not null,
  platform_post_id text not null,
  reason           text not null,
  created_at       timestamptz not null default now(),
  primary key (platform, platform_post_id)
);

create table post_assets (
  id             uuid primary key default gen_random_uuid(),
  content_hash   text not null,
  mime_type      text not null,
  width          int,
  height         int,
  storage_path   text,
  rights_status  text not null default 'reference-only',
  created_at     timestamptz not null default now(),
  unique (content_hash)
);

create table post_slides (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references source_posts(id) on delete cascade,
  asset_id  uuid references post_assets(id),
  position  int not null check (position >= 0),
  alt_text  text not null,
  ocr_text  text,
  unique (post_id, position)
);

create table creative_analyses (
  id                   uuid primary key default gen_random_uuid(),
  post_id              uuid not null references source_posts(id) on delete cascade,
  is_active            boolean not null default true,
  objective_id         text not null,
  secondary_objectives text[] not null default '{}',
  format_id            text not null,
  hook                 text,
  summary              text not null,
  visual_styles        text[] not null default '{}',
  narrative_id         text not null default 'unknown',
  narrative_sequence   text[] not null default '{}',
  text_density         text not null check (text_density in ('low', 'medium', 'high')),
  dominant_colors      text[] not null default '{}',
  composition          text,
  cta_type             text,
  editorial_reason     text,
  confidence           real not null default 0,
  human_overrides      jsonb not null default '{}', -- human corrections survive re-enrichment
  human_reviewed       boolean not null default false,
  taxonomy_version     text not null,
  prompt_version       text not null,
  model_version        text not null,
  created_at           timestamptz not null default now()
);
create unique index one_active_analysis on creative_analyses (post_id) where is_active;

create table post_embeddings (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references source_posts(id) on delete cascade,
  slide_id    uuid references post_slides(id) on delete cascade,
  model_id    text not null,
  dimensions  int not null,
  version     text not null,
  embedding   vector not null,
  unique (post_id, slide_id, model_id, version)
);

-- ─── Workspaces and boards ────────────────────────────────────────────────

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create table workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner', 'member')),
  primary key (workspace_id, user_id)
);

create table collections (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id),
  name          text not null check (char_length(name) between 1 and 80),
  description   text not null default '' check (char_length(description) <= 1000),
  version       int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, workspace_id)
);
create index collections_workspace on collections (workspace_id, updated_at desc);

create table collection_items (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid not null,
  workspace_id   uuid not null,
  source_post_id uuid not null references source_posts(id),
  position       int not null,
  note           text not null default '' check (char_length(note) <= 2000),
  version        int not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (collection_id, source_post_id),
  -- The duplicated workspace_id must match the parent board's.
  foreign key (collection_id, workspace_id) references collections(id, workspace_id) on delete cascade
);

create table collection_shares (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  token_hash    text not null unique,   -- sha256 of a ≥128-bit secret; plaintext is never stored
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid not null references auth.users(id),
  check (expires_at <= created_at + interval '30 days')
);

-- ─── Operations and analytics ─────────────────────────────────────────────

create table ingestion_runs (
  id               uuid primary key default gen_random_uuid(),
  provider         text not null,
  provider_run_id  text not null,
  actor_version    text,
  checkpoint       text,
  expected_count   int,
  imported_count   int,
  cost_usd         numeric(10, 4),
  status           text not null,
  created_at       timestamptz not null default now(),
  unique (provider, provider_run_id)
);

create table processing_jobs (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references source_posts(id) on delete cascade,
  stage           text not null,
  input_hash      text not null,
  model_version   text not null,
  attempts        int not null default 0,
  next_retry_at   timestamptz,
  lease_expires   timestamptz,
  last_error      text,
  status          text not null default 'queued',
  unique (post_id, stage, input_hash, model_version)
);
create index processing_jobs_due on processing_jobs (status, next_retry_at);

create table removal_requests (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid references source_posts(id),
  source_url    text,
  status        text not null default 'received',
  received_at   timestamptz not null default now(),
  suppressed_at timestamptz,
  purged_at     timestamptz
);

create table product_events (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  user_id      uuid,
  workspace_id uuid,
  resource_id  text,
  request_id   text,
  success      boolean not null,
  properties   jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create table audit_events (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action        text not null,
  resource_type text not null,
  resource_id   text,
  outcome       text not null,
  created_at    timestamptz not null default now()
);

-- ─── Row-level security ───────────────────────────────────────────────────

alter table categories         enable row level security;
alter table taxonomy_values    enable row level security;
alter table brands             enable row level security;
alter table brand_profiles     enable row level security;
alter table source_posts       enable row level security;
alter table suppressed_sources enable row level security;
alter table post_assets        enable row level security;
alter table post_slides        enable row level security;
alter table creative_analyses  enable row level security;
alter table post_embeddings    enable row level security;
alter table profiles           enable row level security;
alter table workspaces         enable row level security;
alter table workspace_members  enable row level security;
alter table collections        enable row level security;
alter table collection_items   enable row level security;
alter table collection_shares  enable row level security;
alter table ingestion_runs     enable row level security;
alter table processing_jobs    enable row level security;
alter table removal_requests   enable row level security;
alter table product_events     enable row level security;
alter table audit_events       enable row level security;

create function is_workspace_member(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspace_members
     where workspace_id = target and user_id = auth.uid()
  );
$$;

-- Published library: readable by signed-in members only.
create policy "members read active categories" on categories
  for select to authenticated using (status = 'active');
create policy "members read taxonomy" on taxonomy_values
  for select to authenticated using (active);
create policy "members read brands" on brands
  for select to authenticated using (true);
create policy "members read published posts" on source_posts
  for select to authenticated
  using (publication_status = 'published' and processing_status = 'ready');
create policy "members read published slides" on post_slides
  for select to authenticated
  using (exists (select 1 from source_posts p where p.id = post_id
                 and p.publication_status = 'published' and p.processing_status = 'ready'));
create policy "members read published analyses" on creative_analyses
  for select to authenticated
  using (is_active and exists (select 1 from source_posts p where p.id = post_id
                               and p.publication_status = 'published' and p.processing_status = 'ready'));

-- Own profile and workspace membership.
create policy "read own profile" on profiles for select to authenticated using (id = auth.uid());
create policy "read own workspaces" on workspaces for select to authenticated using (is_workspace_member(id));
create policy "read own memberships" on workspace_members for select to authenticated using (user_id = auth.uid());

-- Boards: own workspace only, for every operation.
create policy "own boards: select" on collections for select to authenticated using (is_workspace_member(workspace_id));
create policy "own boards: insert" on collections for insert to authenticated
  with check (is_workspace_member(workspace_id) and owner_user_id = auth.uid());
create policy "own boards: update" on collections for update to authenticated
  using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "own boards: delete" on collections for delete to authenticated using (is_workspace_member(workspace_id));

create policy "own items: select" on collection_items for select to authenticated using (is_workspace_member(workspace_id));
create policy "own items: insert" on collection_items for insert to authenticated
  with check (
    is_workspace_member(workspace_id)
    and exists (select 1 from source_posts p where p.id = source_post_id
                and p.publication_status = 'published' and p.processing_status = 'ready')
  );
create policy "own items: update" on collection_items for update to authenticated
  using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "own items: delete" on collection_items for delete to authenticated using (is_workspace_member(workspace_id));

-- Share metadata is visible to owners; token hashes are only ever compared server-side.
create policy "own shares: select" on collection_shares for select to authenticated
  using (exists (select 1 from collections c where c.id = collection_id and is_workspace_member(c.workspace_id)));

-- No policies on brand_profiles, suppressed_sources, post_assets, post_embeddings,
-- ingestion_runs, processing_jobs, removal_requests, product_events, audit_events:
-- RLS with no policy = no access except the service role.
