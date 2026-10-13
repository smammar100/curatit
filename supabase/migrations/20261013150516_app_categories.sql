-- Categories after Mobbin's app categories (2026-10-13, at the owner's request): 28 categories in
-- place of the library's original seven. Each brand has one main category (brands.category_id,
-- which drives its colour, the homepage tabs and onboarding) and may carry extra ones as post
-- tags in post_categories, which the MCP functions already read as "in this category" too. The
-- site lists only categories that have published posts.
--
-- Storage doesn't move. Image paths begin with the folder the brand's files were uploaded under
-- (the old category slugs: fintech/, food-delivery/, ...), so that folder becomes its own column,
-- brands.storage_folder. The image-path check and the analysis fingerprint read it instead of
-- the category, which keeps every stored path valid and every content fingerprint identical, so
-- no approved analysis is queued again because its brand changed category.

-- 1. The storage folder, separate from the category -------------------------------------------

alter table public.brands
  add column storage_folder text check (storage_folder ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

comment on column public.brands.storage_folder is
  'Top-level folder of the brand''s files in the library bucket (<folder>/<brand>/<format>/<short_code>/<nn>.webp). Falls back to the category slug when null.';

update public.brands b set storage_folder = c.slug
from public.categories c where c.id = b.category_id and b.storage_folder is null;

create or replace function private.check_post_image_path()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  folder text;
begin
  select coalesce(b.storage_folder, c.slug) || '/' || b.slug || '/' || p.format || '/' || p.short_code || '/'
  into folder
  from public.instagram_posts p
  join public.brands b on b.id = p.brand_id
  left join public.categories c on c.id = b.category_id
  where p.id = new.post_id;

  if folder is null then
    raise exception 'Post % needs a brand with a storage folder or a category before it can have images', new.post_id;
  end if;
  if not starts_with(new.path, folder || lpad((new.position + 1)::text, 2, '0') || '.') then
    raise exception 'Image path % should be %.<ext> for post % position %',
      new.path, folder || lpad((new.position + 1)::text, 2, '0'), new.post_id, new.position;
  end if;
  return new;
end;
$$;

-- Same hash as before for every existing post: the folder is the old category slug
create or replace function private.creative_content_fingerprint(p_post_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(sha256(convert_to(concat_ws(chr(31),
    p.id,
    btrim(regexp_replace(coalesce(p.caption, ''), '\s+', ' ', 'g')),
    coalesce(b.slug, ''),
    coalesce(b.storage_folder, c.slug, ''),
    (select string_agg(i.position || ':' || i.bucket_id || '/' || i.path || '@' || coalesce(o.metadata ->> 'eTag', ''), chr(30) order by i.position)
      from public.post_images i
      left join storage.objects o on o.bucket_id = i.bucket_id and o.name = i.path
      where i.post_id = p.id)
  ), 'UTF8')), 'hex')
  from public.instagram_posts p
  left join public.brands b on b.id = p.brand_id
  left join public.categories c on c.id = b.category_id
  where p.id = p_post_id;
$$;

-- The worker's manifest names the folder too, for its own input fingerprint (lib/creative/analyze.ts)
create or replace function public.creative_post_manifest(p_post_id text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'short_code', p.short_code,
    'source_url', p.url,
    'format', p.format,
    'is_published', p.is_published,
    'caption', coalesce(p.caption, ''),
    'alt', p.alt,
    'hashtags', coalesce(to_jsonb(p.hashtags[1:30]), '[]'),
    'mentions', coalesce(to_jsonb(p.mentions[1:30]), '[]'),
    'paid_partnership', p.paid_partnership,
    'owner_username', p.owner_username,
    'posted_at', p.posted_at,
    'brand', jsonb_build_object('name', b.name, 'slug', b.slug),
    'category', jsonb_build_object('name', c.name, 'slug', c.slug),
    'storage_folder', coalesce(b.storage_folder, c.slug),
    'scrape_run_id', p.scrape_run_id,
    'media', (select to_jsonb(m) from private.creative_media_status(p.id) m),
    'content_fingerprint', private.creative_content_fingerprint(p.id),
    'images', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', i.position,
        'bucket', i.bucket_id,
        'path', i.path,
        'etag', o.metadata ->> 'eTag',
        'size', (o.metadata ->> 'size')::bigint,
        'mimetype', o.metadata ->> 'mimetype',
        'was_video', coalesce(lower(md.type) = 'video', false)
      ) order by i.position)
      from public.post_images i
      left join storage.objects o on o.bucket_id = i.bucket_id and o.name = i.path
      left join public.instagram_post_media md on md.post_id = i.post_id and md.position = i.position
      where i.post_id = p.id
    ), '[]')
  )
  from public.instagram_posts p
  left join public.brands b on b.id = p.brand_id
  left join public.categories c on c.id = b.category_id
  where p.id = p_post_id;
