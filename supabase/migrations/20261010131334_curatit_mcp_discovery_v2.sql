-- Additive RPCs; retain all v1 contracts and existing RLS.
create or replace function public.curatit_mcp_resolve_filter(p_kind text,p_value text)
returns text language plpgsql stable security invoker set search_path='' set statement_timeout='5s' as $$
declare v text; result text;
begin
 if p_kind is null or p_kind not in ('categories','brands') or p_value is null or char_length(p_value)>100 then raise exception 'invalid filter' using errcode='22023'; end if;
 v:=lower(btrim(p_value));
 if p_kind='categories' then
  select c.slug into result from public.categories c where lower(c.slug)=v or lower(c.name)=v order by (lower(c.slug)=v) desc,c.slug limit 1;
  -- A user-facing alias, resolved only when the corresponding category exists.
  if result is null and v='finance' then select slug into result from public.categories where slug='fintech'; end if;
 else
  select b.slug into result from public.brands b where lower(b.slug)=v or lower(b.name)=v order by (lower(b.slug)=v) desc,b.slug limit 1;
 end if;
 return result;
end $$;

create or replace function public.curatit_mcp_catalog_stats()
returns jsonb language sql stable security invoker set search_path='' set statement_timeout='5s' as $$
 with published as materialized (select id,brand_id,format,created_at,updated_at,posted_at from public.instagram_posts where is_published)
 select jsonb_build_object(
 'published_posts',(select count(*) from published),
 'stored_images',(select count(*) from public.post_images i join published p on p.id=i.post_id),
 'brands_with_posts',(select count(distinct brand_id) from published),
 'categories_with_posts',(select count(*) from public.categories c where exists(select 1 from published p join public.brands b on b.id=p.brand_id where b.category_id=c.id) or exists(select 1 from public.post_categories pc join published p on p.id=pc.post_id where pc.category_id=c.id)),
 'formats',(select coalesce(jsonb_object_agg(format,n),'{}'::jsonb) from(select format,count(*) n from published group by format) f),
 'published_analyses',(select count(*) from public.post_analyses a join published p on p.id=a.post_id where a.published_at is not null),
 'posts_without_stored_images',(select count(*) from published p where not exists(select 1 from public.post_images i where i.post_id=p.id)),
 'latest_imported_at',(select max(created_at) from published),
 'latest_posted_at',(select max(posted_at) from published),
 'data_updated_at',(select max(updated_at) from published),
 'retrieved_at',statement_timestamp(),
 'search_mode','keyword', 'semantic_search_available',false)
$$;
revoke all on function public.curatit_mcp_resolve_filter(text,text) from public;
revoke all on function public.curatit_mcp_catalog_stats() from public;
grant execute on function public.curatit_mcp_resolve_filter(text,text) to anon,authenticated;
grant execute on function public.curatit_mcp_catalog_stats() to anon,authenticated;
;
