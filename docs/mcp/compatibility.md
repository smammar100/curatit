# Curatit MCP: compatibility report

Status as of 12 October 2026. A client is **passed** only when a real session initialized, listed tools and ran a tool call against real data; **blocked** when something outside this repository stops the test; **untested** otherwise. Nothing is inferred from one host to another.

## Server facts

- Pinned SDK: `@modelcontextprotocol/server` and `@modelcontextprotocol/client` **2.3.1** (zod 4.6.5). Serves both protocol eras the SDK supports: the 2025 line (`2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`, `2024-10-07`, negotiated at `initialize`) and `2026-07-28` (per-request, via `server/discover`). Transport: Streamable HTTP, stateless, POST only (`GET`/`DELETE` → 405, which the 2025-11-25 transport allows when no stream is offered). No deprecated HTTP+SSE transport.
- Endpoint: `https://www.curatit.app/mcp` (since 17 October 2026; `https://curatit.vercel.app/mcp`, where the tests below ran, serves the same deployment and keeps working, `../domain.md`). Protected Resource Metadata: `/.well-known/oauth-protected-resource/mcp` (and the root fallback).
- Credentials: personal access tokens today; Supabase OAuth once the project's OAuth server is on (`security.md`).
- Contract: envelope `schema_version` **1.1** (13 October 2026). 1.1 only adds fields, so a client written for 1.0 keeps working; it should read `schema_version` as "at least", not "exactly".

## Contract 1.1 (13 October 2026)

What 1.1 added to 1.0, all additive:

- **The 3.0 analysis** on `curatit_get_post`, built with the post page's own code (`toPublicAnalysis`), so the MCP and the website say the same thing. Summary: `strategy_headline` (the concept before 3.0), `strategy_summary`, `creative_formula`, `decisions` (title, explanation, observation, effect, principle, `watch_out`, confidence, and the slides it rests on as zero-based `slides`, a `slides_label` such as "Slides 1–2, 6", and `on_caption`), `data_checks` (concerns first, status `observed`, `potential_concern` or `cannot_verify`; no figure was checked against a source), `application` (when to use it and when not), `caveats` and `needs_review`. Full adds `visual` (six dimensions, each an insight, attributes and slides), `colour_roles` (measured from the images, not brand tokens; placeholder roles are null), `copywriting` and `brief_markdown` (the post page's copy brief). Slide records gain `body`, `legibility`, measured `colours`, `blank` and `changes`, and a slide's `role` is in words ("Hook").
- **Categories, main + tag.** The library has 28 categories. A brand has one main category (`industry`) and its posts may be tagged with more, so a post can be in several: `post.categories` lists them all, main first, each with `main`. The `industries` filter matches a main category or a tag.
- **Classification** fills `approach_family` and adds `tones`, `persuasion` and `cta`. Values that say nothing (`unknown`, `none`, `other`) are left out everywhere. `confidence` stays and is always null; each decision has its own.
- **Inputs.** Filter values take slugs, labels or synonyms (the catalog resolves them; `applied.filters` reports the slug), up to 100 characters. `query` is at most 300 characters, as the database allows. Free text with control characters or unpaired surrogates is refused. A single-value filter given two values says "takes one value". `output_format` takes `prompt`. Defaults appear in the published JSON Schemas.
- **Fields declared for later**, optional until a release fills them: `categories` and `strategy_headline` on search hits, `main_posts` on taxonomy values, `populated` on taxonomy dimensions, `verbose` on the taxonomy input, and `watch_out` and `application` on the brief.

## Matrix

