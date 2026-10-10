-- Instagram can tag the same account twice on one post (or one slide), which broke imports
-- on instagram_tagged_users' (post_id, media_id, account_id) key. The import now keeps the
-- first tag and skips repeats. Otherwise unchanged from 20261009195133_post_images.sql.

create or replace function private.ingest_instagram_post(
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
    values (v_post_id, private.upsert_instagram_account(tagged), tagged_position - 1)
    on conflict do nothing;
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
      values (v_post_id, child ->> 'id', private.upsert_instagram_account(tagged), tagged_position - 1)
      on conflict do nothing;
    end loop;

    perform private.ingest_instagram_comments(child -> 'latestComments', v_post_id, child ->> 'id', null);
  end loop;

  perform private.ingest_instagram_comments(item -> 'latestComments', v_post_id, null, null);

  return v_post_id;
end;
$$;

revoke execute on function private.ingest_instagram_post(jsonb, uuid, uuid) from public;
