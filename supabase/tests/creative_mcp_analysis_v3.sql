-- The MCP's 3.0 analysis (supabase/migrations/20261016120200_creative_mcp_analysis_v3.sql):
-- database checks against the linked project, read-only, in one transaction that always rolls
-- back. Run it with
--   npx supabase db query --linked -f supabase/tests/creative_mcp_analysis_v3.sql
-- It prints one row per check; every `ok` should be true. To check the migration before it's
-- pushed, paste its SQL at the marker below (the rollback undoes it too).
--
-- The reads run as anon, the role the MCP's catalog reads use. anon can't read a temp table that
-- postgres made, so each read keeps its result in set_config(..., true) and the checks read it back
-- as postgres.

begin;

-- @migration

create temp table checks (name text, ok boolean, detail text);

-- DeHeg1THB72: a nine-slide carousel whose evidence runs to slide:8
select set_config('test.post', (select id from public.instagram_posts where short_code = 'DeHeg1THB72'), true);

set local role anon;

select set_config('test.detail', coalesce(private.creative_mcp_analysis(current_setting('test.post'), true), 'null'::jsonb)::text, true);
select set_config('test.compact', coalesce(private.creative_mcp_analysis(current_setting('test.post')), 'null'::jsonb)::text, true);
select set_config('test.get_post', coalesce(public.curatit_mcp_get_post_v2(current_setting('test.post')), 'null'::jsonb)::text, true);
select set_config('test.search', coalesce(public.curatit_mcp_search_v2('{"query": "money", "limit": 3}'::jsonb), 'null'::jsonb)::text, true);

