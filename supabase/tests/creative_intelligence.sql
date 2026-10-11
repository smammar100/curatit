-- Creative Intelligence: database tests, run against the linked project by
-- `npm run creative:test-db` (scripts/creative-db-test.ts). The runner wraps this file in one
-- transaction that always rolls back: it ends by raising the results log, so nothing here is ever
-- committed. With --with-migration the migration is applied inside the same transaction first, at
-- the marker below, so it can be tested before it's pushed. {{...}} are filled in by the runner.

-- Helpers ---------------------------------------------------------------------

select set_config('test.log', '', true);

create function pg_temp.s(p_name text) returns text language sql as $$ select current_setting('test.' || p_name, true) $$;
create function pg_temp.put(p_name text, p_value text) returns void language sql as $$ select set_config('test.' || p_name, p_value, true) $$;

-- A stored value or a query result as jsonb; an error string becomes {"error": ...} instead of aborting the suite
create function pg_temp.jv(p_value text) returns jsonb language plpgsql as $$
begin
  return p_value::jsonb;
exception when others then
  return jsonb_build_object('error', p_value);
end $$;
create function pg_temp.j(p_name text) returns jsonb language sql as $$ select pg_temp.jv(current_setting('test.' || p_name, true)) $$;

create function pg_temp.ok(p_cond boolean, p_name text, p_detail text default null)
returns void language plpgsql as $$
begin
  perform set_config('test.log', current_setting('test.log', true)
    || case when coalesce(p_cond, false) then 'ok   ' else 'FAIL ' end || p_name
    || case when not coalesce(p_cond, false) and p_detail is not null then '  [got ' || left(p_detail, 300) || ']' else '' end
    || chr(10), true);
end $$;

-- Run one query as a Data API role (and, for authenticated, as a user), returning its single
-- value as text, or 'ERROR <sqlstate>'. The role switch is undone however the query ends.
create function pg_temp.try(p_role text, p_sub text, p_sql text)
returns text language plpgsql as $$
declare
  v_result text;
begin
  perform set_config('request.jwt.claims',
    case when p_sub is null then '' else json_build_object('sub', p_sub, 'role', p_role)::text end, true);
  begin
    execute format('set local role %I', p_role);
    execute p_sql into v_result;
    reset role;
  exception when others then
    v_result := 'ERROR ' || sqlstate || ': ' || sqlerrm;
  end;
  perform set_config('request.jwt.claims', '', true);
  return coalesce(v_result, 'null');
end $$;

-- The posts under test: the longest carousel, a single image, and two more carousels
select pg_temp.put('pipeline', '{{PIPELINE}}');
select pg_temp.put('admin', (select id::text from public.profiles where role = 'admin' order by created_at limit 1));
select pg_temp.put('stranger', gen_random_uuid()::text);
select pg_temp.put('carousel', (
  select i.post_id from public.post_images i join public.instagram_posts p on p.id = i.post_id
  where p.is_published and p.format = 'carousel' and coalesce(p.caption, '') <> ''
  group by i.post_id order by count(*) desc, i.post_id limit 1));
select pg_temp.put('n', (select count(*)::text from public.post_images where post_id = pg_temp.s('carousel')));
select pg_temp.put('static', (select id from public.instagram_posts where is_published and format = 'static' order by id limit 1));
select pg_temp.put('other', (select id from public.instagram_posts where is_published and format = 'carousel' and id <> pg_temp.s('carousel') order by id limit 1));
select pg_temp.put('hidden', (select id from public.instagram_posts where is_published and format = 'carousel' and id not in (pg_temp.s('carousel'), pg_temp.s('other')) order by id limit 1));

-- What the public MCP returns before any of this
select pg_temp.put('before_get', pg_temp.try('anon', null, format('select public.curatit_mcp_get_post(%L)::text', pg_temp.s('carousel'))));
select pg_temp.put('before_get_static', pg_temp.try('anon', null, format('select public.curatit_mcp_get_post(%L)::text', pg_temp.s('static'))));
select pg_temp.put('before_search', pg_temp.try('anon', null, 'select public.curatit_mcp_search(null, null, null, null, null, null, null, null, null, 20, null)::text'));
select pg_temp.put('before_search_q', pg_temp.try('anon', null, $q$select public.curatit_mcp_search('new', null, null, 'carousel', null, null, null, null, null, 10, null)::text$q$));
select pg_temp.put('before_stats', pg_temp.try('anon', null, 'select public.curatit_mcp_catalog_stats()::text'));
select pg_temp.put('before_taxonomy', pg_temp.try('anon', null, 'select public.curatit_mcp_taxonomy(''categories'', '''', 50)::text'));

-- @migration

-- Setup -----------------------------------------------------------------------

select pg_temp.ok(pg_temp.s('admin') is not null, 'an admin profile exists');
select pg_temp.ok(pg_temp.s('n')::int >= 3, 'the test carousel has at least three slides', pg_temp.s('n'));
select pg_temp.ok(pg_temp.s('static') is not null and pg_temp.s('other') is not null and pg_temp.s('hidden') is not null, 'test posts found');

-- Schema ----------------------------------------------------------------------

select pg_temp.ok((select bool_and(c.relrowsecurity) from pg_class c where c.oid in (
    'public.creative_taxonomy_terms'::regclass, 'public.post_analysis_versions'::regclass,
    'public.post_slide_analyses'::regclass, 'public.post_creative_labels'::regclass,
    'public.classification_jobs'::regclass, 'public.creative_analysis_runs'::regclass,
    'public.creative_review_events'::regclass)), 'RLS is on for every new table');
select pg_temp.ok((select count(*) from public.creative_taxonomy_terms) = {{TERM_COUNT}}, 'the taxonomy has every term from taxonomy.ts',
  (select count(*)::text from public.creative_taxonomy_terms));
select pg_temp.ok(not exists (select 1 from public.creative_taxonomy_terms where retired_at is not null), 'no term is retired');
select pg_temp.ok(not exists (select 1 from public.creative_taxonomy_terms where dimension = 'archetype' and slug not in ('other', 'unknown') and parent_slug is null), 'every archetype sits under a family');
select pg_temp.ok((select count(*) from public.post_analyses) = (select count(*) from public.post_analyses where published_at is null or review_status = 'approved'), 'existing analyses meet the publish rule');
select pg_temp.ok(not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'creative\_%' and p.prosecdef), 'no public creative_* function is security definer');
select pg_temp.ok(not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'creative\_%' and has_function_privilege('anon', p.oid, 'execute')), 'anon can execute no creative_* function');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.creative_save_analysis(uuid, text, jsonb, jsonb, jsonb, boolean)', 'execute')
  and not has_function_privilege('authenticated', 'public.creative_claim_jobs(text, integer, integer, text[])', 'execute')
  and not has_function_privilege('authenticated', 'public.creative_post_manifest(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.creative_reconcile(text, boolean, boolean, integer)', 'execute'),
  'signed-in users can execute none of the worker functions');

-- The public MCP is unchanged ----------------------------------------------------

select pg_temp.ok(pg_temp.try('anon', null, format('select public.curatit_mcp_get_post(%L)::text', pg_temp.s('carousel'))) = pg_temp.s('before_get'), 'curatit_mcp_get_post is unchanged');
select pg_temp.ok(pg_temp.try('anon', null, 'select public.curatit_mcp_search(null, null, null, null, null, null, null, null, null, 20, null)::text') = pg_temp.s('before_search'), 'curatit_mcp_search is unchanged');
select pg_temp.ok(pg_temp.try('anon', null, $q$select public.curatit_mcp_search('new', null, null, 'carousel', null, null, null, null, null, 10, null)::text$q$) = pg_temp.s('before_search_q'), 'curatit_mcp_search with filters is unchanged');
select pg_temp.ok(pg_temp.try('anon', null, 'select public.curatit_mcp_catalog_stats()::text') = pg_temp.s('before_stats'), 'curatit_mcp_catalog_stats is unchanged');
select pg_temp.ok(pg_temp.try('anon', null, 'select public.curatit_mcp_taxonomy(''categories'', '''', 50)::text') = pg_temp.s('before_taxonomy'), 'curatit_mcp_taxonomy is unchanged');
select pg_temp.ok(pg_temp.try('anon', null, 'select count(*)::text from public.creative_taxonomy_terms') = '{{TERM_COUNT}}', 'anyone can read the taxonomy');
select pg_temp.ok(to_regprocedure('public.creative_enqueue(text[], text, uuid, text, boolean, smallint)') is not null, 'the seed''s guard finds creative_enqueue');

