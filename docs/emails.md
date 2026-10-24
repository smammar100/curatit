# Emails

Curatit's emails are React Email templates in `src/emails/`, sent through [Resend](https://resend.com). They came as a designed set on 2026-10-17 (19 emails in the design system's colours and type, with light and dark versions of every image); of its three alternative welcomes, the owner kept the note (`welcome-note.tsx`) the same day and the other two were deleted, with the images only they used. The images are in `public/email/`.

Two routes send them:

- **The app** sends its own emails with `sendEmail()` in `src/lib/email.tsx`, through Resend's API. Today that's only the welcome email.
- **Supabase Auth** sends the six account emails (confirm, reset password and so on) itself. They're the same templates, rendered to HTML with `npm run email:render` into `supabase/templates/`, pasted into the Supabase dashboard and sent through Resend's SMTP. The files are plain ASCII, every other character written as an HTML entity: the first confirm email Supabase sent (2026-10-17) arrived with its invisible preheader padding and footer dot garbled ("Â â€Œ" in the inbox preview), from a paste that went through the wrong encoding.

## Commands

```bash
npm run email:dev      # preview every template at http://localhost:3001
npm run email:render   # rebuild supabase/templates/*.html
```

Tests: `src/emails/emails.test.tsx` renders every template (and its variants) and checks that each image is a PNG or JPG that exists in `public/email`, that each one stays under Gmail's 102 KB clipping size, and that `supabase/templates/` still matches the templates (it fails after a template change until `npm run email:render` runs). `src/lib/email.test.tsx` covers sending with Resend replaced: off without a key, never throws, and the welcome email's contents.

Images point at the deployed site (`CURATIT_PUBLIC_BASE_URL`, else `https://www.curatit.app`, the canonical address since 2026-10-17: `docs/domain.md`), so the preview shows them only once `public/email/` is deployed. To see them before that, run the preview with `EMAIL_ASSET_URL=http://localhost:3000` while `npm run dev` is running.

## The emails

| Email | File | Sent by | Live? |
| --- | --- | --- | --- |
| Confirm email | `confirm-email.tsx` | Supabase: Confirm sign up | Once pasted into Supabase |
| Reset password | `reset-password.tsx` | Supabase: Reset password | Once pasted into Supabase |
| Verification code | `reauthentication.tsx` | Supabase: Reauthentication | Once pasted into Supabase |
| Change email | `change-email.tsx` | Supabase: Change email address | Once pasted into Supabase |
| Email changed | `email-changed.tsx` | Supabase security notification | Once pasted and turned on |
| Password changed | `password-changed.tsx` | Supabase security notification | Once pasted and turned on |
| Welcome | `welcome-note.tsx` | The app, when a sign-up is confirmed | Yes, once `RESEND_API_KEY` is set |
| Onboarding | `onboarding.tsx` | The app, a day or two after sign-up | No: needs a scheduled job |
| Account deleted | `account-deleted.tsx` | The app, after deleting an account | No: accounts can't be deleted yet |
| Brand submission | `brand-submission.tsx` | The app, from Submit a brand and on approval | No: the submit form isn't wired |
| Weekly edition | `weekly-edition.tsx` | Resend Broadcasts | No: its posts are sample data |
| Share link expiring | `share-link-expiring.tsx` | The app | No: share links never expire |
| Bookmark limit, team invite, plan confirmed, payment failed, plan cancelled | | The app | No: there are no limits, teams or billing yet |

The last rows describe features Curatit doesn't have. Their copy (a five-post limit, a Team plan, what Free loses) is the designer's guess; match it to the real rules, and point their links (`/settings/billing`, `/settings/team`, `/invite/…`, which 404 today) at real pages, before sending any of them. Onboarding and the weekly edition are marketing email: send them as optional emails, which gives them a working unsubscribe link (see Unsubscribing).

## Unsubscribing

Optional emails (onboarding, the weekly edition, share link expiring, bookmark limit) carry an Unsubscribe link in the footer; the account emails (confirm, reset, verification code, change email, the two security notices), the welcome and the billing emails don't, because nobody can opt out of those. Send an optional email with `sendEmail({ ..., optional: "<email name>", react: (unsubscribeUrl) => <Template unsubscribeUrl={unsubscribeUrl} ... /> })`: it skips anyone who has unsubscribed, puts their own link in the footer, and adds the one-click `List-Unsubscribe` and `List-Unsubscribe-Post` headers Gmail and Yahoo ask bulk senders for. It doesn't send at all while it can't check the list or sign a link.

- The link is `/unsubscribe?t=<token>&s=<email name>`. The token is the address and an HMAC of it (`src/lib/unsubscribe.ts`, signed with `EMAIL_UNSUBSCRIBE_SECRET`, else `CURATIT_MCP_SIGNING_SECRET`), so the page knows whose address it is without a sign-in and an edited link is refused. Changing the secret breaks links in emails already sent.
- The page (`src/app/(auth)/unsubscribe`) names the address, asks why (optional: too many emails, not relevant to my work, I never signed up, something else, and a note of up to 500 characters) and unsubscribes on one button.
- Gmail's and Yahoo's own Unsubscribe buttons POST to `/api/unsubscribe` with the same token: no page, so no reason, and a reason given earlier is kept.
- Answers are in `public.email_unsubscribes` (email, reason, note, source, created and updated), one row per address, readable only with the secret key (Table Editor in Supabase). Deleting a row subscribes the address again.

