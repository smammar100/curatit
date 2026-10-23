# ChatGPT

Status: **connected**. ChatGPT's connectors sign in with OAuth against the authorization server the MCP server advertises and don't send bearer headers. Supabase's OAuth 2.1 server is on for the project (since October 2026) with the consent page at `/oauth/consent`. ChatGPT registered and was allowed on 12 Oct 2026 and its session refreshed until 16 Oct, so supabase/auth issue #2820 (a 400 for public clients that send `resource` or `offline_access`) didn't stop it. See `../security.md`.

Steps (October 2026; the `/agents` page carries the same): open Plugins in ChatGPT (chatgpt.com/plugins), choose + and Add custom MCP server, name it Curatit, paste `https://www.curatit.app/mcp` under Connection, choose OAuth, accept the warning, Create as a plugin, then sign in to Curatit and Allow. In a chat, type @ and pick Curatit. Whether a plan can add custom servers is OpenAI's call.

If the sign-in fails, use a personal access token in one of the other clients and tell us what broke. The ChatGPT Sites app at `curatit-mcp.smammar.chatgpt.site` is a separate deployment on OpenAI's own identity, not this code (see `docs/current-state.md`).