-- Media and fingerprints --------------------------------------------------------

select pg_temp.ok((select bool_and(m.complete) from public.instagram_posts p, private.creative_media_status(p.id) m where p.is_published), 'every published post has all its images saved');
select pg_temp.ok((select m.expected from private.creative_media_status(pg_temp.s('carousel')) m) = pg_temp.s('n')::int, 'a carousel expects one image per slide');
select pg_temp.ok((select m.expected from private.creative_media_status(pg_temp.s('static')) m) = 1, 'a single image expects one');
select pg_temp.put('fp', private.creative_content_fingerprint(pg_temp.s('carousel')));
select pg_temp.ok(pg_temp.s('fp') ~ '^[0-9a-f]{64}$' and pg_temp.s('fp') = private.creative_content_fingerprint(pg_temp.s('carousel')), 'the content fingerprint is a stable sha256');
select pg_temp.ok(pg_temp.s('fp') <> private.creative_content_fingerprint(pg_temp.s('other')), 'posts have different fingerprints');

select pg_temp.put('manifest', pg_temp.try('service_role', null, format('select public.creative_post_manifest(%L)::text', pg_temp.s('carousel'))));
select pg_temp.ok(jsonb_array_length(pg_temp.j('manifest') -> 'images') = pg_temp.s('n')::int, 'the manifest lists every image', left(pg_temp.s('manifest'), 200));
select pg_temp.ok((select bool_and((e ->> 'position')::int = o - 1) from jsonb_array_elements(pg_temp.j('manifest') -> 'images') with ordinality as t(e, o)), 'manifest images run 0..n-1 in order');
select pg_temp.ok((select bool_and(e ->> 'etag' is not null and e ->> 'mimetype' = 'image/webp' and e ->> 'path' = i.path)
    from jsonb_array_elements(pg_temp.j('manifest') -> 'images') e
    join public.post_images i on i.post_id = pg_temp.s('carousel') and i.position = (e ->> 'position')::int), 'manifest paths are the recorded post_images paths, with ETags');
select pg_temp.ok(pg_temp.j('manifest') #>> '{media,complete}' = 'true' and pg_temp.j('manifest') ->> 'content_fingerprint' = pg_temp.s('fp'), 'the manifest says complete and carries the fingerprint');

-- Queueing ------------------------------------------------------------------------

select pg_temp.put('q1', public.creative_enqueue(array[pg_temp.s('carousel'), 'no-such-post'], pg_temp.s('pipeline'), null, 'import', false, 5::smallint)::text);
select pg_temp.ok(pg_temp.j('q1') -> 'enqueued' = jsonb_build_array(pg_temp.s('carousel')) and pg_temp.j('q1') -> 'unknown' = '["no-such-post"]', 'enqueue queues a post and reports an unknown one', pg_temp.s('q1'));
select pg_temp.put('q2', public.creative_enqueue(array[pg_temp.s('carousel')], pg_temp.s('pipeline'))::text);
select pg_temp.ok(pg_temp.j('q2') -> 'duplicate' = jsonb_build_array(pg_temp.s('carousel')), 'the same post, content and pipeline is queued once', pg_temp.s('q2'));
select public.creative_enqueue(array[pg_temp.s('static')], pg_temp.s('pipeline'), null, 'import', false, 1::smallint);
select public.creative_enqueue(array[pg_temp.s('carousel')], pg_temp.s('pipeline'), null, 'manual', true, 0::smallint);
select pg_temp.ok((select count(*) from public.classification_jobs where post_id = pg_temp.s('carousel')) = 2
  and exists (select 1 from public.classification_jobs where post_id = pg_temp.s('carousel') and job_type = 'reanalyze'), 'force queues a second job');
select pg_temp.ok((select job_key from public.classification_jobs where post_id = pg_temp.s('carousel') and job_type = 'analyze')
  = pg_temp.s('carousel') || ':' || pg_temp.s('pipeline') || ':' || pg_temp.s('fp'), 'the job key is post:pipeline:fingerprint');

delete from public.post_images where post_id = pg_temp.s('other') and position = (select max(position) from public.post_images where post_id = pg_temp.s('other'));
select pg_temp.ok(public.creative_enqueue(array[pg_temp.s('other')], pg_temp.s('pipeline')) -> 'incomplete' = jsonb_build_array(pg_temp.s('other')), 'a post missing an image is not queued');
update public.instagram_posts set is_published = false where id = pg_temp.s('hidden');
select pg_temp.ok(public.creative_enqueue(array[pg_temp.s('hidden')], pg_temp.s('pipeline')) -> 'unknown' = jsonb_build_array(pg_temp.s('hidden')), 'an unpublished post is not queued');
update public.instagram_posts set is_published = true where id = pg_temp.s('hidden');
select pg_temp.put('badpipe', pg_temp.try('service_role', null, 'select public.creative_enqueue(array[''x''], ''bad pipeline!'')::text'));
select pg_temp.ok(pg_temp.s('badpipe') like 'ERROR 22023%', 'a malformed pipeline version is refused', pg_temp.s('badpipe'));
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), format('select public.creative_enqueue(array[%L], %L)::text', pg_temp.s('static'), pg_temp.s('pipeline'))) like 'ERROR 42501%', 'a member cannot queue');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_enqueue(array[%L], %L, null, ''manual'', true, 50::smallint)::text', pg_temp.s('static'), pg_temp.s('pipeline'))) like 'ERROR 22023%', 'queue priority is bounded');

