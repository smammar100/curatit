-- A board's updated_at follows its posts too: adding or removing one counts as using the
-- board, so the dashboard can list boards by when they were last used.
--
-- Security invoker on purpose: it runs as the person changing board_posts, and the boards
-- update policy (owners only) still applies. A post removed because its board was deleted
-- finds no board to touch, which is fine.

create function private.touch_board()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.boards
  set updated_at = now()
  where id = coalesce(new.board_id, old.board_id);
  return null;
end;
$$;

revoke execute on function private.touch_board() from public;

create trigger touch_board after insert or delete on public.board_posts
  for each row execute function private.touch_board();
