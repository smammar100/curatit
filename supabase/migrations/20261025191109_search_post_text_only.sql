-- Search an analysis by what it says about the post itself (2026-10-25). creative_search was built
-- from every string in creative_dna, so a keyword also matched the takeaways and adaptation ideas
-- (advice about other, hypothetical products: "A meal-planning app could launch custom menus"),
-- each decision's reusable principle and watch-out, the data checks, the label slugs and the
-- internal quality notes. Searches for "banking app" or "product launch announcement" returned
-- posts through those lines, with them quoted as the reason. One helper names the parts that
-- describe the post; the index and the match reasons both read it, so a reason always quotes the
-- text that matched.

-- The text of one part of an analysis: strategy, creative decisions, visual notes, copy, narrative
-- or evidence. A decision counts by its title, observation, explanation and rationale (2.0's
-- creative_rationale and attention_mechanisms are the same kind of text); a piece of evidence by
-- its observation and quote, not its slide reference; the hook without its evidence references.
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

-- The column is computed by whoever writes post_analyses (service_role), and the match reasons run
-- inside curatit_mcp_search_v2, which anon and authenticated call; both pure helpers are granted
-- as private.curatit_mcp_analysis_match is
revoke all on function private.creative_search_part(jsonb, text), private.creative_search_text(jsonb) from public;
grant execute on function private.creative_search_part(jsonb, text), private.creative_search_text(jsonb) to anon, authenticated, service_role;

-- Rewrites the column and rebuilds post_analyses_creative_search_idx (Postgres 17)
alter table public.post_analyses
  alter column creative_search set expression as (
    setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(private.creative_search_text(creative_dna), '')), 'B'));

-- The reason a post matched names the first part whose text matches, now only the parts above.
-- Otherwise unchanged from 20261016120400_mcp_search_v2_reasons.sql.
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
