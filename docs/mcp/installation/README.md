# Connecting to Curatit's MCP server

One server, three ways in:

1. **Remote MCP** at `https://curatit.vercel.app/mcp` (Streamable HTTP). Send a Curatit personal access token as `Authorization: Bearer …`. Hosts that only speak OAuth need the project's OAuth server, which isn't on yet (`../security.md`).
2. **The stdio bridge**, for hosts that launch a local command: `packages/mcp-bridge` (build it with `npm run mcp:bridge:build`; it isn't on npm). It reads the token from `CURATIT_ACCESS_TOKEN` and forwards to the remote server.
3. **REST** at `https://curatit.vercel.app/api/v1` with the same token, described by `/api/v1/openapi.json`, for applications without MCP; `packages/model-adapter` is a reference tool loop over it.

**Get a token:** sign in, open the account menu → API tokens (`/dashboard/settings/tokens`), create one with the scopes you need (`curatit:read` for research, `curatit:brief` for briefs). It's shown once. Revoke it from the same page.

**Smoke-test prompt** for any host: *Find three finance carousel posts and show their sources.* The host should call `curatit_get_taxonomy` or go straight to `curatit_search_posts` with `filters.industries: ["finance"]`, `filters.formats: ["carousel"]`, `limit: 3`, and answer with three Instagram URLs.

**Keep the token out of files you commit, screenshots and prompts.** The guides below put it in the environment.

Per-client guides, each marked with its test status:

- [MCP Inspector](inspector.md) (the reference client)
- [Claude Desktop and Claude.ai](claude-desktop.md)
- [Claude Code](claude-code.md)
- [Cursor](cursor.md)
- [VS Code](vscode.md)
- [ChatGPT](chatgpt.md)
- [REST and the model adapter](rest.md)

Until a guide says "tested", its configuration is illustrative, written from the client's public documentation on 12 October 2026, and may need a tweak for your version.
