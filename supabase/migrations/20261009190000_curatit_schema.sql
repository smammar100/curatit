-- Curatit schema
--
-- 1. Scraping: everything apify/instagram-post-scraper returns (detailed data),
--    split into proper tables. Each field of the dataset JSON has a column:
--
--    item                      -> instagram_posts (one column per field, plus `raw`)
--    item.ownerId/Username/... -> instagram_accounts (owner)
--    item.coauthorProducers[]  -> instagram_post_coauthors + instagram_accounts
--    item.taggedUsers[]        -> instagram_tagged_users + instagram_accounts
--    item.childPosts[]         -> instagram_post_media (carousel slides)
--    childPosts[].taggedUsers  -> instagram_tagged_users (with media_id)
--    item.latestComments[]     -> instagram_comments (replies via parent_id)
--
--    private.ingest_instagram_post(item) does the split, so a new Apify run is
--    imported by passing each dataset item to it.
-- 2. Editorial: brands, categories and editor analyses on top of the posts.
-- 3. Members: profiles, boards and the posts saved to them, with share links.
--
-- Public visitors read published posts and their editorial data. Comments are
-- written by members of the public, so only editors can read them. Editors
-- (profiles.role = 'editor' | 'admin') write the catalogue. Members only see
-- and change their own boards.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Helpers ---------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Brands ----------------------------------------------------------------------

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scraping --------------------------------------------------------------------

-- One row per Apify actor run
create table public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'apify',
  actor text not null,
  run_id text not null unique,
  dataset_id text not null,
  data_detail_level text,
  target_url text not null,
  item_count integer not null default 0 check (item_count >= 0),
  scraped_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Brand and creator accounts: post owners, co-authors and tagged users.
