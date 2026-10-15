---
name: curatit-design
description: Curatit's design system - typography, color, spacing, and component rules. Use whenever creating or modifying UI in this theme (new pages, sections, components) so the result matches Curatit's visual language.
---

# Curatit design system

Curatit is a directory / showcase site with a calm, gallery-like feel: the
posts are the colour, the chrome around them is neutral and quiet. Since
2026-10-15 its tokens, type scale and components are **Interfere's design
system** (https://design.interfere.com, read off the site and installed by
hand, since it ships no package), with Curatit's own terracotta standing in
for Interfere's blue as the brand colour. New UI here should be
indistinguishable from the existing pages.

## Design personality

- Gallery calm: content (post covers, product shots) is the hero; the chrome
  stays neutral grey and quiet.
- Serif headlines, sans everything else: headings are Hedvig Letters Serif
  (`font-display`, its one regular weight) on Interfere's sizes and
  tracking; body, UI, cards, buttons and captions are Inter. The owner kept
  the serif when the system came in.
- Neutral, not warm: the page is pure white (near-black in dark mode) and the
  greys are Radix's neutral gray, mostly as alpha tints so they sit on any
  surface.
- Colour is an event: the terracotta brand colour appears only on hovers,
  focus rings, links and the `accent` (brand) Button, never on headings or
  panels.

## Typography

Two families, both defined in `src/styles/global.css` under `@theme` and
loaded with `next/font/google` in `src/app/layout.tsx`:

- `--font-sans`: **Inter** (variable) - everything. `:root` sets
  `font-feature-settings: "tnum" 1, "ss03" 1` (tabular numbers; round quotes
  and commas, as Interfere sets it).
- `--font-display`: **Hedvig Letters Serif** - every heading, through the
  `Text` heading variants (which carry `font-display font-normal`), the
  wordmark and the dashboard's display role.
- `--font-mono`: a system monospace stack (Interfere's Berkeley Mono isn't
  ours to ship).

Never introduce another font.

The scale is Interfere's, as `--text-*` tokens that carry size, leading,
tracking and (for headings) weight, so one class sets all four:

| Token | Size / leading | Notes |
| --- | --- | --- |
| `text-h1` … `text-h6` | 56/56, 44/56, 36/44, 28/36, 24/32, 20/24 | `-0.01em`; serif regular through `Text`, Inter medium when used bare |
| `text-body-lg`, `text-body-base`, `text-body-sm` | 18/24, 15/24, 13/20 | regular |
| `text-caption-lg`, `-base`, `-sm`, `-xs` | 12/16, 11/16, 10/16, 8/12 | regular; uppercase captions add `tracking-wider` |

Weights: `font-normal` 400, `font-semimedium` 450, `font-medium` 500,
`font-semibold` 600. Serif headings are regular (the face has one weight);
never bold.

Always use the `Text` component (`@/components/fundations/elements/Text`)
instead of raw tags with ad-hoc sizes. Variants `h1`-`h6` step down on
smaller screens (`h1` is 36 → 44 → 56); `bodyLG`, `body` (the default),
`bodySM`; `captionLG`, `caption`, `captionSM`, `captionXS`. The older names
(`displayLG`, `textBase`, …) still work and map onto the same scale.

- Page hero title: `tag="h1" variant="h1"` + `text-primary-foreground` (or
  `text-base-900`), centred inside a `text-balance max-w-3xl mx-auto
  text-center` div; multi-line heroes stack `<span className="block">` lines.
- Section heading: `tag="h2" variant="h1"` on the homepage (every section's
  heading matches the hero's size, at the owner's request); `variant="h2"`
  or `h3` elsewhere.
- Card title: `tag="h3" variant="h6"` or `bodySM` + `font-medium`.
- Card meta line: `variant="captionLG"` + `uppercase tracking-wider
  text-secondary-foreground`.
- Lead / body: `variant="body"` in `text-secondary-foreground`
  (`text-base-600`), `mt-4` after its heading, at most two lines on the
  homepage. Widows and orphans: `global.css` balances every heading and
  wraps every paragraph, list item and label `pretty` as a base style, so
  a last line is never one short word.

## Color system

Interfere's semantic tokens, in `@theme` (`src/styles/global.css`), on top of
the Radix primitives set in `:root` and flipped in
`:root[data-theme="dark"]`. Use the semantic names in new code:

- Surfaces: `bg-page` (the canvas; `bg-white` is the same), `bg-container`
  (white / `#111`), `bg-card` (a 2% tint, the grey mat), `bg-component`
  (6%, chips and tertiary buttons; `-hover`, `-active`), `bg-sunken`,
  `bg-modal`, `bg-standout` (near-black / dark grey),
  `bg-component-on-container-subtle` (a white control on a white container,
  with `-hover`), `bg-transparent-hover`.
