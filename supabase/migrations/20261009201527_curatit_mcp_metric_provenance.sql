create or replace function public.curatit_mcp_get_post(p_id text) returns jsonb
language sql stable security invoker set search_path='' set statement_timeout='5s' as $$
 select jsonb_build_object('id',p.id,'short_code',p.short_code,'source_url',p.url,'format',p.format,
 'caption',left(p.caption,12000),'alt',left(p.alt,4000),'hashtags',p.hashtags[1:100],
 'owner_username',p.owner_username,'posted_at',p.posted_at,'updated_at',p.updated_at,
 'metrics',jsonb_build_object('likes',p.likes_count,'comments',p.comments_count,'video_views',p.video_view_count,'observed_at',null,'post_updated_at',p.updated_at),
 'brand',jsonb_build_object('name',b.name,'slug',b.slug),
 'categories',coalesce((select jsonb_agg(jsonb_build_object('name',c.name,'slug',c.slug) order by c.slug) from public.categories c where c.id=b.category_id or exists(select 1 from public.post_categories pc where pc.post_id=p.id and pc.category_id=c.id)),'[]'::jsonb),
 'images',coalesce((select jsonb_agg(to_jsonb(i) order by i.position) from (select position,bucket_id as bucket,path from public.post_images where post_id=p.id order by position limit 100) i),'[]'::jsonb),
 'analysis',(select jsonb_build_object('summary',left(a.summary,4000),'hook',left(a.hook,2000),'why_it_works',left(a.why_it_works,4000),'takeaways',a.takeaways[1:20],'published_at',a.published_at) from public.post_analyses a where a.post_id=p.id and a.published_at is not null))
 from public.instagram_posts p left join public.brands b on b.id=p.brand_id where p.is_published and p.id=p_id
$$;

;
