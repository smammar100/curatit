-- Creative Intelligence in the MCP read API, additively. curatit_mcp_search, curatit_mcp_get_post
-- and the rest are untouched; these are new, versioned functions with one JSON request each, so
-- PostgREST never sees an ambiguous overload. Like the existing ones they're security invoker and
-- read only what RLS lets anon see: published posts, and the approved, published analysis of each
-- (never a draft, a proposal, a run or a reviewer).
--
--   curatit_mcp_search_v2(p_request jsonb)   keyword + exact taxonomy filters, ranked, with reasons
--   curatit_mcp_get_post_v2(p_id text)       curatit_mcp_get_post plus the post's Creative DNA
--   curatit_mcp_creative_terms(p_dimension)  the filterable vocabulary, with published post counts
--
-- v1 search is keyword over captions. v2 adds weighted full-text over the published analysis
-- (creative_search below) and exact filters through post_creative_labels. Hybrid semantic search
-- (pgvector) can be layered on later, once a held-out set of designer queries shows it beats this.
--
-- Rollback: drop function public.curatit_mcp_search_v2(jsonb), public.curatit_mcp_get_post_v2(text),
--   public.curatit_mcp_creative_terms(text), private.creative_mcp_analysis(text, boolean),
--   private.creative_resolve_terms(text, jsonb), private.creative_norm(text);
--   drop index public.post_analyses_creative_search_idx;
--   alter table public.post_analyses drop column creative_search;

set lock_timeout = '5s';

-- The analysis as searchable text: the summary first, then every string in the Creative DNA
alter table public.post_analyses add column creative_search tsvector generated always as (
  setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'A')
  || setweight(to_tsvector('english'::regconfig, coalesce(creative_dna, '{}'::jsonb)), 'B')
) stored;

create index post_analyses_creative_search_idx on public.post_analyses using gin (creative_search)
  where published_at is not null;

