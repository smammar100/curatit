-- Library images in Supabase Storage
--
-- Public bucket `library`, one folder per post:
--
--   <category>/<brand>/<format>/<short_code>/<nn>.jpg
--   sportswear/nike/carousel/DdcI8NLmY21/01.jpg … 07.jpg
--
-- category is the brand's industry (brands.category_id), format is
-- instagram_posts.format (static | carousel | video), and nn is the slide's
-- position + 1. 01.jpg is the cover; videos keep only their cover frame. The
-- database stores each file's path, so the site never builds paths itself and
-- moving a folder only means updating these columns.

-- A brand's industry: the top-level folder. Post tags stay in post_categories.
alter table public.brands
  add column category_id uuid references public.categories (id) on delete restrict;

create index brands_category_id_idx on public.brands (category_id);

comment on column public.instagram_posts.cover_image_path is 'Path of the cover (01.jpg) in the library bucket';

alter table public.instagram_post_media add column image_path text;

comment on column public.instagram_post_media.image_path is 'Path of this slide in the library bucket';

-- Public: files are served by URL without a policy. There is deliberately no
-- select policy for anon, so the bucket can't be listed through the API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library', 'library', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Editors manage the files (upsert needs select, insert and update)
create policy "Editors read library files" on storage.objects
  for select to authenticated
  using (bucket_id = 'library' and (select private.is_editor()));
create policy "Editors upload library files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'library' and (select private.is_editor()));
create policy "Editors update library files" on storage.objects
  for update to authenticated
  using (bucket_id = 'library' and (select private.is_editor()))
  with check (bucket_id = 'library' and (select private.is_editor()));
create policy "Editors delete library files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'library' and (select private.is_editor()));
