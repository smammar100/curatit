# Claude Desktop and Claude.ai

Status: **untested**. The configuration is illustrative, written from Anthropic's documentation on 12 October 2026; check it against your version.

## Claude Desktop, through the bridge (local command)

Prerequisites: Node 20.19 or newer, this repository built (`npm install && npm run mcp:bridge:build`), a personal access token from `/dashboard/settings/tokens`.

Settings → Developer → Edit Config opens `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "curatit": {
      "command": "node",
      "args": ["/absolute/path/to/Curatit/packages/mcp-bridge/dist/cli.js", "--server", "https://www.curatit.app/mcp"],
      "env": { "CURATIT_ACCESS_TOKEN": "your token, kept in this file only, never committed" }
    }
  }
}
```

Restart Claude Desktop. The six Curatit tools appear under the tools icon. Smoke test: *Find three finance carousel posts and show their sources.*

Images: Claude Desktop renders image content blocks, so `curatit_get_media` with `delivery=inline` lets Claude look at a slide. Untested here.

## Claude.ai and Claude Desktop custom connectors (remote URL)

Custom connectors sign in with OAuth against the authorization server the MCP server advertises. That needs Supabase's OAuth server turned on for the project (see `../security.md`). Until then, use the bridge.

## Disconnect

Remove the entry from the config file and restart; revoke the token at `/dashboard/settings/tokens`.
