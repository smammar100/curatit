# Cursor

Status: **untested**. Illustrative, from Cursor's MCP documentation on 12 October 2026.

`.cursor/mcp.json` in the project, or the global file. Remote with a header, the token interpolated from the environment:

```json
{
  "mcpServers": {
    "curatit": {
      "url": "https://curatit.vercel.app/mcp",
      "headers": { "Authorization": "Bearer ${env:CURATIT_ACCESS_TOKEN}" }
    }
  }
}
```

If your version doesn't interpolate environment variables in headers, use the bridge:

```json
{
  "mcpServers": {
    "curatit": {
      "command": "node",
      "args": ["/absolute/path/to/Curatit/packages/mcp-bridge/dist/cli.js"],
      "env": { "CURATIT_ACCESS_TOKEN": "your token" }
    }
  }
}
```

Smoke test in the agent: *Find three finance carousel posts and show their sources.* Disconnect: delete the entry; revoke the token at `/dashboard/settings/tokens`.
