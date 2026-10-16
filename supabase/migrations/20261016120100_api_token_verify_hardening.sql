-- Personal access tokens, hardened (2026-10-16).
--
-- 1. curatit_api_token_verify wrote last_used_at on every MCP request: a row lock and a dead
--    tuple per call, parallel calls on one token queueing behind each other, and every sign-in
--    failing whenever the database is read-only (Supabase turns read-only on when the disk fills,
--    and a primary can be read-only while it fails over). It now reads first and notes the use
--    at most once a minute, skipping a row another call has locked, and a read-only database
--    doesn't stop the check: the note is simply skipped.
-- 2. A banned account (auth.users.banned_until in the future) or a soft-deleted one kept every
--    token working. The check now refuses them. auth.users belongs to the auth schema, which
--    service_role can't read, so private.api_token_owner_active looks it up as its owner.
-- 3. Owners can update revoked_at (that's how they revoke), so they could also set it back to
--    null and revive a revoked token. A trigger now keeps a revoked token revoked, and keeps the
--    first revocation time if a token is revoked again.
--
-- Same signature, same grants (service_role only) and the same JSON as before, so the code
-- deployed today reads it unchanged, and the tokens that exist today verify as they did.
--
-- Rollback: re-run curatit_api_token_verify from 20261012165035_mcp_access_tokens.sql, then
--   drop trigger api_tokens_keep_revoked on public.api_tokens;
--   drop function private.api_tokens_keep_revoked();
--   drop function private.api_token_owner_active(uuid);

set lock_timeout = '5s';

-- Whether an account may use its tokens: it exists, isn't soft-deleted and isn't banned now.
-- A hard-deleted account takes its tokens with it (api_tokens → profiles → auth.users cascade).
create function private.api_token_owner_active(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = p_user_id
      and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= now()));
$$;

revoke execute on function private.api_token_owner_active(uuid) from public, anon, authenticated;
grant execute on function private.api_token_owner_active(uuid) to service_role;

-- One answer for unknown, revoked, expired and banned: null
create or replace function public.curatit_api_token_verify(p_token_hash text)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_token public.api_tokens%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  select t.* into v_token
    from public.api_tokens t
    where t.token_hash = p_token_hash and t.revoked_at is null and t.expires_at > now();
  if v_token.id is null or not private.api_token_owner_active(v_token.owner_id) then
    return null;
  end if;

  -- Note the use at most once a minute. Under skip locked, a call that finds the row locked by
  -- another call noting the same use leaves it to that one rather than waiting for it. The block
  -- (a subtransaction) is only entered when there's something to note.
  if v_token.last_used_at is null or v_token.last_used_at < now() - interval '1 minute' then
    begin
      update public.api_tokens t
        set last_used_at = now()
        where t.id = (
          select s.id from public.api_tokens s
          where s.id = v_token.id and (s.last_used_at is null or s.last_used_at < now() - interval '1 minute')
          for update skip locked);
    exception when read_only_sql_transaction then
      null;
    end;
  end if;

  return jsonb_build_object('token_id', v_token.id, 'user_id', v_token.owner_id, 'scopes', to_jsonb(v_token.scopes), 'expires_at', v_token.expires_at);
end;
$$;

revoke execute on function public.curatit_api_token_verify(text) from public, anon, authenticated;
grant execute on function public.curatit_api_token_verify(text) to service_role;

-- Revoking is one-way. To bring a token back, make a new one; anyone who truly needs to revive a
-- row (an admin, by hand) has to drop this trigger first, on purpose.
create function private.api_tokens_keep_revoked()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.revoked_at is null then
    raise exception 'A revoked token stays revoked. Create a new token instead.'
      using errcode = 'check_violation';
  end if;
  -- Revoked again: the first time is the one that counts
  new.revoked_at := old.revoked_at;
  return new;
end;
$$;

revoke execute on function private.api_tokens_keep_revoked() from public, anon, authenticated;

create trigger api_tokens_keep_revoked
  before update of revoked_at on public.api_tokens
  for each row
  when (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at)
  execute function private.api_tokens_keep_revoked();
