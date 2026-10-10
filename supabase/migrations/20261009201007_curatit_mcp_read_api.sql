-- Additive, read-only API for the existing Curatit schema. No RLS bypass.
set lock_timeout = '5s';
alter table public.instagram_posts add column if not exists mcp_search tsvector
 generated always as (to_tsvector('simple'::regconfig, coalesce(caption,'') || ' ' || coalesce(alt,'') || ' ' || owner_username)) stored;
create index if not exists instagram_posts_mcp_search_idx on public.instagram_posts using gin(mcp_search) where is_published;
create index if not exists instagram_posts_mcp_page_idx on public.instagram_posts(posted_at desc,id desc) where is_published;
create index if not exists instagram_posts_mcp_brand_page_idx on public.instagram_posts(brand_id,posted_at desc,id desc) where is_published;
create index if not exists instagram_posts_mcp_format_page_idx on public.instagram_posts(format,posted_at desc,id desc) where is_published;

create or replace function public.curatit_mcp_search(
 p_query text default null, p_category text default null, p_brand text default null,
 p_format text default null, p_hashtag text default null, p_from timestamptz default null,
 p_to timestamptz default null, p_after_time timestamptz default null, p_after_id text default null,
 p_limit integer default 20, p_exclude_id text default null
) returns jsonb language plpgsql stable security invoker set search_path = '' set statement_timeout='5s' as $$
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
 select (to_jsonb(p)-'category_id') || jsonb_build_object('categories',coalesce((select jsonb_agg(jsonb_build_object('name',c.name,'slug',c.slug) order by c.slug) from public.categories c where c.id=p.category_id or exists(select 1 from public.post_categories pc where pc.post_id=p.id and pc.category_id=c.id)),'[]'::jsonb)) as item,p.posted_at,p.id from page p order by p.posted_at desc,p.id desc limit p_limit
 ) select jsonb_build_object('posts',coalesce((select jsonb_agg(item order by posted_at desc,id desc) from items),'[]'::jsonb),'has_more',(select count(*)>p_limit from page),'next',(case when (select count(*)>p_limit from page) then (select jsonb_build_object('time',posted_at,'id',id) from items order by posted_at,id limit 1) else null end),'sort','newest','search_mode','keyword') into result;
 return result;
end $$;

create or replace function public.curatit_mcp_get_post(p_id text) returns jsonb
language sql stable security invoker set search_path='' set statement_timeout='5s' as $$
 select jsonb_build_object('id',p.id,'short_code',p.short_code,'source_url',p.url,'format',p.format,
 'caption',left(p.caption,12000),'alt',left(p.alt,4000),'hashtags',p.hashtags[1:100],
 'owner_username',p.owner_username,'posted_at',p.posted_at,'updated_at',p.updated_at,
 'metrics',jsonb_build_object('likes',p.likes_count,'comments',p.comments_count,'video_views',p.video_view_count,'observed_at',p.updated_at),
 'brand',jsonb_build_object('name',b.name,'slug',b.slug),
 'categories',coalesce((select jsonb_agg(jsonb_build_object('name',c.name,'slug',c.slug) order by c.slug) from public.categories c where c.id=b.category_id or exists(select 1 from public.post_categories pc where pc.post_id=p.id and pc.category_id=c.id)),'[]'::jsonb),
 'images',coalesce((select jsonb_agg(to_jsonb(i) order by i.position) from (select position,bucket_id as bucket,path from public.post_images where post_id=p.id order by position limit 100) i),'[]'::jsonb),
 'analysis',(select jsonb_build_object('summary',left(a.summary,4000),'hook',left(a.hook,2000),'why_it_works',left(a.why_it_works,4000),'takeaways',a.takeaways[1:20],'published_at',a.published_at) from public.post_analyses a where a.post_id=p.id and a.published_at is not null))
 from public.instagram_posts p left join public.brands b on b.id=p.brand_id where p.is_published and p.id=p_id
$$;

create or replace function public.curatit_mcp_taxonomy(p_kind text default 'categories',p_after text default '',p_limit integer default 50)
returns jsonb language plpgsql stable security invoker set search_path='' set statement_timeout='5s' as $$
declare result jsonb;
begin
 if p_limit is null or p_limit<1 or p_limit>100 or p_kind is null or p_kind not in ('categories','brands') then raise exception 'invalid taxonomy parameters' using errcode='22023'; end if;
 if p_kind='categories' then
  with page as materialized (select c.name,c.slug,left(c.description,1000) description from public.categories c where c.slug>coalesce(p_after,'') and (exists(select 1 from public.instagram_posts p join public.brands b on p.brand_id=b.id where p.is_published and b.category_id=c.id) or exists(select 1 from public.post_categories pc join public.instagram_posts p on p.id=pc.post_id where pc.category_id=c.id and p.is_published)) order by c.slug limit p_limit+1), items as(select * from page order by slug limit p_limit)
  select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(i) order by slug) from items i),'[]'::jsonb),'next',case when (select count(*) from page)>p_limit then (select max(slug) from items) else null end) into result;
 else
  with page as materialized (select b.name,b.slug,c.slug category from public.brands b left join public.categories c on c.id=b.category_id where b.slug>coalesce(p_after,'') and exists(select 1 from public.instagram_posts p where p.brand_id=b.id and p.is_published) order by b.slug limit p_limit+1),items as(select * from page order by slug limit p_limit)
  select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(i) order by slug) from items i),'[]'::jsonb),'next',case when (select count(*) from page)>p_limit then (select max(slug) from items) else null end) into result;
 end if;
 return result;
end $$;

revoke all on function public.curatit_mcp_search(text,text,text,text,text,timestamptz,timestamptz,timestamptz,text,integer,text) from public;
revoke all on function public.curatit_mcp_get_post(text) from public;
revoke all on function public.curatit_mcp_taxonomy(text,text,integer) from public;
grant execute on function public.curatit_mcp_search(text,text,text,text,text,timestamptz,timestamptz,timestamptz,text,integer,text) to anon,authenticated;
grant execute on function public.curatit_mcp_get_post(text) to anon,authenticated;
grant execute on function public.curatit_mcp_taxonomy(text,text,integer) to anon,authenticated;
;
