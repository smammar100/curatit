# ChatGPT

Status: **blocked**. ChatGPT's connectors sign in with OAuth against the authorization server the MCP server advertises and don't send bearer headers. That route needs Supabase's OAuth 2.1 server turned on for the project, with the consent page built at `/oauth/consent`, and it may be stopped by supabase/auth issue #2820 (a 400 for public clients that send `resource` or `offline_access`, which ChatGPT does). See `../security.md`.

Until then ChatGPT can't connect to this server. The ChatGPT Sites app at `curatit-mcp.smammar.chatgpt.site` is a separate deployment on OpenAI's own identity, not this code (see `docs/current-state.md`).