-- Leasing ---------------------------------------------------------------------------

select pg_temp.put('jobA', pg_temp.try('service_role', null, 'select id::text from public.creative_claim_jobs(''worker-a'', 1, 600)'));
select pg_temp.ok((select post_id = pg_temp.s('carousel') and job_type = 'analyze' and state = 'leased' and attempts = 1 and lease_owner = 'worker-a'
  from public.classification_jobs where id::text = pg_temp.s('jobA')), 'the highest-priority job is leased first', pg_temp.s('jobA'));
select pg_temp.put('claimB', pg_temp.try('service_role', null, 'select string_agg(id::text, '','' order by priority desc) from public.creative_claim_jobs(''worker-b'', 5, 600)'));
select pg_temp.put('jobB', split_part(pg_temp.s('claimB'), ',', 1));
select pg_temp.put('jobC', split_part(pg_temp.s('claimB'), ',', 2));
select pg_temp.ok(pg_temp.s('claimB') not like '%' || pg_temp.s('jobA') || '%' and pg_temp.s('jobB') <> '' and pg_temp.s('jobC') <> '', 'a second worker gets the other jobs, never a leased one', pg_temp.s('claimB'));
select pg_temp.ok((select post_id from public.classification_jobs where id::text = pg_temp.s('jobB')) = pg_temp.s('static'), 'jobs come in priority order');
select pg_temp.ok(pg_temp.try('service_role', null, 'select count(*)::text from public.creative_claim_jobs(''worker-c'', 5, 600)') = '0', 'nothing is left to claim');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_heartbeat(%L, ''worker-b'', 600)::text', pg_temp.s('jobA'))) = 'false', 'only the lease holder can extend it');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_heartbeat(%L, ''worker-a'', 900)::text', pg_temp.s('jobA'))) = 'true', 'the lease holder can extend it');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_finish_job(%L, ''worker-b'', ''failed'', ''bug'', ''x'')', pg_temp.s('jobA'))) = 'lost_lease', 'another worker cannot finish a leased job');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_finish_job(%L, ''worker-a'', ''succeeded'')', pg_temp.s('jobA'))) like 'ERROR 22023%', 'success only comes from saving an analysis');

update public.classification_jobs set lease_expires_at = now() - interval '1 second' where id::text = pg_temp.s('jobB');
select pg_temp.ok(pg_temp.try('service_role', null, 'select id::text from public.creative_claim_jobs(''worker-c'', 5, 600)') = pg_temp.s('jobB'), 'an expired lease is claimed again');
select pg_temp.ok((select attempts = 2 and lease_owner = 'worker-c' from public.classification_jobs where id::text = pg_temp.s('jobB')), 'the re-claim counts as an attempt');
update public.classification_jobs set lease_expires_at = now() - interval '1 second', attempts = max_attempts where id::text = pg_temp.s('jobB');
select pg_temp.ok(pg_temp.try('service_role', null, 'select count(*)::text from public.creative_claim_jobs(''worker-c'', 5, 600)') = '0', 'an expired last attempt is not claimed');
select pg_temp.ok((select state = 'failed' and last_failure_kind = 'lease_expired' and lease_owner is null from public.classification_jobs where id::text = pg_temp.s('jobB')), 'it becomes a dead letter');

select pg_temp.ok(pg_temp.try('service_role', null, format(
  $q$select public.creative_finish_job(%L, 'worker-b', 'pending', 'rate_limit', 'Too many requests', now() + interval '1 minute',
     jsonb_build_object('worker', 'worker-b', 'provider', 'mock', 'status', 'failed', 'failure_kind', 'rate_limit', 'started_at', now()))$q$,
  pg_temp.s('jobC'))) = 'pending', 'a temporary failure goes back to the queue');
select pg_temp.ok((select state = 'pending' and next_retry_at > now() and last_failure_kind = 'rate_limit' and lease_owner is null
  from public.classification_jobs where id::text = pg_temp.s('jobC')), 'with its retry time and error');
select pg_temp.ok((select count(*) from public.creative_analysis_runs where job_id::text = pg_temp.s('jobC') and status = 'failed') = 1, 'the failed attempt is logged as a run');
select pg_temp.ok(pg_temp.try('service_role', null, 'select count(*)::text from public.creative_claim_jobs(''worker-c'', 5, 600)') = '0', 'a job waiting to retry is not claimed early');

-- Saving an analysis ------------------------------------------------------------------

select pg_temp.put('slides', (select jsonb_agg(jsonb_set('{{FIXTURE_SLIDE}}'::jsonb, '{position}', to_jsonb(g)) order by g)
  from generate_series(0, pg_temp.s('n')::int - 1) g)::text);
select pg_temp.put('dna', jsonb_set(jsonb_set(jsonb_set('{{FIXTURE_DNA}}'::jsonb,
  '{narrative,slide_roles}', (select jsonb_agg(jsonb_build_object('position', g, 'role', 'step') order by g) from generate_series(0, pg_temp.s('n')::int - 1) g)),
  '{quality,expected_slides}', to_jsonb(pg_temp.s('n')::int)),
  '{quality,processed_slides}', to_jsonb(pg_temp.s('n')::int))::text);
select pg_temp.put('version', jsonb_build_object(
  'summary', pg_temp.j('dna') ->> 'creative_summary', 'hook', 'Saving, minus the effort',
  'why_it_works', 'Showing the actual setting may make the feature feel easy to try.',
  'takeaways', pg_temp.j('dna') -> 'takeaways', 'creative_dna', pg_temp.j('dna'),
  'perception', jsonb_build_object('slides', pg_temp.j('slides')), 'input_fingerprint', 'input-fp-1',
  'model_id', 'test-model', 'prompt_version', 'test-prompt', 'taxonomy_version', 'test-taxonomy',
  'validation', '{"errors": [], "warnings": []}'::jsonb, 'image_analysis_complete', true,
  'expected_slides', pg_temp.s('n')::int, 'processed_slides', pg_temp.s('n')::int)::text);
