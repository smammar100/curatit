-- Categories and brands in the MCP read API, now that there are 28 categories and a post can be in
-- several (its brand's main category and the tags its posts carry, …_app_categories).
--
-- curatit_mcp_resolve_filter (same signature and grants) matched only an exact slug or name, so
-- "Food and drink", "crypto", "Coca Cola" and "ubereats" were refused as unknown. It now tries, in
-- order: the exact slug or name; the same compared loosely (case, spacing and punctuation ignored,
-- "&" and the word "and" left out); for categories, the original seven's slugs and names, as
-- before; and then a short list of everyday names for the categories ("crypto", "restaurants",
-- "retail"...). The MCP warns when a value lands on something it doesn't name, so nothing is
-- remapped behind a client's back.
--
-- curatit_mcp_taxonomy (same signature and grants, every key it returned before still there) adds
-- counts: a category's published posts by main category or tag (`posts`) and by main category alone
-- (`main_posts`), with its everyday names (`synonyms`); a brand's published posts (`posts`) and its
-- categories, main first (`categories`).
--
-- Rollback: re-run curatit_mcp_resolve_filter from 20261013153131_mcp_main_category_first.sql and
--   curatit_mcp_taxonomy from 20261009201007_curatit_mcp_read_api.sql, then
--   drop function private.curatit_mcp_category_aliases(), private.curatit_mcp_name_key(text);

set lock_timeout = '5s';

-- A name compared loosely: lower case, "&" and the word "and" left out, then everything but letters
-- and digits, so "Food & Drink", "food_drink" and "Food and drink" are one name, and so are
-- "Coca Cola" and "coca-cola", "ubereats" and "Uber Eats". The same rule as nameKey() in
-- src/lib/mcp/services/terms.ts; change the two together
create function private.curatit_mcp_name_key(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(regexp_replace(lower(coalesce(p_value, '')), '&|\mand\M', ' ', 'g'), '[^a-z0-9]+', '', 'g');
$$;

-- Everyday names for the categories, the words people reach for before they know the list. Each
-- resolves only while its category exists. The original seven slugs aren't here: the resolver
-- maps those itself, as it did before
create function private.curatit_mcp_category_aliases()
returns table (alias text, slug text)
language sql
immutable
set search_path = ''
as $$
  values
    ('artificial intelligence', 'ai'),
    ('b2b', 'business'),
    ('team collaboration', 'collaboration'),
    ('messaging', 'communication'),
    ('chat', 'communication'),
    ('sales', 'crm'),
    ('crypto', 'crypto-web3'),
    ('cryptocurrency', 'crypto-web3'),
    ('web3', 'crypto-web3'),
    ('blockchain', 'crypto-web3'),
    ('dev tools', 'developer-tools'),
    ('developers', 'developer-tools'),
    ('edtech', 'education'),
    ('learning', 'education'),
    ('language learning', 'education'),
    ('gaming', 'entertainment'),
    ('streaming', 'entertainment'),
    ('banking', 'finance'),
    ('investing', 'finance'),
    ('payments', 'finance'),
    ('money', 'finance'),
    ('food', 'food-drink'),
    ('fast food', 'food-drink'),
    ('drink', 'food-drink'),
    ('drinks', 'food-drink'),
    ('restaurant', 'food-drink'),
    ('restaurants', 'food-drink'),
    ('grocery', 'food-drink'),
    ('groceries', 'food-drink'),
    ('design', 'graphics-design'),
    ('graphic design', 'graphics-design'),
    ('health', 'health-fitness'),
    ('fitness', 'health-fitness'),
    ('wellness', 'health-fitness'),
    ('meditation', 'health-fitness'),
    ('mindfulness', 'health-fitness'),
    ('jobs', 'jobs-recruitment'),
    ('recruiting', 'jobs-recruitment'),
    ('hiring', 'jobs-recruitment'),
    ('maps', 'maps-navigation'),
    ('navigation', 'maps-navigation'),
    ('healthcare', 'medical'),
    ('music', 'music-audio'),
    ('podcasts', 'music-audio'),
    ('photography', 'photo-video'),
    ('property', 'real-estate'),
    ('retail', 'shopping'),
    ('shop', 'shopping'),
    ('clothing', 'shopping'),
    ('apparel', 'shopping'),
    ('social media', 'social-networking'),
    ('social', 'social-networking'),
    ('sport', 'sports'),
    ('transport', 'travel-transportation'),
    ('transportation', 'travel-transportation'),
    ('mobility', 'travel-transportation'),
    ('hotels', 'travel-transportation'),
    ('airlines', 'travel-transportation'),
    ('tools', 'utilities');
$$;

revoke execute on function private.curatit_mcp_name_key(text), private.curatit_mcp_category_aliases() from public, anon, authenticated;
grant execute on function private.curatit_mcp_name_key(text), private.curatit_mcp_category_aliases() to anon, authenticated, service_role;

create or replace function public.curatit_mcp_resolve_filter(p_kind text, p_value text)
 returns text
 language plpgsql
 stable
 set search_path to ''
 set statement_timeout to '5s'
as $function$
declare
  v text;
  k text;
  result text;
begin
  if p_kind is null or p_kind not in ('categories', 'brands') or p_value is null or char_length(p_value) > 100 then
    raise exception 'invalid filter' using errcode = '22023';
  end if;
  v := lower(btrim(p_value));
  k := private.curatit_mcp_name_key(p_value);
  if p_kind = 'categories' then
    select c.slug into result from public.categories c
    where lower(c.slug) = v or lower(c.name) = v
    order by (lower(c.slug) = v) desc, c.slug limit 1;
    if result is null and k <> '' then
      select c.slug into result from public.categories c
      where private.curatit_mcp_name_key(c.slug) = k or private.curatit_mcp_name_key(c.name) = k
      order by c.position, c.slug limit 1;
    end if;
    -- The original seven categories (until 2026-10-13), by slug or name, for clients and saved
    -- prompts that still send them; each resolves only while its new category exists. The MCP
    -- says what each became (OLD_CATEGORIES in src/lib/categories.ts)
    if result is null then
      select c.slug into result from public.categories c
      where c.slug = case k
        when 'fintech' then 'finance' when 'fooddelivery' then 'food-drink'
        when 'sportswear' then 'sports' when 'technology' then 'ai' when 'travel' then 'travel-transportation'
        when 'ecommerce' then 'shopping' when 'fashion' then 'shopping' end;
    end if;
    if result is null and k <> '' then
      select c.slug into result
      from private.curatit_mcp_category_aliases() a
      join public.categories c on c.slug = a.slug
      where private.curatit_mcp_name_key(a.alias) = k
      order by c.position, c.slug limit 1;
    end if;
  else
    select b.slug into result from public.brands b
    where lower(b.slug) = v or lower(b.name) = v
    order by (lower(b.slug) = v) desc, b.slug limit 1;
    if result is null and k <> '' then
      select b.slug into result from public.brands b
      where private.curatit_mcp_name_key(b.slug) = k or private.curatit_mcp_name_key(b.name) = k
      order by b.slug limit 1;
    end if;
  end if;
  return result;
end $function$;

-- The categories and brands that have published posts, a page at a time by slug, with counts. A
-- post counts in its brand's main category and in every category it's tagged with, so a
-- category's `posts` can exceed its `main_posts` (Lifestyle is a tag on 20 posts and nobody's
-- main category)
create or replace function public.curatit_mcp_taxonomy(p_kind text default 'categories', p_after text default '', p_limit integer default 50)
 returns jsonb
 language plpgsql
 stable
 set search_path to ''
 set statement_timeout to '5s'
as $function$
declare result jsonb;
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 or p_kind is null or p_kind not in ('categories', 'brands') then
    raise exception 'invalid taxonomy parameters' using errcode = '22023';
  end if;
  if p_kind = 'categories' then
    with page as materialized (
      select c.name, c.slug, left(c.description, 1000) as description, n.posts, n.main_posts,
        coalesce((select jsonb_agg(a.alias order by a.alias) from private.curatit_mcp_category_aliases() a where a.slug = c.slug), '[]'::jsonb) as synonyms
      from public.categories c
      cross join lateral (
        select count(*) as posts, count(*) filter (where b.category_id = c.id) as main_posts
        from public.instagram_posts p
        left join public.brands b on b.id = p.brand_id
        where p.is_published
          and (b.category_id = c.id or exists (
            select 1 from public.post_categories pc where pc.post_id = p.id and pc.category_id = c.id))
      ) n
      where c.slug > coalesce(p_after, '') and n.posts > 0
      order by c.slug
      limit p_limit + 1
    ), items as (
      select * from page order by slug limit p_limit
    )
    select jsonb_build_object(
      'items', coalesce((select jsonb_agg(to_jsonb(i) order by slug) from items i), '[]'::jsonb),
      'next', case when (select count(*) from page) > p_limit then (select max(slug) from items) else null end)
    into result;
  else
    with page as materialized (
      select b.name, b.slug, c.slug as category,
        (select count(*) from public.instagram_posts p where p.brand_id = b.id and p.is_published) as posts,
        coalesce((
          select jsonb_agg(jsonb_build_object('name', c2.name, 'slug', c2.slug) order by (c2.id = b.category_id) desc, c2.slug)
          from public.categories c2
          where c2.id = b.category_id or exists (
            select 1 from public.post_categories pc
            join public.instagram_posts p on p.id = pc.post_id
            where p.brand_id = b.id and p.is_published and pc.category_id = c2.id)), '[]'::jsonb) as categories
      from public.brands b
      left join public.categories c on c.id = b.category_id
      where b.slug > coalesce(p_after, '')
        and exists (select 1 from public.instagram_posts p where p.brand_id = b.id and p.is_published)
      order by b.slug
      limit p_limit + 1
    ), items as (
      select * from page order by slug limit p_limit
    )
    select jsonb_build_object(
      'items', coalesce((select jsonb_agg(to_jsonb(i) order by slug) from items i), '[]'::jsonb),
      'next', case when (select count(*) from page) > p_limit then (select max(slug) from items) else null end)
    into result;
  end if;
  return result;
end $function$;
