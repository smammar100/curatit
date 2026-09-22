# Curatit

Creative intelligence for organic social: a curated, searchable library of brand posts, analysed by
editors, with private research boards and read-only sharing. Built with Next.js 15 (App Router),
React 19, TypeScript, and Tailwind CSS v4 on top of the Lexington "Carbon" theme.

> **Demo data.** The local library holds 12 **fictional** brands with generated slide artwork. The build
> plan does not allow collecting real brand posts until each account's identity, quality, and source
> rights are approved (§28, §32), so nothing here is scraped.

## Getting started

```bash
npm install
cp .env.example .env.local      # set CURATIT_ADMIN_EMAILS to your email
npm run dev                     # http://localhost:3000
```

On the first request, the app creates `data/curatit.db` and seeds the demo library. Sign up with the email
you set in `CURATIT_ADMIN_EMAILS` to get the **Curation** (admin) area. To start from a clean library,
delete `data/`.

| Command             | What it does                                         |
| :------------------ | :--------------------------------------------------- |
| `npm run dev`       | Dev server                                           |
| `npm test`          | Integration tests (throwaway database per run)       |
| `npm run typecheck` | TypeScript, no emit                                  |
| `npm run build`     | Production build                                     |

Needs **Node 22.13+** (uses the built-in `node:sqlite`).

## What's built

Mapped to the product build plan:

| Plan item | Where |
| :-- | :-- |
| Public landing, private product, auth (§4) | `app/page.tsx`, `app/signin`, `app/signup`, `lib/auth.ts` |
| Curated grid, keyword + natural-language search, filters, deep links (§7.1) | `app/library`, `lib/services/creatives.ts`, `lib/search/*` |
| Search-result card with "why it matched" (§7.1) | `components/product/CreativeCard.tsx` |
| Post detail: slides, source, dates, analysis, related (§7.2) | `app/creatives/[id]`, `components/product/Carousel.tsx` |
| Personal boards: create/rename/delete, multi-board save, notes, reorder, share/revoke (§7.3, §34) | `app/boards`, `components/boards/*`, `lib/services/boards.ts` |
| Read-only shared view (§34.4) | `app/s/[token]` |
| Admin curation queue, removal, coverage dashboard (§7.4, §25, §32) | `app/admin`, `lib/services/admin.ts` |
| Controlled taxonomy, 36 creative values (§8, §25) | `lib/taxonomy.ts` |
| Web/API contract (§26) | `app/api/**`, `lib/api.ts` |
| Production schema with row-level security (§10, §25) | `supabase/migrations/0001_init.sql` |
| Security acceptance tests (§29, §34.6) | `tests/*.test.ts` |

### Search

`lib/services/creatives.ts` is the single retrieval service. The web app and API use it, and MCP should
reuse it too (§23). It:

1. Validates input (query ≤ 1,000 chars, controlled filter IDs, limit 1–24, signed cursor).
2. Keeps only published, processed posts that match the hard filters.
3. Builds two ranked lists: FTS5 keyword (bm25) and *structured* matching of phrases in the brief to
   taxonomy terms (e.g. "bold typography" → visual style).
4. Fuses the lists with reciprocal-rank fusion (`1 / (60 + rank)`), then limits any one brand to 3 of the
   first 10 results.
5. Explains each result from real fields only.

Suggested readings of the brief appear as chips the user can promote to filters. They never narrow
results silently. **Embedding (semantic) search is not connected**, and the UI says so on every query.

### Security model

- Every board query is scoped to the viewer's workspace, taken from the session and never from submitted
  IDs. Another user's board returns 404, never 403, so IDs can't be probed.
- Board edits carry an expected version. Stale writes get a 409 and a "reload" prompt instead of
  overwriting.
- Saving one post to several boards checks every destination first and writes nothing if any check fails.
- Share tokens have 256 bits of randomness, only their SHA-256 hash is stored, and they expire in at most
  30 days. Replacing a link revokes the old one. Shared pages go through a separate serializer that omits
  the description, notes, owner and workspace, and they are served `no-store`, `noindex`, `no-referrer`.
- `removed` overrides every other state. A removed post disappears from search, detail pages, boards and
  shares immediately. Restoring it sends it back to review, never straight to published.
- Cookie-authenticated API mutations require a same-origin `Origin` header, which blocks CSRF.
- Analytics store IDs and outcomes only — no queries, names, notes, or tokens.

## Not built yet

These are planned but not implemented. Don't describe them to users as available:

- **Supabase.** Local persistence is SQLite. The Postgres migration is written but has **not been
  applied or tested**; the services need a Postgres implementation, and auth needs to move to Supabase
  Auth (including MFA for admins).
- **Ingestion.** No Apify actors, webhooks, dedup, or job queue.
- **AI enrichment and embeddings.** Analyses in the demo seed are hand-written.
- **MCP server.** `search_creatives`, `get_creative`, and `get_collection` should wrap the existing
  services, but the MCP server itself isn't built yet.
- **Plans and payments.** The pricing page shows the plan's test prices, but no entitlements exist. Every
  account gets the same limits (50 boards, 200 references per board, 20 searches/minute).
- **Production concerns:** rate limits are per process (production needs a shared store), there is no
  email verification or password reset, and backups and kill switches don't exist yet.
- **Launch content:** the removal-request contact is a placeholder in `content/legal/removal.md`, and the
  privacy and terms pages are still the theme's sample text.