select pg_temp.put('run', jsonb_build_object('worker', 'worker-a', 'provider', 'mock', 'model_id', 'test-model', 'model_calls', 2,
  'input_tokens', 1200, 'output_tokens', 800, 'estimated_cost_usd', 0.0123, 'duration_ms', 4200, 'started_at', now())::text);

-- Each of these must fail and leave nothing behind
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-a', pg_temp.s('version'), (pg_temp.j('slides') - (pg_temp.s('n')::int - 1))::text, pg_temp.s('run'))) like 'ERROR 22023%',
  'complete with a slide missing is refused');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-a', pg_temp.s('version'),
  (pg_temp.j('slides') || jsonb_build_array(jsonb_set('{{FIXTURE_SLIDE}}'::jsonb, '{position}', to_jsonb(pg_temp.s('n')::int))))::text,
  pg_temp.s('run'))) like 'ERROR 23503%', 'a slide past the last image is refused');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-a', pg_temp.s('version'),
  jsonb_set(pg_temp.j('slides'), '{1,position}', '0')::text, pg_temp.s('run'))) like 'ERROR 23505%', 'a slide given twice is refused');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-z', pg_temp.s('version'), pg_temp.s('slides'), pg_temp.s('run'))) like 'ERROR 55000%', 'a worker without the lease cannot save');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-a', (pg_temp.j('version') - 'creative_dna')::text, pg_temp.s('slides'), pg_temp.s('run'))) like 'ERROR 22023%', 'a version without Creative DNA is refused');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-a', (pg_temp.j('version') || '{"review_status": "approved"}')::text, pg_temp.s('slides'), pg_temp.s('run'))) like 'ERROR 22023%', 'an AI run cannot approve itself');
select pg_temp.ok(not exists (select 1 from public.post_analysis_versions where post_id = pg_temp.s('carousel')), 'failed saves left no version');

select pg_temp.put('save1', pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-a', pg_temp.s('version'), pg_temp.s('slides'), pg_temp.s('run'))));
select pg_temp.put('v1', pg_temp.j('save1') ->> 'version_id');
select pg_temp.ok(pg_temp.j('save1') ->> 'applied' = 'true' and pg_temp.j('save1') ->> 'version_no' = '1', 'the first analysis is saved and applied', pg_temp.s('save1'));
select pg_temp.ok((select review_status = 'needs_review' and analysis_source = 'ai' and published_at is null and current_version_id::text = pg_temp.s('v1')
    and image_analysis_complete and expected_slides = pg_temp.s('n')::int and content_fingerprint = pg_temp.s('fp') and creative_dna is not null
  from public.post_analyses where post_id = pg_temp.s('carousel')), 'the post has an unpublished AI draft needing review');
select pg_temp.ok((select array_agg(position order by position) = array(select generate_series(0, pg_temp.s('n')::int - 1))::smallint[]
  from public.post_slide_analyses where version_id::text = pg_temp.s('v1')), 'every slide is recorded at its zero-based position');
select pg_temp.ok((select status = 'succeeded' and input_tokens = 1200 and estimated_cost_usd = 0.0123 and version_id::text = pg_temp.s('v1')
  from public.creative_analysis_runs where job_id::text = pg_temp.s('jobA')), 'the run is logged with its usage');
select pg_temp.ok((select state = 'succeeded' and result_version_id::text = pg_temp.s('v1') and lease_owner is null
  from public.classification_jobs where id::text = pg_temp.s('jobA')), 'the job is finished only with the analysis');
select pg_temp.ok(not exists (select 1 from public.post_creative_labels where post_id = pg_temp.s('carousel')), 'a draft gets no public labels');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobA'), 'worker-a', pg_temp.s('version'), pg_temp.s('slides'), pg_temp.s('run'))) like 'ERROR 55000%', 'a finished job cannot be saved twice');

-- Drafts stay private -----------------------------------------------------------------

select pg_temp.ok(pg_temp.try('anon', null, format('select count(*)::text from public.post_analyses where post_id = %L', pg_temp.s('carousel'))) = '0', 'anon cannot see the draft');
select pg_temp.ok(pg_temp.try('anon', null, format('select count(*)::text from public.post_slide_analyses where post_id = %L', pg_temp.s('carousel'))) = '0', 'anon cannot see draft slides');
select pg_temp.ok(pg_temp.try('anon', null, 'select count(*)::text from public.post_analysis_versions') like 'ERROR 42501%', 'anon cannot read versions');
select pg_temp.ok(pg_temp.try('anon', null, 'select count(*)::text from public.classification_jobs') like 'ERROR 42501%', 'anon cannot read jobs');
select pg_temp.ok(pg_temp.try('anon', null, 'select count(*)::text from public.creative_analysis_runs') like 'ERROR 42501%', 'anon cannot read runs');
select pg_temp.ok(pg_temp.try('anon', null, format('select (public.curatit_mcp_get_post(%L) -> ''analysis'')::text', pg_temp.s('carousel'))) = 'null', 'the MCP shows no draft');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), format('select count(*)::text from public.post_analyses where post_id = %L', pg_temp.s('carousel'))) = '0', 'a member cannot see the draft');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), 'select count(*)::text from public.post_analysis_versions') = '0', 'a member sees no versions');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), 'select count(*)::text from public.classification_jobs') = '0', 'a member sees no jobs');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), 'select count(*)::text from public.creative_analysis_runs') = '0', 'a member sees no runs');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), format('select public.creative_review(%L, ''approve'')::text', pg_temp.s('v1'))) like 'ERROR 42501%', 'a member cannot approve');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), format('select public.creative_save_analysis(%L, ''x'', ''{}'', ''[]'', ''{}'')::text', pg_temp.s('jobA'))) like 'ERROR 42501%', 'a member cannot call the worker functions');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format('select count(*)::text from public.post_analysis_versions where post_id = %L', pg_temp.s('carousel'))) = '1', 'the admin sees the version');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format('select count(*)::text from public.post_analyses where post_id = %L', pg_temp.s('carousel'))) = '1', 'the admin sees the draft');

-- Versions don't change ------------------------------------------------------------------

do $$
begin
  update public.post_analysis_versions set summary = 'changed' where id::text = pg_temp.s('v1');
  perform pg_temp.put('immutable', 'updated');
exception when others then
  perform pg_temp.put('immutable', sqlstate);
end $$;
select pg_temp.ok(pg_temp.s('immutable') = '55000', 'a version''s content cannot be changed', pg_temp.s('immutable'));
update public.post_analysis_versions set review_note = 'noted' where id::text = pg_temp.s('v1');
select pg_temp.ok((select review_note = 'noted' from public.post_analysis_versions where id::text = pg_temp.s('v1')), 'its review fields can');

-- Approving and publishing -------------------------------------------------------------------