- Foregrounds: `text-primary-foreground` (87% black), `text-secondary-foreground`
  (61%), `text-tertiary-foreground` (45%, under 4.5:1 so never for text that
  carries meaning), `text-disabled-foreground`, `text-on-inverted-foreground`.
- Brand (terracotta): `bg-brand-solid` (`-hover`, `-active`),
  `bg-brand-subtle`, `text-brand-foreground`, `text-on-brand-solid-foreground`,
  `outline-brand-border-focus` (the focus ring everywhere).
- Status: `positive`, `warning`, `danger`, each with `-solid`, `-subtle`,
  `-foreground` and `-border-default` (danger also `-subtle-hover`,
  `-border-subtle`). Errors are always an icon and words as well as red.
- Borders: `ring-border-default` (6%), `-subtle` (2%), `-strong` (15%),
  `border-border-default`; `edge` stays for the 1px line inside images.
- Inverted: `bg-inverted-solid` (`-hover`, `-active`) is the primary button.

The older scales still exist and are fine to read: `base-50`…`950` is now
the same neutral grey (`base-50` ≈ `card`, `base-900` ≈
`primary-foreground`), `accent-*` the terracotta, `paper` white text on an
accent fill. Never use Tailwind's own `gray`/`zinc`/`slate`, never hex in
markup.

Usage rules:

- **Accent is interaction-only**: link hovers (`hover:text-brand-foreground`),
  focus (`focus-visible:outline-brand-border-focus`), text selection, prose
  links, and the `accent` Button. Never for headings, body copy or section
  backgrounds.
- No tinted panels, no hue rotation; the page stays neutral and the post
  covers provide the colour. Named exceptions: the MCP install panel's
  `.mcp-gradient`, the dashboard search pill's `BorderBeam`.
- Dark surfaces are rare: the footer's inset panel and the Vision page's
  `.vision-night` panel (both inverting to paper on the dark site through
  their own `--f-*` / scoped tokens), the primary Button and the search
  backdrop.
- **Dark theme** (`data-theme="dark"` on `<html>`, set before paint by
  `global/ThemeScript`, switched by `global/ThemeToggle`): the tokens flip,
  the classes do not. The page goes `oklch(15% 0 0)`, the grey scale
  reverses, the alpha greys turn white-based, shadows lose their drops and
  gain a half-pixel inner highlight. So never add `dark:` for a colour or a
  shadow. Inline colours in client components use `light-dark()`.

## Layout and spacing

- The page gutter is 16px on phones and 32px from `sm` up (the Wrapper's
  `px-4 sm:px-8`). Everything on a phone sits 16px from the screen edges,
  inset panels included (the footer and Vision panels are `px-4` from the
  window); a narrow column inside a standard Wrapper is a plain
  `mx-auto max-w-xl sm:px-8` div, never a second Wrapper, or the phone gutter
  doubles. A sideways-scrolling row bleeds with `-mx-4 px-4` so its first item
  still starts on the gutter.
- Every section is `<section>` wrapping a `Wrapper`
  (`@/components/fundations/containers/Wrapper`): `variant="standard"`
  (`max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-8`) for pages, `variant="narrow"`
  (`max-w-xl`) for forms/auth, `variant="prose"` for markdown bodies.
- Page rhythm (2026-10-15): two utilities in `global.css`, never ad-hoc
  `py-*` / `pt-*` on a section's Wrapper. A page's first section is
  `className="page-start"` (first line of content 112px from the top on
  phones, 160px from `lg`); every section after it is
  `className="section-y"` (48px above and below, 64px from `lg`), and the
  footer's own `mt-12 lg:mt-16` keeps the last section the same distance.
- Rhythm inside a section: `mt-12` between major blocks, `mt-8` between a
  section header row and its grid, `mt-2`-`mt-4` between a title and its
  supporting text, `gap-8` in card grids.
- Card grids: `grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3`.
- **Card anatomy**: a `p-6 bg-card rounded-2xl` mat (or `bg-container
  shadow-xs` for a white card with a hairline) holding the image
  (`rounded shadow`), caption/meta below at `mt-2`-`mt-4`, and a stretched
  link (`absolute inset-0`).
- Images use `next/image` and always declare `width`/`height`.

## Components

Reuse these before writing anything new:

