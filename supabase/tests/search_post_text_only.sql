-- Checks 20261025191109_search_post_text_only.sql inside a transaction that always rolls back: the
-- migration's statements are repeated here, so this runs before and after it's applied. Runs the
-- searches that matched through text not about the post (takeaways, adaptation ideas, data checks)
-- before and after, and records which part of the analysis each match was found in. Run:
--   npx supabase db query --linked -f supabase/tests/search_post_text_only.sql
-- (only the last statement's result is printed, so the checks collect into a temp table)
begin;

create temp table cases (name text, request jsonb);
insert into cases values
  ('banking app, minimal finance', '{"query": "app", "category": "finance", "tone": ["minimal"], "limit": 50}'),
  ('product launch announcement', '{"query": "announcement", "archetype": ["product-launch"], "limit": 50}'),
  ('AI product screenshots', '{"query": "product", "category": "ai", "imagery": ["screenshot-ui"], "limit": 50}'),
  ('travel photography', '{"query": "photography", "category": "travel-transportation", "limit": 50}'),
  ('pastel', '{"query": "pastel", "limit": 50}'),
  ('call to action', '{"query": "call action", "limit": 50}'),
  ('quote cards', '{"query": "quote cards", "limit": 50}'),
  ('saving money', '{"query": "saving", "category": "finance", "limit": 50}'),
  ('bold', '{"query": "bold", "limit": 50}'),
  ('neon on dark', '{"query": "neon", "palette": ["black"], "limit": 50}'),
  ('halloween', '{"query": "halloween", "limit": 50}');

create temp table results (name text, phase text, total int, analysis_parts text);
create temp table checks (check_name text, ok boolean);

insert into results
select c.name, 'before', jsonb_array_length(r -> 'posts'),
  (select string_agg(part || ' ' || n, ', ' order by n desc, part) from (
    select substring(reason from 'in the ([a-z ]+):') as part, count(*) as n
    from jsonb_array_elements(r -> 'posts') p, jsonb_array_elements_text(p -> 'reasons') reason
    where reason like 'The query matches the published analysis%' group by 1) x)
from cases c, lateral (select public.curatit_mcp_search_v2(c.request) as r) s;

create or replace function private.creative_search_part(p_dna jsonb, p_part text)
returns text
language sql
immutable
set search_path = ''
as $$
  select string_agg(s #>> '{}', ' ')
  from jsonb_path_query(case p_part
      when 'strategy' then jsonb_build_array(p_dna -> 'strategy_headline', p_dna -> 'strategy_summary', p_dna -> 'creative_formula',
        p_dna -> 'concept', p_dna -> 'creative_summary', p_dna -> 'content_intent')
      when 'creative decisions' then jsonb_build_array(
        (select jsonb_agg(jsonb_build_array(d -> 'title', d -> 'observation', d -> 'explanation', d -> 'rationale'))
         from jsonb_array_elements(case when jsonb_typeof(p_dna -> 'creative_decisions') = 'array' then p_dna -> 'creative_decisions' else '[]'::jsonb end) d),
        p_dna -> 'creative_rationale', p_dna -> 'attention_mechanisms')
      when 'visual notes' then jsonb_build_array(p_dna -> 'visual_notes', p_dna -> 'visual_system', p_dna -> 'colour_roles')
      when 'copy' then jsonb_build_array(p_dna -> 'copywriting', p_dna -> 'copy_strategy',
        case when jsonb_typeof(p_dna -> 'hook') = 'object' then (p_dna -> 'hook') - 'evidence' else p_dna -> 'hook' end)
      when 'narrative' then p_dna -> 'narrative'
      when 'evidence' then (select jsonb_agg(jsonb_build_array(e -> 'observation', e -> 'quote'))
        from jsonb_array_elements(case when jsonb_typeof(p_dna -> 'evidence') = 'array' then p_dna -> 'evidence' else '[]'::jsonb end) e)
    end, 'strict $.** ? (@.type() == "string")') s
$$;

create or replace function private.creative_search_text(p_dna jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select concat_ws(' ',
    private.creative_search_part(p_dna, 'strategy'),
    private.creative_search_part(p_dna, 'creative decisions'),
    private.creative_search_part(p_dna, 'visual notes'),
    private.creative_search_part(p_dna, 'copy'),
    private.creative_search_part(p_dna, 'narrative'),
    private.creative_search_part(p_dna, 'evidence'))
$$;

revoke all on function private.creative_search_part(jsonb, text), private.creative_search_text(jsonb) from public;
grant execute on function private.creative_search_part(jsonb, text), private.creative_search_text(jsonb) to anon, authenticated, service_role;

alter table public.post_analyses
  alter column creative_search set expression as (
    setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(private.creative_search_text(creative_dna), '')), 'B'));

create or replace function private.curatit_mcp_analysis_match(p_dna jsonb, p_summary text, p_query tsquery)
 returns text
 language plpgsql
 stable
 set search_path to ''
as $function$
declare
  v_parts constant text[] := array['strategy', 'creative decisions', 'visual notes', 'copy', 'narrative', 'evidence', 'summary'];
  v_part text;
  v_body text;
begin
  if p_query is null or (p_dna is null and p_summary is null) then
    return null;
  end if;
  foreach v_part in array v_parts loop
    if v_part = 'summary' then
      v_body := p_summary;
    else
      v_body := private.creative_search_part(p_dna, v_part);
    end if;
    if v_body is not null and to_tsvector('english'::regconfig, v_body) @@ p_query then
      return v_part || ': "…' || btrim(regexp_replace(
        ts_headline('english'::regconfig, left(v_body, 20000), p_query, 'MaxFragments=1, MaxWords=12, MinWords=4, StartSel="", StopSel=""'),
        '\s+', ' ', 'g')) || '…"';
    end if;
  end loop;
  return null;
end;
$function$;

insert into results
select c.name, 'after', jsonb_array_length(r -> 'posts'),
  (select string_agg(part || ' ' || n, ', ' order by n desc, part) from (
    select substring(reason from 'in the ([a-z ]+):') as part, count(*) as n
    from jsonb_array_elements(r -> 'posts') p, jsonb_array_elements_text(p -> 'reasons') reason
    where reason like 'The query matches the published analysis%' group by 1) x)
from cases c, lateral (select public.curatit_mcp_search_v2(c.request) as r) s;

insert into checks values
  ('no match is found in the takeaways, data checks or labels',
    not exists (select 1 from results where phase = 'after' and analysis_parts ~ '(takeaways|data checks|labels)')),
  ('every published analysis still has search text',
    not exists (select 1 from public.post_analyses where published_at is not null and creative_search = ''::tsvector)),
  ('the index still serves the search', exists (select 1 from pg_indexes where indexname = 'post_analyses_creative_search_idx'));

select name, phase, total, analysis_parts, null::boolean as ok from results
union all
select check_name, 'check', null, null, ok from checks
order by 1, 2 desc;

rollback;