-- id is Instagram's numeric user id. Commenters are kept on instagram_comments.
create table public.instagram_accounts (
  id text primary key,
  username text not null unique,
  full_name text,
  is_verified boolean,
  -- Instagram CDN link, signed and short-lived
  profile_pic_url text,
  brand_id uuid references public.brands (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index instagram_accounts_brand_id_idx on public.instagram_accounts (brand_id);

-- One row per dataset item. Comments give the Apify field name.
create table public.instagram_posts (
  id text primary key,
  input_url text,
  short_code text not null unique,
  url text not null,
  type text not null check (type in ('Image', 'Sidecar', 'Video')),
  product_type text,
  format text not null generated always as (
    case type when 'Image' then 'static' when 'Sidecar' then 'carousel' else 'video' end
  ) stored,
  caption text,
  alt text,
  hashtags text[] not null default '{}',
  mentions text[] not null default '{}',
  first_comment text,
  likes_count bigint,
  comments_count bigint,
  video_view_count bigint,
  video_play_count bigint,
  video_duration numeric,
  dimensions_width integer,
  dimensions_height integer,
  original_width integer,
  original_height integer,
  -- Instagram CDN links, signed and short-lived
  display_url text,
  video_url text,
  images text[] not null default '{}',
  location_id text,
  location_name text,
  paid_partnership boolean,
  is_sponsored boolean,
  is_pinned boolean,
  is_comments_disabled boolean,
  music_info jsonb,
  owner_id text not null references public.instagram_accounts (id),
  owner_username text not null,
  owner_full_name text,
  posted_at timestamptz not null,
  -- The dataset item exactly as Apify returned it
  raw jsonb not null,
  scrape_run_id uuid references public.scrape_runs (id) on delete set null,
  -- Curatit: the brand library this post is filed under (a collab posted by
  -- @nsw still belongs to Nike), the local cover under public/, and publishing
  brand_id uuid references public.brands (id) on delete set null,
  cover_image_path text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.instagram_posts.id is 'Apify: id';
comment on column public.instagram_posts.input_url is 'Apify: inputUrl';
comment on column public.instagram_posts.short_code is 'Apify: shortCode';
comment on column public.instagram_posts.type is 'Apify: type (Image = static, Sidecar = carousel, Video)';
comment on column public.instagram_posts.product_type is 'Apify: productType (clips = reel)';
comment on column public.instagram_posts.first_comment is 'Apify: firstComment';
comment on column public.instagram_posts.likes_count is 'Apify: likesCount';
comment on column public.instagram_posts.comments_count is 'Apify: commentsCount';
comment on column public.instagram_posts.video_view_count is 'Apify: videoViewCount';
comment on column public.instagram_posts.video_play_count is 'Apify: videoPlayCount';
comment on column public.instagram_posts.video_duration is 'Apify: videoDuration (seconds)';
comment on column public.instagram_posts.dimensions_width is 'Apify: dimensionsWidth';
comment on column public.instagram_posts.dimensions_height is 'Apify: dimensionsHeight';
comment on column public.instagram_posts.original_width is 'Apify: originalWidth';
comment on column public.instagram_posts.original_height is 'Apify: originalHeight';
comment on column public.instagram_posts.display_url is 'Apify: displayUrl (expires)';
comment on column public.instagram_posts.video_url is 'Apify: videoUrl (expires)';
comment on column public.instagram_posts.location_id is 'Apify: locationId';
comment on column public.instagram_posts.location_name is 'Apify: locationName';
comment on column public.instagram_posts.paid_partnership is 'Apify: paidPartnership';
comment on column public.instagram_posts.is_sponsored is 'Apify: isSponsored';
comment on column public.instagram_posts.is_pinned is 'Apify: isPinned';
comment on column public.instagram_posts.is_comments_disabled is 'Apify: isCommentsDisabled';
comment on column public.instagram_posts.music_info is 'Apify: musicInfo';
comment on column public.instagram_posts.owner_id is 'Apify: ownerId';
comment on column public.instagram_posts.owner_username is 'Apify: ownerUsername';
comment on column public.instagram_posts.owner_full_name is 'Apify: ownerFullName';
comment on column public.instagram_posts.posted_at is 'Apify: timestamp';
comment on column public.instagram_posts.raw is 'The Apify dataset item, verbatim';

create index instagram_posts_owner_id_idx on public.instagram_posts (owner_id);
create index instagram_posts_brand_id_idx on public.instagram_posts (brand_id);
create index instagram_posts_scrape_run_id_idx on public.instagram_posts (scrape_run_id);
create index instagram_posts_published_idx on public.instagram_posts (posted_at desc) where is_published;
create index instagram_posts_hashtags_idx on public.instagram_posts using gin (hashtags);

-- Apify: childPosts[] (the slides of a carousel)
create table public.instagram_post_media (
  id text primary key,
  post_id text not null references public.instagram_posts (id) on delete cascade,
  position smallint not null,
  type text not null check (type in ('Image', 'Video')),
  short_code text,
  url text,
  alt text,
  hashtags text[] not null default '{}',
  mentions text[] not null default '{}',
  first_comment text,
  dimensions_width integer,
  dimensions_height integer,
  original_width integer,
  original_height integer,
  -- Instagram CDN links, signed and short-lived
  display_url text,
  video_url text,
  audio_url text,
  images text[] not null default '{}',
  video_duration numeric,
  owner_id text references public.instagram_accounts (id),
  owner_username text,
  owner_full_name text,
  posted_at timestamptz,
  raw jsonb not null,
  unique (post_id, position)
);

create index instagram_post_media_owner_id_idx on public.instagram_post_media (owner_id);

-- Apify: coauthorProducers[]
create table public.instagram_post_coauthors (
  post_id text not null references public.instagram_posts (id) on delete cascade,
  account_id text not null references public.instagram_accounts (id),
  position smallint not null default 0,
  is_unpublished boolean,
  primary key (post_id, account_id)
);

create index instagram_post_coauthors_account_id_idx on public.instagram_post_coauthors (account_id);

-- Apify: taggedUsers[] on the post, and childPosts[].taggedUsers[] on a slide (media_id set)
create table public.instagram_tagged_users (
  id bigint generated always as identity primary key,
  post_id text not null references public.instagram_posts (id) on delete cascade,
  media_id text references public.instagram_post_media (id) on delete cascade,
  account_id text not null references public.instagram_accounts (id),
  position smallint not null default 0,
  unique nulls not distinct (post_id, media_id, account_id)
);

create index instagram_tagged_users_media_id_idx on public.instagram_tagged_users (media_id);
create index instagram_tagged_users_account_id_idx on public.instagram_tagged_users (account_id);

-- Apify: latestComments[] (and their replies[]). Written by members of the public: editors only.
create table public.instagram_comments (
  id text primary key,
  post_id text not null references public.instagram_posts (id) on delete cascade,
  media_id text references public.instagram_post_media (id) on delete cascade,
  parent_id text references public.instagram_comments (id) on delete cascade,
  text text,
  likes_count bigint,
  replies_count bigint,
  posted_at timestamptz,
  owner_id text,
  owner_username text,
  owner_full_name text,
  owner_is_verified boolean,
  owner_is_private boolean,
  owner_is_mentionable boolean,
  owner_profile_pic_url text,
  owner_profile_pic_id text,
  owner_latest_reel_media bigint,
  raw jsonb not null
);

create index instagram_comments_post_id_idx on public.instagram_comments (post_id, posted_at desc);
create index instagram_comments_media_id_idx on public.instagram_comments (media_id);
create index instagram_comments_parent_id_idx on public.instagram_comments (parent_id);

-- Importing -------------------------------------------------------------------

create function private.upsert_instagram_account(account jsonb)
returns text
language plpgsql
set search_path = ''
as $$
begin
  if account ->> 'id' is null then
    return null;
  end if;
  insert into public.instagram_accounts (id, username, full_name, is_verified, profile_pic_url)
  values (
    account ->> 'id',
    account ->> 'username',
    nullif(account ->> 'full_name', ''),
    (account ->> 'is_verified')::boolean,
    account ->> 'profile_pic_url'
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = coalesce(excluded.full_name, public.instagram_accounts.full_name),
    is_verified = coalesce(excluded.is_verified, public.instagram_accounts.is_verified),
    profile_pic_url = coalesce(excluded.profile_pic_url, public.instagram_accounts.profile_pic_url);
  return account ->> 'id';
end;
$$;

create function private.text_array(value jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array(select jsonb_array_elements_text(coalesce(value, '[]'::jsonb))), '{}');
$$;

-- Comments and their replies (Apify nests replies inside each comment)
create function private.ingest_instagram_comments(comments jsonb, p_post_id text, p_media_id text, p_parent_id text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  c jsonb;
begin
  for c in select * from jsonb_array_elements(coalesce(comments, '[]'::jsonb)) loop
    insert into public.instagram_comments (
      id, post_id, media_id, parent_id, text, likes_count, replies_count, posted_at,
      owner_id, owner_username, owner_full_name, owner_is_verified, owner_is_private, owner_is_mentionable,
      owner_profile_pic_url, owner_profile_pic_id, owner_latest_reel_media, raw
    ) values (
      c ->> 'id', p_post_id, p_media_id, p_parent_id, c ->> 'text',
      (c ->> 'likesCount')::bigint, (c ->> 'repliesCount')::bigint, (c ->> 'timestamp')::timestamptz,
      c -> 'owner' ->> 'id', coalesce(c ->> 'ownerUsername', c -> 'owner' ->> 'username'),
      c -> 'owner' ->> 'full_name', (c -> 'owner' ->> 'is_verified')::boolean,
      (c -> 'owner' ->> 'is_private')::boolean, (c -> 'owner' ->> 'is_mentionable')::boolean,
      coalesce(c ->> 'ownerProfilePicUrl', c -> 'owner' ->> 'profile_pic_url'),
      c -> 'owner' ->> 'profile_pic_id', (c -> 'owner' ->> 'latest_reel_media')::bigint, c
    );
    if jsonb_typeof(c -> 'replies') = 'array' then
      perform private.ingest_instagram_comments(c -> 'replies', p_post_id, p_media_id, c ->> 'id');
    end if;
  end loop;
end;
$$;

-- Imports one Apify dataset item into the tables above. Safe to re-run: scraped
-- fields are refreshed, child rows are replaced, and Curatit's own fields
-- (brand, cover, publishing) are only set the first time.
create function private.ingest_instagram_post(
  item jsonb,
  p_scrape_run_id uuid default null,
  p_brand_id uuid default null,
  p_cover_image_path text default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_post_id text := item ->> 'id';
  child jsonb;
  child_position bigint;
  tagged jsonb;
  tagged_position bigint;
begin
  perform private.upsert_instagram_account(jsonb_build_object(
    'id', item ->> 'ownerId', 'username', item ->> 'ownerUsername', 'full_name', item ->> 'ownerFullName'
  ));

  insert into public.instagram_posts (
    id, input_url, short_code, url, type, product_type, caption, alt, hashtags, mentions, first_comment,
    likes_count, comments_count, video_view_count, video_play_count, video_duration,
    dimensions_width, dimensions_height, original_width, original_height,
    display_url, video_url, images, location_id, location_name,
    paid_partnership, is_sponsored, is_pinned, is_comments_disabled, music_info,
    owner_id, owner_username, owner_full_name, posted_at, raw,
    scrape_run_id, brand_id, cover_image_path
  ) values (
    v_post_id, item ->> 'inputUrl', item ->> 'shortCode', item ->> 'url', item ->> 'type', item ->> 'productType',
    item ->> 'caption', item ->> 'alt', private.text_array(item -> 'hashtags'), private.text_array(item -> 'mentions'),
    nullif(item ->> 'firstComment', ''),
    (item ->> 'likesCount')::bigint, (item ->> 'commentsCount')::bigint,
    (item ->> 'videoViewCount')::bigint, (item ->> 'videoPlayCount')::bigint, (item ->> 'videoDuration')::numeric,
    (item ->> 'dimensionsWidth')::integer, (item ->> 'dimensionsHeight')::integer,
    (item ->> 'originalWidth')::integer, (item ->> 'originalHeight')::integer,
    item ->> 'displayUrl', item ->> 'videoUrl', private.text_array(item -> 'images'),
    item ->> 'locationId', item ->> 'locationName',
    (item ->> 'paidPartnership')::boolean, (item ->> 'isSponsored')::boolean,
    (item ->> 'isPinned')::boolean, (item ->> 'isCommentsDisabled')::boolean, item -> 'musicInfo',
    item ->> 'ownerId', item ->> 'ownerUsername', item ->> 'ownerFullName', (item ->> 'timestamp')::timestamptz, item,
    p_scrape_run_id, p_brand_id, p_cover_image_path
  )
  on conflict (id) do update set
    input_url = excluded.input_url, url = excluded.url, type = excluded.type, product_type = excluded.product_type,
    caption = excluded.caption, alt = excluded.alt, hashtags = excluded.hashtags, mentions = excluded.mentions,
    first_comment = excluded.first_comment, likes_count = excluded.likes_count, comments_count = excluded.comments_count,
    video_view_count = excluded.video_view_count, video_play_count = excluded.video_play_count,
    video_duration = excluded.video_duration,
    dimensions_width = excluded.dimensions_width, dimensions_height = excluded.dimensions_height,
    original_width = excluded.original_width, original_height = excluded.original_height,
    display_url = excluded.display_url, video_url = excluded.video_url, images = excluded.images,
    location_id = excluded.location_id, location_name = excluded.location_name,
    paid_partnership = excluded.paid_partnership, is_sponsored = excluded.is_sponsored,
    is_pinned = excluded.is_pinned, is_comments_disabled = excluded.is_comments_disabled,
    music_info = excluded.music_info, owner_id = excluded.owner_id, owner_username = excluded.owner_username,
    owner_full_name = excluded.owner_full_name, posted_at = excluded.posted_at, raw = excluded.raw,
    scrape_run_id = coalesce(excluded.scrape_run_id, public.instagram_posts.scrape_run_id),
    brand_id = coalesce(public.instagram_posts.brand_id, excluded.brand_id),
    cover_image_path = coalesce(public.instagram_posts.cover_image_path, excluded.cover_image_path);

  -- Replace the child rows with this scrape's
  delete from public.instagram_post_coauthors where post_id = v_post_id;
  delete from public.instagram_tagged_users where post_id = v_post_id;
  delete from public.instagram_comments where post_id = v_post_id;
  delete from public.instagram_post_media where post_id = v_post_id;

  for tagged, tagged_position in
    select * from jsonb_array_elements(coalesce(item -> 'coauthorProducers', '[]'::jsonb)) with ordinality
  loop
    insert into public.instagram_post_coauthors (post_id, account_id, position, is_unpublished)
    values (v_post_id, private.upsert_instagram_account(tagged), tagged_position - 1, (tagged ->> 'is_unpublished')::boolean);
  end loop;

  for tagged, tagged_position in
    select * from jsonb_array_elements(coalesce(item -> 'taggedUsers', '[]'::jsonb)) with ordinality
  loop
    insert into public.instagram_tagged_users (post_id, account_id, position)
    values (v_post_id, private.upsert_instagram_account(tagged), tagged_position - 1);
  end loop;

  for child, child_position in
    select * from jsonb_array_elements(coalesce(item -> 'childPosts', '[]'::jsonb)) with ordinality
  loop
    perform private.upsert_instagram_account(jsonb_build_object(
      'id', child ->> 'ownerId', 'username', child ->> 'ownerUsername', 'full_name', child ->> 'ownerFullName'
    ));
    insert into public.instagram_post_media (
      id, post_id, position, type, short_code, url, alt, hashtags, mentions, first_comment,
      dimensions_width, dimensions_height, original_width, original_height,
      display_url, video_url, audio_url, images, video_duration,
      owner_id, owner_username, owner_full_name, posted_at, raw
    ) values (
      child ->> 'id', v_post_id, child_position - 1, child ->> 'type', child ->> 'shortCode', child ->> 'url',
      child ->> 'alt', private.text_array(child -> 'hashtags'), private.text_array(child -> 'mentions'),
      nullif(child ->> 'firstComment', ''),
      (child ->> 'dimensionsWidth')::integer, (child ->> 'dimensionsHeight')::integer,
      (child ->> 'originalWidth')::integer, (child ->> 'originalHeight')::integer,
      child ->> 'displayUrl', child ->> 'videoUrl', child ->> 'audioUrl', private.text_array(child -> 'images'),
      (child ->> 'videoDuration')::numeric,
      child ->> 'ownerId', child ->> 'ownerUsername', child ->> 'ownerFullName', (child ->> 'timestamp')::timestamptz,
      child
    );

    for tagged, tagged_position in
      select * from jsonb_array_elements(coalesce(child -> 'taggedUsers', '[]'::jsonb)) with ordinality
    loop
      insert into public.instagram_tagged_users (post_id, media_id, account_id, position)
      values (v_post_id, child ->> 'id', private.upsert_instagram_account(tagged), tagged_position - 1);
    end loop;

    perform private.ingest_instagram_comments(child -> 'latestComments', v_post_id, child ->> 'id', null);
  end loop;

  perform private.ingest_instagram_comments(item -> 'latestComments', v_post_id, null, null);

  return v_post_id;
end;
$$;

-- Imports run as the database owner (SQL editor, seed, service role), never from the browser
revoke execute on all functions in schema private from public, anon, authenticated;

-- Members ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('editor', 'admin')
  );
$$;

grant execute on function private.is_editor() to anon, authenticated;

-- Create a profile for every new auth user (metadata is only used for display, never for access)
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Editorial -------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_categories (
  post_id text not null references public.instagram_posts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (post_id, category_id)
);

create index post_categories_category_id_idx on public.post_categories (category_id);

-- The editor's breakdown of a post. Visible once published_at is set.
create table public.post_analyses (
  id uuid primary key default gen_random_uuid(),
  post_id text not null unique references public.instagram_posts (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  summary text not null,
  hook text,
  why_it_works text,
  takeaways text[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index post_analyses_author_id_idx on public.post_analyses (author_id);

-- Boards ----------------------------------------------------------------------

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  -- Set to share the board by link; null keeps it private
  share_token uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index boards_owner_id_idx on public.boards (owner_id);

create table public.board_posts (
  board_id uuid not null references public.boards (id) on delete cascade,
  post_id text not null references public.instagram_posts (id) on delete cascade,
  note text,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (board_id, post_id)
);

create index board_posts_post_id_idx on public.board_posts (post_id);

-- updated_at triggers ---------------------------------------------------------

create trigger set_updated_at before update on public.brands
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.instagram_accounts
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.instagram_posts
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.post_analyses
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.boards
  for each row execute function private.set_updated_at();

-- Data API access -------------------------------------------------------------

-- Granted explicitly because new projects may not expose tables automatically.
-- These decide which tables each role can reach; RLS below decides which rows.
grant select on
  public.brands, public.instagram_accounts, public.instagram_posts, public.instagram_post_media,
  public.instagram_post_coauthors, public.instagram_tagged_users,
  public.categories, public.post_categories, public.post_analyses
to anon, authenticated;

grant insert, update, delete on
  public.brands, public.scrape_runs, public.instagram_accounts, public.instagram_posts,
  public.instagram_post_media, public.instagram_post_coauthors, public.instagram_tagged_users,
  public.instagram_comments, public.categories, public.post_categories, public.post_analyses
to authenticated;

grant select on public.scrape_runs, public.instagram_comments, public.profiles to authenticated;
grant select, insert, update, delete on public.boards, public.board_posts to authenticated;

-- Row level security ----------------------------------------------------------

alter table public.brands enable row level security;
alter table public.scrape_runs enable row level security;
alter table public.instagram_accounts enable row level security;
alter table public.instagram_posts enable row level security;
alter table public.instagram_post_media enable row level security;
alter table public.instagram_post_coauthors enable row level security;
alter table public.instagram_tagged_users enable row level security;
alter table public.instagram_comments enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.post_categories enable row level security;
alter table public.post_analyses enable row level security;
alter table public.boards enable row level security;
alter table public.board_posts enable row level security;

-- Public catalogue: anyone reads, editors write
create policy "Anyone can read brands" on public.brands
  for select to anon, authenticated using (true);
create policy "Anyone can read accounts" on public.instagram_accounts
  for select to anon, authenticated using (true);
create policy "Anyone can read categories" on public.categories
  for select to anon, authenticated using (true);

create policy "Published posts are public; editors see all" on public.instagram_posts
  for select to anon, authenticated
  using (is_published or (select private.is_editor()));

-- Rows that belong to a post are visible when the post is
do $$
declare
  t text;
begin
  foreach t in array array[
    'instagram_post_media', 'instagram_post_coauthors', 'instagram_tagged_users', 'post_categories'
  ] loop
    execute format(
      'create policy "Visible with their post" on public.%I for select to anon, authenticated using (exists (
         select 1 from public.instagram_posts p
         where p.id = post_id and (p.is_published or (select private.is_editor()))
       ))', t);
  end loop;
end;
$$;

create policy "Published analyses are public; editors see all" on public.post_analyses
  for select to anon, authenticated
  using (
    (select private.is_editor())
    or (published_at is not null and exists (
      select 1 from public.instagram_posts p where p.id = post_id and p.is_published
    ))
  );

create policy "Editors read scrape runs" on public.scrape_runs
  for select to authenticated using ((select private.is_editor()));
create policy "Editors read comments" on public.instagram_comments
  for select to authenticated using ((select private.is_editor()));

-- Editor writes, one policy per command so reads keep a single policy
do $$
declare
  t text;
begin
  foreach t in array array[
    'brands', 'scrape_runs', 'instagram_accounts', 'instagram_posts', 'instagram_post_media',
    'instagram_post_coauthors', 'instagram_tagged_users', 'instagram_comments',
    'categories', 'post_categories', 'post_analyses'
  ] loop
    execute format(
      'create policy "Editors insert" on public.%I for insert to authenticated with check ((select private.is_editor()))', t);
    execute format(
      'create policy "Editors update" on public.%I for update to authenticated using ((select private.is_editor())) with check ((select private.is_editor()))', t);
    execute format(
      'create policy "Editors delete" on public.%I for delete to authenticated using ((select private.is_editor()))', t);
  end loop;
end;
$$;

-- Profiles: members read and edit their own name and avatar, never their role
create policy "Members read their profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Members update their profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Boards: owners only
create policy "Owners read boards" on public.boards
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners create boards" on public.boards
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owners update boards" on public.boards
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners delete boards" on public.boards
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "Owners read board posts" on public.board_posts
  for select to authenticated
  using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = (select auth.uid())));
create policy "Owners add board posts" on public.board_posts
  for insert to authenticated
  with check (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = (select auth.uid())));
create policy "Owners update board posts" on public.board_posts
  for update to authenticated
  using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = (select auth.uid())));
create policy "Owners remove board posts" on public.board_posts
  for delete to authenticated
  using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = (select auth.uid())));

