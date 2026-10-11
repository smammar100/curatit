-- Whether each account has confirmed its email address, beside the email on its profile, so the
-- Table Editor (public.profiles) shows who is verified. Supabase's own Users page has no such
-- column; the source is auth.users.email_confirmed_at.
--
-- Like the email (…_profiles_email), it's copied when the account is made and kept in step by a
-- trigger: the confirmation link, a confirmed email change, or an account confirmed from the
-- dashboard all set email_confirmed_at. Members can read their own row but can't write it
-- (authenticated may only update full_name and avatar_url).

alter table public.profiles add column email_verified boolean not null default false;

comment on column public.profiles.email_verified is 'Whether the account has confirmed its email (auth.users.email_confirmed_at is set), copied by triggers; read-only for members';

-- Accounts made before this migration
update public.profiles p
set email_verified = u.email_confirmed_at is not null
from auth.users u
where u.id = p.id;

-- New accounts: verified from the start when the project doesn't ask for confirmation.
-- Otherwise unchanged from 20261010162254_profiles_email.sql.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, email_verified)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email,
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

-- The email and whether it's confirmed follow into the profile, whichever changed
create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email, email_verified = new.email_confirmed_at is not null
  where id = new.id;
  return new;
end;
$$;

drop trigger on_auth_user_email_changed on auth.users;

create trigger on_auth_user_email_changed
  after update of email, email_confirmed_at on auth.users
  for each row
  when (old.email is distinct from new.email or old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function private.sync_profile_email();