select pg_temp.put('approve1', pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_review(%L, ''approve'', true, ''Looks right'')::text', pg_temp.s('v1'))));
select pg_temp.ok(pg_temp.j('approve1') ->> 'published' = 'true', 'the admin approves and publishes', pg_temp.s('approve1'));
select pg_temp.ok((select review_status = 'approved' and published_at is not null and reviewed_at is not null from public.post_analyses where post_id = pg_temp.s('carousel')), 'the analysis is approved and published');
select pg_temp.ok((select review_decision = 'approved' and reviewed_by::text = pg_temp.s('admin') and published_at is not null
  from public.post_analysis_versions where id::text = pg_temp.s('v1')), 'the version records who approved it');
select pg_temp.ok((select count(*) from public.creative_review_events where post_id = pg_temp.s('carousel') and action = 'publish' and actor::text = pg_temp.s('admin')) = 1, 'the decision is in the review history');
select pg_temp.ok((select weight from public.post_creative_labels where post_id = pg_temp.s('carousel') and dimension = 'archetype' and slug = 'product-feature') = 3, 'the primary archetype is labelled with weight 3');
select pg_temp.ok((select weight from public.post_creative_labels where post_id = pg_temp.s('carousel') and dimension = 'archetype' and slug = 'how-to-use') = 2, 'secondary archetypes with weight 2');
select pg_temp.ok(exists (select 1 from public.post_creative_labels where post_id = pg_temp.s('carousel') and dimension = 'archetype_family' and slug = 'product'), 'its family is labelled too');
select pg_temp.ok(exists (select 1 from public.post_creative_labels where post_id = pg_temp.s('carousel') and dimension = 'typography' and slug = 'sans-serif')
  and exists (select 1 from public.post_creative_labels where post_id = pg_temp.s('carousel') and dimension = 'visual_device' and slug = 'swipe-cue')
  and exists (select 1 from public.post_creative_labels where post_id = pg_temp.s('carousel') and dimension = 'hook_technique' and slug = 'bold-claim'), 'visual and copy labels come from the DNA and the slides');
select pg_temp.ok(not exists (select 1 from public.post_creative_labels where slug in ('unknown', 'none', 'other')), 'unknown, none and other are never labels');

select pg_temp.ok(pg_temp.try('anon', null, format('select count(*)::text from public.post_analyses where post_id = %L', pg_temp.s('carousel'))) = '1', 'anon sees the published analysis');
select pg_temp.ok(pg_temp.try('anon', null, format('select count(*)::text from public.post_slide_analyses where post_id = %L', pg_temp.s('carousel'))) = pg_temp.s('n'), 'and its slides');
select pg_temp.ok(pg_temp.try('anon', null, format('select (count(*) > 5)::text from public.post_creative_labels where post_id = %L', pg_temp.s('carousel'))) = 'true', 'and its labels');
select pg_temp.put('after_get', pg_temp.try('anon', null, format('select public.curatit_mcp_get_post(%L)::text', pg_temp.s('carousel'))));
select pg_temp.ok(pg_temp.j('after_get') #>> '{analysis,summary}' = pg_temp.j('dna') ->> 'creative_summary'
  and pg_temp.j('after_get') #>> '{analysis,hook}' = 'Saving, minus the effort'
  and jsonb_array_length(pg_temp.j('after_get') #> '{analysis,takeaways}') = 3, 'the MCP shows the published analysis in its existing shape', left(pg_temp.s('after_get'), 300));
select pg_temp.ok((pg_temp.j('after_get') - 'analysis') = (pg_temp.j('before_get') - 'analysis'), 'and nothing else in the post changed');

-- The MCP's creative search -----------------------------------------------------------------------

select pg_temp.put('s_arch', pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"archetype": "product-feature"}')::text$q$));
select pg_temp.ok(jsonb_array_length(pg_temp.j('s_arch') -> 'posts') = 1 and pg_temp.j('s_arch') #>> '{posts,0,id}' = pg_temp.s('carousel'), 'search_v2 filters on the primary archetype', left(pg_temp.s('s_arch'), 300));
select pg_temp.ok(pg_temp.j('s_arch') #> '{posts,0,reasons}' ? 'archetype: Feature explainer (primary)', 'and says why it matched', pg_temp.j('s_arch') #>> '{posts,0,reasons}');
select pg_temp.ok(pg_temp.j('s_arch') #>> '{posts,0,analysis,primary_type}' = 'product-feature' and pg_temp.j('s_arch') #>> '{posts,0,analysis,verified_status}' = 'approved'
  and jsonb_array_length(pg_temp.j('s_arch') #> '{posts,0,analysis,takeaways}') = 3, 'results carry the published analysis');
select pg_temp.ok(exists (select 1 from jsonb_array_elements(pg_temp.j('s_arch') #> '{posts,0,analysis,analysis_evidence}') e where e #>> '{slide,path}' is not null and e ->> 'ref' = 'slide:' || (e #>> '{slide,position}')),
  'evidence points at the stored slide image');
select pg_temp.ok(not (pg_temp.j('s_arch') #> '{posts,0,analysis}' ?| array['confidence', 'model_id', 'input_fingerprint', 'reviewed_by']), 'results expose no confidence score or worker details');

select pg_temp.put('s_vis', pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"typography": "sans-serif", "visual_device": ["Swipe cue"]}')::text$q$));
select pg_temp.ok(pg_temp.j('s_vis') #>> '{posts,0,id}' = pg_temp.s('carousel'), 'visual filters accept labels as well as slugs', left(pg_temp.s('s_vis'), 300));
select pg_temp.ok(exists (select 1 from jsonb_array_elements_text(pg_temp.j('s_vis') #> '{posts,0,reasons}') r where r like 'typography: Sans-serif — seen on slide 0, 1%')
  and exists (select 1 from jsonb_array_elements_text(pg_temp.j('s_vis') #> '{posts,0,reasons}') r where r like 'visual device: Swipe cue — seen on slide 0%'), 'visual matches cite the slides they were seen on',
  pg_temp.j('s_vis') #>> '{posts,0,reasons}');

select pg_temp.put('s_q', pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"query": "savings rule explainer", "analysed_only": true}')::text$q$));
select pg_temp.ok(pg_temp.j('s_q') #>> '{posts,0,id}' = pg_temp.s('carousel') and pg_temp.j('s_q') #> '{posts,0,reasons}' ? 'The query matches the published analysis', 'the query searches the published analysis', left(pg_temp.s('s_q'), 300));
select pg_temp.ok(jsonb_array_length(pg_temp.j('s_q') -> 'posts') = 1, 'analysed_only keeps to analysed posts');
select pg_temp.put('s_bts', pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"archetype": "BTS"}')::text$q$));
select pg_temp.ok(jsonb_array_length(pg_temp.j('s_bts') -> 'posts') = 0 and pg_temp.j('s_bts') -> 'filters' = '{"archetype": ["behind-the-scenes"]}', 'synonyms resolve to their term', pg_temp.s('s_bts'));
select pg_temp.ok(pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"archetype": "viral banger"}')::text$q$) like 'ERROR 22023%', 'an unknown term is refused');
select pg_temp.ok(pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"sort": "likes"}')::text$q$) like 'ERROR 22023%', 'an unknown field is refused');
select pg_temp.ok(pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"limit": 0}')::text$q$) like 'ERROR 22023%', 'the limit is checked');

select pg_temp.put('s_all', pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{}')::text$q$));
select pg_temp.put('v1_21', pg_temp.try('anon', null, 'select public.curatit_mcp_search(null, null, null, null, null, null, null, null, null, 21, null)::text'));
select pg_temp.ok(pg_temp.j('s_all') ->> 'sort' = 'newest' and pg_temp.j('s_all') ->> 'has_more' = 'true' and jsonb_array_length(pg_temp.j('s_all') -> 'posts') = 20, 'with no filters it pages through everything, newest first');
select pg_temp.ok((select jsonb_agg(e ->> 'id' order by o) from jsonb_array_elements(pg_temp.j('s_all') -> 'posts') with ordinality t(e, o))
  = (select jsonb_agg(e ->> 'id' order by o) from jsonb_array_elements(pg_temp.j('v1_21') -> 'posts') with ordinality t(e, o) where o <= 20),
  'in the same order as curatit_mcp_search');
select pg_temp.ok(pg_temp.jv(pg_temp.try('anon', null, $q$select public.curatit_mcp_search_v2('{"offset": 20}')::text$q$)) #>> '{posts,0,id}'
  = (select e ->> 'id' from jsonb_array_elements(pg_temp.j('v1_21') -> 'posts') with ordinality t(e, o) where o = 21), 'offset pages on');

select pg_temp.put('g2', pg_temp.try('anon', null, format('select public.curatit_mcp_get_post_v2(%L)::text', pg_temp.s('carousel'))));
select pg_temp.ok((pg_temp.j('g2') - 'creative') = pg_temp.jv(pg_temp.try('anon', null, format('select public.curatit_mcp_get_post(%L)::text', pg_temp.s('carousel')))), 'get_post_v2 is get_post plus creative');
select pg_temp.ok(jsonb_array_length(pg_temp.j('g2') #> '{creative,narrative,slides}') = pg_temp.s('n')::int and pg_temp.j('g2') #>> '{creative,narrative,slides,0,image,path}' is not null, 'with every slide, its role and its image', left(pg_temp.s('g2'), 200));
select pg_temp.ok(pg_temp.jv(pg_temp.try('anon', null, format('select public.curatit_mcp_get_post_v2(%L)::text', pg_temp.s('static')))) -> 'creative' = 'null', 'a post without a published analysis has none');
select pg_temp.put('terms', pg_temp.try('anon', null, 'select public.curatit_mcp_creative_terms()::text'));
select pg_temp.ok((select (e ->> 'posts')::int from jsonb_array_elements(pg_temp.j('terms') #> '{dimensions,archetype}') e where e ->> 'slug' = 'product-feature') = 1
  and pg_temp.j('terms') -> 'dimensions' ? 'visual_device' and not (pg_temp.j('terms') -> 'dimensions' ? 'level'), 'creative_terms lists the filterable vocabulary with counts', left(pg_temp.s('terms'), 200));

-- Editors write only through the functions -----------------------------------------------------

select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$update public.post_analyses set analysis_source = 'ai', review_status = 'approved', published_at = now() where post_id = %L returning post_id$q$,
  pg_temp.s('carousel'))) like 'ERROR 42501%', 'an editor cannot write post_analyses directly');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$delete from public.post_analyses where post_id = %L returning post_id$q$, pg_temp.s('carousel'))) like 'ERROR 42501%', 'or delete it');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$update public.post_analysis_versions set reviewed_by = %L where id = %L returning id::text$q$, pg_temp.s('stranger'), pg_temp.s('v1'))) like 'ERROR 42501%',
  'an editor cannot rewrite who reviewed a version');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$insert into public.post_slide_analyses (version_id, post_id, position, role, legibility, text_density, confidence, observation)
     values (%L, %L, 0, 'hook', 'clear', 'low', 'high', '{}') returning position::text$q$, pg_temp.s('v1'), pg_temp.s('carousel'))) like 'ERROR 42501%',
  'an editor cannot add slide records to a published version');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$insert into public.post_creative_labels (post_id, version_id, dimension, slug) values (%L, %L, 'archetype', 'meme') returning slug$q$,
  pg_temp.s('carousel'), pg_temp.s('v1'))) like 'ERROR 42501%', 'or labels');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$delete from public.post_creative_labels where post_id = %L returning slug$q$, pg_temp.s('carousel'))) like 'ERROR 42501%', 'or remove labels');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$insert into public.classification_jobs (job_key, post_id, content_fingerprint, pipeline_version) values ('forged', %L, 'f', 'p') returning id::text$q$,
  pg_temp.s('static'))) like 'ERROR 42501%', 'or plant a job');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$insert into public.creative_review_events (post_id, action, actor) values (%L, 'approve', %L) returning id::text$q$,
  pg_temp.s('carousel'), pg_temp.s('admin'))) like 'ERROR 42501%', 'or write review history');
