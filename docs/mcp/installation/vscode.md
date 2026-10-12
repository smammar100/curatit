# VS Code (GitHub Copilot agent mode)

Status: **untested**. Illustrative, from VS Code's MCP documentation on 12 October 2026.

`.vscode/mcp.json`, with the token prompted for once and kept by VS Code, not in the file:

```json
{
  "inputs": [
    { "id": "curatit-token", "type": "promptString", "description": "Curatit personal access token", "password": true }
  ],
  "servers": {
    "curatit": {
      "type": "http",
      "url": "https://curatit.vercel.app/mcp",
      "headers": { "Authorization": "Bearer ${input:curatit-token}" }
    }
  }
}
```

Or the bridge as a `stdio` server: `"command": "node"`, `"args": ["/absolute/path/to/Curatit/packages/mcp-bridge/dist/cli.js"]`, `"env": { "CURATIT_ACCESS_TOKEN": "${input:curatit-token}" }`.

Smoke test in agent mode: *Find three finance carousel posts and show their sources.* Disconnect: remove the server; revoke the token at `/dashboard/settings/tokens`.
