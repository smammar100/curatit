-- The MCP names a post's industry from the first entry of its categories (lib/mcp/services/shared.ts
-- industryOf). Since posts can carry extra categories as tags (…_app_categories), that list must
-- start with the brand's main category, not the alphabetically first: Nike's posts are Sports
-- first, then Shopping. These are the live definitions with only that ordering changed. The
-- category filter also takes the original seven slugs and names again, mapped to their new
-- categories, so clients and saved prompts that send "fintech" keep working.

CREATE OR REPLACE FUNCTION public.curatit_mcp_get_post(p_id text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
 SET statement_timeout TO '5s'
AS $function$
 select jsonb_build_object('id',p.id,'short_code',p.short_code,'source_url',p.url,'format',p.format,
 'caption',left(p.caption,12000),'alt',left(p.alt,4000),'hashtags',p.hashtags[1:100],
 'owner_username',p.owner_username,'posted_at',p.posted_at,'updated_at',p.updated_at,
 'metrics',jsonb_build_object('likes',p.likes_count,'comments',p.comments_count,'video_views',p.video_view_count,'observed_at',null,'post_updated_at',p.updated_at),
 'brand',jsonb_build_object('name',b.name,'slug',b.slug),
 'categories',coalesce((select jsonb_agg(jsonb_build_object('name',c.name,'slug',c.slug) order by (c.id=b.category_id) desc,c.slug) from public.categories c where c.id=b.category_id or exists(select 1 from public.post_categories pc where pc.post_id=p.id and pc.category_id=c.id)),'[]'::jsonb),
 'images',coalesce((select jsonb_agg(to_jsonb(i) order by i.position) from (select position,bucket_id as bucket,path from public.post_images where post_id=p.id order by position limit 100) i),'[]'::jsonb),
 'analysis',(select jsonb_build_object('summary',left(a.summary,4000),'hook',left(a.hook,2000),'why_it_works',left(a.why_it_works,4000),'takeaways',a.takeaways[1:20],'published_at',a.published_at) from public.post_analyses a where a.post_id=p.id and a.published_at is not null))
 from public.instagram_posts p left join public.brands b on b.id=p.brand_id where p.is_published and p.id=p_id
$function$;

CREATE OR REPLACE FUNCTION public.curatit_mcp_search(p_query text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_brand text DEFAULT NULL::text, p_format text DEFAULT NULL::text, p_hashtag text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_after_time timestamp with time zone DEFAULT NULL::timestamp with time zone, p_after_id text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_exclude_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
 SET statement_timeout TO '5s'
AS $function$
declare result jsonb;
begin
 if p_limit is null or p_limit < 1 or p_limit > 50 then raise exception 'limit must be 1..50' using errcode='22023'; end if;
 if length(p_query)>300 or length(p_category)>100 or length(p_brand)>100 or length(p_hashtag)>100 then raise exception 'filter too long' using errcode='22023'; end if;
 if p_format is not null and p_format not in ('static','carousel','video') then raise exception 'invalid format' using errcode='22023'; end if;
 if (p_after_time is null) <> (p_after_id is null) then raise exception 'incomplete cursor' using errcode='22023'; end if;
 if p_from > p_to then raise exception 'invalid date range' using errcode='22023'; end if;
 with page as materialized (
 select p.id,p.short_code,p.url,p.format,left(p.caption,800) as caption,left(p.alt,800) as alt,
 p.owner_username,p.posted_at,p.updated_at,p.likes_count,p.comments_count,p.hashtags[1:30] as hashtags,
 b.name as brand_name,b.slug as brand_slug,b.category_id,
 (select jsonb_build_object('bucket',i.bucket_id,'path',i.path,'position',i.position) from public.post_images i where i.post_id=p.id order by i.position limit 1) as cover
 from public.instagram_posts p left join public.brands b on b.id=p.brand_id
 where p.is_published
 and (nullif(btrim(p_query),'') is null or p.mcp_search @@ websearch_to_tsquery('simple'::regconfig,p_query))
 and (p_brand is null or b.slug=p_brand)
 and (p_category is null or exists(select 1 from public.categories c where c.slug=p_category and (c.id=b.category_id or exists(select 1 from public.post_categories pc where pc.post_id=p.id and pc.category_id=c.id))))
 and (p_format is null or p.format=p_format)
 and (p_hashtag is null or p.hashtags @> array[p_hashtag])
 and (p_from is null or p.posted_at>=p_from) and (p_to is null or p.posted_at<=p_to)
 and (p_after_time is null or (p.posted_at,p.id)<(p_after_time,p_after_id))
 and (p_exclude_id is null or p.id<>p_exclude_id)
 order by p.posted_at desc,p.id desc limit p_limit+1
 ), items as (
 select (to_jsonb(p)-'category_id') || jsonb_build_object('categories',coalesce((select jsonb_agg(jsonb_build_object('name',c.name,'slug',c.slug) order by (c.id=p.category_id) desc,c.slug) from public.categories c where c.id=p.category_id or exists(select 1 from public.post_categories pc where pc.post_id=p.id and pc.category_id=c.id)),'[]'::jsonb)) as item,p.posted_at,p.id from page p order by p.posted_at desc,p.id desc limit p_limit
 ) select jsonb_build_object('posts',coalesce((select jsonb_agg(item order by posted_at desc,id desc) from items),'[]'::jsonb),'has_more',(select count(*)>p_limit from page),'next',(case when (select count(*)>p_limit from page) then (select jsonb_build_object('time',posted_at,'id',id) from items order by posted_at,id limit 1) else null end),'sort','newest','search_mode','keyword') into result;
 return result;
end $function$;

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
        select jsonb_agg(jsonb_build_object('name', c.name, 'slug', c.slug) order by (c.id = pg.category_id) desc, c.slug)
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
$function$;

CREATE OR REPLACE FUNCTION public.curatit_mcp_resolve_filter(p_kind text, p_value text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
 SET statement_timeout TO '5s'
AS $function$
declare v text; result text;
begin
 if p_kind is null or p_kind not in ('categories','brands') or p_value is null or char_length(p_value)>100 then raise exception 'invalid filter' using errcode='22023'; end if;
 v:=lower(btrim(p_value));
 if p_kind='categories' then
  select c.slug into result from public.categories c where lower(c.slug)=v or lower(c.name)=v order by (lower(c.slug)=v) desc,c.slug limit 1;
  -- The original seven categories (until 2026-10-13), by slug or name, for clients and saved
  -- prompts that still send them; each resolves only while its new category exists
  if result is null then
   select c.slug into result from public.categories c
   where c.slug = case v
     when 'fintech' then 'finance' when 'food-delivery' then 'food-drink'
     when 'sportswear' then 'sports' when 'technology' then 'ai' when 'travel' then 'travel-transportation'
     when 'ecommerce' then 'shopping' when 'e-commerce' then 'shopping' when 'fashion' then 'shopping' end;
  end if;
 else
  select b.slug into result from public.brands b where lower(b.slug)=v or lower(b.name)=v order by (lower(b.slug)=v) desc,b.slug limit 1;
 end if;
 return result;
end $function$;