select pg_temp.ok((select count(*) from public.post_creative_labels where post_id = pg_temp.s('carousel') and slug = 'meme') = 0, 'and nothing of those got through');

-- A new AI run never overwrites reviewed work ------------------------------------------------------

select public.creative_enqueue(array[pg_temp.s('carousel')], pg_temp.s('pipeline'), null, 'manual', true, 9::smallint);
select pg_temp.ok(pg_temp.try('service_role', null, format('select count(*)::text from public.creative_claim_jobs(''worker-d'', 5, 600, array[%L])', pg_temp.s('static'))) = '0', 'claiming can be limited to some posts');
select pg_temp.put('jobD', pg_temp.try('service_role', null, format('select id::text from public.creative_claim_jobs(''worker-d'', 1, 600, array[%L])', pg_temp.s('carousel'))));
select pg_temp.put('save2', pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobD'), 'worker-d', (pg_temp.j('version') || '{"summary": "A second reading of the same carousel."}')::text, pg_temp.s('slides'), pg_temp.s('run'))));
select pg_temp.put('v2', pg_temp.j('save2') ->> 'version_id');
select pg_temp.ok(pg_temp.j('save2') ->> 'applied' = 'false' and pg_temp.j('save2') ->> 'version_no' = '2', 'a re-run is filed as a proposal', pg_temp.s('save2'));
select pg_temp.ok((select review_status = 'approved' and published_at is not null and current_version_id::text = pg_temp.s('v1') and summary <> 'A second reading of the same carousel.'
  from public.post_analyses where post_id = pg_temp.s('carousel')), 'the approved analysis is untouched');
select pg_temp.ok(pg_temp.try('anon', null, format('select count(*)::text from public.post_slide_analyses where post_id = %L', pg_temp.s('carousel'))) = pg_temp.s('n'), 'the proposal''s slides stay private');

-- Editors' decisions -----------------------------------------------------------------------------

select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_review(%L, ''approve'')::text', pg_temp.s('v2'))) like '%"published": true%', 'approving a proposal on a published post publishes it');
select pg_temp.ok((select current_version_id::text = pg_temp.s('v2') and summary = 'A second reading of the same carousel.' and published_at is not null
  from public.post_analyses where post_id = pg_temp.s('carousel')), 'the proposal becomes the analysis');
select pg_temp.ok((select published_at is null from public.post_analysis_versions where id::text = pg_temp.s('v1')), 'the earlier version is no longer published');
select pg_temp.ok((select bool_and(version_id::text = pg_temp.s('v2')) from public.post_creative_labels where post_id = pg_temp.s('carousel')), 'labels follow the published version');

select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_review(%L, ''reject'', false, ''Wrong archetype'')::text', pg_temp.s('v2'))) not like 'ERROR%', 'the admin can reject');
select pg_temp.ok((select review_status = 'rejected' and published_at is null from public.post_analyses where post_id = pg_temp.s('carousel')), 'rejecting the current analysis unpublishes it');
select pg_temp.ok(not exists (select 1 from public.post_creative_labels where post_id = pg_temp.s('carousel')), 'and removes its labels');
select pg_temp.ok(pg_temp.try('anon', null, format('select count(*)::text from public.post_analyses where post_id = %L', pg_temp.s('carousel'))) = '0', 'anon no longer sees it');
select pg_temp.ok(jsonb_array_length(pg_temp.jv(pg_temp.try('anon', null, $q$select (public.curatit_mcp_search_v2('{"archetype": "product-feature"}') -> 'posts')::text$q$))) = 0
  and pg_temp.jv(pg_temp.try('anon', null, format('select public.curatit_mcp_get_post_v2(%L)::text', pg_temp.s('carousel')))) -> 'creative' = 'null', 'nor does the MCP');
select pg_temp.put('reopen', pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_review(%L, ''reopen'')::text', pg_temp.s('v2'))));
select pg_temp.ok(pg_temp.s('reopen') not like 'ERROR%' and (select review_status from public.post_analyses where post_id = pg_temp.s('carousel')) = 'needs_review',
  'reopening puts it back in review', pg_temp.s('reopen'));
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_review(%L, ''unpublish'')::text', pg_temp.s('v1'))) like 'ERROR 22023%', 'only the current analysis can be unpublished');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_review(%L, ''publish'')::text', pg_temp.s('v2'))) like 'ERROR 22023%', 'unknown actions are refused');