$$;

-- 2. The 28 categories -----------------------------------------------------------------------

insert into public.categories (slug, name, position, description) values
  ('ai', 'AI', 1, 'AI assistants, models and AI-first products.'),
  ('business', 'Business', 2, 'Tools and platforms for running and growing a business.'),
  ('collaboration', 'Collaboration', 3, 'Shared workspaces, whiteboards and team tools.'),
  ('communication', 'Communication', 4, 'Messaging, email, calls and meetings.'),
  ('crm', 'CRM', 5, 'Customer relationships, sales pipelines and support.'),
  ('crypto-web3', 'Crypto & Web3', 6, 'Crypto exchanges, wallets and web3 products.'),
  ('developer-tools', 'Developer Tools', 7, 'Tools for building, shipping and running software.'),
  ('education', 'Education', 8, 'Learning, courses and schools.'),
  ('entertainment', 'Entertainment', 9, 'Streaming, games and things to watch.'),
  ('finance', 'Finance', 10, 'Banking, payments, investing and money transfer.'),
  ('food-drink', 'Food & Drink', 11, 'Restaurants, fast food, drinks, delivery and groceries.'),
  ('graphics-design', 'Graphics & Design', 12, 'Design, illustration and creative tools.'),
  ('health-fitness', 'Health & Fitness', 13, 'Workouts, wellbeing and health tracking.'),
  ('jobs-recruitment', 'Jobs & Recruitment', 14, 'Hiring, job search and careers.'),
  ('lifestyle', 'Lifestyle', 15, 'Fashion, homes, stays and everyday living.'),
  ('maps-navigation', 'Maps & Navigation', 16, 'Maps, directions and getting around.'),
  ('medical', 'Medical', 17, 'Healthcare, clinics and medical services.'),
  ('music-audio', 'Music & Audio', 18, 'Music, podcasts and audio.'),
  ('news', 'News', 19, 'News, magazines and publishing.'),
  ('photo-video', 'Photo & Video', 20, 'Cameras, photo and video creation.'),
  ('productivity', 'Productivity', 21, 'Getting work done: notes, tasks, research and assistants.'),
  ('real-estate', 'Real Estate', 22, 'Buying, selling and renting property.'),
  ('reference', 'Reference', 23, 'Dictionaries, encyclopedias and look-it-up tools.'),
  ('shopping', 'Shopping', 24, 'Retail, fashion, marketplaces and online stores.'),
  ('social-networking', 'Social Networking', 25, 'Social networks and communities.'),
  ('sports', 'Sports', 26, 'Sportswear, teams, leagues and sport.'),
  ('travel-transportation', 'Travel & Transportation', 27, 'Trips, stays, rides and getting around.'),
  ('utilities', 'Utilities', 28, 'Everyday tools and utilities.')
on conflict (slug) do update set name = excluded.name, position = excluded.position, description = excluded.description;

-- 3. Each brand's main category and extra tags -----------------------------------------------

