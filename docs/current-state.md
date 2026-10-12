# Current state audit: Curatit before the MCP build

Date: 12 October 2026. Read-only audit of the repository (branch `feat/mcp-server`, from `main` at `3181f04`), the production deployment, the Supabase project `ytxtwowgxmztaboxgdmq` (SELECT only) and the candidate endpoint named in the build specification. Secrets are named, never shown. Items that couldn't be verified say so.

## 1. Repository, framework, runtime, deployment

- Next.js 16.4.0 (App Router, React 19.3.0), Tailwind 4, TypeScript 6.0.3 (`strict`), zod 4.6.5, `@supabase/supabase-js` 2.117.3, `@supabase/ssr` 0.12.7, vitest 5.0.1. npm with `package-lock.json` v3; no `engines` field before this work (now `node >=20.19`). Local Node v24.19.0.
- Deployed on Vercel from `main` to `https://curatit.vercel.app` (Fluid compute; `maxDuration` default 300 s). `vercel.json` has one cron (`/api/cron/creative-reconcile`). The project's Deployment Protection scope is UNVERIFIED (needs the Vercel account); AGENTS.md records that preview URLs sit behind a Vercel login, so protocol testing happens on the production domain or a local server.
- No CI existed (`.github/` absent). No ESLint or Prettier.
- Routes under `src/app/`: marketing pages in `(site)`, auth pages in `(auth)`, the dashboard, `api/cron/creative-reconcile`, `auth/callback`, `rss.xml`. Nothing under `/mcp`, `/api/v1`, `/.well-known` or `/oauth` before this work.
- `src/proxy.ts` (Next 16's middleware) ran the Supabase session refresh on every path including the ones above; it only redirects `/dashboard*` (signed out), the signed-out-only pages (signed in) and `/?code=`. The MCP paths are now excluded from its matcher.

## 2. Existing MCP work

- **In this repository: none.** No MCP SDK, transport or server. The marketing site announces "a Curatit MCP server is on the way"; the roadmap lists it under Now.
- **In the database:** eight `public.curatit_mcp_*` SQL functions, applied by another session (two of them straight to the database and later fetched into `supabase/migrations`): `search`, `get_post`, `taxonomy`, `resolve_filter`, `catalog_stats` (v1) and `search_v2`, `get_post_v2`, `creative_terms` (v2, Creative Intelligence). All `security invoker`, `stable`, `search_path=''`, `statement_timeout=5s`, executable by `anon`, `authenticated` and `service_role`. Each filters to published posts and approved, published analyses itself, so they are safe under any role. Documented in `docs/creative-intelligence.md`.
- **Candidate endpoint `https://curatit-mcp.smammar.chatgpt.site/mcp`:** live, hosted on OpenAI's ChatGPT Sites (Cloudflare, `auth.openai.com` as authorization server, scope `openid resource.invoke email`). Every MCP request without an OpenAI/Sites token gets `401` with `WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource/mcp"`; that metadata document is served (200). Its public `/openapi.json` lists ten tools (`search_posts`, `list_categories`, `list_brands`, `get_catalog_stats`, `get_post`, `find_related_posts`, `get_post_image`, `get_carousel_slides`, `get_reference_set`, `get_post_images`) whose shapes match the v1 functions above (including the "Finance is an alias for Fintech" rule), so it is very probably backed by this Supabase project through the v1 functions; that link is UNVERIFIED (no Supabase URL appears in its bundle). Its source is not in this repository, it doesn't use the v2 Creative Intelligence functions, and its own page says "No external client application has been verified yet". **Decision:** it isn't reused. It depends on an OpenAI-managed identity that other hosts can't obtain, and its code isn't ours to change. The server built here lives in this repository at `https://curatit.vercel.app/mcp`.

## 3. Tables, views and column mapping

Row Level Security is on for every table; grants are explicit (`…_least_privilege_grants.sql`).

| Contract | Source | Notes |
| --- | --- | --- |
| Post | `instagram_posts` | `id` (Instagram numeric id, text), `short_code` (unique), `url`, `caption`, `alt`, `hashtags`, `posted_at`, `created_at` (import time), `format` (generated: static, carousel, video), `brand_id`, `is_published`, `scrape_run_id`, `likes_count`, `comments_count`, `video_view_count`, `dimensions_*` (Instagram originals), `raw` (the verbatim Apify item). No `platform` column: everything is Instagram. anon reads published rows, all columns. |
| Brand | `brands` | `id`, `name`, `slug`, `website_url`, `category_id` (one industry), `logo_path`. anon reads all. |
| Industry | `categories` | 7 rows. `post_categories` (multi-tag) exists with 0 rows. |
| Media | `post_images` keyed `(post_id, position)` | `bucket_id`, `path`; position 0 is the cover. **No media id, mime type, width, height or alt per file.** Alt per slide and Instagram's original size are on `instagram_post_media` (`alt`, `type` = `Video` for video slides, `dimensions_*`). The API composes a media id as `<post id>.<position>`. |
| Classification | `post_creative_labels` (dimension, slug, weight) for the current published version; `creative_taxonomy_terms` (245 terms, 16 dimensions, 13 filterable, version `2026.10.11-1`) | Dimensions: archetype, archetype_family, objective, hook_technique, narrative_pattern, typography, layout, imagery, palette, visual_device, tone, persuasion, cta (+ slide_role, level, type_weight, not filterable). **No theme/occasion dimension.** |
| Analysis | `post_analyses` (published, approved) + `post_slide_analyses` for the current version; `post_analysis_versions` editors only | 14 analyses: 11 published (prompts `2026.10.11-2` ×10, `2026.10.11-3` ×1), 3 `needs_review` on prompt `2026.10.12-1`. The v2 `creative` payload omits the 2.1/3.0 fields (`creative_decisions`, `integrity_notes`, `strategy_headline`, `colour_roles`, …); only one published analysis has any of them. |
| Metrics | `instagram_posts.likes_count`, `comments_count`, `video_view_count`; observation time is `scrape_runs.scraped_at` (editors only; readable as `service_role`) | v1/v2 functions return `observed_at: null`. The API reads `scraped_at` as `service_role`, filtered to published posts. |
| Entitlements | none | Only `profiles.role` (member, editor, admin). No organisations, plans, quotas or subscriptions; the pricing page enforces nothing. `Principal.organizationId` is always null; `entitlementVersion` is a constant. |

Live counts (12 Oct 2026): 162 published posts (112 carousels, 50 single images, 0 videos), 32 brands, 7 industries, 719 stored images, 11 published analyses.

**Finding worth fixing separately:** `anon` can SELECT `instagram_posts.raw` and `instagram_post_media.raw`, which hold the verbatim Apify items including `latestComments` (commenters' usernames and text) for 157 of 162 posts, even though `instagram_comments` is editors-only. Proven as `anon` in SQL; the PostgREST path wasn't exercised. Not changed here (it isn't an MCP behaviour; the API never returns `raw`), but a column-level `revoke select (raw)` migration is recommended.

## 4. Storage

- Bucket `library`, **public**, 10 MiB limit, `image/jpeg`, `image/png`, `image/webp`. Paths `<category>/<brand>/<static|carousel|video>/<short_code>/<NN>.webp` (NN = position + 1); logos at `logos/<slug>.webp`. anon can't list objects (no `storage.objects` policy); public URLs are `https://<ref>.supabase.co/storage/v1/object/public/library/<path>`.
- 787 objects, all `image/webp`: 719 post images (none missing, none over 1 MiB; mean 115 KB, max 450 KB), 32 logos, 36 orphans under `ecommerce/carousel/…` (the known stray Shopify copy). Files are at most 1080 px wide (WebP quality 80). **No width/height stored anywhere**; the API reads it from the WebP header with a 30-byte range request (verified: `Accept-Ranges: bytes`, 206).
- Image transformation is on: `/storage/v1/render/image/public/library/<path>?width=&height=&resize=contain` works (verified live) and returns `image/jpeg`.
- Signed URLs aren't needed: the bucket is public. Failed-image rate: 0 of 719 (every `post_images.path` has an object).

## 5. Search

- Full-text only: GIN on `instagram_posts.mcp_search` (`simple` config over caption, alt, owner), GIN on `post_analyses.creative_search` (`english`, weighted summary + creative_dna), GIN on hashtags; B-tree keyset indexes on `(posted_at, id)`, `(brand_id, …)`, `(format, …)`; label indexes `(dimension, slug, post_id)`.
- v2 ranks `2 × ts_rank(analysis) + ts_rank(caption) + 0.1 × Σ label weight`, ties by `posted_at desc`. Offset pagination, max 500. `websearch_to_tsquery` requires every word to match: the spec's example sentence returns 0 results; "launch" returns 5. No trigram, no `pgvector` (available, not installed), no embeddings.
- Known gap: an unknown `category` or `brand` returns an empty result rather than an error; the API resolves them first (`curatit_mcp_resolve_filter`) and refuses unknown ones.

## 6. Accounts, auth, OAuth

- Email + password through Supabase Auth; Google was built and removed. Confirm-email is on. 7 accounts.
- **Supabase's OAuth 2.1 server is off** for this project: `/.well-known/oauth-authorization-server/auth/v1` returns `404 feature_disabled`; the `auth.oauth_*` tables exist and are empty. OIDC discovery and JWKS answer; the JWKS holds one ES256 (P-256) key, so JWTs can be verified locally.
- When it is turned on (dashboard: Authentication › OAuth Server, Authorization Path `/oauth/consent`): tokens are JWTs with `iss=https://<ref>.supabase.co/auth/v1`, `aud="authenticated"`, `sub`, `client_id`. The `resource` parameter is accepted but ignored (`aud` can't be bound to `/mcp`; supabase/auth#2610, PR #2526 not merged), custom scopes aren't supported, CIMD isn't supported, DCR is a toggle, and issue #2820 reports a 400 for public clients sending `resource`/`offline_access`, which the big MCP hosts do. UNVERIFIED on this project while the server is off. See `docs/mcp/security.md` for how the build handles this.

## 7. Endpoint behaviour before this work

- `https://curatit.vercel.app/mcp`, `/.well-known/oauth-protected-resource[/mcp]`, `/.well-known/oauth-authorization-server`: clean 404 from the app's own not-found page; no Vercel login wall, no HTML challenge in front of them.

## 8. Migration plan and rollback

- One migration, `20261012165035_mcp_access_tokens.sql`: `public.api_tokens` (RLS, column grants), `public.curatit_api_token_verify` (service_role), `private.rate_limits` + `public.curatit_rate_limit_hit` (service_role). Tested in a rolled-back transaction against the linked project (every check passed); applied with `npx supabase db push` once approved.
- Rollback: `drop function public.curatit_rate_limit_hit(text, integer, integer); drop table private.rate_limits; drop function public.curatit_api_token_verify(text); drop table public.api_tokens;` and `delete from supabase_migrations.schema_migrations where version = '20261012165035'`. Nothing else in the schema is touched; no existing table or function changes.
- The server code is additive (new routes); rolling it back is reverting the deployment.
