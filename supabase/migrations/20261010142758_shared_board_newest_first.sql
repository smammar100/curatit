-- A shared board lists its posts newest first, like the board's own page in the dashboard
-- (position still comes first, for when boards can be reordered by hand). Otherwise unchanged
-- from the original in 20261009190000_curatit_schema.sql; create or replace keeps its grants.
-- It stays security definer and callable by anon on purpose: the share token is the credential.

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
      ) order by bp.position, bp.added_at desc)
      from public.board_posts bp
      join public.instagram_posts p on p.id = bp.post_id
      left join public.post_images cover on cover.post_id = p.id and cover.position = 0
      where bp.board_id = b.id and p.is_published
    ), '[]'::jsonb)
  )
  from public.boards b
  where b.share_token = token;
$$;
