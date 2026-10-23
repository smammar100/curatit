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

Custom connectors sign in with OAuth against the authorization server the MCP server advertises; Supabase's OAuth server is on (see `../security.md`), and Claude connected this way on 12 Oct 2026. In Claude: Customize → Connectors → Add custom connector, name it Curatit, paste `https://www.curatit.app/mcp`, Add, then Connect, sign in to Curatit and Allow. If the dialog asks for an OAuth client, choose Register automatically: Supabase doesn't support Client ID Metadata Documents (#2850), which is what Claude's published identity uses. The connector then shows in Claude Desktop and on mobile too. The free plan allows one custom connector.

## Disconnect

Remove the entry from the config file and restart; revoke the token at `/dashboard/settings/tokens`.
