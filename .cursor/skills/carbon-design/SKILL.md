---
name: carbon-design
description: Carbon's design system - typography, color, spacing, and component rules. Use whenever creating or modifying UI in this theme (new pages, sections, components) so the result matches Carbon's visual language.
---

# Carbon design system

Carbon is a directory / showcase theme with a warm, editorial, gallery-like
feel: thin serif display type over a warm paper background, monochrome card
"mats" holding shadowed screenshots, and a single terracotta accent used only
for interaction states. New UI here should be indistinguishable from the
existing pages.

## Design personality

- Gallery calm: content (site screenshots, product shots) is the hero;
  the chrome around it stays warm gray and quiet.
- Serif elegance, sans utility: display headings are a thin serif
  (`font-display`); everything functional (body, buttons, cards, meta) is Inter.
- Warmth over starkness: even "white" is a warm off-white token; neutrals
  are warm grays, never cold slate.
- Color is an event: the terracotta accent appears only on hovers, focus
  rings, links, and the occasional accent button - never on headings or panels.

## Typography

Two families, both defined in `src/styles/global.css` under `@theme` and
loaded in `fundations/head/Fonts.astro`:

- `--font-sans`: **Inter / InterVariable** (from rsms.me) - the default; body,
  UI, cards, buttons. `:root` sets `font-feature-settings: "tnum" 1`
  (tabular numbers) globally.
- `--font-display`: **Hedvig Letters Serif** (Google Fonts, optical size
  12..24) - used via the `font-display` class, for display headings only.

Never introduce another font.

Always use the `Text` component (`@/components/fundations/elements/Text.astro`)
instead of raw tags with ad-hoc sizes. Variants: `display6XL` down to
`displayXS`, then `textXL`, `textLG`, `textBase`, `textSM`, `textXS`.

- Page hero title: `tag="h1" variant="displayLG"` +
  `text-base-900 font-display font-light`, centered inside a
  `text-balance max-w-3xl mx-auto text-center` div; multi-line heroes stack
  `<span class="block">` lines.
- Section heading: `tag="h2" variant="displaySM"` +
  `text-base-900 font-display font-thin`.
- Card title: `tag="h3" variant="textSM"` + `font-medium` (sans, NOT
  `font-display`) in `text-base-900`, or `text-base-600` for quiet captions.
- Card meta line: `variant="textXS"` + `uppercase font-medium text-base-600`.
- Lead / body: `variant="textBase"` in `text-base-600`, placed `mt-4` after
  its heading.

**Display type is thin.** Serif headings use `font-thin` or `font-light`
only. `font-medium` is reserved for small sans UI text (buttons, card
titles, labels). Never `font-semibold`/`font-bold` on a heading.

## Color system

Two custom oklch scales in `@theme` (`src/styles/global.css`) - use only
these, never Tailwind default palettes, never hex in markup:

- `base` - warm gray neutral scale (hue ~85-90). All text, backgrounds,
  borders. Note `--color-white` itself is overridden to a warm off-white,
  so `bg-white` is paper, not pure white.
- `accent` - terracotta / burnt orange (hue ~35).

Usage rules:

- Page background is (warm) white; cards and muted buttons sit on
  `bg-base-50`; headings `text-base-900`, body `text-base-600`, quiet meta
  `text-base-500`.
- **Accent is interaction-only**: link hovers (`hover:text-accent-600` /
  `-500`), form focus (`focus:border-accent-500 focus:ring-accent-100`),
  text selection (`selection:bg-accent-50 selection:text-accent-500` on
  `<body>`), prose links/blockquotes, and the `accent` Button variant.
  Never use accent for headings, body copy, or section backgrounds.
- There are no tinted color panels and no hue rotation - the page stays
  monochrome warm gray; the screenshots inside cards provide the color.
- Dark surfaces are rare and purposeful: the default Button (`bg-base-800`)
  and the search modal backdrop (`bg-base-950`). No dark mode - do not add
  `dark:` classes.

## Layout and spacing

- Every section is `<section>` wrapping a `Wrapper`
  (`@/components/fundations/containers/Wrapper.astro`): `variant="standard"`
  (`max-w-7xl 2xl:max-w-[110rem] px-8`) for pages, `variant="narrow"`
  (`max-w-xl`) for forms/auth, `variant="prose"` for markdown bodies (the
  prose preset styles links/blockquotes in accent and code blocks
  `rounded-2xl`).
- Section vertical padding is `py-24` on the Wrapper; heroes add large top
  padding: `pt-24 lg:pt-48` (or `py-24 lg:pt-48`).
- Rhythm inside a section: `mt-12` between major blocks, `mt-8` between a
  section header row and its grid, `mt-2`-`mt-4` between a title and its
  supporting text, `gap-8` in card grids.
