-- Checks the input length limits (20261018090000_input_length_limits.sql) inside a transaction
-- that always rolls back: the migration's statements are repeated here, so this runs before
-- and after the migration is applied. Run:
--   npx supabase db query --linked -f supabase/tests/input_limits.sql
-- (only the last statement's result is printed, so the checks collect into a temp table)
begin;

alter table public.boards
  add constraint boards_description_length check (description is null or char_length(description) <= 160);

alter table public.board_posts
  add constraint board_posts_note_length check (note is null or char_length(note) <= 280);

alter table public.profiles
  add constraint profiles_full_name_length check (full_name is null or char_length(full_name) <= 60),
  add constraint profiles_avatar_url_https check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://'));

-- A new account's name and avatar come from its sign-up metadata, which anyone can set when
-- calling Supabase Auth directly. Trim the name to the limit and drop an avatar URL that
-- isn't a short https link, so an oversized value never makes the sign-up itself fail.
-- Otherwise unchanged from 20261011080728_profiles_email_verified.sql.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  avatar text := new.raw_user_meta_data ->> 'avatar_url';
begin
  insert into public.profiles (id, full_name, avatar_url, email, email_verified)
  values (
    new.id,
    left(name, 60),
    case when avatar ~ '^https://' and char_length(avatar) <= 2048 then avatar end,
    new.email,
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

create temp table results (check_name text, passed boolean);

do $$
declare
  me uuid := (select id from auth.users order by created_at limit 1);
  board uuid := gen_random_uuid();
  ok boolean;
begin
  insert into public.boards (id, owner_id, name) values (board, me, 'Limits test');

  begin
    update public.boards set description = repeat('x', 161) where id = board;
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into results values ('board description over 160 refused', ok);

  begin
    insert into public.board_posts (board_id, post_id, note) values (board, 'limits-test', repeat('x', 281));
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into results values ('note over 280 refused', ok);

  begin
    update public.profiles set full_name = repeat('x', 61) where id = me;
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into results values ('full name over 60 refused', ok);

  begin
    update public.profiles set avatar_url = 'javascript:alert(1)' where id = me;
    ok := false;
  exception when check_violation then ok := true;
  end;
  insert into results values ('non-https avatar refused', ok);

  begin
    update public.boards set description = repeat('x', 160) where id = board;
    update public.profiles set full_name = repeat('x', 60), avatar_url = 'https://example.com/a.png' where id = me;
    ok := true;
  exception when check_violation then ok := false;
  end;
  insert into results values ('values at the limits accepted', ok);
end $$;

select * from results;

rollback;
