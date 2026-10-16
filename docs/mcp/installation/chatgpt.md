# ChatGPT

Status: **being tested**. ChatGPT's connectors sign in with OAuth against the authorization server the MCP server advertises and don't send bearer headers. Supabase's OAuth 2.1 server is on for the project (since October 2026) with the consent page at `/oauth/consent`; the route may still be stopped by supabase/auth issue #2820 (a 400 for public clients that send `resource` or `offline_access`, which ChatGPT does). See `../security.md`.

If the sign-in fails, use a personal access token in one of the other clients and tell us what broke. The ChatGPT Sites app at `curatit-mcp.smammar.chatgpt.site` is a separate deployment on OpenAI's own identity, not this code (see `docs/current-state.md`).
