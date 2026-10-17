# Domain: www.curatit.app

Since 17 October 2026 Curatit's canonical address is `https://www.curatit.app`. The owner bought `curatit.app` through Vercel that day (DNS on Vercel) and verified it in Resend, which sends the app's email from `hello@curatit.app` (`docs/emails.md`). Before that the site lived at `https://curatit.vercel.app`.

## What serves what

Checked with `curl` on 17 October 2026:

| Address | Answer |
|---|---|
| `https://www.curatit.app` | The site (200) |
| `https://curatit.app` | 308 to `https://www.curatit.app`, path kept (`/mcp` goes to `www…/mcp`) |
| `https://curatit.vercel.app` | The same production deployment, served directly (200, no redirect) |

So `www` is canonical: it's what Vercel serves, and the code agrees.

## What the code reads

- `SITE_URL` in `src/lib/site.ts` is `https://www.curatit.app`. It's the `metadataBase` (Open Graph and Twitter image URLs, and the canonical link every page carries, so a page read at `curatit.vercel.app` names its `www` address), the sitemap, RSS, the addresses the MCP pages give people to copy (`MCP_URL` in `src/components/mcp/tools.ts`, the REST example in `ClientInstall`), and the fallback for the sign-up and password links when a request has no origin.
- `CURATIT_PUBLIC_BASE_URL` is an environment variable, so only Vercel can change it: the MCP server's protected resource metadata (`resource`, `resource_documentation`), the `WWW-Authenticate` challenge's metadata URL, CORS, the OpenAPI `servers`, and every link and image in the emails (`src/emails/_components/tokens.ts`, which falls back to `https://www.curatit.app` when it's unset).
- The sign-up, resend and forgot-password actions send Supabase the origin the visitor is on (`origin()` in `src/app/auth/actions.ts`), so someone signing up at `curatit.vercel.app` gets a link back to `curatit.vercel.app`. That's why the old address stays on Supabase's redirect list.
- The defaults of `packages/mcp-bridge` (`--server`), `packages/model-adapter` and `scripts/mcp-smoke.ts` are the new address.

## Steps for the owner

The code can't change these. In order:

1. **Vercel, environment variable.** Project → Settings → Environment Variables: set `CURATIT_PUBLIC_BASE_URL` to `https://www.curatit.app` for Production (and Preview, if it's set there to the old address). Variables apply to the next deployment, so do this before or with the merge that deploys this change, or redeploy after. Change it in `.env.local` too if it's set there, so local runs send the same links.
2. **Supabase, URL Configuration.** Dashboard → Authentication → URL Configuration:
   - Site URL: `https://www.curatit.app`. Never a preview address: those sit behind Vercel's login (AGENTS.md, Auth).
   - Redirect URLs: add `https://www.curatit.app/**` and `https://curatit.app/**`. Keep `https://curatit.vercel.app/**`, `http://localhost:3000/**` and the preview builds' `https://curatit-*-dexters-projects1.vercel.app` (bare and `/**`): people can still sign up on the old address, and links already sitting in inboxes point there.
3. **Supabase, email templates.** If the six Auth templates were pasted into Supabase before this change, paste them again from `supabase/templates/` (`docs/emails.md`, Going live): their images and links now point at `www`.
4. **Check it.** After the deploy:
   - `curl -s https://www.curatit.app/.well-known/oauth-protected-resource/mcp` shows `"resource":"https://www.curatit.app/mcp"`.
   - `curl -s https://www.curatit.app/sitemap.xml | head` lists `https://www.curatit.app/…` addresses.
   - `npm run mcp:smoke -- --server https://www.curatit.app` passes, and so does `--server https://curatit.vercel.app` (old clients).
   - A sign-up on `www.curatit.app` gets a confirmation link to `https://www.curatit.app/auth/callback…`.
5. **Search (optional).** Add `https://www.curatit.app` to Google Search Console and submit `https://www.curatit.app/sitemap.xml`.

## MCP clients on the old address

- **Personal access tokens keep working at `https://curatit.vercel.app/mcp`.** The server checks the token, not the host it was reached on, and `vercel.app` keeps serving the same deployment. Once `CURATIT_PUBLIC_BASE_URL` changes, the 401 challenge and the metadata name the `www` address, but a client that already sends its token never asks for them.
- **OAuth connections (ChatGPT) should be reconnected at `https://www.curatit.app/mcp`.** Tokens they already hold keep working (the server doesn't bind them to a host). But the next time one signs in again, its metadata will name `https://www.curatit.app/mcp` while the client is talking to `curatit.vercel.app`, and clients check that the two match: the official SDK client stops with "Protected resource … does not match expected …".
- **Don't redirect `curatit.vercel.app` to `www` while clients still use it.** A redirect to another origin makes fetch-based clients drop the `Authorization` header, so every call on the old address would come back 401. Move the clients first, or leave `/mcp` and `/api/v1` out of any redirect.
