-- One row per image file in the `library` bucket, linked to its post
--
-- Replaces instagram_posts.cover_image_path and instagram_post_media.image_path:
-- static posts had their image only on the post, carousel slides only on
-- instagram_post_media, and ingest_instagram_post() deletes and re-inserts the
-- media rows on every import, which wiped the slide paths. post_images is keyed
-- by (post_id, position), which imports never touch:
--
--   position 0 is the cover (a static post's image, a carousel's first slide,
--   a video's cover frame); carousel slide n is position n, matching
--   instagram_post_media.position.
--
-- Each path must be <category>/<brand>/<format>/<short_code>/<position + 1>.<ext>
-- for its own post, checked on insert and update. Deleting a post deletes its
-- rows here, not its files in the bucket.

create table public.post_images (
  post_id text not null references public.instagram_posts (id) on delete cascade,
  position smallint not null check (position >= 0),
  bucket_id text not null default 'library',
  path text not null check (path ~ '^[a-z0-9-]+/[a-z0-9-]+/(static|carousel|video)/[A-Za-z0-9_-]+/[0-9]{2}\.(jpg|png|webp)$'),
  created_at timestamptz not null default now(),
  primary key (post_id, position),
  unique (bucket_id, path)
);

comment on table public.post_images is 'Image files in Storage, one per post slot. Position 0 is the cover; carousel slide n is position n.';

-- The path must point into this post's own folder, at this position
create function private.check_post_image_path()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  folder text;
begin
  select c.slug || '/' || b.slug || '/' || p.format || '/' || p.short_code || '/'
  into folder
  from public.instagram_posts p
  join public.brands b on b.id = p.brand_id
  join public.categories c on c.id = b.category_id
  where p.id = new.post_id;

  if folder is null then
    raise exception 'Post % needs a brand with a category before it can have images', new.post_id;
  end if;
  if not starts_with(new.path, folder || lpad((new.position + 1)::text, 2, '0') || '.') then
    raise exception 'Image path % should be %.<ext> for post % position %',
      new.path, folder || lpad((new.position + 1)::text, 2, '0'), new.post_id, new.position;
  end if;
  return new;
end;
$$;

create trigger check_path before insert or update of post_id, position, path on public.post_images
  for each row execute function private.check_post_image_path();

-- Move the existing paths over: slides first, then single-image covers
insert into public.post_images (post_id, position, path)
select m.post_id, m.position, m.image_path
from public.instagram_post_media m
where m.image_path is not null;

insert into public.post_images (post_id, position, path)
select p.id, 0, p.cover_image_path
from public.instagram_posts p
where p.cover_image_path is not null
  and not exists (select 1 from public.post_images i where i.post_id = p.id);

-- Access: visible with the post, written by editors
grant select on public.post_images to anon, authenticated;
grant insert, update, delete on public.post_images to authenticated;

alter table public.post_images enable row level security;

create policy "Visible with their post" on public.post_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.instagram_posts p
    where p.id = post_id and (p.is_published or (select private.is_editor()))
  ));
create policy "Editors insert" on public.post_images
  for insert to authenticated with check ((select private.is_editor()));
create policy "Editors update" on public.post_images
  for update to authenticated using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "Editors delete" on public.post_images
  for delete to authenticated using ((select private.is_editor()));

-- Drop the old path columns and everything that read them --------------------

drop view public.library_posts;
drop function private.ingest_instagram_post(jsonb, uuid, uuid, text);

alter table public.instagram_posts drop column cover_image_path;
alter table public.instagram_post_media drop column image_path;

-- Same import as before, without the cover path (images go in post_images)
create function private.ingest_instagram_post(
  item jsonb,
  p_scrape_run_id uuid default null,
  p_brand_id uuid default null
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
    scrape_run_id, brand_id
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
    p_scrape_run_id, p_brand_id
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
    brand_id = coalesce(public.instagram_posts.brand_id, excluded.brand_id);

  -- Replace the child rows with this scrape's (post_images is left alone)
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

-- Private functions are for the database owner only (the default privileges
-- revoke only covers public)
revoke execute on function private.ingest_instagram_post(jsonb, uuid, uuid) from public;
revoke execute on function private.check_post_image_path() from public;

-- What /library shows: published static posts and carousels, with their cover
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
  cover.path as cover_path,
  (select count(*) from public.post_images i where i.post_id = p.id) as image_count,
  p.posted_at,
  p.owner_username,
  p.owner_full_name,
  b.name as brand_name,
  b.slug as brand_slug,
  c.slug as category_slug
from public.instagram_posts p
left join public.post_images cover on cover.post_id = p.id and cover.position = 0
left join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = b.category_id
where p.is_published and p.format in ('static', 'carousel');

grant select on public.library_posts to anon, authenticated;

-- Shared boards return the cover's path instead of the old column
create or replace function public.get_shared_board(token uuid)
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
        'cover_path', cover.path,
        'owner_username', p.owner_username,
        'posted_at', p.posted_at,
        'note', bp.note
      ) order by bp.position, bp.added_at)
      from public.board_posts bp
      join public.instagram_posts p on p.id = bp.post_id
      left join public.post_images cover on cover.post_id = p.id and cover.position = 0
      where bp.board_id = b.id and p.is_published
    ), '[]'::jsonb)
  )
  from public.boards b
  where b.share_token = token;
$$;