create temp table brand_category_map (brand text primary key, main text not null, extra text[] not null default '{}');
insert into brand_category_map (brand, main, extra) values
  ('chatgpt', 'ai', '{productivity}'),
  ('claude', 'ai', '{productivity}'),
  ('perplexity', 'ai', '{productivity}'),
  ('shopify', 'business', '{shopping}'),
  ('binance', 'crypto-web3', '{finance}'),
  ('coinbase', 'crypto-web3', '{finance}'),
  ('public', 'finance', '{}'),
  ('revolut', 'finance', '{}'),
  ('robinhood', 'finance', '{}'),
  ('wealthfront', 'finance', '{}'),
  ('wealthsimple', 'finance', '{}'),
  ('wise', 'finance', '{}'),
  ('burger-king', 'food-drink', '{}'),
  ('coca-cola', 'food-drink', '{}'),
  ('deliveroo', 'food-drink', '{}'),
  ('doordash', 'food-drink', '{}'),
  ('instacart', 'food-drink', '{shopping}'),
  ('kfc', 'food-drink', '{}'),
  ('mcdonalds', 'food-drink', '{}'),
  ('uber-eats', 'food-drink', '{}'),
  ('amazon', 'shopping', '{}'),
  ('hm', 'shopping', '{lifestyle}'),
  ('uniqlo', 'shopping', '{lifestyle}'),
  ('zara', 'shopping', '{lifestyle}'),
  ('adidas', 'sports', '{shopping}'),
  ('nike', 'sports', '{shopping}'),
  ('under-armour', 'sports', '{shopping}'),
  ('airbnb', 'travel-transportation', '{lifestyle}'),
  ('bolt', 'travel-transportation', '{}'),
  ('expedia', 'travel-transportation', '{}'),
  ('tripadvisor', 'travel-transportation', '{}'),
  ('uber', 'travel-transportation', '{}');

-- Every brand must be in the map, or it would be left pointing at a category that's about to go
do $$
declare missing text;
begin
  select string_agg(b.slug, ', ') into missing from public.brands b where not exists (select 1 from brand_category_map m where m.brand = b.slug);
  if missing is not null then
    raise exception 'No new category for brand(s): %', missing;
  end if;
end $$;

update public.brands b set category_id = c.id
from brand_category_map m join public.categories c on c.slug = m.main
where m.brand = b.slug;

-- Every brand has a main category now, and a seed with a mistyped one must fail, not blank it
alter table public.brands alter column category_id set not null;

insert into public.post_categories (post_id, category_id)
select p.id, c.id
from public.instagram_posts p
join public.brands b on b.id = p.brand_id
join brand_category_map m on m.brand = b.slug
cross join lateral unnest(m.extra) as e(slug)
join public.categories c on c.slug = e.slug
on conflict do nothing;

-- 4. Onboarding answers name categories by slug: carry them over -----------------------------

create temp table old_category_map (old text primary key, new text[] not null);
insert into old_category_map values
  ('fintech', '{finance,crypto-web3}'),
  ('food-delivery', '{food-drink}'),
  ('sportswear', '{sports}'),
  ('technology', '{ai}'),
  ('travel', '{travel-transportation}'),
  ('ecommerce', '{shopping,business}'),
  ('fashion', '{shopping,lifestyle}');

-- Each old slug becomes its new ones in place; duplicates keep their first position
update public.profiles p set industries = array(
  select t.slug from (
    select s.slug, min(i.n * 10 + s.k) as ord
    from unnest(p.industries) with ordinality as i(slug, n)
    left join old_category_map o on o.old = i.slug
    cross join lateral unnest(coalesce(o.new, array[i.slug])) with ordinality as s(slug, k)
    group by s.slug
  ) t order by t.ord)
where p.industries && array(select old from old_category_map);

-- 5. The old categories go -------------------------------------------------------------------

delete from public.categories c
where c.slug in (select old from old_category_map)
  and not exists (select 1 from public.brands b where b.category_id = c.id);

drop table brand_category_map;
drop table old_category_map;
