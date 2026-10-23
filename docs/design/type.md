# Type

Sources: `src/components/fundations/elements/Text.tsx`, the `--text-*` tokens in
`src/styles/global.css`, `src/lib/type-scale.ts` and `size-context.tsx` (the roles and the two
steps), `src/lib/font-weight.ts` (the weights), fonts in `src/app/layout.tsx`. Live: `/system/type`.

**Two families.** Hedvig Letters Serif (`font-display`) for headings, the wordmark and the
dashboard's display role: one regular weight, never bold (`html` has
`font-synthesis-weight: none`). Inter (`font-sans`) for everything else. Never another font.

## Marketing, auth, share and docs pages: `<Text>`

| Variant | Size / leading (phone → lg) | Use |
| --- | --- | --- |
| `h1` | 36 → 44 → 56 | Page titles; every homepage section heading |
| `h2` | 28 → 36 → 44 | Section headings elsewhere |
| `h3` | 24 → 28 → 36 | Sub-sections, sheet titles |
| `h4` | 24 → 28 | Panel titles |
| `h5` | 20 → 24 | Card groups, the auth card title |
| `h6` | 20 | Card titles |
| `bodyLG` / `body` (default) / `bodySM` | 18/24, 15/24, 13/20 | Leads, running text, UI text |
| `captionLG` / `caption` / `captionSM` / `captionXS` | 12, 11, 10 on 16; 8/12 | Meta, small print |

Old names (`displayLG`, `textBase`, …) still map onto these; write the new names. Heading variants
already set `font-display font-normal`: never add a weight or font class to them. `Text` is
unchanged by the 2026-10-23 rebuild: the serif headings are the brand.

```
Which variant?
 ├── The page's title → tag="h1" variant="h1"
 ├── A homepage section → tag="h2" variant="h1"
 ├── A section elsewhere → tag="h2" variant="h2" (or h3)
 ├── A card title → CardTitle (semibold by fontVariationSettings), or tag="h3" variant="h6"
 ├── Running text → body, in text-muted-foreground for leads
 └── Meta under a card → captionLG (no caps: CardMeta's uppercase is ignored now)
```

## Dashboard, review and onboarding: the six roles, two steps

Each role is a size and a leading, on the library's default step and its compact step: display
28/34 (24/30), title 16/22 (15/20), subtitle 14/20 (13/18), body 13/20 (12/18), caption 12/16
(11/14), micro 11/14 (10/12). As utilities: `text-display` (serif, light), `text-title`,
`text-subtitle`, `text-body` (the default inherited), `text-caption`, `text-micro`. The compact
step is the site's (`SizeProvider defaultSize="compact"` in `global/FluidRoot`), and every size
name maps onto it, so every system control reads its text from `useSize()` as 12/18 (a button,
field or menu row, `lg` / `xl` included; the default step's 13/20 is in the library but no site
component uses it); the Badge and a Kbd cap read the caption and micro roles' compact values
(11/14, 10/12). Fields add `pointer-coarse:text-[16px]` so iOS doesn't zoom. No Tailwind
`text-sm`/`text-xs` and no pixel sizes.

## Weight

Three, through Inter's variation axes (`src/lib/font-weight.ts`):

| Name | Value | Use |
| --- | --- | --- |
| `fontWeights.normal` | `'wght' 400, 'opsz' 14` | Everything |
| `fontWeights.semibold` | `'wght' 550, 'opsz' 18` | A chosen tab or option, a checked menu row, a Notice's title, a card or empty state's title, Avatar initials |
| `fontWeights.bold` | `'wght' 700, 'opsz' 25` | Unused on the site today |

Set it as `style={{ fontVariationSettings: fontWeights.semibold }}`, not a Tailwind `font-*`
class, in new code. The library changes weight without reflow by reserving the heavier label's
width (Segmented, Tabs, menu rows); a `font-medium` class on a label that switches would move its
neighbours. The older `font-normal` / `font-semimedium` / `font-medium` / `font-semibold` classes
stay in features until they're touched. Never bold body copy for emphasis in a paragraph's flow.

## Rules

- Headings balance and paragraphs wrap `pretty` by default (no widows): don't fight it.
- Running text is at most 65ch wide.
- No uppercase labels in the system (the library sets no caps and no tracking); a feature that
  keeps one adds `tracking-wider`.
- Numbers are tabular by default (`tnum` on `:root`); Hedvig has no tabular figures.
- Colour changes on text (a label brightening on focus, a link on hover) take 80ms (`duration-80`).

```tsx
// Correct
<Text tag="h2" variant="h1" className="text-foreground">Find the post that works.</Text>
<p className="text-title text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>Nothing here yet</p>

// Incorrect: raw tag with ad-hoc size, a bold serif, a Tailwind weight on a switching label
<h2 className="font-display text-5xl font-bold">Find the post that works.</h2>
<span className={selected ? "font-semibold" : "font-normal"}>Breakdown</span>
```
