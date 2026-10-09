-- Least privilege for the Data API roles
--
-- Supabase's default privileges give anon and authenticated every privilege on
-- each new table, view and sequence in public (TRUNCATE included, which RLS
-- does not cover), and Postgres gives PUBLIC execute on every new function. So
-- the grants in the schema migration only added to what was already there.
-- Reset both roles to exactly what the app uses; RLS still decides which rows.

-- New objects start with no access: each migration grants what it needs
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Existing tables and views
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on
  public.brands, public.instagram_accounts, public.instagram_posts, public.instagram_post_media,
  public.instagram_post_coauthors, public.instagram_tagged_users,
  public.categories, public.post_categories, public.post_analyses, public.library_posts
to anon, authenticated;

grant select on public.scrape_runs, public.instagram_comments, public.profiles to authenticated;

grant insert, update, delete on
  public.brands, public.scrape_runs, public.instagram_accounts, public.instagram_posts,
  public.instagram_post_media, public.instagram_post_coauthors, public.instagram_tagged_users,
  public.instagram_comments, public.categories, public.post_categories, public.post_analyses
to authenticated;

grant select, insert, update, delete on public.boards, public.board_posts to authenticated;

-- Members edit their name and avatar, never their role
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Functions created after the blanket revoke in the schema migration
revoke execute on function private.handle_new_user() from public;
revoke execute on function private.is_editor() from public;
grant execute on function private.is_editor() to anon, authenticated;