-- "User generated", "user-generated" and "USER_GENERATED" are the same term
create function private.creative_norm(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

-- A filter's values (slugs, labels or synonyms, one or a list) as current slugs of the dimension
create function private.creative_resolve_terms(p_dimension text, p_values jsonb)
returns text[]
language plpgsql
stable
set search_path = ''
as $$
declare
  v_value text;
  v_slug text;
  v_slugs text[] := '{}';
begin
  if p_values is null or jsonb_typeof(p_values) = 'null' then
    return null;
  end if;
  if jsonb_typeof(p_values) = 'string' then
    p_values := jsonb_build_array(p_values);
  end if;
  if jsonb_typeof(p_values) <> 'array' or jsonb_array_length(p_values) not between 1 and 10 then
    raise exception '% must be a term or a list of 1 to 10 terms', p_dimension using errcode = '22023';
  end if;
  for v_value in select jsonb_array_elements_text(p_values) loop
    select t.slug into v_slug
    from public.creative_taxonomy_terms t
    where t.dimension = p_dimension and t.retired_at is null
      and (private.creative_norm(t.slug) = private.creative_norm(v_value)
        or private.creative_norm(t.label) = private.creative_norm(v_value)
        or exists (select 1 from unnest(t.synonyms) s where private.creative_norm(s) = private.creative_norm(v_value)))
    order by private.creative_norm(t.slug) = private.creative_norm(v_value) desc, t.slug
    limit 1;
    if v_slug is null then
      raise exception 'Unknown % "%"; curatit_mcp_creative_terms lists them', p_dimension, left(v_value, 60) using errcode = '22023';
    end if;
    v_slugs := v_slugs || v_slug;
  end loop;
  return v_slugs;
end;
$$;

-- A post's published analysis for the MCP, or null. p_detail adds the narrative slide by slide.
-- Long text is clipped; there is no confidence score, since none has been measured.
create function private.creative_mcp_analysis(p_post_id text, p_detail boolean default false)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'verified_status', 'approved',
    'analysis_version', a.current_version_id,
    'analysis_source', a.analysis_source,
    'taxonomy_version', a.taxonomy_version,
    'published_at', a.published_at,
    'image_analysis_complete', a.image_analysis_complete,
    'slides_analysed', a.processed_slides,
    'slides_total', a.expected_slides,
    'primary_type', a.creative_dna #>> '{primary_archetype,slug}',
    'secondary_types', coalesce((select jsonb_agg(e ->> 'slug') from jsonb_array_elements(a.creative_dna -> 'secondary_archetypes') e), '[]'),
    'objective', a.creative_dna #>> '{marketing_objective,slug}',
    'visual_styles', coalesce(a.creative_dna #> '{visual_system,imagery}', '[]'),
    'typography_categories', coalesce(a.creative_dna #> '{visual_system,typography}', '[]'),
    'layout_tags', coalesce(a.creative_dna #> '{visual_system,composition}', '[]'),
    'palette', coalesce(a.creative_dna #> '{visual_system,palette}', '[]'),
    'narrative_pattern', a.creative_dna #>> '{narrative,pattern}',
    'hook_technique', a.creative_dna #>> '{hook,technique}',
    'concept', left(a.creative_dna ->> 'concept', 200),
    'creative_summary', left(a.summary, 800),
    'why_it_might_work', coalesce((
      select jsonb_agg(jsonb_build_object('hypothesis', left(e ->> 'hypothesis', 400), 'evidence', e -> 'evidence'))
      from jsonb_array_elements(a.creative_dna -> 'creative_rationale') e), '[]'),
    'takeaways', to_jsonb(a.takeaways[1:5]),
    'analysis_evidence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'ref', x.e ->> 'ref',
        'observation', left(x.e ->> 'observation', 300),
        'quote', left(x.e ->> 'quote', 160),
        'slide', (select jsonb_build_object('position', i.position, 'bucket', i.bucket_id, 'path', i.path)
          from public.post_images i where i.post_id = a.post_id and 'slide:' || i.position = x.e ->> 'ref')))
      from (select e from jsonb_array_elements(a.creative_dna -> 'evidence') e limit 8) x), '[]'),
    'note', 'AI-assisted analysis, reviewed and approved by a Curatit editor. Rationale is hypothesis, not measured performance.'
  ) || case when p_detail then jsonb_build_object(
    'hook', jsonb_build_object(
      'technique', a.creative_dna #>> '{hook,technique}',
      'observed_text', left(a.creative_dna #>> '{hook,observed_text}', 240),
      'location', a.creative_dna #>> '{hook,location}'),
    'narrative', jsonb_build_object(
      'pattern', a.creative_dna #>> '{narrative,pattern}',
      'arc', left(a.creative_dna #>> '{narrative,arc}', 400),
      'slides', coalesce((
        select jsonb_agg(jsonb_build_object(
          'position', s.position, 'role', s.role, 'headline', left(s.headline, 200),
          'observation', left(s.observation ->> 'observation', 300),
          'typography', s.typography, 'layout', s.layout, 'imagery', s.imagery, 'palette', s.palette,
          'devices', s.devices, 'image', jsonb_build_object('bucket', i.bucket_id, 'path', i.path)) order by s.position)
        from public.post_slide_analyses s
        join public.post_images i on i.post_id = s.post_id and i.position = s.position
        where s.version_id = a.current_version_id), '[]')),
    'copy_strategy', a.creative_dna -> 'copy_strategy',
    'attention_mechanisms', coalesce(a.creative_dna -> 'attention_mechanisms', '[]'),
    'adaptation_ideas', coalesce(a.creative_dna -> 'adaptation_ideas', '[]'),
    'constraints_or_uncertainties', coalesce(a.creative_dna -> 'constraints_or_uncertainties', '[]')
  ) else '{}'::jsonb end
  from public.post_analyses a
  join public.instagram_posts p on p.id = a.post_id and p.is_published
  where a.post_id = p_post_id and a.published_at is not null and a.review_status = 'approved';
$$;

-- Search: { query, category, brand, format, analysed_only, limit (1..50), offset (0..500), and any of
-- archetype, archetype_family, objective, hook_technique, narrative_pattern, typography, layout,
-- imagery, palette, visual_device, tone, persuasion, cta (a term or a list) }. Terms within a
-- dimension are alternatives; dimensions all have to match. Ranked by text match (analysis over
-- caption) plus the weight of matched labels, newest first among equals; each result says why it
-- matched, and visual matches cite the slides they were seen on.
create function public.curatit_mcp_search_v2(p_request jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
set statement_timeout = '5s'
as $$
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
  end if;

  with candidates as materialized (
    select p.id, p.short_code, p.url, p.format, p.caption, p.posted_at, p.mcp_search,
      b.name as brand_name, b.slug as brand_slug, b.category_id,
      a.current_version_id, a.creative_search, a.published_at is not null as analysed
    from public.instagram_posts p
    left join public.brands b on b.id = p.brand_id
    left join public.post_analyses a on a.post_id = p.id and a.published_at is not null and a.review_status = 'approved'
    where p.is_published
      and (r ->> 'brand' is null or b.slug = r ->> 'brand')
      and (r ->> 'format' is null or p.format = r ->> 'format')
      and (r ->> 'category' is null or exists (
        select 1 from public.categories c
        where c.slug = r ->> 'category'
          and (c.id = b.category_id or exists (
            select 1 from public.post_categories pc where pc.post_id = p.id and pc.category_id = c.id))))
      and (coalesce((r ->> 'analysed_only')::boolean, false) = false or a.published_at is not null)
      and not exists (
        select 1 from jsonb_each(v_filters) f(dimension, slugs)
        where not exists (
          select 1 from public.post_creative_labels l
          where l.post_id = p.id and l.version_id = a.current_version_id and l.dimension = f.dimension
            and l.slug in (select jsonb_array_elements_text(f.slugs))))
  ), scored as (
    select c.*,
      case when v_query is null then 0 else coalesce(ts_rank(c.creative_search, v_english), 0) * 2 end as analysis_score,
      case when v_query is null then 0 else coalesce(ts_rank(c.mcp_search, v_simple), 0) end as caption_score,
      coalesce((
        select sum(l.weight) from public.post_creative_labels l
        join jsonb_each(v_filters) f(dimension, slugs) on f.dimension = l.dimension
        where l.post_id = c.id and l.version_id = c.current_version_id
          and l.slug in (select jsonb_array_elements_text(f.slugs))), 0) * 0.1 as label_score
    from candidates c
    where v_query is null or coalesce(c.creative_search @@ v_english, false) or c.mcp_search @@ v_simple
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
        select jsonb_agg(jsonb_build_object('name', c.name, 'slug', c.slug) order by c.slug)
        from public.categories c
        where c.id = pg.category_id or exists (select 1 from public.post_categories pc where pc.post_id = pg.id and pc.category_id = c.id)), '[]'),
      'cover', (select jsonb_build_object('bucket', i.bucket_id, 'path', i.path, 'position', i.position)
        from public.post_images i where i.post_id = pg.id order by i.position limit 1),
      'score', round(pg.score::numeric, 4),
      'reasons', to_jsonb(array_remove(array[
          case when pg.analysis_score > 0 then 'The query matches the published analysis' end,
          case when pg.caption_score > 0 then 'The query matches the caption' end], null))
        || coalesce((
          select jsonb_agg(x.reason order by x.dimension, x.reason)
          from (
            select l.dimension,
              replace(l.dimension, '_', ' ') || ': ' || t.label
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
    -- No next page past the offset cap (500), since the next call would be refused
    'has_more', (select count(*) > v_limit from page) and v_offset + v_limit <= 500,
    'next_offset', case when (select count(*) > v_limit from page) and v_offset + v_limit <= 500 then v_offset + v_limit end,
    'sort', case when v_query is null and v_filters = '{}'::jsonb then 'newest' else 'relevance' end,
    'search_mode', 'keyword+taxonomy',
    'filters', v_filters)
  into v_result;
  return v_result;
end;
$$;

create function public.curatit_mcp_get_post_v2(p_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
set statement_timeout = '5s'
as $$
  select public.curatit_mcp_get_post(p_id) || jsonb_build_object('creative', private.creative_mcp_analysis(p_id, true));
$$;

-- The vocabulary search_v2 filters on, by dimension, with how many published analyses use each term
create function public.curatit_mcp_creative_terms(p_dimension text default null)
returns jsonb
language sql
stable
security invoker
set search_path = ''
set statement_timeout = '5s'
as $$
  select jsonb_build_object(
    'taxonomy_version', (select max(taxonomy_version) from public.creative_taxonomy_terms where retired_at is null),
    'dimensions', coalesce(jsonb_object_agg(d.dimension, d.terms), '{}'::jsonb))
  from (
    select t.dimension, jsonb_agg(jsonb_build_object(
      'slug', t.slug, 'label', t.label, 'description', t.description, 'parent', t.parent_slug,
      'synonyms', to_jsonb(t.synonyms),
      'posts', (select count(*) from public.post_creative_labels l where l.dimension = t.dimension and l.slug = t.slug)
    ) order by t.slug) as terms
    from public.creative_taxonomy_terms t
    where t.retired_at is null
      and t.dimension in ('archetype', 'archetype_family', 'objective', 'hook_technique', 'narrative_pattern',
        'typography', 'layout', 'imagery', 'palette', 'visual_device', 'tone', 'persuasion', 'cta')
      and (p_dimension is null or t.dimension = p_dimension)
    group by t.dimension
  ) d;
$$;

revoke execute on function
  public.curatit_mcp_search_v2(jsonb),
  public.curatit_mcp_get_post_v2(text),
  public.curatit_mcp_creative_terms(text),
  private.creative_mcp_analysis(text, boolean),
  private.creative_resolve_terms(text, jsonb),
  private.creative_norm(text)
from public, anon, authenticated;

grant execute on function
  public.curatit_mcp_search_v2(jsonb),
  public.curatit_mcp_get_post_v2(text),
  public.curatit_mcp_creative_terms(text),
  private.creative_mcp_analysis(text, boolean),
  private.creative_resolve_terms(text, jsonb),
  private.creative_norm(text)
to anon, authenticated, service_role;
