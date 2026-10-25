-- Hybrid search for Curatit MCP (2026-10-25): keyword search plus search by meaning, with a
-- reranker deciding which meaning-only matches are good enough to show. Chosen from a judged test
-- (docs/search-eval/): on 60 requests and 828 blind-judged results it found about half again as
-- many relevant posts as keyword search alone, ranked them about 60% better, with the same share
-- of relevant results and nothing returned for topics the library doesn't cover.
--
-- The database holds what can be prepared ahead: each published post's short description (what
-- the reranker reads) and the embeddings of its chunks (gte-small, 384 dimensions), written by
-- `npm run search:index` with the secret key. curatit_mcp_search_v3 fuses the keyword matches
-- (ranked exactly as curatit_mcp_search_v2 ranks them, under exactly its filters) with the posts
-- closest in meaning to the request's embedding, and returns the candidates; the MCP server embeds
-- the request, reranks the candidates and keeps keyword matches plus meaning-only matches the
-- reranker scores 0.02 or more (src/lib/search/semantic/). A second call with the page's ids
-- returns those posts in curatit_mcp_search_v2's item shape. curatit_mcp_search_v2 is unchanged.

create extension if not exists vector with schema extensions;

-- One row per indexed published post. content_hash is the hash of the chunks' text, the
-- description and the model, so the index script re-embeds only what changed
create table public.post_search_documents (
  post_id text primary key references public.instagram_posts (id) on delete cascade,
  description text not null check (char_length(description) <= 2000),
  content_hash text not null,
  model text not null,
  indexed_at timestamptz not null default now()
);

-- A post's chunks (strategy and labels, caption, visuals and copy, decisions and narrative,
-- evidence), each embedded; a post scores by its closest chunk
create table public.post_search_chunks (
  post_id text not null references public.post_search_documents (post_id) on delete cascade,
  kind text not null check (kind in ('strategy', 'caption', 'visual', 'decisions', 'evidence')),
  embedding extensions.vector(384) not null,
  primary key (post_id, kind)
);

alter table public.post_search_documents enable row level security;
alter table public.post_search_chunks enable row level security;

-- Readable for published posts only, like the posts themselves; written only with the secret key
create policy "Search documents of published posts are public" on public.post_search_documents
  for select to anon, authenticated
  using (exists (select 1 from public.instagram_posts p where p.id = post_id and p.is_published));
create policy "Search chunks of published posts are public" on public.post_search_chunks
  for select to anon, authenticated
  using (exists (select 1 from public.instagram_posts p where p.id = post_id and p.is_published));

grant select on public.post_search_documents, public.post_search_chunks to anon, authenticated;
grant select, insert, update, delete on public.post_search_documents, public.post_search_chunks to service_role;

-- What the index script builds descriptions and chunks from: every published post with the
-- text search reads about it (private.creative_search_part, only what describes the post), its
-- labels with their names, and its industries. service_role only
create or replace function public.curatit_search_index_source()
returns jsonb
language sql
stable
set search_path to ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'brand', b.name,
    'format', p.format,
    'caption', left(p.caption, 1500),
    'categories', coalesce((select jsonb_agg(c.name order by (c.id = b.category_id) desc, c.name)
      from public.categories c
      where c.id = b.category_id or exists (select 1 from public.post_categories pc where pc.post_id = p.id and pc.category_id = c.id)), '[]'::jsonb),
    'summary', a.summary,
    'strategy', private.creative_search_part(a.creative_dna, 'strategy'),
    'decisions', private.creative_search_part(a.creative_dna, 'creative decisions'),
    'visual', private.creative_search_part(a.creative_dna, 'visual notes'),
    'copy', private.creative_search_part(a.creative_dna, 'copy'),
    'narrative', private.creative_search_part(a.creative_dna, 'narrative'),
    'evidence', private.creative_search_part(a.creative_dna, 'evidence'),
    'labels', coalesce((select jsonb_object_agg(x.dimension, x.labels) from (
      select l.dimension, jsonb_agg(t.label order by l.weight desc, l.slug) as labels
      from public.post_creative_labels l
      join public.creative_taxonomy_terms t on t.dimension = l.dimension and t.slug = l.slug
      where l.post_id = p.id and l.version_id = a.current_version_id
      group by l.dimension) x), '{}'::jsonb)
  ) order by p.id), '[]'::jsonb)
  from public.instagram_posts p
  join public.brands b on b.id = p.brand_id
  left join public.post_analyses a on a.post_id = p.id and a.published_at is not null and a.review_status = 'approved'
  where p.is_published;
$function$;

revoke all on function public.curatit_search_index_source() from public, anon, authenticated;
grant execute on function public.curatit_search_index_source() to service_role;

-- Without p_ids: the candidates. Keyword matches are ranked as curatit_mcp_search_v2 ranks them;
-- the top 20 are fused with the 30 posts closest in meaning to p_embedding (within the same
-- filters) by reciprocal rank (k = 60), and the best 30 come back with their keyword rank, their
-- similarity, the chunk that matched and their description; keyword_rest lists the other keyword
-- matches in order, up to 50 keyword matches in all. With p_ids (at most 50): those posts, in that
-- order, in curatit_mcp_search_v2's item shape, with the reasons the request explains.
create or replace function public.curatit_mcp_search_v3(p_request jsonb default '{}'::jsonb, p_embedding extensions.vector default null, p_ids text[] default null)
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

revoke all on function public.curatit_mcp_search_v3(jsonb, extensions.vector, text[]) from public;
grant execute on function public.curatit_mcp_search_v3(jsonb, extensions.vector, text[]) to anon, authenticated, service_role;