Resend Broadcasts (the weekly edition) has its own list and unsubscribe page; pass `{{{RESEND_UNSUBSCRIBE_URL}}}` there instead.

## The verification code

No inbox runs scripts, so a button inside an email can't copy anything. The verification code email (`reauthentication.tsx`) has a Copy code button that opens `/code#<code>` on the site, which copies the code there (one tap where the browser wants one). The code rides in the `#` part of the address, which browsers never send to a server, and the page takes it out of the address once read. The code in the email is also set to select whole on one tap in Apple Mail and iOS Mail, and Gmail adds its own Copy button to codes it recognises.

## The welcome email

`sendWelcomeEmail()` runs inside `after()`, so no response waits on Resend, at the same two moments the analytics journey records a confirmed sign-up:

- `/auth/callback`, when the link confirmed the address within the last 15 minutes;
- the sign-up action, when the project doesn't confirm addresses and the account is signed in at once.

Its idempotency key is `welcome/<user id>`, so a second click on the link within 24 hours doesn't send it twice. It's the note: a hero of library posts (`hero`: scatter by default, or grid, board, carousel), three short paragraphs, Search the library, and Ammar's signature. It's sent from `EMAIL_FROM` with replies to `EMAIL_REPLY_TO`, else to the sender itself (Resend's Receiving inbox for curatit.app; since 2026-10-18 the Hotmail `SUPPORT_EMAIL` is no longer the default, because a free-mail Reply-To under a curatit.app sender is a common spam-filter penalty), carries no unsubscribe link (it's transactional), and its button opens the dashboard, since the person is signed in by then.

## Setup (the owner's steps)

1. **Resend.** The sending domain is `curatit.app` (bought on 2026-10-17, DNS on Vercel), set up in Resend in the Tokyo region (`ap-northeast-1`) with sending and receiving on: DKIM (`resend._domainkey`), SPF (`send` and `rsend` CNAMEs), the receiving MX on the root (mail to `@curatit.app` lands in Resend's inbox) and a monitor-only DMARC record (`_dmarc`, `p=none`). The app sends from `Curatit <hello@curatit.app>` unless `EMAIL_FROM` says otherwise. What's left: create an API key and set `RESEND_API_KEY` (and `EMAIL_REPLY_TO` if replies shouldn't go to `SUPPORT_EMAIL`) in Vercel and `.env.local`.
2. **Deploy `public/email/`**, so the images exist at `https://www.curatit.app/email/…`, and set `CURATIT_PUBLIC_BASE_URL=https://www.curatit.app` in Vercel (`docs/domain.md`; the links and images follow it).
3. **Supabase SMTP.** Authentication → Emails → SMTP settings: host `smtp.resend.com`, port `465`, username `resend`, password the Resend API key, sender `hello@curatit.app` (name Curatit). This also lifts the default sender's limit of a few emails an hour to team members only.
4. **Supabase templates.** Authentication → Emails → Templates: paste each file and set its subject.

   | Supabase template | File | Subject |
   | --- | --- | --- |
   | Confirm sign up | `supabase/templates/confirm-signup.html` | Confirm your email for Curatit |
   | Reset password | `supabase/templates/reset-password.html` | Reset your Curatit password |
   | Change email address | `supabase/templates/change-email.html` | Confirm your new email for Curatit |
   | Reauthentication | `supabase/templates/reauthentication.html` | Your Curatit verification code |
   | Password changed (security notification) | `supabase/templates/password-changed.html` | Your Curatit password was changed |
   | Email address changed (security notification) | `supabase/templates/email-changed.html` | Your Curatit email was changed |

   Security notifications are off by default; turn on those two. They ask people to reply if something's wrong, so the sender should be an inbox someone reads.

The confirm, reset and change-email templates don't link to `{{ .ConfirmationURL }}`. They link to `/auth/confirm?token_hash={{ .TokenHash }}&type=…&next={{ .RedirectTo }}`, a page with one button that posts the token to `/auth/callback`. Some mail providers (Outlook's Safe Links, for one) open every link in an email to scan it, which would use up a one-time link before the person clicks; a page that waits for a click can't be used up that way (Supabase's own advice on email prefetching). The confirm email shows no code, because Curatit has nowhere to type one. These token links also work in any browser, unlike the default templates' PKCE links, but the sign-up and reset screens still say "open it in this browser" while Supabase's default templates may be in use. The copy says links work for 1 hour; if the Email OTP expiry changes in Supabase, change `expiresIn` in the templates and render again.

## How the brand maps to email

- **Colour.** Monochrome, from the design system's neutral tokens (`src/emails/_components/tokens.ts`). Terracotta appears only in the symbol.
- **Type.** Hedvig Letters Serif for headings and the wordmark, Inter for the rest. Apple Mail and iOS Mail load both; Gmail and Outlook fall back to Iowan Old Style, Palatino or Georgia, and the system sans. Body text is 15px for reading on phones.
- **Dark mode.** Apple Mail, iOS Mail and Outlook.com use the dark tokens, and every image has a dark copy; Gmail's apps invert colours on their own.
- **Images** are PNG and JPG, never WebP, which Outlook for Windows can't show.
- **Voice.** Sentence case, no em dashes, counts first, second person.
