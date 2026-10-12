# Curatit MCP: security

## Credentials

Two kinds, one `Principal`:

**Personal access tokens** (`curatit_pat_` + 32 random bytes, base64url). Made at `/dashboard/settings/tokens` by the signed-in member in the browser; the SHA-256 goes to `public.api_tokens` and the secret is shown once. Scopes `curatit:read` and/or `curatit:brief`; expiry 30 to 365 days (a check on the table); revocable. The server checks a token with `curatit_api_token_verify` as `service_role`, which answers one way for unknown, revoked and expired tokens and records `last_used_at`. Owners can read their own rows (never the hash column) and update only `name` and `revoked_at` (column grants). A token can't exceed its owner: both scopes map to what every member may read.

**OAuth access tokens** from Supabase Auth's OAuth 2.1 server, when `CURATIT_OAUTH_ISSUER` is set. Verified with `jose` against the issuer's JWKS (ES256/RS256), exact `iss`, `exp` with 30 s tolerance, `aud = "authenticated"`, and a `client_id` claim, which only OAuth-issued tokens carry, so a first-party browser session JWT is refused. OAuth principals get both scopes (Supabase has no custom scopes).

Anything else is `401 invalid_token` with `WWW-Authenticate: Bearer resource_metadata="https://<host>/.well-known/oauth-protected-resource/mcp", scope="curatit:read curatit:brief"`.

## OAuth: what works, what doesn't, and the deviation

Supabase's OAuth server is **off** on the project today. To turn it on: Supabase dashboard → Authentication → OAuth Server → enable, Authorization Path `/oauth/consent`; decide on Dynamic Client Registration (a toggle; any MCP client can then register); set `CURATIT_OAUTH_ISSUER=https://ytxtwowgxmztaboxgdmq.supabase.co/auth/v1` on Vercel. The consent page (`/oauth/consent`) is built and uses `supabase.auth.oauth.getAuthorizationDetails / approveAuthorization / denyAuthorization` (supabase-js 2.117.3). Nothing in this repository can flip the dashboard setting.

Known upstream limits, recorded rather than hidden:

- **Audience.** The MCP spec says a resource server MUST validate the token's audience. Supabase sets `aud` to `"authenticated"` for every token and ignores RFC 8707 `resource` (supabase/auth#2610). Mitigation: exact issuer plus `client_id` plus RLS. A token issued by Curatit's Supabase project for an OAuth client is valid for Curatit's Supabase API and for this server, and nothing else; there is no third audience it could be replayed to. This is a documented deviation until Supabase binds `aud`.
- **Scopes.** No custom scopes; consent shows Supabase's own (`email`, `profile`, …). Curatit's scopes apply to tokens, not to consent.
- **Client registration.** Pre-registration through the admin API works; DCR is a toggle; CIMD isn't supported (#2850), so each DCR reconnect creates a client.
- **Issue #2820** reports `GET /oauth/authorizations/{id}` answering 400 for public clients that send `resource` or `offline_access`, which Claude and ChatGPT do. Unverified here (the server is off). If it reproduces, OAuth from those hosts is blocked on Supabase and personal access tokens remain the path.
- The `scope` claim inside the JWT is unverified; the server doesn't depend on it.

## Authorization and isolation

- There is one tenant and the catalog is the same for every member; the private data this server could reach (boards) is out of scope and no tool touches it. `organizationId` is null on every principal.
- Reads go through the publishable key: RLS returns published posts and published, approved analyses only. The three `service_role` uses are listed in `architecture.md`; each filters to published rows explicitly.
- Every tool call checks the principal's scope; `curatit_create_brief` needs `curatit:brief`. A missing scope is a tool error (`FORBIDDEN`), so `tools/list` still works for a read-only token.
- Search cursors are HMAC-signed over the offset, a fingerprint of the search and the principal key: another account's or another search's cursor is refused (`INVALID_ARGUMENT`).
- Caches: none that hold protected content. Taxonomy and catalog data are public-under-RLS and read per request.

## Transport

- Origin: a present, foreign `Origin` gets `403` (`originValidationResponse`); allowed hostnames are the base URL's plus `CURATIT_ALLOWED_ORIGINS`. Server-side clients send no Origin and pass.
- Host: Vercel terminates TLS and routes by host; the app doesn't rebind.
- `MCP-Protocol-Version`: the SDK answers `400` for unsupported values and assumes 2025-03-26 when absent.
- Bodies: the SDK caps request bodies (4 MiB); REST caps at 64 KiB.
- The session proxy (`src/proxy.ts`) no longer runs on `/mcp`, `/api/v1/*` or `/.well-known/*`, so no cookie session can confuse a bearer request.

## Media

`curatit_get_media` resolves a media id to a published post's own stored file and never fetches a caller-supplied URL. Only `image/webp`, `image/jpeg`, `image/png` are served; inline bytes are capped at 1 MiB and 1024 px (resized through Storage's own resizer). The bucket is public, so URLs are public and carry no credential; there are no signed URLs to redact.

## Prompt injection and untrusted data

Captions, on-slide text, alt text and analyses are third-party data. The server's instructions and tool descriptions are fixed strings in `server.ts` and `tools.ts`; nothing scraped is ever inserted into them. Tool results carry the data in `structuredContent` and a plain-text summary; the brief service quotes on-slide text inside "Observed" fields and marks it as such. Tests check that an instruction-shaped query reaches the catalog as a query and changes nothing.

## Logging

One JSON line per call with request id, tool, outcome code, duration, credential kind and a pseudonymous account (first 12 hex chars of SHA-256 of the user id). `redact()` strips `curatit_pat_…`, `Bearer …`, JWTs and `token=`/`signature=` query values from every logged value, and keys named like secrets are dropped. Request bodies and briefs aren't logged.

## Rate limits

60 reads and 10 briefs a minute per account, counted in Postgres (shared by every replica); 5 calls in flight per account per replica. If the counter can't be reached, reads continue and briefs are refused (`UPSTREAM_UNAVAILABLE`, `Retry-After: 30`).

## Findings outside this build

- `anon` can read `instagram_posts.raw` (commenters' data inside). Recommend a `revoke select (raw)` migration. See `docs/current-state.md` §3.
- `post_creative_labels` and `post_slide_analyses` policies check the analysis's publication but not the post's `is_published`; harmless today (every post is published), worth tightening.