- **Button** (`fundations/elements/Button.tsx`), Interfere's: 13px medium
  text at every size; sizes `xxs` 24, `xs` 28, `sm` 32, `base` (and `md`,
  `lg`, `xl`) 40, radius 6 up to `xs` and 8 from `sm`, `shape="pill"` for
  round ends, `iconOnly` for a square. Variants: `default` (primary,
  inverted solid), `secondary` (white with the default shadow), `muted`
  (tertiary, a tint), `accent` (brand), `danger`, `dangerSubtle`,
  `transparent`, `none`. No borders on any of them. `isLink` + `href`
  renders a `next/link`. **Width is a per-use decision**: standalone CTAs
  get `w-fit`, form submits `w-full`, buttons in a flex row nothing. The
  header's Sign in is `transparent`, every signup action `default`.
- **Badge** (`fundations/elements/Badge.tsx`): 16 / 20 / 24px, 11 / 12 /
  13px regular text, radius 4 (6 at `lg`), variants `default`,
  `transparent`, `inverted`, `outline`, `brand`, `danger`. The Beta chips use
  it.
- **Text**: the only sanctioned type scale (see Typography).
- **Wrapper**: the only page-width container.
- **Form inputs** share one recipe, `inputClass` in
  `components/auth/AuthParts.tsx`: `h-10 rounded-lg
  bg-component-on-container-subtle px-3 text-body-sm shadow-sm
  placeholder:text-tertiary-foreground`, a 2px `brand-border-focus` shadow on
  focus, `danger-border-default` when the field has a problem, and
  `pointer-coarse:text-[16px]` so iOS doesn't zoom. Labels are `text-body-sm
  font-medium text-primary-foreground`. Import it rather than copying it.
- Icons live in `fundations/icons/` as individual components on the shared
  `Icon.tsx` shell (Phosphor bold paths); add new ones there.

## Corners, borders, shadows

- Radius scale (Interfere's): `rounded-xs` 2, `sm` 4, `md` 6, `lg` 8, `xl`
  10, `2xl` 12, `3xl` 16, `4xl` 20, `5xl` 24, `full`. Buttons and inputs
  `md`/`lg` (the Button bakes its own in), chips `sm`, cards and mats `2xl`,
  the auth card `2xl`, the footer panel `4xl`/`5xl`. Plain `rounded` for
  images inside mats. Inner radius = outer radius − padding.
- Shadows (Interfere's, on the `--shadow-*` tokens): `shadow-xs` is a 1px
  hairline (the border for white cards), `shadow-sm` / `shadow` the default
  (a half-pixel ring and two soft drops; inputs, the secondary button),
  `shadow-md` / `shadow-lg` large, `shadow-xl` extra large (the auth card).
  Every one has its own dark-mode treatment, so never add `dark:ring-*` to
  stand in for a shadow.
- Borders are alpha tints: `ring-1 ring-border-default` (6%) or
  `divide-y divide-border-default`; `ring-border-strong` (15%) for an
  outline badge. No `border-2`.

## Voice and copy

Short declarative statements, often two stacked sentences in heroes.
Practical, anti-hype tone aimed at designers. Sentence case everywhere, no
Title Case, no emoji; exclamation marks are rare and playful - default to
none. Subtext under a heading is two lines at most.

## Do / Don't

Do:

- Copy an existing section's structure before inventing a new layout.
- Put every image on a `bg-card rounded-2xl` mat with `rounded shadow` on
  the image itself.
- Use `text-balance` on headings and `max-w-3xl mx-auto text-center` for
  centered heroes.
- Reach for the semantic tokens (`text-secondary-foreground`,
  `ring-border-default`, `bg-component`) in new code.

Don't:

- Don't use `font-display` on buttons, labels, captions or body text; the
  serif is for headings (the `Text` heading variants add it), the wordmark
  and the dashboard's display role.
- Don't put accent colour on headings, backgrounds, or body copy; it is for
  hovers, focus, links, and the accent Button.
- Don't introduce new fonts, colours outside `@theme`, gradients, or `dark:`
  classes for colour or shadow (the tokens flip).
- Don't use default Tailwind `slate`/`gray`/`zinc`/`orange` classes.
- Don't put a border on a button, and don't exceed `rounded-2xl` on a card.
- Don't inline a heading with raw classes when `Text` has a variant for it.

## Quality check before finishing

1. Fonts, colours, radii and shadows all come from the tokens and match a
   sibling section.
2. New section reads correctly at `sm`, `md`, and `lg` breakpoints, in both
   themes.
3. Headings use `Text` heading variants (the serif on Interfere's scale);
   buttons use `Button` variants with an explicit width decision.
4. No new dependencies, no unused imports, minimal diff.
