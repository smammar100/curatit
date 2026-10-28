-- Checks 20261028155252_hybrid_search_post_ids.sql inside a transaction that always rolls back: the
-- migration's function is repeated here, so this runs before and after it's applied. Run:
--   npx supabase db query --linked -f supabase/tests/hybrid_search_post_ids.sql
-- Every check runs as anon. Without "post_ids" a request answers exactly as before; with them every
-- candidate is one of those posts, and posts the whole library's top 30 by meaning leaves out are
-- found. (Only the last statement's result is printed, so the checks are one query.)
begin;
set local statement_timeout = '120s';

-- Refusals, as an SQL state (null when the request is answered)
create function pg_temp.refused(r jsonb) returns text language plpgsql as $$
begin
  perform public.curatit_mcp_search_v3(r, (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1));
  return null;
exception when others then
  return sqlstate;
end $$;

-- Before: today's function's answers, kept in a setting (anon can't read a temp table made here)
set local role anon;
select set_config('test.before', jsonb_build_array(public.curatit_mcp_search_v3('{"query":"funny"}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)),
    public.curatit_mcp_search_v3('{"query":"app","category":"finance"}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)),
    public.curatit_mcp_search_v3('{"tone":["playful"]}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)),
    public.curatit_mcp_search_v3('{"query":"scuba diving equipment"}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)))::text, true);
reset role;

CREATE OR REPLACE FUNCTION public.curatit_mcp_search_v3(p_request jsonb DEFAULT '{}'::jsonb, p_embedding extensions.vector DEFAULT NULL::extensions.vector, p_ids text[] DEFAULT NULL::text[])
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
  v_allowed constant text[] := v_dimensions || array['query', 'category', 'brand', 'format', 'analysed_only', 'limit', 'offset', 'fields', 'post_ids'];
  v_key text;
  v_dimension text;
  v_filters jsonb := '{}'::jsonb;
  v_query text;
  v_english tsquery;
  v_simple tsquery;
  v_analysed_matches text[] := '{}';
  v_marker text;
  v_result jsonb;
  v_fields text := p_request ->> 'fields';
  v_post_ids text[];
begin
  if jsonb_typeof(r) <> 'object' then
    raise exception 'The request must be a JSON object' using errcode = '22023';
  end if;
  for v_key in select jsonb_object_keys(r) loop
    if not v_key = any (v_allowed) then
      raise exception 'Unknown search field "%"', left(v_key, 40) using errcode = '22023';
    end if;
  end loop;
  -- 'card': each post's analysis as its labels only (search results show nothing else of it)
  if v_fields is not null and v_fields <> 'card' then
    raise exception 'fields must be card' using errcode = '22023';
  end if;
  if p_ids is not null and cardinality(p_ids) > 50 then
    raise exception 'At most 50 posts at a time' using errcode = '22023';
  end if;
  -- Only these posts (a person's saved posts, sent by the dashboard), as in curatit_mcp_search_v2:
  -- the scope applies before the keyword and meaning candidates are cut, so the best matches among
  -- them are found, not just those that make the whole library's top 20 and top 30
  if r ? 'post_ids' and jsonb_typeof(r -> 'post_ids') <> 'null' then
    if jsonb_typeof(r -> 'post_ids') <> 'array' then
      raise exception 'post_ids must be a list of post ids' using errcode = '22023';
    end if;
    if jsonb_array_length(r -> 'post_ids') > 2000 then
      raise exception 'post_ids takes at most 2000 post ids' using errcode = '22023';
    end if;
    select coalesce(array_agg(e), '{}') into v_post_ids from jsonb_array_elements_text(r -> 'post_ids') e;
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
        and (v_post_ids is null or p.id = any (v_post_ids))
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
        'analysis', case when pg.analysed then case v_fields when 'card' then private.creative_mcp_card(pg.id) else private.creative_mcp_analysis(pg.id) end end
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

set local role anon;
with far as (
  -- The 31st to 45th posts closest in meaning to the embedding: outside what the whole library's
  -- search takes by meaning (its 30 closest)
  select jsonb_agg(id order by n) as ids from (
    select c.post_id as id, row_number() over (order by max(1 - (c.embedding operator(extensions.<=>) (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1))) desc, c.post_id) as n
    from public.post_search_chunks c group by c.post_id) ranked
  where n between 31 and 45
), scoped as (
  select f.ids,
    public.curatit_mcp_search_v3(jsonb_build_object('query', 'scuba diving equipment', 'post_ids', f.ids), (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)) as by_meaning,
    public.curatit_mcp_search_v3(jsonb_build_object('query', 'app', 'post_ids', f.ids), (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)) as by_words
  from far f
), checks(name, ok, detail) as (
  select 'without post_ids: every answer is the same as before', jsonb_build_array(public.curatit_mcp_search_v3('{"query":"funny"}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)),
    public.curatit_mcp_search_v3('{"query":"app","category":"finance"}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)),
    public.curatit_mcp_search_v3('{"tone":["playful"]}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)),
    public.curatit_mcp_search_v3('{"query":"scuba diving equipment"}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1))) = current_setting('test.before')::jsonb, null
  union all
  select 'post_ids: posts past the library''s 30 closest by meaning are found, and only they',
    (select jsonb_agg(x -> 'id' order by x ->> 'id') from jsonb_array_elements(s.by_meaning -> 'fused') x)
      = (select jsonb_agg(i order by i #>> '{}') from jsonb_array_elements(s.ids) i),
    jsonb_array_length(s.by_meaning -> 'fused') || ' of ' || jsonb_array_length(s.ids)
  from scoped s
  union all
  select 'post_ids: every candidate, by words or meaning, is one of the posts',
    not exists (select 1 from jsonb_array_elements(s.by_words -> 'fused') x where not s.ids @> jsonb_build_array(x -> 'id'))
      and not exists (select 1 from jsonb_array_elements(s.by_words -> 'keyword_rest') x where not s.ids @> jsonb_build_array(x)),
    (s.by_words ->> 'keyword_total') || ' keyword matches'
  from scoped s
  union all
  select 'post_ids: an empty scope finds nothing',
    jsonb_array_length(public.curatit_mcp_search_v3('{"query":"app","post_ids":[]}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)) -> 'fused') = 0, null
  union all
  select 'post_ids: ids that aren''t published posts find nothing',
    jsonb_array_length(public.curatit_mcp_search_v3('{"query":"app","post_ids":["not-a-post"]}', (select c.embedding from public.post_search_chunks c order by c.post_id, c.kind limit 1)) -> 'fused') = 0, null
  union all
  select 'post_ids: a value that isn''t a list is refused', pg_temp.refused('{"query":"app","post_ids":"p1"}') = '22023', null
  union all
  select 'post_ids: more than 2000 are refused',
    pg_temp.refused(jsonb_build_object('query', 'app', 'post_ids', (select jsonb_agg(g::text) from generate_series(1, 2001) g))) = '22023', null
)
select * from checks;

rollback;
