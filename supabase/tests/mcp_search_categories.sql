-- The MCP's categories, brands and search (supabase/migrations/20261016120300_mcp_category_resolution.sql
-- and 20261016120400_mcp_search_v2_reasons.sql): database checks against the linked project,
-- read-only, in one transaction that always rolls back. Run it with
--   npx supabase db query --linked -f supabase/tests/mcp_search_categories.sql
-- It prints one row per check; every `ok` should be true. To check the migrations before they're
-- pushed, paste their SQL at the marker below (the rollback undoes it too). The checks that read a
-- hit's strategy_headline need 20261016120200_creative_mcp_analysis_v3 as well.
--
-- The reads run as anon, the role the MCP's catalog reads use. anon can't read a temp table that
-- postgres made, so each read keeps its result in set_config(..., true) and the checks read it back
-- as postgres.

begin;

-- @migration

create temp table checks (name text, ok boolean, detail text);

set local role anon;

-- Category and brand names, loosely
select set_config('test.resolve', (
  select jsonb_object_agg(x.kind || ':' || x.value, public.curatit_mcp_resolve_filter(x.kind, x.value))
  from (values
    ('categories', 'Food and drink'), ('categories', 'food-and-drink'), ('categories', 'food_drink'),
    ('categories', 'crypto'), ('categories', 'Crypto & Web3'), ('categories', 'crypto web3'),
    ('categories', 'fintech'), ('categories', 'Fintech'), ('categories', 'fashion'), ('categories', 'E-commerce'),
    ('categories', 'Finance'), ('categories', 'restaurants'), ('categories', 'halloween'),
    ('brands', 'Coca Cola'), ('brands', 'ubereats'), ('brands', 'H&M'), ('brands', 'hm'), ('brands', 'nike'),
    ('brands', 'pepsi'),
    -- Brands and fields added since (2026-10-15)
    ('categories', 'meditation'), ('categories', 'language learning'), ('categories', 'graphic design'),
    ('categories', 'Health & Fitness'), ('brands', 'Duolingo'), ('brands', 'head space'), ('brands', 'Puma')) x(kind, value))::text, true);

-- The taxonomy with counts
select set_config('test.categories', public.curatit_mcp_taxonomy('categories', '', 100)::text, true);
select set_config('test.brands', public.curatit_mcp_taxonomy('brands', '', 100)::text, true);

-- Search: category names in the query, public names in reasons, the matched part of the analysis
select set_config('test.crypto', public.curatit_mcp_search_v2('{"query": "Crypto & Web3", "limit": 50}')::text, true);
select set_config('test.family', public.curatit_mcp_search_v2('{"archetype_family": ["education"], "limit": 50}')::text, true);
select set_config('test.approach', public.curatit_mcp_search_v2('{"archetype": ["explainer"], "objective": ["education"], "limit": 50}')::text, true);
select set_config('test.gridlines', public.curatit_mcp_search_v2('{"query": "gridlines", "analysed_only": true, "limit": 20}')::text, true);
-- Paging, measured against the library as it is today rather than a count written in: a page in
-- the middle, the last page (the one that starts at the last whole ten), and one past the end
select set_config('test.carousels', (select count(*) from public.instagram_posts where is_published and format = 'carousel')::text, true);
select set_config('test.broad', public.curatit_mcp_search_v2('{"format": "carousel", "limit": 50, "offset": 100}')::text, true);
select set_config('test.last', public.curatit_mcp_search_v2(jsonb_build_object('format', 'carousel', 'limit', 10, 'offset', (current_setting('test.carousels')::int / 10) * 10))::text, true);
select set_config('test.past', public.curatit_mcp_search_v2('{"format": "carousel", "limit": 10, "offset": 500}')::text, true);
select set_config('test.again', public.curatit_mcp_search_v2('{"query": "Crypto & Web3", "limit": 50}')::text, true);

reset role;

