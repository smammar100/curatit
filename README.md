# Curatit

A curated directory of production websites — ported from the Astro "Carbon" theme to **Next.js 15 (App Router)** with React 19, TypeScript and Tailwind CSS v4.

## Commands

| Command         | Action                                        |
| :-------------- | :-------------------------------------------- |
| `npm install`   | Install dependencies                          |
| `npm run dev`   | Start the dev server on http://localhost:3000 |
| `npm run build` | Production build (all routes prerendered)     |
| `npm run start` | Serve the production build                    |

## Project structure

```
app/                     Routes (App Router)
  layout.tsx             <html>, fonts, navigation, footer
  page.tsx               Home (hero + sites + blog + store previews)
  blog/                  Magazine index, posts, tag index and tag pages
  sites/                 Directory index, detail pages, tag index/pages
  store/                 Product index and detail pages
  legal/[slug]/          Markdown-driven legal pages
  system/                Design-system reference pages
  rss.xml/route.ts       RSS feed
  sitemap.ts             Generated sitemap
components/
  fundations/            Text, Button, Wrapper, icons (the design primitives)
  navigation/            Desktop nav + client-side mobile nav
  sites/, store/, blog/  Cards and the Fuse.js command-K search dialog
  landing/               Homepage sections
lib/content.ts           Markdown loader, Zod schemas, markdown → HTML
content/                 Markdown collections: posts, sites, store, legal
public/images/           Screenshots and artwork
```

## Content

Markdown lives in `content/<collection>/*.md` and is validated at build time by the Zod
schemas in [lib/content.ts](lib/content.ts) — the direct equivalent of Astro's
`src/content.config.ts`. Frontmatter that fails validation fails the build with the offending
file named.

Image paths in frontmatter are public URLs (`/images/sites/1.png`) rather than Astro's
`/src/images/...` imports, and are rendered through `next/image`.

Adding a file to a collection is enough — routes, tag pages, the sitemap and the RSS feed all
derive from the collection at build time. In `next dev` content is re-read per request; in
production it is cached.

## How the Astro concepts map over

| Astro                                   | Next.js                                             |
| :-------------------------------------- | :-------------------------------------------------- |
| `src/layouts/BaseLayout.astro`          | `app/layout.tsx`                                     |
| `BlogLayout` / `SitesLayout` / `StoreLayout` | Folded into the matching `page.tsx`             |
| `getCollection("posts")`                | `getCollection("posts")` in `lib/content.ts`         |
| `getStaticPaths()`                      | `generateStaticParams()`                             |
| `<Content />` from `render(entry)`      | `renderMarkdown(entry.body)` (remark → rehype)       |
| `<slot />` / named slots                | `children` / explicit props (`icon`, `leftIcon`, …)  |
| `class:list`                            | `className` strings                                  |
| `<script is:inline>`                    | `"use client"` components (mobile nav, search, grid) |
| `@astrojs/rss`, `@astrojs/sitemap`      | `app/rss.xml/route.ts`, `app/sitemap.ts`             |
| `astro:assets` `<Image />`              | `next/image`                                         |

## Notes

- Set `NEXT_PUBLIC_SITE_URL` (and `metadataBase` in `app/layout.tsx`) to your real domain
  before deploying; RSS and the sitemap read it.
- The wordmark in `components/assets/Logo.tsx` is the original vector artwork, which still
  spells "Carbon" — replace the SVG path with a Curatit mark when you have one.
