-- Database security for the site and the MCP (supabase/migrations/20261016120000_hide_scrape_raw_columns.sql
-- and 20261016120100_api_token_verify_hardening.sql): checks against the linked project, in one
-- transaction that always rolls back. Run it with
--   npx supabase db query --linked -f supabase/tests/mcp_security.sql
-- It prints one row per check, failures first; every `ok` should be true. To check the
-- migrations before they're pushed, paste their SQL at the marker below (the rollback undoes
-- them too).
--
-- Part 1 runs, as anon, as a signed-in member and as an editor, exactly what each reader of
-- instagram_posts and instagram_post_media selects: the website (src/lib/posts.ts, the review
-- pages, src/lib/boards.ts, the post page's analysis), the MCP's own reads
-- (src/lib/mcp/repo/supabase.ts) and every catalog function either role can call. Then it checks
-- raw and first_comment are refused. Part 2 checks personal access tokens: the verify function
-- notes a use at most once a minute, refuses banned and deleted accounts, keeps working when the
-- database is read-only, and a revoked token can't be revived.
--
-- anon and authenticated can't read a temp table that postgres made, so what they see is kept in
-- set_config(..., true) and read back as postgres.

begin;

-- @migration

create temp table checks (name text, ok boolean, detail text);

-- Part 1: who reads which columns ------------------------------------------------------------

-- The rows the reads use, found as postgres
select set_config('test.post', (
  select p.id from public.instagram_posts p
  join public.post_analyses a on a.post_id = p.id and a.published_at is not null
  where p.is_published and p.format = 'carousel' and exists (select 1 from public.instagram_post_media m where m.post_id = p.id)
  order by p.posted_at desc limit 1), true);
select set_config('test.short_code', (select short_code from public.instagram_posts where id = current_setting('test.post')), true);
select set_config('test.board', (
  select b.share_token::text from public.boards b
  where b.share_token is not null and exists (select 1 from public.board_posts bp where bp.board_id = b.id)
  limit 1), true);
select set_config('test.term', (
  select jsonb_build_object(l.dimension, jsonb_build_array(l.slug))::text
  from public.post_creative_labels l
  join public.post_analyses a on a.current_version_id = l.version_id and a.published_at is not null
  where l.dimension = 'archetype' limit 1), true);
select set_config('test.editor', (select id::text from public.profiles where role in ('editor', 'admin') order by id limit 1), true);

-- Each read returns one number, which should be above zero. The SQL is what the reader asks
-- for, written out the way PostgREST runs an embedded select (the joins use the same foreign
-- key columns, which need SELECT too).
select set_config('test.reads', jsonb_build_object(
  'website: getPublishedPosts', $q$
    select count(*) from (
      select p.id, p.short_code, p.url, p.format, p.caption, p.posted_at, p.created_at, p.dimensions_width, p.dimensions_height,
        (select jsonb_build_object('name', b.name, 'slug', b.slug, 'logo_path', b.logo_path,
           'categories', (select jsonb_build_object('name', c.name, 'slug', c.slug) from public.categories c where c.id = b.category_id))
         from public.brands b where b.id = p.brand_id) as brands,
        (select jsonb_agg(jsonb_build_object('position', i.position, 'path', i.path)) from public.post_images i where i.post_id = p.id) as post_images,
        (select jsonb_agg((select jsonb_build_object('name', c.name, 'slug', c.slug) from public.categories c where c.id = pc.category_id))
         from public.post_categories pc where pc.post_id = p.id) as post_categories
      from public.instagram_posts p where p.is_published = true order by p.posted_at desc) x $q$,
  'website: getPostDetail', $q$
    select count(*) from (
      select p.id, p.short_code, p.url, p.format, p.caption, p.posted_at, p.created_at, p.dimensions_width, p.dimensions_height,
        p.likes_count, p.comments_count, p.owner_username,
        (select a.is_verified from public.instagram_accounts a where a.id = p.owner_id) as owner,
        (select jsonb_build_object('name', b.name, 'slug', b.slug, 'logo_path', b.logo_path) from public.brands b where b.id = p.brand_id) as brands,
        (select jsonb_agg(jsonb_build_object('position', i.position, 'path', i.path)) from public.post_images i where i.post_id = p.id) as post_images,
        (select jsonb_agg(pc.category_id) from public.post_categories pc where pc.post_id = p.id) as post_categories,
        (select jsonb_agg(jsonb_build_object('position', m.position, 'type', m.type)) from public.instagram_post_media m where m.post_id = p.id) as media
      from public.instagram_posts p where p.is_published = true and p.short_code = current_setting('test.short_code')) x $q$,
  'website: post page analysis', $q$
    select count(*) from public.post_analyses a
    join public.post_slide_analyses s on s.post_id = a.post_id and s.version_id = a.current_version_id
    where a.post_id = current_setting('test.post') and a.published_at is not null $q$,
  'website: boards.ts library_posts', $q$
    select count(*) from (select short_code, brand_name, brand_logo_path, dimensions_width, dimensions_height from public.library_posts) x $q$,
  'website: library_posts, every column', $q$ select count(*) from (select * from public.library_posts) x $q$,
  'website: get_shared_board', $q$ select jsonb_array_length(public.get_shared_board(current_setting('test.board')::uuid) -> 'posts') $q$,
  'review: POST_COLUMNS', $q$
    select count(*) from (
      select p.id, p.short_code, p.url, p.caption, p.format,
        (select jsonb_build_object('name', b.name, 'categories', (select jsonb_build_object('name', c.name) from public.categories c where c.id = b.category_id))
         from public.brands b where b.id = p.brand_id) as brands,
        (select jsonb_agg(jsonb_build_object('position', i.position, 'path', i.path)) from public.post_images i where i.post_id = p.id) as post_images
      from public.instagram_posts p where p.id in (current_setting('test.post'))) x $q$,
  'mcp: resolvePost', $q$
    select count(*) from (
      select id, short_code from public.instagram_posts
      where id = current_setting('test.short_code') or short_code = current_setting('test.short_code') limit 1) x $q$,
  'mcp: slides, the post', $q$
    select count(*) from (select alt, dimensions_width, dimensions_height, format from public.instagram_posts where id = current_setting('test.post')) x $q$,
  'mcp: slides, the media', $q$
    select count(*) from (
      select position, alt, type, dimensions_width, dimensions_height from public.instagram_post_media
      where post_id = current_setting('test.post') order by position) x $q$,
  'rpc: curatit_mcp_search (v1)', $q$ select jsonb_array_length(public.curatit_mcp_search(p_query => 'money') -> 'posts') $q$,
  'rpc: curatit_mcp_search (v1) by category', $q$ select jsonb_array_length(public.curatit_mcp_search(p_category => 'finance') -> 'posts') $q$,
  'rpc: curatit_mcp_get_post (v1)', $q$ select (public.curatit_mcp_get_post(current_setting('test.post')) is not null)::int $q$,
  'rpc: curatit_mcp_search_v2, query', $q$ select jsonb_array_length(public.curatit_mcp_search_v2('{"query": "money"}') -> 'posts') $q$,
  'rpc: curatit_mcp_search_v2, category and analysed', $q$
    select jsonb_array_length(public.curatit_mcp_search_v2('{"category": "finance", "analysed_only": true, "limit": 50}') -> 'posts') $q$,
  'rpc: curatit_mcp_search_v2, a creative term', $q$
    select jsonb_array_length(public.curatit_mcp_search_v2(current_setting('test.term')::jsonb) -> 'posts') $q$,
  'rpc: curatit_mcp_get_post_v2', $q$ select (public.curatit_mcp_get_post_v2(current_setting('test.post')) -> 'creative' is not null)::int $q$,
  'rpc: curatit_mcp_taxonomy, categories', $q$ select jsonb_array_length(public.curatit_mcp_taxonomy('categories', '', 100) -> 'items') $q$,
  'rpc: curatit_mcp_taxonomy, brands', $q$ select jsonb_array_length(public.curatit_mcp_taxonomy('brands', '', 100) -> 'items') $q$,
  'rpc: curatit_mcp_catalog_stats', $q$ select (public.curatit_mcp_catalog_stats() ->> 'published_posts')::int $q$,
  'rpc: curatit_mcp_resolve_filter', $q$ select (public.curatit_mcp_resolve_filter('categories', 'finance') is not null)::int $q$,
  'rpc: curatit_mcp_creative_terms', $q$ select (public.curatit_mcp_creative_terms() is not null)::int $q$
)::text, true);

-- Each of these should be refused with 42501
select set_config('test.refused', jsonb_build_object(
  'instagram_posts.raw', $q$ select count(raw) from public.instagram_posts $q$,
  'instagram_posts.raw -> latestComments', $q$ select count(*) from public.instagram_posts where raw ? 'latestComments' $q$,
  'instagram_posts.first_comment', $q$ select count(first_comment) from public.instagram_posts $q$,
  'instagram_posts, every column', $q$ select count(*) from (select * from public.instagram_posts) x $q$,
  'instagram_post_media.raw', $q$ select count(raw) from public.instagram_post_media $q$,
  'instagram_post_media.first_comment', $q$ select count(first_comment) from public.instagram_post_media $q$
)::text, true);

-- Runs both lists as the current role and keeps the outcomes under test.out_<label>
select set_config('test.runner', $run$
  do $$
  declare
    v_label text := current_setting('test.label');
    v_out jsonb := '{}';
    v_name text;
    v_sql text;
    v_n bigint;
  begin
    for v_name, v_sql in select key, value from jsonb_each_text(current_setting('test.reads')::jsonb) loop
      begin
        execute v_sql into v_n;
        v_out := v_out || jsonb_build_object('read: ' || v_name, coalesce(v_n::text, 'null'));
      exception when others then
        v_out := v_out || jsonb_build_object('read: ' || v_name, 'ERROR ' || sqlstate || ': ' || sqlerrm);
      end;
    end loop;
    for v_name, v_sql in select key, value from jsonb_each_text(current_setting('test.refused')::jsonb) loop
      begin
        execute v_sql into v_n;
        v_out := v_out || jsonb_build_object('refused: ' || v_name, 'read ' || coalesce(v_n::text, 'null'));
      exception when others then
        v_out := v_out || jsonb_build_object('refused: ' || v_name, sqlstate);
      end;
    end loop;
    perform set_config('test.out_' || v_label, v_out::text, true);
  end $$
$run$, true);

select set_config('test.label', 'anon', true);
set local role anon;
do $$ begin execute current_setting('test.runner'); end $$;
reset role;

-- A signed-in member who isn't an editor (a made-up id: RLS treats them as a member)
select set_config('test.label', 'member', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin execute current_setting('test.runner'); end $$;
reset role;

select set_config('test.label', 'editor', true);
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('test.editor'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin execute current_setting('test.runner'); end $$;
reset role;
select set_config('request.jwt.claims', '', true);

insert into checks
select format('%s %s', r.role, o.key),
  case when o.key like 'read: %' then o.value ~ '^[0-9]+$' and o.value::bigint > 0 else o.value = '42501' end,
  o.value
from (values ('anon'), ('member'), ('editor')) r(role)
cross join lateral jsonb_each_text(current_setting('test.out_' || r.role)::jsonb) o;

insert into checks
select format('%s can''t select %s.%s', r.role, t.name, c.name),
  not has_column_privilege(r.role, format('public.%I', t.name), c.name, 'select'), null
from (values ('anon'), ('authenticated')) r(role),
  (values ('instagram_posts'), ('instagram_post_media')) t(name),
  (values ('raw'), ('first_comment')) c(name);

insert into checks
select format('%s can select every other column of %s', r.role, t.name),
  bool_and(has_column_privilege(r.role, format('public.%I', t.name), c.column_name, 'select')),
  string_agg(c.column_name, ', ') filter (where not has_column_privilege(r.role, format('public.%I', t.name), c.column_name, 'select'))
from (values ('anon'), ('authenticated')) r(role),
  (values ('instagram_posts'), ('instagram_post_media')) t(name),
  information_schema.columns c
where c.table_schema = 'public' and c.table_name = t.name and c.column_name not in ('raw', 'first_comment')
group by r.role, t.name;

insert into checks
select 'service_role still reads raw',
  has_column_privilege('service_role', 'public.instagram_posts', 'raw', 'select')
    and has_column_privilege('service_role', 'public.instagram_post_media', 'raw', 'select'), null
union all
select 'editors keep their writes',
  bool_and(has_table_privilege('authenticated', t, p)), null
from unnest(array['public.instagram_posts', 'public.instagram_post_media']) t, unnest(array['insert', 'update', 'delete']) p;

-- Part 2: personal access tokens ---------------------------------------------------------------

-- A token for the editor, last used 30 seconds ago, whose secret is 'ws5-test-token'
select set_config('test.hash', encode(sha256('ws5-test-token'::bytea), 'hex'), true);
select set_config('test.token', gen_random_uuid()::text, true);
insert into public.api_tokens (id, owner_id, name, prefix, token_hash, scopes, expires_at, last_used_at)
values (current_setting('test.token')::uuid, current_setting('test.editor')::uuid, 'Security test', 'curatit_pat_test',
  current_setting('test.hash'), array['curatit:read'], now() + interval '30 days', now() - interval '30 seconds');

-- Runs the verify as service_role, the role the server uses, and keeps the answer, last_used_at
-- and the row's ctid (an update always moves it) under test.<label>
select set_config('test.verify', $v$
  do $$ begin
    perform set_config('test.answer_' || current_setting('test.label'),
      coalesce(public.curatit_api_token_verify(current_setting('test.hash'))::text, 'null'), true);
  end $$
$v$, true);

create function pg_temp.snapshot(p_label text) returns void language sql as $$
  select set_config('test.row_' || p_label, (
    select jsonb_build_object('last_used_at', t.last_used_at, 'ctid', t.ctid::text)::text
    from public.api_tokens t where t.id = current_setting('test.token')::uuid), true);
$$;

-- Used 30 seconds ago: answered, nothing written
select pg_temp.snapshot('before');
select set_config('test.label', 'recent', true);
set local role service_role;
do $$ begin execute current_setting('test.verify'); end $$;
reset role;
select pg_temp.snapshot('recent');

-- Used two minutes ago: noted now
update public.api_tokens set last_used_at = now() - interval '2 minutes' where id = current_setting('test.token')::uuid;
select pg_temp.snapshot('stale_before');
select set_config('test.label', 'stale', true);
set local role service_role;
do $$ begin execute current_setting('test.verify'); end $$;
reset role;
select pg_temp.snapshot('stale');

-- Never used, then twice in a row: the first call notes it, the second writes nothing
update public.api_tokens set last_used_at = null where id = current_setting('test.token')::uuid;
set local role service_role;
select set_config('test.label', 'first', true);
do $$ begin execute current_setting('test.verify'); end $$;
reset role;
select pg_temp.snapshot('first');
set local role service_role;
select set_config('test.label', 'second', true);
do $$ begin execute current_setting('test.verify'); end $$;
reset role;
select pg_temp.snapshot('second');

-- The tokens that exist today still verify (each hash as stored; the notes they make roll back)
set local role service_role;
select set_config('test.existing', (
  select jsonb_build_object(
    'live', count(*),
    'verified', count(*) filter (where public.curatit_api_token_verify(t.token_hash) is not null))::text
  from public.api_tokens t
  where t.revoked_at is null and t.expires_at > now() and t.id <> current_setting('test.token')::uuid), true);
reset role;

-- Banned until tomorrow: refused; ban over: answered again; soft-deleted: refused
update auth.users set banned_until = now() + interval '1 day' where id = current_setting('test.editor')::uuid;
set local role service_role;
select set_config('test.label', 'banned', true);
do $$ begin execute current_setting('test.verify'); end $$;
reset role;
update auth.users set banned_until = now() - interval '1 minute' where id = current_setting('test.editor')::uuid;
set local role service_role;
select set_config('test.label', 'ban_over', true);
do $$ begin execute current_setting('test.verify'); end $$;
reset role;
update auth.users set banned_until = null, deleted_at = now() where id = current_setting('test.editor')::uuid;
set local role service_role;
select set_config('test.label', 'deleted', true);
do $$ begin execute current_setting('test.verify'); end $$;
reset role;
update auth.users set deleted_at = null where id = current_setting('test.editor')::uuid;

-- The owner revokes it, can rename it, can't revive it, and revoking again keeps the first time
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('test.editor'), 'role', 'authenticated')::text, true);
set local role authenticated;
update public.api_tokens set revoked_at = now() where id = current_setting('test.token')::uuid;
do $$
begin
  update public.api_tokens set revoked_at = null where id = current_setting('test.token')::uuid;
  perform set_config('test.revive', 'updated', true);
exception when others then
  perform set_config('test.revive', sqlstate, true);
end $$;
update public.api_tokens set name = 'Renamed after revoking' where id = current_setting('test.token')::uuid;
update public.api_tokens set revoked_at = now() - interval '1 day' where id = current_setting('test.token')::uuid;
select set_config('test.after_revoke', (
  select jsonb_build_object('name', name, 'revoked_at', revoked_at, 'first_time_kept', revoked_at = now())::text
  from public.api_tokens where id = current_setting('test.token')::uuid), true);
reset role;
select set_config('request.jwt.claims', '', true);
set local role service_role;
select set_config('test.label', 'revoked', true);
do $$ begin execute current_setting('test.verify'); end $$;
reset role;

insert into checks
select 'verify answers a live token with the same four keys',
  (a ?& array['token_id', 'user_id', 'scopes', 'expires_at']) and (select count(*) from jsonb_object_keys(a)) = 4
    and a ->> 'token_id' = current_setting('test.token') and a ->> 'user_id' = current_setting('test.editor'),
  a::text
from (select current_setting('test.answer_recent')::jsonb a) v
union all
select 'used 30 s ago: nothing written',
  current_setting('test.row_recent') = current_setting('test.row_before'), current_setting('test.row_recent')
union all
select 'used 2 min ago: last_used_at moves to now',
  (current_setting('test.row_stale')::jsonb ->> 'last_used_at')::timestamptz = now() and current_setting('test.answer_stale') <> 'null',
  current_setting('test.row_stale')
union all
select 'never used: the first call notes it',
  (current_setting('test.row_first')::jsonb ->> 'last_used_at')::timestamptz = now(), current_setting('test.row_first')
union all
select 'the second call within the minute writes nothing',
  current_setting('test.row_second') = current_setting('test.row_first') and current_setting('test.answer_second') <> 'null',
  current_setting('test.row_second')
union all
select 'the tokens that exist today still verify',
  (e ->> 'verified')::int = (e ->> 'live')::int, e::text
from (select current_setting('test.existing')::jsonb e) v
union all
select 'a banned owner''s token is refused', current_setting('test.answer_banned') = 'null', current_setting('test.answer_banned')
union all
select 'a ban that has ended doesn''t count', current_setting('test.answer_ban_over') <> 'null', left(current_setting('test.answer_ban_over'), 60)
union all
select 'a soft-deleted owner''s token is refused', current_setting('test.answer_deleted') = 'null', current_setting('test.answer_deleted')
union all
select 'a revoked token is refused', current_setting('test.answer_revoked') = 'null', current_setting('test.answer_revoked')
union all
select 'the owner can''t revive a revoked token', current_setting('test.revive') = '23514', current_setting('test.revive')
union all
select 'the owner can still rename a revoked token', a ->> 'name' = 'Renamed after revoking', a::text
from (select current_setting('test.after_revoke')::jsonb a) v
union all
select 'revoking again keeps the first time', (a ->> 'first_time_kept')::boolean, a::text
from (select current_setting('test.after_revoke')::jsonb a) v
union all
select 'only service_role runs the verify and the owner check',
  has_function_privilege('service_role', 'public.curatit_api_token_verify(text)', 'execute')
    and has_function_privilege('service_role', 'private.api_token_owner_active(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.curatit_api_token_verify(text)', 'execute')
    and not has_function_privilege('authenticated', 'public.curatit_api_token_verify(text)', 'execute')
    and not has_function_privilege('anon', 'private.api_token_owner_active(uuid)', 'execute')
    and not has_function_privilege('authenticated', 'private.api_token_owner_active(uuid)', 'execute'),
  null
union all
select 'PUBLIC runs none of the new functions',
  not exists (
    select 1 from pg_proc f, aclexplode(f.proacl) acl
    where f.oid in ('public.curatit_api_token_verify(text)'::regprocedure, 'private.api_token_owner_active(uuid)'::regprocedure,
      'private.api_tokens_keep_revoked()'::regprocedure)
      and acl.grantee = 0),
  null
union all
select 'the verify stays security invoker; the owner check is security definer',
  not (select prosecdef from pg_proc where oid = 'public.curatit_api_token_verify(text)'::regprocedure)
    and (select prosecdef from pg_proc where oid = 'private.api_token_owner_active(uuid)'::regprocedure),
  null;

-- Last: a read-only database still answers (the note is skipped, not the check). Temp tables
-- stay writable in a read-only transaction, so the check can still be recorded.
select set_config('test.hash', encode(sha256('ws5-read-only'::bytea), 'hex'), true);
insert into public.api_tokens (owner_id, name, prefix, token_hash, scopes, expires_at, last_used_at)
values (current_setting('test.editor')::uuid, 'Read-only test', 'curatit_pat_rot', current_setting('test.hash'),
  array['curatit:read'], now() + interval '30 days', now() - interval '1 hour');
set local transaction_read_only = on;
set local role service_role;
select set_config('test.label', 'read_only', true);
do $$ begin execute current_setting('test.verify'); end $$;
reset role;

insert into checks
select 'a read-only database still answers',
  current_setting('transaction_read_only') = 'on' and current_setting('test.answer_read_only') <> 'null',
  left(current_setting('test.answer_read_only'), 60);

select name, ok, detail from checks order by ok, name;

rollback;