-- Read back as postgres
insert into checks
select 'resolves "' || split_part(k, ':', 2) || '" (' || split_part(k, ':', 1) || ')', (r ->> k) is not distinct from expected, coalesce(r ->> k, 'null')
from (select current_setting('test.resolve')::jsonb r) v,
  (values
    ('categories:Food and drink', 'food-drink'), ('categories:food-and-drink', 'food-drink'), ('categories:food_drink', 'food-drink'),
    ('categories:crypto', 'crypto-web3'), ('categories:Crypto & Web3', 'crypto-web3'), ('categories:crypto web3', 'crypto-web3'),
    ('categories:fintech', 'finance'), ('categories:Fintech', 'finance'), ('categories:fashion', 'shopping'), ('categories:E-commerce', 'shopping'),
    ('categories:Finance', 'finance'), ('categories:restaurants', 'food-drink'), ('categories:halloween', null),
    ('brands:Coca Cola', 'coca-cola'), ('brands:ubereats', 'uber-eats'), ('brands:H&M', 'hm'), ('brands:hm', 'hm'), ('brands:nike', 'nike'),
    ('brands:pepsi', null),
    ('categories:meditation', 'health-fitness'), ('categories:language learning', 'education'), ('categories:graphic design', 'graphics-design'),
    ('categories:Health & Fitness', 'health-fitness'), ('brands:Duolingo', 'duolingo'), ('brands:head space', 'headspace'), ('brands:Puma', 'puma')) e(k, expected);

insert into checks
-- Counted from the tables, not written in, so the check holds as the library grows
select 'every category''s counts match the published posts, by main category or tag',
  bool_and((c ->> 'posts')::int = x.posts and (c ->> 'main_posts')::int = x.main_posts),
  string_agg(format('%s: %s/%s, expected %s/%s', x.slug, c ->> 'posts', c ->> 'main_posts', x.posts, x.main_posts), '; ')
    filter (where (c ->> 'posts')::int is distinct from x.posts or (c ->> 'main_posts')::int is distinct from x.main_posts)
from jsonb_array_elements(current_setting('test.categories')::jsonb -> 'items') c
join (
  select k.slug,
    (select count(*) from public.instagram_posts p join public.brands b on b.id = p.brand_id
     where p.is_published and (b.category_id = k.id
       or exists (select 1 from public.post_categories pc where pc.post_id = p.id and pc.category_id = k.id)))::int as posts,
    (select count(*) from public.instagram_posts p join public.brands b on b.id = p.brand_id
     where p.is_published and b.category_id = k.id)::int as main_posts
  from public.categories k) x on x.slug = c ->> 'slug'
union all
select 'a category that is only ever a tag still counts its posts (Lifestyle)',
  (c ->> 'posts')::int > 0 and (c ->> 'main_posts')::int = 0, c::text
from jsonb_array_elements(current_setting('test.categories')::jsonb -> 'items') c where c ->> 'slug' = 'lifestyle'
union all
select 'a category lists its everyday names', c -> 'synonyms' ? 'crypto', c ->> 'synonyms'
from jsonb_array_elements(current_setting('test.categories')::jsonb -> 'items') c where c ->> 'slug' = 'crypto-web3'
union all
select 'categories keep the keys they had', bool_and(c ?& array['name', 'slug', 'description', 'posts', 'main_posts']), count(*) || ' categories'
from jsonb_array_elements(current_setting('test.categories')::jsonb -> 'items') c
union all
select 'only categories with posts are listed', bool_and((c ->> 'posts')::int > 0), string_agg(c ->> 'slug', ', ')
from jsonb_array_elements(current_setting('test.categories')::jsonb -> 'items') c
union all
select 'a brand lists its categories, main first, and its posts',
  b -> 'categories' -> 0 ->> 'slug' = 'sports' and b -> 'categories' @> '[{"slug": "shopping"}]' and (b ->> 'posts')::int > 0 and b ->> 'category' = 'sports',
  b::text
from jsonb_array_elements(current_setting('test.brands')::jsonb -> 'items') b where b ->> 'slug' = 'nike';

