-- Takes back 20261026070552_search_projections.sql: the two search functions as they were live on
-- 26 October 2026 (pg_get_functiondef, before the migration), and the card helper dropped. Run only
-- after an app that sends "fields" or "post_ids" is gone, or that app falls back on its own (it does:
-- it asks the old way when the database refuses the field). Not a migration: apply by hand with
--   npx supabase db query --linked -f supabase/rollbacks/20261026070552_search_projections.sql
begin;

CREATE OR REPLACE FUNCTION public.curatit_mcp_search_v2(p_request jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
 SET statement_timeout TO '5s'
AS $function$
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

CREATE OR REPLACE FUNCTION public.curatit_mcp_search_v3(p_request jsonb DEFAULT '{}'::jsonb, p_embedding vector DEFAULT NULL::vector, p_ids text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
 SET statement_timeout TO '5s'
AS $function$
declare
  r jsonb := coalesce(p_request, '{}'::jsonb);
  v_dimensions constant text[] := array['archetype', 'archetype_family', 'objective', 'hook_technique',
    'narrative_pattern', 'typography', 'layout', 'imagery', 'palette', 'visual_device', 'tone', 'persuasion', 'cta'];
  v_allowed constant text[] := v_dimensions || array['query', 'category', 'brand', 'format', 'analysed_only', 'limit', 'offset'];
  v_key text;
  v_dimension text;
  v_filters jsonb := '{}'::jsonb;
  v_query text;
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
  if p_ids is not null and cardinality(p_ids) > 50 then
    raise exception 'At most 50 posts at a time' using errcode = '22023';
  end if;
  if p_embedding is not null and extensions.vector_dims(p_embedding) <> 384 then
    raise exception 'The embedding must have 384 dimensions' using errcode = '22023';
  end if;

  v_query := nullif(btrim(r ->> 'query'), '');
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
    select coalesce(array_agg(a.post_id), '{}') into v_analysed_matches
    from public.post_analyses a
    where a.published_at is not null and a.review_status = 'approved' and a.creative_search @@ v_english;
  end if;

  select left(md5(concat_ws('|', count(*), max(p.updated_at),
      (select max(greatest(a.published_at, a.updated_at)) from public.post_analyses a where a.published_at is not null))), 16)
  into v_marker
  from public.instagram_posts p
  where p.is_published;

  if p_ids is null then
    with base as materialized (
      select p.id, p.posted_at, coalesce(p.mcp_search, ''::tsvector) as mcp_search,
        a.current_version_id, p.id = any (v_analysed_matches) as analysis_match, n.names
      from public.instagram_posts p
      left join public.brands b on b.id = p.brand_id
      left join public.post_analyses a on a.post_id = p.id and a.published_at is not null and a.review_status = 'approved'
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
        and (coalesce((r ->> 'analysed_only')::boolean, false) = false or a.post_id is not null)
        and not exists (
          select 1 from jsonb_each(v_filters) f(dimension, slugs)
          where not exists (
            select 1 from public.post_creative_labels l
            where l.post_id = p.id and l.version_id = a.current_version_id and l.dimension = f.dimension
              and l.slug in (select jsonb_array_elements_text(f.slugs))))
    ), keyword as materialized (
      select k.id, row_number() over (order by k.score desc, k.posted_at desc, k.id desc) as rank
      from (
        select b.id, b.posted_at,
          case when b.analysis_match then coalesce((
            select ts_rank(a.creative_search, v_english) from public.post_analyses a where a.post_id = b.id), 0) * 2 else 0 end
          + case when v_query is null then 0 else coalesce(ts_rank(b.mcp_search || b.names, v_simple), 0) end
          + coalesce((
            select sum(l.weight) from public.post_creative_labels l
            join jsonb_each(v_filters) f(dimension, slugs) on f.dimension = l.dimension
            where l.post_id = b.id and l.version_id = b.current_version_id
              and l.slug in (select jsonb_array_elements_text(f.slugs))), 0) * 0.1 as score
        from base b
        where v_query is null or b.analysis_match or (b.mcp_search || b.names) @@ v_simple
      ) k
    ), semantic as materialized (
      select c.post_id as id,
        max(1 - (c.embedding operator(extensions.<=>) p_embedding)) as similarity,
        (array_agg(c.kind order by c.embedding operator(extensions.<=>) p_embedding))[1] as kind
      from public.post_search_chunks c
      where p_embedding is not null and c.post_id in (select b.id from base b)
      group by c.post_id
      order by 2 desc, 1
      limit 30
    ), semantic_ranked as (
      select s.id, s.similarity, s.kind, row_number() over (order by s.similarity desc, s.id) as rank from semantic s
    ), pool as (
      select k.id from keyword k where k.rank <= 20
      union
      select s.id from semantic_ranked s
    ), fused as materialized (
      select pl.id, k.rank as keyword_rank, s.similarity, s.kind,
        (case when k.rank <= 20 then 1.0 / (60 + k.rank) else 0 end) + coalesce(1.0 / (60 + s.rank), 0) as rrf
      from pool pl
      left join keyword k on k.id = pl.id
      left join semantic_ranked s on s.id = pl.id
      order by rrf desc, k.rank nulls last, pl.id
      limit 30
    )
    select jsonb_build_object(
      'fused', coalesce((
        select jsonb_agg(jsonb_build_object('id', f.id, 'keyword_rank', f.keyword_rank, 'similarity', round(f.similarity::numeric, 4),
            'kind', f.kind, 'description', d.description)
          order by f.rrf desc, f.keyword_rank nulls last, f.id)
        from fused f left join public.post_search_documents d on d.post_id = f.id), '[]'::jsonb),
      'keyword_rest', coalesce((
        select jsonb_agg(k.id order by k.rank) from keyword k where k.rank <= 50 and not exists (select 1 from fused f where f.id = k.id)), '[]'::jsonb),
      'keyword_total', (select count(*) from keyword),
      'filters', v_filters,
      'catalog_marker', v_marker)
    into v_result;
  else
    with chosen as materialized (
      select p.id, p.short_code, p.url, p.format, p.caption, p.posted_at, coalesce(p.mcp_search, ''::tsvector) as mcp_search,
        b.name as brand_name, b.slug as brand_slug, b.category_id,
        a.current_version_id, a.post_id is not null as analysed,
        p.id = any (v_analysed_matches) as analysis_match, n.names,
        array_position(p_ids, p.id) as position
      from public.instagram_posts p
      left join public.brands b on b.id = p.brand_id
      left join public.post_analyses a on a.post_id = p.id and a.published_at is not null and a.review_status = 'approved'
      cross join lateral (
        select case when v_query is null then null else to_tsvector('simple'::regconfig, concat_ws(' ', b.name, (
          select string_agg(c.name, ' ')
          from public.categories c
          where c.id = b.category_id or exists (select 1 from public.post_categories pc where pc.post_id = p.id and pc.category_id = c.id))))
        end as names
      ) n
      where p.is_published and p.id = any (p_ids)
    ), scored as (
      select c.*,
        case when c.analysis_match then coalesce((
          select ts_rank(a.creative_search, v_english) from public.post_analyses a where a.post_id = c.id), 0) * 2 else 0 end
        + case when v_query is null then 0 else coalesce(ts_rank(c.mcp_search || c.names, v_simple), 0) end
        + coalesce((
          select sum(l.weight) from public.post_creative_labels l
          join jsonb_each(v_filters) f(dimension, slugs) on f.dimension = l.dimension
          where l.post_id = c.id and l.version_id = c.current_version_id
            and l.slug in (select jsonb_array_elements_text(f.slugs))), 0) * 0.1 as score
      from chosen c
    ), items as (
      select pg.position, jsonb_build_object(
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
      from scored pg
    )
    select jsonb_build_object(
      'posts', coalesce((select jsonb_agg(i.item order by i.position) from items i), '[]'::jsonb),
      'catalog_marker', v_marker)
    into v_result;
  end if;
  return v_result;
end;
$function$;

drop function if exists private.creative_mcp_card(text);

commit;