-- Every published analysis anon can see (RLS keeps it to published posts)
select set_config('test.all', (
  select jsonb_build_object(
    'analysed', count(*),
    'headline', count(*) filter (where nullif(btrim(x.c ->> 'strategy_headline'), '') is not null),
    'dna_headline', count(*) filter (where x.d -> 'dna' ? 'strategy_headline'),
    'records_match', count(*) filter (where jsonb_array_length(x.d -> 'slide_records') = (x.d ->> 'processed_slides')::int),
    'other_versions', count(*) filter (where exists (
      select 1 from jsonb_array_elements(x.d -> 'slide_records') r where r ->> 'version_id' is distinct from x.d ->> 'current_version_id')),
    'sentinel_slides', count(*) filter (where exists (
      select 1 from jsonb_array_elements(x.d #> '{narrative,slides}') s
      where s ->> 'role' in ('unknown', 'none', 'other')
        or exists (
          select 1 from jsonb_array_elements_text(
            coalesce(s -> 'typography', '[]') || coalesce(s -> 'layout', '[]') || coalesce(s -> 'imagery', '[]')
            || coalesce(s -> 'palette', '[]') || coalesce(s -> 'devices', '[]')) t
          where t in ('unknown', 'none', 'other')))),
    'sentinel_copy', count(*) filter (where x.c ->> 'cta' in ('unknown', 'none', 'other') or exists (
      select 1 from jsonb_array_elements_text(coalesce(x.c -> 'tones', '[]') || coalesce(x.c -> 'persuasion', '[]')) t
      where t in ('unknown', 'none', 'other'))),
    'evidence_cut', count(*) filter (where jsonb_array_length(x.c -> 'analysis_evidence') < least(jsonb_array_length(x.d #> '{dna,evidence}'), 20)),
    'editor_note', count(*) filter (where x.c ->> 'note' like '%reviewed and approved by a Curatit editor%'))
  from (
    select private.creative_mcp_analysis(p.id) c, private.creative_mcp_analysis(p.id, true) d
    from public.instagram_posts p) x
  where x.c is not null)::text, true);

reset role;

-- Read back as postgres
insert into checks
select 'the analysis reads as anon', d <> 'null'::jsonb, left(d::text, 120)
from (select current_setting('test.detail')::jsonb d) v
union all
select 'detail carries the DNA with its strategy headline', d -> 'dna' ? 'strategy_headline', d #>> '{dna,strategy_headline}'
from (select current_setting('test.detail')::jsonb d) v
union all
select 'one slide record per processed slide', jsonb_array_length(d -> 'slide_records') = (d ->> 'processed_slides')::int,
  jsonb_array_length(d -> 'slide_records') || ' records, ' || (d ->> 'processed_slides') || ' processed'
from (select current_setting('test.detail')::jsonb d) v
union all
select 'evidence reaches slide:8 (it stopped at 8 items)', d -> 'analysis_evidence' @> '[{"ref": "slide:8"}]',
  (select string_agg(e ->> 'ref', ', ') from jsonb_array_elements(d -> 'analysis_evidence') e)
from (select current_setting('test.detail')::jsonb d) v
union all
select 'every key from before is still there',
  d ?& array['verified_status', 'analysis_version', 'analysis_source', 'taxonomy_version', 'published_at',
    'image_analysis_complete', 'slides_analysed', 'slides_total', 'primary_type', 'secondary_types', 'objective',
    'visual_styles', 'typography_categories', 'layout_tags', 'palette', 'narrative_pattern', 'hook_technique',
    'concept', 'creative_summary', 'why_it_might_work', 'takeaways', 'analysis_evidence', 'note', 'hook',
    'narrative', 'copy_strategy', 'attention_mechanisms', 'adaptation_ideas', 'constraints_or_uncertainties'],
  (select string_agg(k, ', ' order by k) from jsonb_object_keys(d) k)
from (select current_setting('test.detail')::jsonb d) v
union all
select 'compact adds the strategy and copy fields but not the DNA',
  c ?& array['strategy_headline', 'strategy_summary', 'tones', 'persuasion', 'cta'] and not c ? 'dna' and not c ? 'slide_records',
  (select string_agg(k, ', ' order by k) from jsonb_object_keys(c) k)
from (select current_setting('test.compact')::jsonb c) v
union all
select 'get_post_v2 passes the detail through', g #> '{creative,dna}' ? 'strategy_headline', left(g ->> 'creative', 80)
from (select current_setting('test.get_post')::jsonb g) v
union all
select 'search_v2 hits carry the compact strategy headline',
  jsonb_array_length(s -> 'posts') > 0 and not exists (
    select 1 from jsonb_array_elements(s -> 'posts') h where h -> 'analysis' is not null and jsonb_typeof(h -> 'analysis') = 'object' and not h -> 'analysis' ? 'strategy_headline'),
  jsonb_array_length(s -> 'posts') || ' hits'
from (select current_setting('test.search')::jsonb s) v
union all
select 'every published analysis has a strategy headline', (a ->> 'headline')::int = (a ->> 'analysed')::int and (a ->> 'analysed')::int > 0, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'every detail carries the DNA', (a ->> 'dna_headline')::int = (a ->> 'analysed')::int, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'slide records match processed slides everywhere', (a ->> 'records_match')::int = (a ->> 'analysed')::int, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'slide records are the current version''s only', (a ->> 'other_versions')::int = 0, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'no narrative slide says unknown, none or other', (a ->> 'sentinel_slides')::int = 0, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'no tone, persuasion or cta says unknown, none or other', (a ->> 'sentinel_copy')::int = 0, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'no evidence cut short below 20', (a ->> 'evidence_cut')::int = 0, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'no note claims an editor reviewed it', (a ->> 'editor_note')::int = 0, a::text
from (select current_setting('test.all')::jsonb a) v
union all
select 'anon can run both functions',
  has_function_privilege('anon', 'private.creative_mcp_analysis(text, boolean)', 'execute')
    and has_function_privilege('anon', 'private.creative_known(jsonb)', 'execute'), null
union all
select 'PUBLIC can run neither',
  not exists (
    select 1 from pg_proc f, aclexplode(f.proacl) acl
    where f.oid in ('private.creative_mcp_analysis(text, boolean)'::regprocedure, 'private.creative_known(jsonb)'::regprocedure)
      and acl.grantee = 0),
  null
union all
select 'creative_known keeps order and drops what says nothing',
  private.creative_known('["unknown", "sans-serif", "none", "serif", "other"]') = '["sans-serif", "serif"]'::jsonb
    and private.creative_known('"unknown"') = '[]'::jsonb and private.creative_known(null) = '[]'::jsonb,
  private.creative_known('["unknown", "sans-serif", "none", "serif", "other"]')::text;

select name, ok, detail from checks order by ok, name;

rollback;
