-- Each profile carries its account's email, copied from auth.users (where Supabase keeps the
-- account itself, in the auth schema the Table Editor doesn't show), so the app and the
-- dashboard can read it beside the name without reaching into auth.
--
-- The copy follows the account: it's set when the account is made (handle_new_user) and again
-- whenever the address changes (a confirmed email change). Members can read their own row (the
-- existing select policy) but can't write the column: authenticated may only update full_name
-- and avatar_url, so the email can't drift from the real one.

alter table public.profiles add column email text;

comment on column public.profiles.email is 'The account''s email, copied from auth.users by triggers; read-only for members';

-- Accounts made before this migration
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

-- New accounts get their email with their profile. Otherwise unchanged from
-- 20261009190000_curatit_schema.sql.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', new.email);
  return new;
end;
$$;

-- A changed address follows into the profile
create function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

revoke execute on function private.sync_profile_email() from public;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sync_profile_email();
