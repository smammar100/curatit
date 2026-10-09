# AGENTS.md — Curatit

**Design rules:** [.cursor/skills/curatit-design/SKILL.md](./.cursor/skills/curatit-design/SKILL.md) - read before creating or changing any UI.  

**Curatit** is a **directory / showcase-style marketing site** built with Next.js on a Lexington Themes template: homepage highlights featured “sites” (with Fuse.js search), a magazine-style **blog**, a **digital product store**, and supporting pages (pricing, advertise, submit, sign-in/up, system styleguide). It fits **SaaS/marketing, template marketplaces, and curated listings**. Original template publisher: [Lexington Themes](https://lexingtonthemes.com/).

## Tech stack

| Area | Details |
|------|---------|
| **Framework** | [Next.js](https://nextjs.org/) `^16` (App Router, React 19), all routes statically generated |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) `^4` via `@tailwindcss/postcss` (`postcss.config.mjs`) |
| **Markdown** | Frontmatter parsed with `yaml` and validated with `zod` in `src/lib/content.ts`; bodies rendered by `src/lib/markdown.ts` (unified: GFM, smartypants, heading ids, Shiki `min-light`) |
| **Search** | `fuse.js` in the client component `src/components/sites/SearchDialog.tsx` |
| **Tailwind plugins** | `@tailwindcss/forms`, `@tailwindcss/typography`, `tailwind-scrollbar-hide` (loaded with `@plugin` in `src/styles/global.css`) |
| **Fonts** | `next/font/google` (Inter, Hedvig Letters Serif) in `src/app/layout.tsx` |
| **Aliases** | `@/*` → `src/*` (`tsconfig.json`) |

## Folder map

| Path | Role |
|------|------|
| `src/app/` | App Router routes (see Routing below). `(site)` and `(auth)` are route groups that only choose the page shell |
| `src/layouts/` | Page-level components: `BaseLayout` (nav + `<main>` + footer shell), `BlogLayout`, `LegalLayout`, `StoreLayout`, `SitesLayout` |
| `src/components/` | UI: `fundations/` (design system), `home/` (homepage sections + demo data), `ui/` (shadcn-style vendored components), `navigation/`, `global/`, `landing/` (sections of the `/sites` directory page), `blog/`, `store/`, `sites/`, `assets/`, `system/` |
| `src/content/` | Markdown sources for the collections (`legal/`, `store/`, `sites/`, `posts/`) |
| `src/lib/` | `content.ts` (collections + schemas), `markdown.ts`, `site.ts` (`SITE_URL`), `cx.ts`, `utils.ts` (shadcn `cn`) |
| `src/styles/` | `global.css` — Tailwind import, `@theme` tokens, plugins |
| `public/images/` | Images referenced from content frontmatter and components (`blog/`, `sites/`, `store/`, `lex.jpg`) |

## Content collections (`src/lib/content.ts`)

`getCollection(name)` returns entries sorted by filename (so `10.md` sorts before `2.md`); `getEntry(name, id)` finds one. IDs are the filename without `.md`/`.mdx`. Frontmatter is validated with zod at build time and a bad file fails the build with the file name. Image fields are paths under `public/` (e.g. `/images/blog/1.jpg`) and must exist.

### `legal`

| | |
|--|--|
| **Folder** | `src/content/legal/` |
| **Schema** | `page` (string), `pubDate` (date) |
| **Images** | None in schema |
| **Template** | Copy structure from `src/content/legal/terms.md` or `privacy.md` |

### `store`

| | |
|--|--|
| **Folder** | `src/content/store/` |
| **Schema** | `price`, `title`, `preview`, `checkout`, `license`, `highlights` (string[]), `description`, `features` (`{ title, description }[]`), `image: { url, alt }`, optional `gallery: { url, alt }[]` |
| **Images** | `/images/store/...` |
| **Template** | `src/content/store/1.md` |

### `sites`

| | |
|--|--|
| **Folder** | `src/content/sites/` |
| **Schema** | `live`, `title`, `tagline`, `description`, optional `isNew`, optional `details: { label, value }[]`, `thumbnail: { url, alt }`, optional `tags` (string[]) |
| **Images** | `/images/sites/...` |
| **Template** | `src/content/sites/1.md` |

### `posts` (blog)

| | |
|--|--|
| **Folder** | `src/content/posts/` |
| **Schema** | `title`, `pubDate`, `description`, `image: { url, alt }`, `tags: string[]` |
| **Images** | `/images/blog/...` |
| **Template** | `src/content/posts/1.md` |

**Do not** widen schemas without updating every page/layout that reads `entry.data` (e.g. `BlogLayout`, `StoreLayout`, cards).

## Routing conventions

| URL pattern | Source |
|-------------|--------|
| `/` | `src/app/(site)/page.tsx` — Curatit homepage built from `src/components/home/` (corridor hero, pinned problem → solution scroll section, how-it-works cards, category folders, MCP coming-soon, FAQ) |
| `/sites` | `src/app/(site)/sites/page.tsx` — website directory (the template's original homepage), renders `<Search />` |
| `/blog` | `src/app/(site)/blog/page.tsx` — lists `posts` |
| `/blog/posts/[slug]` | `src/app/(site)/blog/posts/[slug]/page.tsx` — `slug` = post `id` (e.g. `1` → `/blog/posts/1`) |
| `/blog/tags`, `/blog/tags/[tag]` | Tag index + filtered posts |
| `/store`, `/store/[slug]` | Store grid + product detail |
| `/sites/site/[slug]` | Site detail from `sites` (`SitesLayout`, renders `<Search />`) |
| `/sites/tags`, `/sites/tags/[tag]` | Tag index + filtered `sites` |
| `/legal/[slug]` | Legal pages |
| `/rss.xml` | `src/app/rss.xml/route.ts`, built from `posts` |
| `/sitemap.xml` | `src/app/sitemap.ts` — add new static routes to its list |
| `/system/*` | Styleguide (`overview`, `colors`, `typography`, `buttons`, `links`) |
| Other | `pricing`, `about`, `advertise`, `submit` in `(site)`; `signin`, `signup` in `(auth)` (no navigation or footer); 404 is `src/app/not-found.tsx` |

Dynamic routes use `generateStaticParams` + `dynamicParams = false`, so unknown slugs 404.

## Customization

- **Site URL / domain:** `SITE_URL` in `src/lib/site.ts` (currently `https://yourdomain.com`). SEO placeholders (title, Open Graph, Twitter, canonical) live in `metadata` in `src/app/layout.tsx`.
- **Brand colors / typography:** `src/styles/global.css` — `@theme` (`--color-accent-*`, `--color-base-*`); font families are wired in `src/app/layout.tsx` and mapped to `--font-sans` / `--font-display`.
- **Navigation / footer:** `src/components/navigation/Navigation.tsx`, `MobileNav.tsx`, `src/components/global/Footer.tsx`.
- **Wordmark:** `src/components/assets/Logo.tsx` (outlined "Curatit" in Hedvig Letters Serif); favicon is `src/app/icon.svg`.

## Commands

Run at repo root:

- `npm install` — dependencies  
- `npm run dev` — dev server on http://localhost:3000  
- `npm run build` — production build (`.next/`)  
- `npm start` — serve the production build  
- `npm run typecheck` — TypeScript check  

## Guardrails

- Keep the folder name **`fundations`** as spelled in this repo (do not “fix” to *foundations* without a coordinated rename everywhere).
- Components are server components by default; client components (`"use client"`) are `MobileNav`, `SearchDialog`, `SitesPreviewGrid`, the homepage demos (`SearchDemo`, `DetailDemo`, `BoardDemo`), the pinned problem/solution section (`ProblemSolution`, `Scattered`), the MCP demo (`McpDemo`), the CTA logo reels (`LogoReel`), (`Scattered` uses the `useIntroOnce` hook), `ui/image-stream-hero` and `ui/interactive-folder-gallery` (framer-motion). Keep content loading (`src/lib/content.ts`, which uses `node:fs`) out of client components.
- `src/components/ui/` holds components copied from shadcn / 21st.dev. They import `cn` from `@/lib/utils`; keep them close to upstream and style them from the outside. There is no `components.json`, so run `npx shadcn@latest init` before using the shadcn CLI (it also edits `global.css`, so review that diff).
- Icons in `src/components/fundations/icons/` are Phosphor (bold weight) paths on the shared `Icon` shell; take new ones from `@phosphor-icons/core` rather than adding an icon library.
- Homepage demo brands and posts in `src/components/home/demo.ts` are fictional; their hex colours are post artwork, not theme tokens.
- Do not expand content schemas lightly; update all consumers (layouts, cards, `generateStaticParams`) in the same change.
- Prefer small diffs and existing patterns (`@/` imports, collection names `posts` | `sites` | `store` | `legal`).

## Lexington links (original template)

- Theme specs: https://lexingtonthemes.com/templates/carbon  
- Documentation: https://lexingtonthemes.com/documentation  
- Changelog (theme): https://lexingtonthemes.com/changelog/carbon  
- Support: https://lexingtonthemes.com/legal/support/  
- Bundle: https://lexingtonthemes.com  
