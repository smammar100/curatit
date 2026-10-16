# Curatit MCP: operations

## Configuration

Set on Vercel (Project → Settings → Environment Variables) or in `.env.local`; names only here, values never in the repository.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Catalog reads under RLS (already set) |
| `SUPABASE_SECRET_KEY` | yes | Token verification, rate limits, metrics' observation time (service_role; never in a browser or the bridge) |
| `CURATIT_PUBLIC_BASE_URL` | production | The canonical origin, `https://curatit.vercel.app`; resource metadata and CORS derive from it |
| `CURATIT_MCP_SIGNING_SECRET` | production | Signs search cursors; `openssl rand -hex 32` |
| `CURATIT_OAUTH_ISSUER` | no | `https://ytxtwowgxmztaboxgdmq.supabase.co/auth/v1` once Supabase's OAuth server is on; unset keeps OAuth off |
| `CURATIT_ALLOWED_ORIGINS` | no | Extra browser origins for `/mcp`, comma-separated |
| `CURATIT_LOG_LEVEL` | no | `debug`, `info` (default), `warn`, `error` |

`loadConfig()` (`src/lib/mcp/config.ts`) checks all of this on the first request and fails with the variable's name. In development the base URL defaults to `http://localhost:3000` and the signing secret to a random per-process value.

## Deploy

Vercel, from `main`, like the rest of the site. Routes under `/mcp` and `/api/v1` are dynamic (`force-dynamic`), `maxDuration` 60 s. No extra infrastructure: no Redis, no separate process. Rollback is Vercel's "promote previous deployment"; the routes are additive.

Database: the MCP reads through these migrations, each applied with `npx supabase db push` after a run inside `begin; … rollback;` (the matching test under `supabase/tests/` takes the migration pasted at its `-- @migration` marker):

| Migration | What | Applied |
|---|---|---|
| `20261009201007_curatit_mcp_read_api` | `curatit_mcp_search`, `_get_post`, `_taxonomy`, `_resolve_filter`, `_catalog_stats` (v1) | 9 Oct 2026 |
| `20261010131334_curatit_mcp_discovery_v2` | discovery additions | 10 Oct 2026 |
| `20261011131743_creative_mcp_v2` | `curatit_mcp_search_v2`, `_get_post_v2`, `_creative_terms` | 11 Oct 2026 |
| `20261012165035_mcp_access_tokens` | `api_tokens`, `curatit_api_token_verify`, `curatit_rate_limit_hit` | 12 Oct 2026 |
| `20261012174923_mcp_rate_limits_grants` | empty; recorded by mistake, kept so the history matches | 12 Oct 2026 |
| `20261012180633_mcp_rate_limits_grant_service_role` | the limiter's grant | 12 Oct 2026 |
| `20261013153131_mcp_main_category_first` | a post's categories main first | 13 Oct 2026 |
| `20261016120000_hide_scrape_raw_columns` | `raw` and `first_comment` hidden from the public key | 16 Oct 2026 |
| `20261016120100_api_token_verify_hardening` | use noted once a minute, banned owners refused, revocation one-way | 16 Oct 2026 |
| `20261016120200_creative_mcp_analysis_v3` | the 3.0 analysis in the MCP's reads | not yet |
| `20261016120300_mcp_category_resolution` | loose category and brand names, taxonomy counts | not yet |
| `20261016120400_mcp_search_v2_reasons` | public names in match reasons, `catalog_marker` | not yet |

