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
- The sign-up, resend and forgot-password actions send Supabase a redirect on the origin the visitor is on (`origin()` in `src/app/auth/actions.ts`), and Supabase only keeps a redirect that's on its list, so both addresses stay on it. Curatit's own account templates link to `CURATIT_PUBLIC_BASE_URL` + `/auth/confirm` whichever address the person used, with that redirect as `next`; the confirm page follows `next` only when it's on its own origin, and otherwise goes to the link's usual page (the dashboard, or Reset password).
- The defaults of `packages/mcp-bridge` (`--server`), `packages/model-adapter` and `scripts/mcp-smoke.ts` are the new address.

## Steps for the owner

The code can't change these. In this order:

**Before merging the pull request that makes the change (safe at once):**

1. **Supabase, Redirect URLs.** Dashboard → Authentication → URL Configuration → Redirect URLs: add `https://www.curatit.app/**` and `https://curatit.app/**`. Keep `https://curatit.vercel.app/**`, `http://localhost:3000/**` and the preview builds' `https://curatit-*-dexters-projects1.vercel.app` (bare and `/**`): people can still sign up on the old address, and links already sitting in inboxes point there. This only allows more addresses, so it changes nothing for anyone on the old one; until it's done, someone who signs up on `www` is sent back to the Site URL instead.
2. **Vercel, environment variable.** Project → Settings → Environment Variables: set `CURATIT_PUBLIC_BASE_URL` to `https://www.curatit.app` for Production (and Preview, if it's set there to the old address). A variable applies from the next deployment, which the merge makes. Change it in `.env.local` too if it's set there, so local runs send the same links.

**Then:**

3. **Merge**, and wait for Vercel's production deployment to finish.
4. **Check it:**
   - `curl -s https://www.curatit.app/.well-known/oauth-protected-resource/mcp` shows `"resource":"https://www.curatit.app/mcp"` (the variable took effect).
   - `curl -s https://www.curatit.app/sitemap.xml | head` lists `https://www.curatit.app/…` addresses.
   - `https://www.curatit.app/email/curatit-symbol.png` opens (the email images are served on `www`).
   - `npm run mcp:smoke -- --server https://www.curatit.app` passes, and so does `--server https://curatit.vercel.app` (old clients).

**After the deploy checks out:**

5. **Supabase, Site URL.** Same page: set the Site URL to `https://www.curatit.app`. Never a preview address: those sit behind Vercel's login (AGENTS.md, Auth). It's the address Supabase falls back to when a redirect isn't on the list, and where it sends OAuth sign-ins for the consent screen.
6. **Supabase, email templates.** Paste the six files in `supabase/templates/` (as they are on `main` after the merge) into Authentication → Emails, with the subjects in `docs/emails.md`. Paste them only now: these are the copies that link to `https://www.curatit.app/auth/confirm?…` and load their images from `https://www.curatit.app/email/…`. Then sign up with a test address on `www.curatit.app` and check the email's button opens `https://www.curatit.app/auth/confirm?…` and confirms the account.
7. **MCP connections made with OAuth (ChatGPT):** reconnect them at `https://www.curatit.app/mcp` (below).
8. **Search (optional).** Add `https://www.curatit.app` to Google Search Console and submit `https://www.curatit.app/sitemap.xml`.

## MCP clients on the old address

- **Personal access tokens keep working at `https://curatit.vercel.app/mcp`.** The server checks the token, not the host it was reached on, and `vercel.app` keeps serving the same deployment. Once `CURATIT_PUBLIC_BASE_URL` changes, the 401 challenge and the metadata name the `www` address, but a client that already sends its token never asks for them.
- **OAuth connections (ChatGPT) should be reconnected at `https://www.curatit.app/mcp`.** Tokens they already hold keep working (the server doesn't bind them to a host). But the next time one signs in again, its metadata will name `https://www.curatit.app/mcp` while the client is talking to `curatit.vercel.app`, and clients check that the two match: the official SDK client stops with "Protected resource … does not match expected …".
- **Don't redirect `curatit.vercel.app` to `www` while clients still use it.** A redirect to another origin makes fetch-based clients drop the `Authorization` header, so every call on the old address would come back 401. Move the clients first, or leave `/mcp` and `/api/v1` out of any redirect.