| Target | Route | Status | Evidence |
| --- | --- | --- | --- |
| Official SDK client (`@modelcontextprotocol/client` 2.3.1), in process | Streamable HTTP, bearer | **Passed** (2025 and 2026-07-28 negotiation): initialize, `tools/list` (6 tools with annotations and output schemas), `curatit_search_posts`, `curatit_get_post`, inline image, scope refusal, 401 challenge, 403 Origin, rate limit | `src/lib/mcp/mcp.test.ts`, 12 Oct 2026; whole suite 252 tests green |
| The services against the real catalog (read-only, no token needed) | Supabase repository | **Passed**: taxonomy (28 categories, main + tag; 30+ brands), search with alias resolution and signed-cursor paging, a tag category's posts listing it, a real analysed carousel with its slides, a real image probed (WebP header), a brief, and every published post (162) through `curatit_get_post` at summary and full and every `curatit_get_carousel` page, each held to the tool's output schema. Inputs go through each tool's own schema first. The two 3.0 checks (decisions on every analysis, the copy brief) run once `20261016120200_creative_mcp_analysis_v3` is applied and are skipped, by name, until then | `tests/mcp/live.test.ts`, 13 Oct 2026, 4 tests green and 2 skipped against project `ytxtwowgxmztaboxgdmq`; the 3.0 output checked over all 162 posts from a rolled-back run of the migration |
| Official SDK client over the network against production (`https://curatit.vercel.app/mcp`) | Streamable HTTP, personal access token | **Passed** (12 Oct 2026, 2026-07-28 negotiation via `auto`): `scripts/mcp-smoke.ts` green (initialize, `tools/list` 6 tools, `curatit_search_posts`, `curatit_get_post`, metadata 200, health 200); plus `curatit_get_post` on a post with no analysis, `curatit_get_carousel`, `curatit_get_media` inline (image block, resized to 512px JPEG, 29 KB), `curatit_create_brief` (two references, one analysed, `method: deterministic_template`), REST `/api/v1/taxonomy`. Two faults found on the first run and fixed the same day: posts without an analysis (`null` from the catalog) and the rate-limit table's missing `service_role` grant | `scripts/mcp-smoke.ts` output; Vercel runtime logs (`tool.ok` / `tool.error` lines) |
| Stdio bridge (`packages/mcp-bridge`) with a local SDK client | stdio → Streamable HTTP | **Passed** in process (in-memory stdio pair → bridge → hosted handler): tools mirrored with annotations, calls and errors forwarded, token never leaves the `Authorization` header, no token → no start | `packages/mcp-bridge/src/bridge.test.ts` |
| MCP Inspector (CLI, `@modelcontextprotocol/inspector` latest on 12 Oct 2026) | Remote URL + bearer header | **Passed**: `--cli https://curatit.vercel.app/mcp --transport http --method tools/list` lists the six tools with titles, descriptions and schemas; `tools/call curatit_search_posts query=launch limit=2` returns two real posts (H&M, ChatGPT). Through the bridge as a stdio command: not completed, the CLI's `-e` env passing didn't reach the bridge in the forms tried; the Inspector UI with the bridge is untested | terminal output, 12 Oct 2026 |
| Claude Desktop / Claude.ai connectors | Remote URL (OAuth) or the bridge (command + env token) | **Connected** through OAuth: Claude registered itself (dynamic registration, a confidential client) and was allowed on 12 Oct 2026, and its session was still refreshing on 18 Oct. Tool calls weren't checked one by one. The bridge route is untested | `auth.oauth_clients`, `auth.oauth_consents`, `auth.sessions` (18 Oct 2026) |
| Claude Code | Remote (`claude mcp add --transport http curatit https://www.curatit.app/mcp --header "Authorization: Bearer …"`) or the bridge | Untested | |
| Cursor | Remote URL with headers, or the bridge | Untested | |
| VS Code (Copilot MCP) | Remote URL, or the bridge | Untested | |
| ChatGPT connectors | Remote MCP with OAuth | **Connected** through OAuth: registered (public client) and allowed on 12 Oct 2026, session refreshing until 16 Oct, so issue #2820 didn't stop it. Tool calls weren't checked one by one. ChatGPT now adds servers under Plugins → + → Add custom MCP server | `auth.oauth_clients`, `auth.sessions` (18 Oct 2026) |
| Local agent with a local model | The bridge (stdio) or the REST adapter | Untested | |
| Custom hosted-model application | `packages/model-adapter` (REST + function calling) | **Passed** with a scripted model (loop, allowlist, credential isolation, budget) | `packages/model-adapter/src/tool-loop.test.ts`; no run with a live model API yet |

## Image behaviour

`curatit_get_media` returns a link by default and an MCP `image` content block with `delivery=inline` (WebP, at most 1024 px and 1 MiB; larger files are resized through Storage and come back as JPEG). Whether a host shows the block to its model is the host's own capability; text-only hosts receive the metadata and alt text. Verified in process only.

## How to update this report

Run the client, record the application version, the date, transport, auth method, what tool ran and what came back, and change the row. A screenshot or the smoke script's output is the evidence.
