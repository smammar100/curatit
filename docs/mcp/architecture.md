# Curatit MCP: architecture

Decision record for the server built on 12 October 2026 from `CURATIT_UNIVERSAL_MCP_BUILD_SPEC.md`. The audit it rests on is `docs/current-state.md`.

## Where it lives

Inside the Next.js app, on the production domain, rather than as a separate service. The reasons: the official MCP TypeScript SDK v2 serves a web-standard `fetch(Request)` handler, which is exactly what a Next route handler is; the catalog's database functions, Supabase clients, auth and deployment already exist here; and one deployment means one set of secrets, one CI and one domain for OAuth discovery (`https://curatit.vercel.app/.well-known/oauth-protected-resource/mcp`). The server's code is `src/lib/mcp/`, with thin route files:

| Route | File | What |
| --- | --- | --- |
| `POST /mcp` (GET, DELETE → 405) | `src/app/mcp/route.ts` | The MCP endpoint, Streamable HTTP, stateless |
| `GET /.well-known/oauth-protected-resource[/mcp]` | `src/app/.well-known/oauth-protected-resource/**` | RFC 9728 Protected Resource Metadata |
| `/api/v1/*` | `src/app/api/v1/**` | REST face of the same tools, plus `openapi.json` and health |
| `/oauth/consent` | `src/app/(auth)/oauth/consent` | Supabase OAuth consent screen (once the OAuth server is on) |
| `/dashboard/settings/tokens` | `src/app/dashboard/settings/tokens` | Personal access tokens |

## Layers

```
Transports                 src/lib/mcp/http.ts (MCP), rest.ts (REST), packages/mcp-bridge (stdio)
  ↓ Principal              auth/verifier.ts → auth/pat.ts | auth/oauth.ts → auth/principal.ts
Tool registry              tools.ts: scope check → rate limit → service → envelope
Services (no MCP types)    services/{taxonomy,search,post,media,brief}.ts
Repository                 repo/types.ts (contract), repo/supabase.ts, repo/fixture.ts (tests)
Contracts                  contracts.ts (zod, one source for MCP schemas, REST validation, OpenAPI)
```

- **Stateless.** One `McpServer` per request from `createMcpHandler(factory, { legacy: "stateless" })`, which serves both the 2025-era (initialize / tools/list / tools/call over JSON-RPC) and the 2026-07-28 per-request protocol. No sessions, no SSE stream to resume, no Redis; replicas share nothing but the database. GET and DELETE on `/mcp` get `405` as the 2025-11-25 transport allows when no stream is offered.
- **Auth at the HTTP boundary.** `requireBearerAuth` (SDK) with one verifier for both credential kinds. The SDK entry never reads headers itself; it receives the verified `AuthInfo`, whose `extra.principal` is the `Principal` tools read.
- **Catalog reads under RLS.** The repository calls the `curatit_mcp_*` functions and tables with the publishable key, so Row Level Security decides visibility (published posts, published analyses). The secret key is used for exactly three things, all server-side: verifying a personal access token, the rate-limit counter, and the metrics' observation time (`scrape_runs`, editors-only under RLS, filtered to published posts by hand).
- **Shared tool registry.** `executeTool()` runs a tool for a principal; MCP (`server.ts`) and REST (`rest.ts`) both call it, so the two surfaces can't diverge. The REST adapter's OpenAPI is generated from the same zod contracts (`openapi.ts`).
- **Errors.** `CuratitError` with the spec's codes. MCP returns tool failures as `isError: true` with the error envelope as structured content; protocol errors stay protocol errors; auth failures are the SDK's 401/403 challenges. REST maps codes to statuses and sets `Retry-After`.

## Data mapping decisions

- Post ids are Instagram's numeric ids (the catalog's primary key); every tool also accepts the short code and resolves it.
- Media ids are `<post id>.<slide index>`, zero-based, composed from `post_images (post_id, position)` since the catalog has no media id. Human labels count from 1.
- The taxonomy's dimensions are exposed under plainer public names (`goal` = `objective`, `creative_approach` = `archetype`, `approach_family` = `archetype_family`); the search filters are plural keys (`goals`, `layouts`, …) mapped to the catalog's names. Industries, brands and formats take one value per search because the catalog's function does; the creative dimensions take up to ten alternatives.
- Image sizes come from the WebP header (30-byte range request), since the catalog stores none. Inline delivery over 1024 px or 1 MiB goes through Storage's resizer (`render/image`, returns JPEG).
- Metrics' `observed_at` is `scrape_runs.scraped_at`; it is null (and named under `missing`) when it can't be read.

## Retrieval

Full-text (`websearch_to_tsquery`) plus taxonomy filters, through `curatit_mcp_search_v2`, ranked by the function. No semantic retrieval: no embeddings exist and the spec says to add them only when an evaluation shows benefit. Two things the API adds: `query_mode: "any_word"` (explicit, reported back) for natural-language queries the all-words default can't match, and `suggestions` on an empty page instead of silent relaxation. Cursors are HMAC-signed and bound to the search and the account.

## Brief generation

Deterministic (`services/brief.ts`): observed facts (on-slide text, labels, slide roles, captions), inferred points (the published analysis's hypotheses and takeaways) and recommendations (templated proposals) stay in separate fields. No model runs; `method: "deterministic_template"` says so. A model-backed brief would go behind a provider adapter with a budget and an audit trail, as the spec describes; it isn't built.

## Not built (by design or blocked)

- Resources and prompts: tools carry everything.
- Semantic search, boards over MCP (scopes reserved: `curatit:boards:*`).
- An authorization server of our own: Supabase Auth's is the one to use once enabled; see `security.md` for the gaps that remain.
- Server-side model calls.
