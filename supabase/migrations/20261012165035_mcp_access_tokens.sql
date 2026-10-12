-- Personal access tokens and rate limits for the MCP / research API (2026-10-12).
--
-- api_tokens: a member's tokens for MCP clients and the stdio bridge. Only a SHA-256 of the
-- secret is kept; the owner sees the secret once. Owners manage their own rows under RLS and
-- column grants (they never read or write the hash column, which the server action fills on
-- insert). The server checks a presented token with curatit_api_token_verify as service_role,
-- which also notes when it was last used. A token can't outlive a year.
--
-- rate_limits: a fixed-window counter per key, shared by every replica, through
-- curatit_rate_limit_hit (service_role only). Old windows are swept as a side effect.

create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  -- The first characters of the secret, so the owner can tell tokens apart
  prefix text not null check (char_length(prefix) between 8 and 24),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  scopes text[] not null check (cardinality(scopes) between 1 and 4 and scopes <@ array['curatit:read', 'curatit:brief']::text[]),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at and expires_at <= created_at + interval '366 days')
);

create index api_tokens_owner_id_idx on public.api_tokens (owner_id);

alter table public.api_tokens enable row level security;

create policy "api_tokens: owners read their own" on public.api_tokens
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "api_tokens: owners create their own" on public.api_tokens
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "api_tokens: owners update their own" on public.api_tokens
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- The hash is write-once from the server action; owners never read it back
grant select (id, owner_id, name, prefix, scopes, expires_at, last_used_at, revoked_at, created_at) on public.api_tokens to authenticated;
grant insert (name, prefix, token_hash, scopes, expires_at) on public.api_tokens to authenticated;
grant update (name, revoked_at) on public.api_tokens to authenticated;

-- One answer for unknown, revoked and expired tokens: null
create function public.curatit_api_token_verify(p_token_hash text)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_token public.api_tokens%rowtype;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  update public.api_tokens t
    set last_used_at = now()
    where t.token_hash = p_token_hash and t.revoked_at is null and t.expires_at > now()
    returning t.* into v_token;
  if v_token.id is null then
    return null;
  end if;
  return jsonb_build_object('token_id', v_token.id, 'user_id', v_token.owner_id, 'scopes', to_jsonb(v_token.scopes), 'expires_at', v_token.expires_at);
end;
$$;

revoke execute on function public.curatit_api_token_verify(text) from public, anon, authenticated;
grant execute on function public.curatit_api_token_verify(text) to service_role;

-- Rate limits ----------------------------------------------------------------

create table private.rate_limits (
  key text primary key check (char_length(key) between 1 and 200),
  window_start timestamptz not null,
  count integer not null default 0
);

create function public.curatit_rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_window interval := make_interval(secs => greatest(1, p_window_seconds));
  v_row private.rate_limits%rowtype;
begin
  insert into private.rate_limits as r (key, window_start, count)
    values (p_key, v_now, 1)
    on conflict (key) do update
      set window_start = case when r.window_start + v_window <= v_now then v_now else r.window_start end,
          count = case when r.window_start + v_window <= v_now then 1 else r.count + 1 end
    returning * into v_row;
  -- Keep the table small: windows that ended more than an hour ago are gone
  if random() < 0.02 then
    delete from private.rate_limits where window_start < v_now - interval '1 hour';
  end if;
  return jsonb_build_object(
    'allowed', v_row.count <= p_limit,
    'remaining', greatest(0, p_limit - v_row.count),
    'retry_after', greatest(1, ceil(extract(epoch from (v_row.window_start + v_window - v_now)))::integer));
end;
$$;

revoke execute on function public.curatit_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.curatit_rate_limit_hit(text, integer, integer) to service_role;
