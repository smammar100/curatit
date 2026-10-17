# Claude Code

Status: **untested**. Commands are illustrative, from Claude Code's documentation on 12 October 2026.

Remote, with the token taken from your shell environment:

```bash
claude mcp add --transport http curatit https://www.curatit.app/mcp --header "Authorization: Bearer $CURATIT_ACCESS_TOKEN"
```

Or the bridge:

```bash
claude mcp add curatit --env CURATIT_ACCESS_TOKEN=$CURATIT_ACCESS_TOKEN -- node /absolute/path/to/Curatit/packages/mcp-bridge/dist/cli.js --server https://www.curatit.app/mcp
```

Check with `claude mcp list`; then, in a session: *Find three finance carousel posts and show their sources.*

Disconnect: `claude mcp remove curatit`; revoke the token at `/dashboard/settings/tokens`.
