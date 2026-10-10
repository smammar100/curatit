-- Brand logos in the `library` bucket, at logos/<brand slug>.webp
--
-- Each logo is the brand's Instagram profile picture (its official square mark),
-- compressed to WebP by scripts/download-brand-logos.mjs. The check ties the path
-- to the brand's own slug, so a logo can't point at another brand's file and
-- renaming a brand means moving its logo too.

alter table public.brands
  add column logo_path text
  constraint brands_logo_path_matches_slug check (logo_path = 'logos/' || slug || '.webp');

comment on column public.brands.logo_path is 'Path of the brand''s logo in the library bucket (logos/<slug>.webp)';

-- The library view gains the logo, for cards that show which brand a post is from
create or replace view public.library_posts
with (security_invoker = true)
as
select
  p.id,
  p.short_code,
  p.url,
  p.format,
  p.caption,
  p.likes_count,
  p.comments_count,
  p.dimensions_width,
  p.dimensions_height,
  cover.path as cover_path,
  (select count(*) from public.post_images i where i.post_id = p.id) as image_count,
  p.posted_at,
  p.owner_username,
  p.owner_full_name,
  b.name as brand_name,
  b.slug as brand_slug,
  c.slug as category_slug,
  b.logo_path as brand_logo_path
from public.instagram_posts p
left join public.post_images cover on cover.post_id = p.id and cover.position = 0
left join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = b.category_id
where p.is_published and p.format in ('static', 'carousel');