insert into checks
select 'a query naming a category finds its posts', jsonb_array_length(s -> 'posts') >= 9, jsonb_array_length(s -> 'posts') || ' posts'
from (select current_setting('test.crypto')::jsonb s) v
union all
select 'they say the name matched', bool_and(p -> 'reasons' @> '["The query matches the brand or category name"]'), min(p ->> 'short_code')
from jsonb_array_elements(current_setting('test.crypto')::jsonb -> 'posts') p
where p -> 'categories' @> '[{"slug": "crypto-web3"}]'
union all
select 'reasons say approach family, not archetype family',
  bool_and(exists (select 1 from jsonb_array_elements_text(p -> 'reasons') x where x like 'approach family: %'))
    and not bool_or(exists (select 1 from jsonb_array_elements_text(p -> 'reasons') x where x like 'archetype%')),
  count(*) || ' posts; ' || min(p ->> 'reasons')
from jsonb_array_elements(current_setting('test.family')::jsonb -> 'posts') p
union all
select 'reasons say creative approach and goal',
  bool_or(exists (select 1 from jsonb_array_elements_text(p -> 'reasons') x where x like 'creative approach: %'))
    and bool_or(exists (select 1 from jsonb_array_elements_text(p -> 'reasons') x where x like 'goal: %'))
    and not bool_or(exists (select 1 from jsonb_array_elements_text(p -> 'reasons') x where x like 'archetype%' or x like 'objective%')),
  count(*) || ' posts; ' || min(p ->> 'reasons')
from jsonb_array_elements(current_setting('test.approach')::jsonb -> 'posts') p
union all
select 'a match in the analysis names the part it matched', coalesce(bool_or(p ->> 'reasons' like '%visual notes: %'), false),
  string_agg((p ->> 'short_code') || ' ' || (p ->> 'reasons'), ' | ')
from jsonb_array_elements(current_setting('test.gridlines')::jsonb -> 'posts') p
union all
select 'DeSB6D7NsfO matched gridlines in its visual notes', coalesce(bool_or(p ->> 'short_code' = 'DeSB6D7NsfO' and p ->> 'reasons' like '%visual notes%'), false), null
from jsonb_array_elements(current_setting('test.gridlines')::jsonb -> 'posts') p
union all
select 'a page in the middle says whether there is more (offset 100, 50 a page)',
  (s ->> 'has_more')::boolean = (n > 150) and (s -> 'next_offset' = 'null'::jsonb) = (n <= 150) and jsonb_array_length(s -> 'posts') = least(50, greatest(0, n - 100)),
  format('%s carousels; has_more %s, next_offset %s, %s posts', n, s ->> 'has_more', coalesce(s ->> 'next_offset', 'null'), jsonb_array_length(s -> 'posts'))
from (select current_setting('test.broad')::jsonb s, current_setting('test.carousels')::int n) v
union all
select 'the last page says there is no more',
  (s ->> 'has_more')::boolean = false and s -> 'next_offset' = 'null'::jsonb and jsonb_array_length(s -> 'posts') = n % 10,
  format('%s carousels; has_more %s, next_offset %s, %s posts', n, s ->> 'has_more', coalesce(s ->> 'next_offset', 'null'), jsonb_array_length(s -> 'posts'))
from (select current_setting('test.last')::jsonb s, current_setting('test.carousels')::int n) v
union all
select 'past the end, nothing and no next page', jsonb_array_length(s -> 'posts') = 0 and (s ->> 'has_more')::boolean = false and s -> 'next_offset' = 'null'::jsonb, s::text
from (select current_setting('test.past')::jsonb s) v
union all
select 'the result keeps every key it had, and adds catalog_marker',
  s ?& array['posts', 'has_more', 'next_offset', 'sort', 'search_mode', 'filters'] and length(s ->> 'catalog_marker') = 16,
  s ->> 'catalog_marker'
from (select current_setting('test.crypto')::jsonb s) v
union all
select 'the catalog marker holds still while the library does', a ->> 'catalog_marker' = b ->> 'catalog_marker', null
from (select current_setting('test.crypto')::jsonb a, current_setting('test.again')::jsonb b) v
union all
select 'hits carry the strategy line (needs 20261016120200_creative_mcp_analysis_v3)',
  bool_and(p -> 'analysis' ? 'strategy_headline'), count(*) || ' hits'
from jsonb_array_elements(current_setting('test.family')::jsonb -> 'posts') p;

select * from checks;

rollback;