The code reads the old and the new shapes, so it can be deployed before or after the last three. Rollback: the code is Vercel's "promote previous deployment"; a function change is rolled back by re-running the previous definition, which each migration's header names (the SQL in `docs/current-state.md` §8 drops only `api_tokens` and the rate-limit table, which kills every client's token: never run it to undo a function change). After applying, regenerate `src/lib/database.types.ts` with `npx supabase gen types typescript --linked > src/lib/database.types.ts` (the hand-written `api_tokens` entry matches what it generates).

## Health

- `GET /api/v1/health/live` → `{"status":"ok"}`: the process is up.
- `GET /api/v1/health/ready` → `{"status":"ready"}` or `503 {"status":"not_ready"}`: a cheap catalog read answered.
- A real check is a tool call: initialize → `tools/list` → `curatit_search_posts` with a small query → `curatit_get_post` on a known id, with a restricted test token. `scripts/mcp-smoke.ts` does exactly that (`npm run mcp:smoke -- --server https://curatit.vercel.app`, token from `CURATIT_ACCESS_TOKEN`); run it after every deploy, and on a schedule if a monitor can run Node.

## Logs and metrics

Structured JSON on stdout (Vercel's runtime logs): `event` is `tool.ok`, `tool.error` (with `code`), `ratelimit.store_unavailable`, `mcp.transport` or `health.not_ready`; every line has `request_id`, `tool`, `ms`, `account` (pseudonymous) and `credential`. Count `tool.error` by `code`: `UPSTREAM_UNAVAILABLE` and `TIMEOUT` mean the catalog or Storage; `UNAUTHENTICATED` spikes at the HTTP boundary show in Vercel's 401 counts rather than here. Alert on sustained 401s with valid tokens (JWKS or the verify function failing) separately from 5xx (database). Retention is Vercel's default; nothing personal beyond the pseudonym is logged.

## Limits

| Setting | Value | Where |
| --- | --- | --- |
| Search and post timeout | 10 s per database call | `repo/supabase.ts` |
| Brief | runs up to 8 post reads, 60 s route cap | `api/v1/briefs/route.ts` |
| Search page | 8 default, 20 max | `contracts.ts` |
| Inline image | 1024 px, 1 MiB | `services/media.ts` |
| Reads / briefs per account | 60 / 10 a minute | `ratelimit.ts` |
| Concurrent calls per account | 5 per replica | `ratelimit.ts` |

These are the spec's initial targets, not measured production figures; no load test has run yet.

## Failures

| Symptom | Check | Likely layer |
| --- | --- | --- |
| 401 on everything | `WWW-Authenticate` header present? Token revoked or expired? `SUPABASE_SECRET_KEY` set? | Credentials |
| 401 with OAuth tokens only | `CURATIT_OAUTH_ISSUER` matches the token's `iss`; JWKS reachable | OAuth |
| 403 on `/mcp` | A browser `Origin` not in the allow list | Transport |
| `UPSTREAM_UNAVAILABLE` everywhere | Supabase status; `health/ready` | Database |
| Briefs refused, reads fine | Rate-limit function failing (`ratelimit.store_unavailable` in logs) | Database |
| Search finds nothing | `applied` filters in the result; taxonomy values; `query_mode` | Data |
| HTML from `/mcp` | Vercel Deployment Protection on a non-production URL | Hosting |
| One replica differs | Shouldn't: nothing is in-process but the concurrency cap | Scaling |

## Tests

- `npm test`: unit tests for every service against the fixture catalog, the MCP surface end to end with the pinned SDK client in both protocol eras, the HTTP boundary (challenges, origins, scopes, rate limits), the bridge and the model adapter.
- `npm run test:mcp:live`: the services against the real catalog, read-only (needs `.env.local`).
- `npm run mcp:smoke`: an authenticated run against a deployment (needs a token).
- `npm run creative:test-db` is unrelated; the migration here was tested with its own rolled-back script.

## Every authenticated call answers 500

A `500 server_error` on `/mcp` and `/api/v1/*` for every token, while `/api/v1/health/live` is fine, means the token check itself failed: look for `auth.verify_failed` in the logs. Causes, in order: `SUPABASE_SECRET_KEY` rotated in Supabase but not on Vercel; the `service_role` grant on `curatit_api_token_verify` missing after a migration. (A read-only database no longer causes it: the check survives that since 16 Oct 2026.) `/api/v1/health/ready` runs the same check (since 17 Oct 2026) and answers 503 in that state, so a monitor on it sees the outage.

One noisy token: revoke it at `/dashboard/settings/tokens` (the owner) or by setting `revoked_at` on its `api_tokens` row as `service_role`. The limits themselves (60 reads and 10 briefs a minute per account, 5 in flight, a 25 s call budget) are constants in `src/lib/mcp/ratelimit.ts` and `deadline.ts`, changed with a deploy.

## Preview deployments

`NODE_ENV` is `production` on every Vercel build, so a Preview deployment needs `CURATIT_PUBLIC_BASE_URL` and `CURATIT_MCP_SIGNING_SECRET` set for the Preview environment too, or the first `/mcp`, `/api/v1/*` or `/.well-known/*` request fails with `Missing …`. A preview that reuses the production base URL names production in its allowed origins and in the RFC 9728 `resource`, so browser clients on the preview host get 403 and the metadata is wrong for it. Previews also sit behind Vercel's Deployment Protection, so MCP clients can't reach them: test the bridge and `npm run mcp:smoke` against production, and the services with `npm run test:mcp:live`.
