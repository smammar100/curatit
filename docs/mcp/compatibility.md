# Curatit MCP: compatibility report

Status as of 12 October 2026. A client is **passed** only when a real session initialized, listed tools and ran a tool call against real data; **blocked** when something outside this repository stops the test; **untested** otherwise. Nothing is inferred from one host to another.

## Server facts

- Pinned SDK: `@modelcontextprotocol/server` and `@modelcontextprotocol/client` **2.3.1** (zod 4.6.5). Serves both protocol eras the SDK supports: the 2025 line (`2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`, `2024-10-07`, negotiated at `initialize`) and `2026-07-28` (per-request, via `server/discover`). Transport: Streamable HTTP, stateless, POST only (`GET`/`DELETE` → 405, which the 2025-11-25 transport allows when no stream is offered). No deprecated HTTP+SSE transport.
- Endpoint: `https://curatit.vercel.app/mcp` once deployed. Protected Resource Metadata: `/.well-known/oauth-protected-resource/mcp` (and the root fallback).
- Credentials: personal access tokens today; Supabase OAuth once the project's OAuth server is on (`security.md`).

## Matrix

| Target | Route | Status | Evidence |
| --- | --- | --- | --- |
| Official SDK client (`@modelcontextprotocol/client` 2.3.1), in process | Streamable HTTP, bearer | **Passed** (2025 and 2026-07-28 negotiation): initialize, `tools/list` (6 tools with annotations and output schemas), `curatit_search_posts`, `curatit_get_post`, inline image, scope refusal, 401 challenge, 403 Origin, rate limit | `src/lib/mcp/mcp.test.ts`, 12 Oct 2026; whole suite 252 tests green |
| The services against the real catalog (read-only, no token needed) | Supabase repository | **Passed**: taxonomy (7+ industries, 30+ brands), search with alias resolution and signed-cursor paging, a real analysed carousel with its slides, a real image probed (WebP header), a brief | `tests/mcp/live.test.ts`, 12 Oct 2026, 3 tests green against project `ytxtwowgxmztaboxgdmq` |
| Official SDK client over the network against production (`https://curatit.vercel.app/mcp`) | Streamable HTTP, personal access token | **Passed** (12 Oct 2026, 2026-07-28 negotiation via `auto`): `scripts/mcp-smoke.ts` green (initialize, `tools/list` 6 tools, `curatit_search_posts`, `curatit_get_post`, metadata 200, health 200); plus `curatit_get_post` on a post with no analysis, `curatit_get_carousel`, `curatit_get_media` inline (image block, resized to 512px JPEG, 29 KB), `curatit_create_brief` (two references, one analysed, `method: deterministic_template`), REST `/api/v1/taxonomy`. Two faults found on the first run and fixed the same day: posts without an analysis (`null` from the catalog) and the rate-limit table's missing `service_role` grant | `scripts/mcp-smoke.ts` output; Vercel runtime logs (`tool.ok` / `tool.error` lines) |
| Stdio bridge (`packages/mcp-bridge`) with a local SDK client | stdio → Streamable HTTP | **Passed** in process (in-memory stdio pair → bridge → hosted handler): tools mirrored with annotations, calls and errors forwarded, token never leaves the `Authorization` header, no token → no start | `packages/mcp-bridge/src/bridge.test.ts` |
| MCP Inspector (CLI, `@modelcontextprotocol/inspector` latest on 12 Oct 2026) | Remote URL + bearer header | **Passed**: `--cli https://curatit.vercel.app/mcp --transport http --method tools/list` lists the six tools with titles, descriptions and schemas; `tools/call curatit_search_posts query=launch limit=2` returns two real posts (H&M, ChatGPT). Through the bridge as a stdio command: not completed, the CLI's `-e` env passing didn't reach the bridge in the forms tried; the Inspector UI with the bridge is untested | terminal output, 12 Oct 2026 |
| Claude Desktop / Claude.ai connectors | Remote URL (OAuth) or the bridge (command + env token) | Untested. The remote route needs Supabase's OAuth server on; the bridge route needs the built CLI on the machine | |
| Claude Code | Remote (`claude mcp add --transport http curatit https://curatit.vercel.app/mcp --header "Authorization: Bearer …"`) or the bridge | Untested | |
| Cursor | Remote URL with headers, or the bridge | Untested | |
| VS Code (Copilot MCP) | Remote URL, or the bridge | Untested | |
| ChatGPT connectors | Remote MCP with OAuth | Untested; ChatGPT requires OAuth (no bearer headers), so this waits on Supabase's OAuth server and issue #2820 | |
| Local agent with a local model | The bridge (stdio) or the REST adapter | Untested | |
| Custom hosted-model application | `packages/model-adapter` (REST + function calling) | **Passed** with a scripted model (loop, allowlist, credential isolation, budget) | `packages/model-adapter/src/tool-loop.test.ts`; no run with a live model API yet |

## Image behaviour

`curatit_get_media` returns a link by default and an MCP `image` content block with `delivery=inline` (WebP, at most 1024 px and 1 MiB; larger files are resized through Storage and come back as JPEG). Whether a host shows the block to its model is the host's own capability; text-only hosts receive the metadata and alt text. Verified in process only.

## How to update this report

Run the client, record the application version, the date, transport, auth method, what tool ran and what came back, and change the row. A screenshot or the smoke script's output is the evidence.
