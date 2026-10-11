-- Onboarding answers, on each member's profile: what they do, the industries they work in, the
-- brands they follow and the posts that stopped their thumb. The For you feed ranks the library
-- on them (components/dashboard/forYou.ts). onboarded_at is when they finished, or skipped, the
-- flow (Skip sets it with nothing else, so it doesn't ask again); null shows it on the next
-- visit to the feed. The flow is /dashboard/welcome, chosen 2026-10-11.

alter table public.profiles
  add column occupation text check (char_length(occupation) <= 40),
  add column industries text[] not null default '{}' check (cardinality(industries) <= 20),
  add column brands text[] not null default '{}' check (cardinality(brands) <= 100),
  add column taste_posts text[] not null default '{}' check (cardinality(taste_posts) <= 50),
  add column onboarded_at timestamptz;

comment on column public.profiles.occupation is 'What they do (Designer, Marketer, Founder, …), from onboarding';
comment on column public.profiles.industries is 'Category slugs they work in, from onboarding; the For you feed puts these first';
comment on column public.profiles.brands is 'Brand slugs they keep an eye on, from onboarding';
comment on column public.profiles.taste_posts is 'Short codes of the posts they tapped in onboarding''s taste test';
comment on column public.profiles.onboarded_at is 'When they finished or skipped onboarding; null shows it on their next visit to the feed';

-- Members set these on their own row (the existing update policy), beside their name and avatar
grant update (occupation, industries, brands, taste_posts, onboarded_at) on public.profiles to authenticated;
