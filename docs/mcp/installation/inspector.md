# MCP Inspector

Status: **untested against a deployment** (needs the applied migration and a token). This is the planned check; update it with the Inspector version and the output once run.

Remote, with a personal access token read from the environment (the value never appears on a command line):

```bash
npx @modelcontextprotocol/inspector --cli https://www.curatit.app/mcp --transport http --method tools/list --header "Authorization: Bearer $CURATIT_ACCESS_TOKEN"
```

A tool call:

```bash
npx @modelcontextprotocol/inspector --cli https://www.curatit.app/mcp --transport http --header "Authorization: Bearer $CURATIT_ACCESS_TOKEN" --method tools/call --tool-name curatit_search_posts --tool-arg query=launch --tool-arg limit=3
```

The bridge as a local command, from the repository after `npm run mcp:bridge:build`:

```bash
CURATIT_ACCESS_TOKEN=… npx @modelcontextprotocol/inspector node packages/mcp-bridge/dist/cli.js --server https://www.curatit.app/mcp
```

Expected: six tools (`curatit_get_taxonomy`, `curatit_search_posts`, `curatit_get_post`, `curatit_get_carousel`, `curatit_get_media`, `curatit_create_brief`); a search returns an envelope with `data.posts`. Images: `curatit_get_media` with `delivery=inline` shows an image block in the Inspector's result view.

Disconnect: close the Inspector; revoke the token at `/dashboard/settings/tokens` if it was made for the test.
