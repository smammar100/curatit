# REST and the model adapter

For applications without MCP support. Status: the REST routes run the same tool registry as MCP, so the tool tests cover them; a run against a deployment waits on a token.

## REST

Base `https://www.curatit.app/api/v1`, `Authorization: Bearer <token>`, JSON envelopes (`schema_version`, `request_id`, `data` or `error`, `warnings`, `provenance`). The document: `GET /api/v1/openapi.json` (no auth).

| Method | Route | Tool |
| --- | --- | --- |
| GET | `/taxonomy?dimension=` | `curatit_get_taxonomy` |
| POST | `/posts/search` (JSON body) | `curatit_search_posts` |
| GET | `/posts/{post_id}?detail_level=full` | `curatit_get_post` |
| GET | `/posts/{post_id}/carousel?start_slide=&limit=` | `curatit_get_carousel` |
| GET | `/media/{media_id}?delivery=inline` (the image bytes; metadata in `X-Curatit-Media`) | `curatit_get_media` |
| POST | `/briefs` | `curatit_create_brief` |

Query strings: `filters.layouts=framed-card,list-stack`; repeated keys make arrays; `true`, `false` and integers are typed.

```bash
curl -s https://www.curatit.app/api/v1/posts/search -H "Authorization: Bearer $CURATIT_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"filters":{"industries":["finance"],"formats":["carousel"]},"limit":3}'
```

## The model adapter

`packages/model-adapter` (build: `npm run mcp:adapter:build`) turns the OpenAPI document into function schemas (Anthropic and OpenAI shapes) and runs a bounded tool loop: each call the model asks for is checked against the allowlist, sent to REST with the token kept in the process, and its envelope handed back as data; the loop stops at its budget of iterations, calls and time.

```bash
CURATIT_ACCESS_TOKEN=… ANTHROPIC_API_KEY=… node packages/model-adapter/dist/cli.js --server https://www.curatit.app "Find three finance carousel posts and show their sources."
```

Tested with a scripted model (`tool-loop.test.ts`); not yet with a live model API.
