-- Who has unsubscribed from Curatit's optional emails (onboarding, the weekly edition and other
-- product notices), and why. One row per address. The /unsubscribe page writes it with the
-- secret key after checking the link's signature (src/lib/unsubscribe.ts), and sendEmail()
-- reads it before sending any email that carries an unsubscribe link. Account emails (confirm,
-- reset password, security notices) never check it: nobody can opt out of those.
create table public.email_unsubscribes (
  email text primary key check (email = lower(email) and length(email) between 3 and 320),
  reason text check (reason in ('too_many', 'not_relevant', 'never_signed_up', 'other')),
  note text check (length(note) <= 500),
  -- Which email the link came from, e.g. "onboarding", "weekly-edition"
  source text check (length(source) <= 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.email_unsubscribes is
  'Addresses that unsubscribed from optional emails, with the reason they gave. Written and read only with the secret key.';

-- Only the service role reads or writes it: no policies, so anon and authenticated get nothing
alter table public.email_unsubscribes enable row level security;
revoke all on table public.email_unsubscribes from anon, authenticated;