- Section header row: `flex flex-wrap gap-4 justify-between items-center`
  holding the `displaySM` serif heading and a small `muted` Button link
  ("See all articles").
- Card grids: `grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3`
  (blog, store) or `lg:grid-cols-4` (sites directory).
- **Card anatomy** (see `sites/SiteCard.astro`, `blog/BlogCard.astro`):
  a `p-8 bg-base-50 rounded-lg` mat containing the image
  (`object-cover aspect-8/5 w-full object-top rounded shadow`), caption/meta
  below the mat at `mt-2`-`mt-4`, and a stretched link
  (`<a>` with `absolute inset-0`). Grids dim siblings on hover:
  `group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300`.
- Images always declare `width`/`height` and use the `aspect-8/5` +
  `object-top` crop inside mats.

## Components

Reuse these before writing anything new:

- **Button** (`fundations/elements/Button.astro`): variants `default`
  (`bg-base-800`, white text), `accent` (`bg-accent-600`), `muted`
  (`bg-base-50 text-base-900`), `none`; sizes `xxs`-`xl` with fixed heights
  (`h-7.5`-`h-13`) and baked-in radius (`rounded-lg`, `rounded-xl` at `xl`) -
  do not add your own `rounded-*`; `isLink` + `href` renders an anchor;
  `iconOnly` + `size` for square icon buttons; `gap` prop (`xs`-`lg`) spaces
  icon slots. **Width is a per-use decision** - the component renders a
  block-level `flex` that stretches to its container: standalone CTAs get
  `w-fit` (e.g. pricing cards use `class="w-fit mt-8"`), form submits get
  `w-full`, buttons in a flex row need no width class. Tag/filter chips are
  `size="xs" variant="muted"` with `class="capitalize"`.
- **Text**: the only sanctioned type scale (see Typography).
- **Wrapper**: the only page-width container. Don't hand-roll
  `max-w-* mx-auto` wrappers.
- **Form inputs** share one canonical recipe (see `signin.astro`, `Footer.astro`,
  `sites/Search.astro`): `h-9 rounded-md bg-white ring-1 ring-base-200
  placeholder-base-400 shadow-sm focus:border-accent-500 focus:ring-accent-100
  focus:ring-2 text-xs`. Copy it verbatim for new inputs.
- Icons live in `fundations/icons/` as individual Astro components
  (`ArrowUpRight`, `Search`, `Plus`, ...); add new ones there in the same
  style instead of importing icon packs.

## Corners, borders, shadows

- Radius policy (real counts: 48x `rounded-lg`, 8x `rounded-md`, 8x
  `rounded`, 3x `rounded-xl`, 1x `rounded-2xl`): `rounded-lg` for card mats
  and buttons, plain `rounded` for images inside mats, `rounded-md` for
  inputs. Nothing larger except the prose code-block preset. No
  `rounded-full` except tiny indicators.
- Shadows are only for "physical" objects: `shadow` on screenshots/product
  images sitting on their mat, `shadow-sm` on inputs. **Never** shadow a
  card, panel, or button.
- Borders are `ring-1 ring-base-200` (inputs) or `divide-y divide-base-200`
  (feature lists) - no heavy `border-2` styles.

## Voice and copy

Short declarative statements, often two stacked sentences in heroes
("No concepts. Just real websites."). Practical, anti-hype tone aimed at
designers ("benchmark your own work, not to copy it"). Sentence case
everywhere, no Title Case, no emoji; exclamation marks are rare and playful
("See them all!") - default to none.

## Do / Don't

Do:

- Copy an existing section's structure before inventing a new layout.
- Put every image on a `p-8 bg-base-50 rounded-lg` mat with `rounded shadow`
  on the image itself.
- Use `text-balance` on headings and `max-w-3xl mx-auto text-center` for
  centered heroes.
- Pair every serif display heading with `font-thin` or `font-light`.

Don't:

- Don't use `font-display` on card titles, buttons, or body text - serif is
  for display headings only.
- Don't put accent color on headings, backgrounds, or body copy; it is for
  hovers, focus, links, and the accent Button.
- Don't introduce new fonts, colors outside `@theme`, gradients, or `dark:`
  classes.
- Don't use default Tailwind `slate`/`gray`/`zinc`/`orange` classes - the
  scales here are `base-*` and `accent-*`.
- Don't shadow cards or buttons, and don't exceed `rounded-lg` outside the
  established input/prose cases.
- Don't inline a heading with raw classes when `Text` has a variant for it.

## Quality check before finishing

1. Fonts, colors, and spacing all come from existing tokens and match a
   sibling section.
2. New section reads correctly at `sm`, `md`, and `lg` breakpoints.
3. Headings use `Text` variants with `font-display font-thin/light`;
   buttons use `Button` variants with an explicit width decision.
4. No new dependencies, no unused imports, minimal diff.
