-- Length limits on everything members write straight from the browser, so the database enforces
-- what the interface already promises (2026-10-18, a pre-launch input audit). Until now only
-- board names, token names and the onboarding occupation were checked here; a member could
-- write a board description, a note on a saved post, their name or their avatar URL of any
-- size through the API with their own session.
--
--   boards.description   160   NewBoardDialog / BoardView DESCRIPTION_MAX
--   board_posts.note     280   BoardView NOTE_MAX
--   profiles.full_name    60   the welcome flow's name field
--   profiles.avatar_url  2048, https only (it's put in an <img src>)
--
-- Every existing row fits (checked 2026-10-18: no descriptions, notes or avatar URLs yet, the
-- longest name 7 characters), so the constraints are validated at once.

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
