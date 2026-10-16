-- curatit_mcp_search_v2, the MCP's search, with the same signature, grants and output keys (one
-- added). What changes:
--
-- - Match reasons use the API's public names: "creative approach" (was archetype), "approach
--   family" (archetype_family) and "goal" (objective), and a match in the published analysis says
--   which part matched with a few words around it ('…, in the visual notes: "dotted horizontal
--   gridlines…"'). It said only "The query matches the published analysis", and the text that
--   matched was often in a part the client never sees.
-- - The query also matches the brand's name and the post's categories, main and tags, alongside
--   the caption. "Crypto & Web3" or "Coinbase" found nothing unless a caption said so.
-- - At the 500-result cap the result says has_more true with next_offset null, so a client is told
--   the search stopped instead of the results just ending.
-- - A query is matched against the analyses once, through their GIN index, before the candidates
--   are built, instead of reading every analysis's search vector for every post.
-- - `catalog_marker`, an opaque mark of the library's state (published posts and analyses), so the
--   MCP can tell a client when the library changed between pages.
--
-- It still calls private.creative_mcp_analysis(id) compact for each hit, so whatever that returns
-- (…_creative_mcp_analysis_v3) reaches the hits.
--
-- Rollback: re-run curatit_mcp_search_v2 from 20261013153131_mcp_main_category_first.sql, then
--   drop function private.curatit_mcp_analysis_match(jsonb, text, tsquery);

set lock_timeout = '5s';

-- Which part of a published analysis a query matches, as '<part>: "<a few words around it>"', or
-- null when no single part matches every word (the whole analysis can still match, across parts).
-- The parts are named after what curatit_get_post returns, so a client can find the text
create function private.curatit_mcp_analysis_match(p_dna jsonb, p_summary text, p_query tsquery)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_parts constant text[] := array['strategy', 'creative decisions', 'visual notes', 'data checks', 'copy', 'narrative',
    'takeaways', 'evidence', 'labels', 'summary'];
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
      select string_agg(s #>> '{}', ' ') into v_body
      from jsonb_path_query(case v_part
          when 'strategy' then jsonb_build_array(p_dna -> 'strategy_headline', p_dna -> 'strategy_summary', p_dna -> 'creative_formula',
            p_dna -> 'concept', p_dna -> 'creative_summary', p_dna -> 'content_intent')
          when 'creative decisions' then p_dna -> 'creative_decisions'
          when 'visual notes' then jsonb_build_array(p_dna -> 'visual_notes', p_dna -> 'visual_system', p_dna -> 'colour_roles')
          when 'data checks' then p_dna -> 'integrity_notes'
          when 'copy' then jsonb_build_array(p_dna -> 'copywriting', p_dna -> 'copy_strategy', p_dna -> 'hook')
          when 'narrative' then p_dna -> 'narrative'
          when 'takeaways' then jsonb_build_array(p_dna -> 'takeaways', p_dna -> 'adaptation_ideas', p_dna -> 'application',
            p_dna -> 'creative_rationale', p_dna -> 'attention_mechanisms')
          when 'evidence' then jsonb_build_array(p_dna -> 'evidence', p_dna -> 'constraints_or_uncertainties', p_dna -> 'quality')
          when 'labels' then jsonb_build_array(p_dna -> 'primary_archetype', p_dna -> 'secondary_archetypes', p_dna -> 'marketing_objective')
        end, 'strict $.** ? (@.type() == "string")') s;
    end if;
    if v_body is not null and to_tsvector('english'::regconfig, v_body) @@ p_query then
      return v_part || ': "…' || btrim(regexp_replace(
        ts_headline('english'::regconfig, left(v_body, 20000), p_query, 'MaxFragments=1, MaxWords=12, MinWords=4, StartSel="", StopSel=""'),
        '\s+', ' ', 'g')) || '…"';
    end if;
  end loop;
  return null;
end;
$$;

revoke execute on function private.curatit_mcp_analysis_match(jsonb, text, tsquery) from public, anon, authenticated;
grant execute on function private.curatit_mcp_analysis_match(jsonb, text, tsquery) to anon, authenticated, service_role;

create or replace function public.curatit_mcp_search_v2(p_request jsonb default '{}'::jsonb)
 returns jsonb
 language plpgsql
 stable
 set search_path to ''
 set statement_timeout to '5s'
as $function$
declare
  r jsonb := coalesce(p_request, '{}'::jsonb);
  v_dimensions constant text[] := array['archetype', 'archetype_family', 'objective', 'hook_technique',
    'narrative_pattern', 'typography', 'layout', 'imagery', 'palette', 'visual_device', 'tone', 'persuasion', 'cta'];
  v_allowed constant text[] := v_dimensions || array['query', 'category', 'brand', 'format', 'analysed_only', 'limit', 'offset'];
  v_key text;
  v_dimension text;
  v_filters jsonb := '{}'::jsonb;
  v_query text;
  v_limit integer;
  v_offset integer;
  v_english tsquery;
  v_simple tsquery;
  v_analysed_matches text[] := '{}';
  v_marker text;
  v_result jsonb;
begin
  if jsonb_typeof(r) <> 'object' then
    raise exception 'The request must be a JSON object' using errcode = '22023';
  end if;
  for v_key in select jsonb_object_keys(r) loop
    if not v_key = any (v_allowed) then
      raise exception 'Unknown search field "%"', left(v_key, 40) using errcode = '22023';
    end if;
  end loop;

  v_query := nullif(btrim(r ->> 'query'), '');
  begin
    v_limit := coalesce((r ->> 'limit')::integer, 20);
    v_offset := coalesce((r ->> 'offset')::integer, 0);
  exception when others then
    raise exception 'limit and offset must be whole numbers' using errcode = '22023';
  end;
  if v_limit not between 1 and 50 or v_offset not between 0 and 500 then
    raise exception 'limit must be 1..50 and offset 0..500' using errcode = '22023';
  end if;
  if length(v_query) > 300 or length(r ->> 'category') > 100 or length(r ->> 'brand') > 100 then
    raise exception 'A filter is too long' using errcode = '22023';
  end if;
  if r ->> 'format' is not null and r ->> 'format' not in ('static', 'carousel', 'video') then
    raise exception 'format must be static, carousel or video' using errcode = '22023';
  end if;

  foreach v_dimension in array v_dimensions loop
    if r ? v_dimension and jsonb_typeof(r -> v_dimension) <> 'null' then
      v_filters := v_filters || jsonb_build_object(v_dimension, to_jsonb(private.creative_resolve_terms(v_dimension, r -> v_dimension)));
    end if;
  end loop;
  if v_query is not null then
    v_english := websearch_to_tsquery('english'::regconfig, v_query);
    v_simple := websearch_to_tsquery('simple'::regconfig, v_query);
    -- The analyses the query matches, once, through post_analyses_creative_search_idx (its
    -- predicate is published_at is not null)
    select coalesce(array_agg(a.post_id), '{}') into v_analysed_matches
    from public.post_analyses a
    where a.published_at is not null and a.review_status = 'approved' and a.creative_search @@ v_english;
  end if;

  -- The library's state, for the MCP's "the library changed since page 1" warning: published posts
  -- (how many, last change) and published analyses (last publish or edit). Opaque to clients
  select left(md5(concat_ws('|', count(*), max(p.updated_at),
      (select max(greatest(a.published_at, a.updated_at)) from public.post_analyses a where a.published_at is not null))), 16)
  into v_marker
  from public.instagram_posts p
  where p.is_published;

  with candidates as materialized (
    select p.id, p.short_code, p.url, p.format, p.caption, p.posted_at, coalesce(p.mcp_search, ''::tsvector) as mcp_search,
      b.name as brand_name, b.slug as brand_slug, b.category_id,
      a.current_version_id, a.published_at is not null as analysed,
      p.id = any (v_analysed_matches) as analysis_match,
      n.names
    from public.instagram_posts p
    left join public.brands b on b.id = p.brand_id
    left join public.post_analyses a on a.post_id = p.id and a.published_at is not null and a.review_status = 'approved'
    -- The brand's name and the post's categories (main and tags), matched with the caption, so a
    -- query can name a brand or a category
    cross join lateral (
      select case when v_query is null then null else to_tsvector('simple'::regconfig, concat_ws(' ', b.name, (
        select string_agg(c.name, ' ')
        from public.categories c
        where c.id = b.category_id or exists (select 1 from public.post_categories pc where pc.post_id = p.id and pc.category_id = c.id))))
      end as names
    ) n
    where p.is_published
      and (r ->> 'brand' is null or b.slug = r ->> 'brand')
      and (r ->> 'format' is null or p.format = r ->> 'format')
      and (r ->> 'category' is null or exists (
        select 1 from public.categories c
        where c.slug = r ->> 'category'
          and (c.id = b.category_id or exists (
            select 1 from public.post_categories pc where pc.post_id = p.id and pc.category_id = c.id))))
      and (coalesce((r ->> 'analysed_only')::boolean, false) = false or a.published_at is not null)
      and (v_query is null or p.id = any (v_analysed_matches) or (coalesce(p.mcp_search, ''::tsvector) || n.names) @@ v_simple)
      and not exists (
        select 1 from jsonb_each(v_filters) f(dimension, slugs)
        where not exists (
          select 1 from public.post_creative_labels l
          where l.post_id = p.id and l.version_id = a.current_version_id and l.dimension = f.dimension
            and l.slug in (select jsonb_array_elements_text(f.slugs))))
  ), scored as (
    select c.*,
      case when c.analysis_match then coalesce((
        select ts_rank(a.creative_search, v_english) from public.post_analyses a where a.post_id = c.id), 0) * 2 else 0 end as analysis_score,
      case when v_query is null then 0 else coalesce(ts_rank(c.mcp_search || c.names, v_simple), 0) end as caption_score,
      coalesce((
        select sum(l.weight) from public.post_creative_labels l
        join jsonb_each(v_filters) f(dimension, slugs) on f.dimension = l.dimension
        where l.post_id = c.id and l.version_id = c.current_version_id
          and l.slug in (select jsonb_array_elements_text(f.slugs))), 0) * 0.1 as label_score
    from candidates c
  ), page as materialized (
    select s.*, s.analysis_score + s.caption_score + s.label_score as score,
      row_number() over (order by s.analysis_score + s.caption_score + s.label_score desc, s.posted_at desc, s.id desc) as rank
    from scored s
    order by rank
    limit v_limit + 1 offset v_offset
  ), items as (
    select pg.rank, jsonb_build_object(
      'id', pg.id,
      'short_code', pg.short_code,
      'source_url', pg.url,
      'format', pg.format,
      'caption', left(pg.caption, 400),
      'posted_at', pg.posted_at,
      'brand', jsonb_build_object('name', pg.brand_name, 'slug', pg.brand_slug),
      'categories', coalesce((
        select jsonb_agg(jsonb_build_object('name', c.name, 'slug', c.slug) order by (c.id = pg.category_id) desc, c.slug)
        from public.categories c
        where c.id = pg.category_id or exists (select 1 from public.post_categories pc where pc.post_id = pg.id and pc.category_id = c.id)), '[]'),
      'cover', (select jsonb_build_object('bucket', i.bucket_id, 'path', i.path, 'position', i.position)
        from public.post_images i where i.post_id = pg.id order by i.position limit 1),
      'score', round(pg.score::numeric, 4),
      'reasons', to_jsonb(array_remove(array[
          case when pg.analysis_match then 'The query matches the published analysis' || coalesce(', in the ' || (
            select private.curatit_mcp_analysis_match(a.creative_dna, a.summary, v_english)
            from public.post_analyses a where a.post_id = pg.id), '') end,
          case when v_query is not null and pg.mcp_search @@ v_simple then 'The query matches the caption' end,
          case when v_query is not null and pg.names @@ v_simple then 'The query matches the brand or category name' end,
          case when v_query is not null and not pg.mcp_search @@ v_simple and not pg.names @@ v_simple and (pg.mcp_search || pg.names) @@ v_simple
            then 'The query matches the caption and the brand or category name together' end], null))
        || coalesce((
          select jsonb_agg(x.reason order by x.dimension, x.reason)
          from (
            select l.dimension,
              case l.dimension when 'archetype' then 'creative approach' when 'archetype_family' then 'approach family'
                when 'objective' then 'goal' else replace(l.dimension, '_', ' ') end
              || ': ' || t.label
              || case when l.dimension = 'archetype' and l.weight = 3 then ' (primary)' else '' end
              || coalesce(' — seen on slide ' || (
                select string_agg(s.position::text, ', ' order by s.position)
                from public.post_slide_analyses s
                where s.version_id = l.version_id and case l.dimension
                  when 'typography' then l.slug = any (s.typography)
                  when 'layout' then l.slug = any (s.layout)
                  when 'imagery' then l.slug = any (s.imagery)
                  when 'palette' then l.slug = any (s.palette)
                  when 'visual_device' then l.slug = any (s.devices)
                  else false end), '') as reason
            from public.post_creative_labels l
            join jsonb_each(v_filters) f(dimension, slugs) on f.dimension = l.dimension
            join public.creative_taxonomy_terms t on t.dimension = l.dimension and t.slug = l.slug
            where l.post_id = pg.id and l.version_id = pg.current_version_id
              and l.slug in (select jsonb_array_elements_text(f.slugs))) x), '[]'::jsonb),
      'analysis', case when pg.analysed then private.creative_mcp_analysis(pg.id) end
    ) as item
    from page pg
    where pg.rank <= v_offset + v_limit
  )
  select jsonb_build_object(
    'posts', coalesce((select jsonb_agg(item order by rank) from items), '[]'::jsonb),
    -- More results exist; past the offset cap (500) there is no next page to ask for, so
    -- next_offset is null while has_more stays true and the MCP says the search stopped there
    'has_more', (select count(*) > v_limit from page),
    'next_offset', case when (select count(*) > v_limit from page) and v_offset + v_limit <= 500 then v_offset + v_limit end,
    'sort', case when v_query is null and v_filters = '{}'::jsonb then 'newest' else 'relevance' end,
    'search_mode', 'keyword+taxonomy',
    'filters', v_filters,
    'catalog_marker', v_marker)
  into v_result;
  return v_result;
end;
$function$;