-- Shared boards ---------------------------------------------------------------

-- Read a board through its share link (clients, logged out). The token is the
-- credential: an unknown token returns null, and only published posts come back.
create function public.get_shared_board(token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', b.name,
    'description', b.description,
    'posts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'short_code', p.short_code,
        'url', p.url,
        'format', p.format,
        'caption', p.caption,
        'cover_image_path', p.cover_image_path,
        'owner_username', p.owner_username,
        'posted_at', p.posted_at,
        'note', bp.note
      ) order by bp.position, bp.added_at)
      from public.board_posts bp
      join public.instagram_posts p on p.id = bp.post_id
      where bp.board_id = b.id and p.is_published
    ), '[]'::jsonb)
  )
  from public.boards b
  where b.share_token = token;
$$;

revoke execute on function public.get_shared_board(uuid) from public;
grant execute on function public.get_shared_board(uuid) to anon, authenticated;

-- Library ---------------------------------------------------------------------

-- What /library shows: published static posts and carousels
create view public.library_posts
with (security_invoker = true)
as
select
  p.id,
  p.short_code,
  p.url,
  p.format,
  p.caption,
  p.likes_count,
  p.comments_count,
  p.dimensions_width,
  p.dimensions_height,
  p.cover_image_path,
  p.posted_at,
  p.owner_username,
  p.owner_full_name,
  b.name as brand_name,
  b.slug as brand_slug,
  (select count(*) from public.instagram_post_media m where m.post_id = p.id) as slide_count
from public.instagram_posts p
left join public.brands b on b.id = p.brand_id
where p.is_published and p.format in ('static', 'carousel');

grant select on public.library_posts to anon, authenticated;
