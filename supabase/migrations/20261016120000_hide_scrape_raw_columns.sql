-- Commenters' data stays with editors (2026-10-16). instagram_comments has always been
-- editors-only, because members of the public wrote those comments, but the same comments were
-- readable with the publishable key through instagram_posts.raw (the verbatim Apify item, whose
-- latestComments carries each commenter's username, profile picture and text) and first_comment.
-- 212 of the 217 published posts had them on 2026-10-16. instagram_post_media has the same two
-- columns.
--
-- anon and authenticated (anyone can sign up, so it's as public as anon) lose SELECT on both
-- tables and get it back column by column, for every column but raw and first_comment. Nothing
-- that runs as either role reads those two: the website (src/lib/posts.ts, the review pages,
-- library_posts, get_shared_board), the MCP's reads and the curatit_mcp_* functions name their
-- columns, and the scripts and the analysis worker read as service_role, which keeps everything.
-- RLS still decides which rows.
--
-- What changes for later: `select *` (PostgREST's `select=*`) on these two tables now fails for
-- anon and authenticated with 42501, and a column added to either table is invisible to them
-- until a migration grants it. Name the columns you read, and grant new ones explicitly.
--
-- Rollback: grant select on public.instagram_posts, public.instagram_post_media to anon, authenticated;

set lock_timeout = '5s';

revoke select on public.instagram_posts, public.instagram_post_media from anon, authenticated;

grant select (
  id, input_url, short_code, url, type, product_type, format, caption, alt, hashtags, mentions,
  likes_count, comments_count, video_view_count, video_play_count, video_duration,
  dimensions_width, dimensions_height, original_width, original_height,
  display_url, video_url, images, location_id, location_name,
  paid_partnership, is_sponsored, is_pinned, is_comments_disabled, music_info,
  owner_id, owner_username, owner_full_name, posted_at,
  scrape_run_id, brand_id, is_published, published_at, created_at, updated_at,
  mcp_search
) on public.instagram_posts to anon, authenticated;

grant select (
  id, post_id, position, type, short_code, url, alt, hashtags, mentions,
  dimensions_width, dimensions_height, original_width, original_height,
  display_url, video_url, audio_url, images, video_duration,
  owner_id, owner_username, owner_full_name, posted_at
) on public.instagram_post_media to anon, authenticated;

-- The lists above are written out so the grant can be read; this makes sure they match the
-- tables, so a column that exists today but isn't listed can't quietly disappear from the site
do $$
declare
  v_wrong text;
begin
  -- Wrong: raw or first_comment readable, or any other column not
  select string_agg(format('%s.%s for %s', c.table_name, c.column_name, r.role), ', ')
  into v_wrong
  from information_schema.columns c
  cross join (values ('anon'), ('authenticated')) r(role)
  where c.table_schema = 'public'
    and c.table_name in ('instagram_posts', 'instagram_post_media')
    and (c.column_name in ('raw', 'first_comment')) = has_column_privilege(r.role, format('public.%I', c.table_name), c.column_name, 'select');
  if v_wrong is not null then
    raise exception 'Column grants are off: %', v_wrong;
  end if;
end;
$$;