select pg_temp.put('edit', pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_save_edit(%L, %L, %L::jsonb, null, true, true)::text',
  pg_temp.s('carousel'), pg_temp.s('v2'), (pg_temp.j('version') || '{"summary": "Edited by an editor."}')::text)));
select pg_temp.put('v3', pg_temp.j('edit') ->> 'version_id');
select pg_temp.ok(pg_temp.j('edit') ->> 'source' = 'mixed' and pg_temp.j('edit') ->> 'version_no' = '3', 'an edit of an AI version is saved as a mixed version', pg_temp.s('edit'));
select pg_temp.ok((select created_by::text = pg_temp.s('admin') and based_on_id::text = pg_temp.s('v2') and review_decision = 'approved'
  from public.post_analysis_versions where id::text = pg_temp.s('v3')), 'it records its author and what it was based on');
select pg_temp.ok((select count(*) from public.post_slide_analyses where version_id::text = pg_temp.s('v3')) = pg_temp.s('n')::int, 'it keeps the slide records');
select pg_temp.ok((select summary = 'Edited by an editor.' and analysis_source = 'mixed' and published_at is not null and author_id::text = pg_temp.s('admin')
  from public.post_analyses where post_id = pg_temp.s('carousel')), 'and is published as the analysis');
select pg_temp.ok((select count(*) from public.post_analysis_versions where post_id = pg_temp.s('carousel')) = 3, 'every version is kept');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('stranger'), format('select public.creative_save_edit(%L, null, %L::jsonb)::text',
  pg_temp.s('carousel'), pg_temp.s('version'))) like 'ERROR 42501%', 'a member cannot edit');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format(
  $q$insert into public.post_analysis_versions (post_id, version_no, source, summary, creative_dna, taxonomy_version, created_by)
     values (%L, 99, 'ai', 'x', '{}', 't', %L) returning id::text$q$, pg_temp.s('carousel'), pg_temp.s('admin'))) like 'ERROR 42501%', 'editors cannot pass work off as the AI''s');
select pg_temp.ok((select count(*) from public.creative_review_events where post_id = pg_temp.s('carousel')) = 5, 'every decision is in the history',
  (select string_agg(action, ',' order by created_at) from public.creative_review_events where post_id = pg_temp.s('carousel')));

-- Editing a live analysis -------------------------------------------------------------------------

select pg_temp.put('edit4', pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_save_edit(%L, %L, %L::jsonb, null, true, false)::text',
  pg_temp.s('carousel'), pg_temp.s('v3'), (pg_temp.j('version') || '{"summary": "Approved without the publish switch."}')::text)));
select pg_temp.put('v4', pg_temp.j('edit4') ->> 'version_id');
select pg_temp.ok(pg_temp.j('edit4') ->> 'published' = 'true'
  and (select published_at is not null and summary = 'Approved without the publish switch.' from public.post_analyses where post_id = pg_temp.s('carousel')),
  'approving an edit of a live analysis keeps it live', pg_temp.s('edit4'));
select pg_temp.put('edit5', pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_save_edit(%L, %L, %L::jsonb)::text',
  pg_temp.s('carousel'), pg_temp.s('v4'), (pg_temp.j('version') || '{"summary": "A draft edit."}')::text)));
select pg_temp.ok(pg_temp.j('edit5') ->> 'applied' = 'false'
  and (select published_at is not null and summary = 'Approved without the publish switch.' and current_version_id::text = pg_temp.s('v4')
       from public.post_analyses where post_id = pg_temp.s('carousel')),
  'saving a draft edit of a live analysis files it as a proposal and leaves the live one up', pg_temp.s('edit5'));
select pg_temp.ok(pg_temp.try('anon', null, format('select count(*)::text from public.post_analyses where post_id = %L', pg_temp.s('carousel'))) = '1', 'anon still sees it');

update public.post_analyses set current_version_id = null where post_id = pg_temp.s('carousel');
select pg_temp.ok(pg_temp.try('authenticated', pg_temp.s('admin'), format('select public.creative_review(%L, ''unpublish'')::text', pg_temp.s('v3'))) like 'ERROR 22023%',
  'an analysis with no current version is not mistaken for another version');
update public.post_analyses set current_version_id = pg_temp.s('v4')::uuid where post_id = pg_temp.s('carousel');
select pg_temp.ok(pg_temp.try('anon', null, $q$select (public.curatit_mcp_search_v2('{"offset": 140, "limit": 5}') ->> 'next_offset')$q$) = '145'
  and pg_temp.try('anon', null, $q$select (public.curatit_mcp_search_v2('{"offset": 500, "limit": 50}') ->> 'has_more')$q$) = 'false',
  'search pages on, but never past its offset cap');

-- Reconciling ----------------------------------------------------------------------------------

select pg_temp.put('jobs_before', (select count(*)::text from public.classification_jobs));
select pg_temp.put('dry', pg_temp.try('service_role', null, format('select public.creative_reconcile(%L)::text', pg_temp.s('pipeline'))));
select pg_temp.ok((select count(*)::text from public.classification_jobs) = pg_temp.s('jobs_before'), 'a dry run queues nothing');
select pg_temp.ok(pg_temp.j('dry') -> 'due' @> jsonb_build_array(jsonb_build_object('post_id', pg_temp.s('hidden'), 'why', 'missing')), 'posts never analysed are due', left(pg_temp.s('dry'), 300));
select pg_temp.ok(not (pg_temp.j('dry') -> 'due' @> jsonb_build_array(jsonb_build_object('post_id', pg_temp.s('other'))))
  and (pg_temp.j('dry') ->> 'incomplete')::int >= 1, 'a post with an image missing is counted, not due', pg_temp.j('dry') ->> 'incomplete');
select pg_temp.ok(not (pg_temp.j('dry') -> 'due' @> jsonb_build_array(jsonb_build_object('post_id', pg_temp.s('carousel'))))
  and not (pg_temp.j('dry') -> 'due' @> jsonb_build_array(jsonb_build_object('post_id', pg_temp.s('static')))), 'analysed and already-queued posts are not, even when the job failed');
select pg_temp.put('wet', pg_temp.try('service_role', null, format('select public.creative_reconcile(%L, false, false, 3)::text', pg_temp.s('pipeline'))));
select pg_temp.ok(jsonb_array_length(pg_temp.j('wet') #> '{queued,enqueued}') + jsonb_array_length(pg_temp.j('wet') #> '{queued,incomplete}') = 3, 'reconcile queues up to its limit', pg_temp.s('wet'));
select pg_temp.put('dry2', pg_temp.try('service_role', null, format('select public.creative_reconcile(%L)::text', pg_temp.s('pipeline'))));
select pg_temp.ok(not exists (
    select 1 from jsonb_array_elements_text(pg_temp.j('wet') #> '{queued,enqueued}') q(id)
    where pg_temp.j('dry2') -> 'due' @> jsonb_build_array(jsonb_build_object('post_id', q.id))), 'queued posts are not due again', pg_temp.s('dry2'));
select pg_temp.ok(pg_temp.jv(pg_temp.try('service_role', null, format('select public.creative_reconcile(%L, true, true, 1000)::text', 'next-pipeline'))) -> 'due'
  @> jsonb_build_array(jsonb_build_object('post_id', pg_temp.s('carousel'), 'why', 'stale')), 'a new pipeline makes analysed posts stale, when asked');
select pg_temp.ok(not (pg_temp.jv(pg_temp.try('service_role', null, format('select public.creative_reconcile(%L, true, false, 1000)::text', 'next-pipeline'))) -> 'due'
  @> jsonb_build_array(jsonb_build_object('post_id', pg_temp.s('carousel')))), 'but not by default');

-- Content that changes mid-analysis ------------------------------------------------------------------

select public.creative_enqueue(array[pg_temp.s('carousel')], pg_temp.s('pipeline'), null, 'manual', true, 9::smallint);
select pg_temp.put('jobE', pg_temp.try('service_role', null, 'select id::text from public.creative_claim_jobs(''worker-e'', 1, 600)'));
update public.instagram_posts set caption = '  ' || caption || E'\n\n ' where id = pg_temp.s('carousel');
select pg_temp.ok(private.creative_content_fingerprint(pg_temp.s('carousel')) = pg_temp.s('fp'), 'whitespace in the caption does not change the fingerprint');
update public.instagram_posts set caption = caption || ' Edited.' where id = pg_temp.s('carousel');
select pg_temp.ok(private.creative_content_fingerprint(pg_temp.s('carousel')) <> pg_temp.s('fp'), 'a caption edit does');
select pg_temp.ok(pg_temp.try('service_role', null, format('select public.creative_save_analysis(%L, %L, %L::jsonb, %L::jsonb, %L::jsonb)::text',
  pg_temp.s('jobE'), 'worker-e', pg_temp.s('version'), pg_temp.s('slides'), pg_temp.s('run'))) like 'ERROR 40001%', 'an analysis of content that has since changed is refused');
select pg_temp.ok(pg_temp.jv(pg_temp.try('service_role', null, format('select public.creative_reconcile(%L)::text', pg_temp.s('pipeline')))) -> 'due'
  @> jsonb_build_array(jsonb_build_object('post_id', pg_temp.s('carousel'), 'why', 'changed')), 'and the changed post is due again');

-- MCP for posts without an analysis --------------------------------------------------------------------

select pg_temp.ok(pg_temp.try('anon', null, format('select public.curatit_mcp_get_post(%L)::text', pg_temp.s('static'))) = pg_temp.s('before_get_static'), 'a post without an analysis reads exactly as before');

-- Deleting a post takes its analyses with it -------------------------------------------------------------

do $$
begin
  delete from public.instagram_posts where id = pg_temp.s('carousel');
  perform pg_temp.put('delete', 'ok');
exception when others then
  perform pg_temp.put('delete', sqlstate || ' ' || sqlerrm);
end $$;
select pg_temp.ok(pg_temp.s('delete') = 'ok', 'a post with versions, slides, labels and jobs can be deleted', pg_temp.s('delete'));
select pg_temp.ok(not exists (select 1 from public.post_analysis_versions where post_id = pg_temp.s('carousel'))
  and not exists (select 1 from public.classification_jobs where post_id = pg_temp.s('carousel')), 'and nothing of it is left');
